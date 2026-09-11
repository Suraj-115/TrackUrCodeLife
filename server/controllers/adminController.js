const Student = require("../models/Student");
const ContestParticipation = require("../models/ContestParticipation");

const syncStudent = require("../services/sync/syncStudent");
const syncAllStudents = require("../services/sync/syncAllStudents");
const { syncSectionForStudent } = require("../services/sync/syncContestHistory");
const queueStudentSync = require("../utils/queueStudentSync");

const {
    getContestAnalytics,
    getSectionOverview
} = require("../services/analytics/contestAnalytics");

const { toLeaderboardRow, escapeRegex } = require("./studentController");

const {
    normalizeEmail,
    isCollegeEmail,
    isValidSection,
    validateUsername,
    FAILED,
    OK
} = require("../utils/validation");

/*
 * Imported from the model rather than the validation helper so the enum has
 * exactly one definition — the schema's.
 */
const { SECTIONS } = require("../models/Student");

/*
 * The admin table needs the identity fields the public leaderboard omits —
 * email and roll number — plus the sync error text so a failing platform is
 * visible without opening each record.
 */
const ADMIN_FIELDS =
    "_id name collegeEmail rollNo section leetcodeUsername codechefUsername " +
    "leetcodeStats codechefStats createdAt updatedAt";

const toAdminRow = (student) => ({
    ...toLeaderboardRow(student),
    collegeEmail: student.collegeEmail,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt
});

/**
 * Admin student directory: the same search and section filters as the
 * student-facing list, with the identity fields and no rank cap.
 */
const getAllStudents = async (req, res) => {
    try {
        const { search, section, sort = "name", order = "asc" } = req.query;

        const query = {};

        if (section && section !== "All") {
            if (!isValidSection(section)) {
                return FAILED(res, 400, "Invalid section filter");
            }

            query.section = section;
        }

        if (search && String(search).trim()) {
            const pattern = escapeRegex(String(search).trim());

            /*
             * Admins search by name, roll number or email, so all three are
             * matched rather than name alone.
             */
            query.$or = [
                { name: { $regex: pattern, $options: "i" } },
                { rollNo: { $regex: pattern, $options: "i" } },
                { collegeEmail: { $regex: pattern, $options: "i" } }
            ];
        }

        const students = await Student.find(query).select(ADMIN_FIELDS);
        const rows = students.map(toAdminRow);

        const direction = order === "asc" ? 1 : -1;

        rows.sort((a, b) => direction * a.name.localeCompare(b.name));

        return OK(res, 200, {
            students: rows,
            count: rows.length,
            sections: SECTIONS
        });
    } catch (error) {
        console.error("getAllStudents failed:", error.message);
        return FAILED(res, 500, "Unable to load students. Please try again.");
    }
};

/**
 * Admin edit. Unlike the student self-service endpoint this may change
 * identity and academic fields, which is the whole point of the admin view.
 */
const updateStudentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id);

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        const body = req.body || {};
        const update = {};

        /*
         * Collected instead of applied one-by-one so the document is saved
         * once, after every field has been validated.
         */
        if (body.name !== undefined) {
            const name = String(body.name).trim();

            if (name.length < 2) {
                return FAILED(res, 400, "Name must be at least 2 characters");
            }

            update.name = name;
        }

        if (body.rollNo !== undefined) {
            const rollNo = String(body.rollNo).trim();

            if (!rollNo) {
                return FAILED(res, 400, "Roll number cannot be empty");
            }

            update.rollNo = rollNo;
        }

        if (body.collegeEmail !== undefined) {
            const email = normalizeEmail(body.collegeEmail);

            if (!isCollegeEmail(email)) {
                return FAILED(res, 400, "Email must be a valid @abes.ac.in address");
            }

            update.collegeEmail = email;
        }

        if (body.section !== undefined) {
            if (!isValidSection(body.section)) {
                return FAILED(
                    res,
                    400,
                    `Section must be one of ${SECTIONS.join(", ")}`
                );
            }

            update.section = body.section;
        }

        /*
         * Tracks only the platforms whose handle actually changed. A handle
         * that was submitted unchanged still holds valid stats, so it must not
         * be marked for a refresh.
         */
        const changedPlatforms = [];

        for (const platform of ["leetcode", "codechef"]) {
            const field = `${platform}Username`;

            if (body[field] === undefined) {
                continue;
            }

            const result = validateUsername(platform, body[field]);

            if (!result.valid) {
                return FAILED(res, 400, result.message);
            }

            update[field] = result.username;

            if (result.username !== student[field]) {
                changedPlatforms.push(platform);
            }
        }

        if (Object.keys(update).length === 0) {
            return FAILED(res, 400, "No editable fields were provided");
        }

        const sectionChanged =
            update.section !== undefined && update.section !== student.section;

        Object.assign(student, update);

        await student.save();

        /*
         * Contest records carry a denormalised section, so a section change
         * has to be propagated or historical analytics would keep reporting
         * the student under their old section.
         */
        if (sectionChanged) {
            await syncSectionForStudent(student._id, student.section);
        }

        /*
         * When a handle changes, the stored stats belong to the previous
         * profile. They are left in place rather than zeroed — a platform
         * outage during the refresh must not destroy them — but the status is
         * reset so the admin sees that the numbers are stale and a refresh is
         * pending.
         */
        if (changedPlatforms.length > 0) {
            const resetFields = {};

            for (const platform of changedPlatforms) {
                resetFields[`${platform}Stats.syncStatus`] = "PENDING";
                resetFields[`${platform}Stats.syncError`] = null;
            }

            await Student.findByIdAndUpdate(student._id, {
                $set: resetFields
            });

            /*
             * Applied to the in-memory document too, so the response and the
             * queued sync see the reset statuses rather than the pre-reset
             * values from before the save.
             */
            student.set(resetFields);

            queueStudentSync(student);
        }

        return OK(res, 200, {
            message: "Student updated successfully",
            student: toAdminRow(student)
        });
    } catch (error) {
        /*
         * E11000 is the unique index on email and roll number — the only
         * realistic cause here, so it gets a specific message.
         */
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";

            return FAILED(
                res,
                409,
                `That ${field === "rollNo" ? "roll number" : "email"} is already registered`
            );
        }

        console.error("updateStudentByAdmin failed:", error.message);
        return FAILED(res, 500, "Failed to update student");
    }
};

/**
 * Removes a student and every contest record belonging to them.
 *
 * The contest records are deleted too because they are keyed by student id
 * and would otherwise remain as orphaned rows inflating the analytics.
 */
const deleteStudentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id);

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        const contests = await ContestParticipation.deleteMany({ student: id });

        await Student.findByIdAndDelete(id);

        return OK(res, 200, {
            message: "Student deleted successfully",
            deletedContestRecords: contests.deletedCount || 0
        });
    } catch (error) {
        console.error("deleteStudentByAdmin failed:", error.message);
        return FAILED(res, 500, "Failed to delete student");
    }
};

/**
 * Manually triggers a full refresh. The scheduled cron job remains the normal
 * path; this exists so an admin can push data through after a bulk edit.
 */
const syncAllStudentsAdmin = async (req, res) => {
    try {
        if (syncAllStudents.isSyncing()) {
            return FAILED(res, 409, "A synchronization is already running");
        }

        const summary = await syncAllStudents();

        return OK(res, 200, {
            message: "Synchronization completed",
            summary
        });
    } catch (error) {
        console.error("syncAllStudentsAdmin failed:", error.message);
        return FAILED(res, 500, "Synchronization failed");
    }
};

const syncOneStudentAdmin = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        if (!student.leetcodeUsername && !student.codechefUsername) {
            return FAILED(res, 400, "This student has no platform IDs to sync");
        }

        const results = await syncStudent(student);
        const refreshed = await Student.findById(student._id).select(ADMIN_FIELDS);

        return OK(res, 200, {
            message: "Synchronization completed",
            results,
            student: toAdminRow(refreshed)
        });
    } catch (error) {
        console.error("syncOneStudentAdmin failed:", error.message);
        return FAILED(res, 500, "Synchronization failed");
    }
};

/**
 * Date-ranged contest analytics.
 *
 * Every number comes from ContestParticipation documents, which carry a real
 * participation date. Nothing here is derived from the aggregate
 * `contestsParticipated` counters.
 */
const getContestAnalyticsAdmin = async (req, res) => {
    try {
        const { period = "this-month", startDate, endDate, section } = req.query;

        if (section && section !== "All" && !isValidSection(section)) {
            return FAILED(res, 400, "Invalid section filter");
        }

        const analytics = await getContestAnalytics({
            period,
            startDate,
            endDate,
            section
        });

        if (analytics.error) {
            return FAILED(res, 400, analytics.error);
        }

        return OK(res, 200, {
            analytics,
            sections: SECTIONS
        });
    } catch (error) {
        console.error("getContestAnalyticsAdmin failed:", error.message);
        return FAILED(res, 500, "Unable to load contest analytics");
    }
};

/**
 * Headline numbers for the admin dashboard landing page.
 */
const getAdminOverview = async (req, res) => {
    try {
        const [
            totalStudents,
            bySection,
            contestTotals,
            contestBySection,
            failedSyncs,
            lastContestSync
        ] = await Promise.all([
            Student.countDocuments({}),

            Student.aggregate([
                { $group: { _id: "$section", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),

            ContestParticipation.aggregate([
                { $group: { _id: "$platform", count: { $sum: 1 } } }
            ]),

            getSectionOverview(),

            Student.countDocuments({
                $or: [
                    { "leetcodeStats.syncStatus": "FAILED" },
                    { "codechefStats.syncStatus": "FAILED" }
                ]
            }),

            Student.findOne({ "leetcodeStats.lastUpdated": { $ne: null } })
                .sort({ "leetcodeStats.lastUpdated": -1 })
                .select("leetcodeStats.lastUpdated codechefStats.lastUpdated")
        ]);

        const totals = { leetcode: 0, codechef: 0 };

        contestTotals.forEach((entry) => {
            if (totals[entry._id] !== undefined) {
                totals[entry._id] = entry.count;
            }
        });

        const sections = {};

        /*
         * Every configured section is emitted, even at zero, so the cards do
         * not shift around as sections gain or lose members.
         */
        SECTIONS.forEach((name) => {
            sections[name] = {
                students:
                    bySection.find((entry) => entry._id === name)?.count || 0,
                contests: contestBySection[name] || 0
            };
        });

        return OK(res, 200, {
            overview: {
                totalStudents,
                totalContests: totals.leetcode + totals.codechef,
                leetcodeContests: totals.leetcode,
                codechefContests: totals.codechef,
                failedSyncs,
                sections,
                lastSyncAt: lastContestSync
                    ? lastContestSync.leetcodeStats?.lastUpdated || null
                    : null
            }
        });
    } catch (error) {
        console.error("getAdminOverview failed:", error.message);
        return FAILED(res, 500, "Unable to load the overview");
    }
};

module.exports = {
    getAllStudents,
    updateStudentByAdmin,
    deleteStudentByAdmin,
    syncAllStudentsAdmin,
    syncOneStudentAdmin,
    getContestAnalyticsAdmin,
    getAdminOverview
};
