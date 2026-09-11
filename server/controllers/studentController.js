const Student = require("../models/Student");
const syncStudent = require("../services/sync/syncStudent");
const { SECTIONS } = require("../models/Student");

const {
    validateUsername,
    FAILED,
    OK
} = require("../utils/validation");

const PLATFORM_SYNC_ERRORS = {
    leetcode: "Invalid LeetCode ID or the profile could not be reached.",
    codechef: "Invalid CodeChef ID or the profile could not be reached."
};

/**
 * Escapes a user-supplied string before it is used in a RegExp, so a search
 * for "a+b" is treated as literal text rather than a pattern.
 */
const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PUBLIC_FIELDS =
    "_id name rollNo section leetcodeUsername codechefUsername " +
    "leetcodeStats codechefStats createdAt";

/**
 * Normalises one student document into the shape the dashboard and admin
 * tables consume, with both platforms side by side.
 */
const toLeaderboardRow = (student) => {
    const leetcode = student.leetcodeStats || {};
    const codechef = student.codechefStats || {};

    const lcProblems = leetcode.problemsSolved ?? 0;
    const ccProblems = codechef.problemsSolved ?? 0;
    const lcRating = leetcode.contestRating ?? 0;
    const ccRating = codechef.contestRating ?? 0;

    return {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        section: student.section,
        leetcodeUsername: student.leetcodeUsername || "",
        codechefUsername: student.codechefUsername || "",

        leetcode: {
            problemsSolved: lcProblems,
            contestRating: lcRating,
            contestsParticipated: leetcode.contestsParticipated ?? 0,
            lastParticipatedContestDate:
                leetcode.lastParticipatedContestDate || null,
            lastUpdated: leetcode.lastUpdated || null,
            syncStatus: leetcode.syncStatus || "PENDING",
            syncError: leetcode.syncError || null
        },

        codechef: {
            problemsSolved: ccProblems,
            contestRating: ccRating,
            contestsParticipated: codechef.contestsParticipated ?? 0,
            lastParticipatedContestDate:
                codechef.lastParticipatedContestDate || null,
            lastUpdated: codechef.lastUpdated || null,
            syncStatus: codechef.syncStatus || "PENDING",
            syncError: codechef.syncError || null
        },

        totalProblems: lcProblems + ccProblems,
        totalRating: lcRating + ccRating,

        lastUpdated:
            [leetcode.lastUpdated, codechef.lastUpdated]
                .filter(Boolean)
                .sort()
                .pop() || null
    };
};

const SORT_FIELDS = {
    totalProblems: (row) => row.totalProblems,
    totalRating: (row) => row.totalRating,
    leetcodeProblems: (row) => row.leetcode.problemsSolved,
    codechefProblems: (row) => row.codechef.problemsSolved,
    leetcodeRating: (row) => row.leetcode.contestRating,
    codechefRating: (row) => row.codechef.contestRating,
    name: (row) => row.name
};

/**
 * The shared student directory that powers both dashboards.
 *
 * Supports the two filters the product asks for — name search and one of the
 * four CSE sections — and ranks by a chosen metric.
 */
const getStudents = async (req, res) => {
    try {
        const { search, section, sort = "totalProblems", order = "desc" } =
            req.query;

        const query = {};

        if (section && section !== "All") {
            if (!SECTIONS.includes(section)) {
                return FAILED(res, 400, "Invalid section filter");
            }

            query.section = section;
        }

        if (search && String(search).trim()) {
            query.name = {
                $regex: escapeRegex(String(search).trim()),
                $options: "i"
            };
        }

        const students = await Student.find(query).select(PUBLIC_FIELDS);

        const rows = students.map(toLeaderboardRow);

        const sortKey = SORT_FIELDS[sort] ? sort : "totalProblems";
        const direction = order === "asc" ? 1 : -1;

        rows.sort((a, b) => {
            const left = SORT_FIELDS[sortKey](a);
            const right = SORT_FIELDS[sortKey](b);

            if (typeof left === "string" || typeof right === "string") {
                return direction * String(left).localeCompare(String(right));
            }

            if (left === right) {
                // Stable tiebreaker so ranks do not shuffle between calls.
                return a.name.localeCompare(b.name);
            }

            return direction * (left - right);
        });

        /*
         * Ranks are assigned after sorting. With the default sort the top
         * row is rank 1 by problems solved across both platforms.
         */
        const ranked = rows.map((row, index) => ({ ...row, rank: index + 1 }));

        return OK(res, 200, {
            students: ranked,
            count: ranked.length,
            sections: SECTIONS,
            sort: sortKey,
            order: direction === 1 ? "asc" : "desc"
        });
    } catch (error) {
        console.error("getStudents failed:", error.message);
        return FAILED(res, 500, "Unable to load students. Please try again.");
    }
};

const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const isSelf = String(req.studentId) === String(id);

        if (!isSelf && req.role !== "admin") {
            return FAILED(res, 403, "You can only view your own profile");
        }

        const student = await Student.findById(id).select(PUBLIC_FIELDS);

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        return OK(res, 200, { student: toLeaderboardRow(student) });
    } catch (error) {
        console.error("getStudentById failed:", error.message);
        return FAILED(res, 500, "Failed to load student");
    }
};

/**
 * Student self-service profile update.
 *
 * Only the two platform handles are accepted. Every other field — name,
 * email, roll number, section — is rejected explicitly rather than silently
 * ignored, and this is enforced here rather than in the UI, so a crafted
 * request cannot change academic details.
 */
const updateOwnProfile = async (req, res) => {
    try {
        const body = req.body || {};

        const PROTECTED_FIELDS = [
            "name",
            "collegeEmail",
            "email",
            "rollNo",
            "section",
            "password",
            "role"
        ];

        const attempted = PROTECTED_FIELDS.filter(
            (field) => body[field] !== undefined
        );

        if (attempted.length) {
            return FAILED(
                res,
                403,
                `You are not allowed to change: ${attempted.join(", ")}. Only your LeetCode ID and CodeChef ID can be edited.`
            );
        }

        const student = await Student.findById(req.studentId);

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        const updates = {};

        if (body.leetcodeUsername !== undefined) {
            const result = validateUsername("leetcode", body.leetcodeUsername);

            if (!result.valid) {
                return FAILED(res, 400, result.message);
            }

            updates.leetcodeUsername = result.username;
        }

        if (body.codechefUsername !== undefined) {
            const result = validateUsername("codechef", body.codechefUsername);

            if (!result.valid) {
                return FAILED(res, 400, result.message);
            }

            updates.codechefUsername = result.username;
        }

        if (!Object.keys(updates).length) {
            return FAILED(
                res,
                400,
                "Provide a LeetCode ID or CodeChef ID to update."
            );
        }

        const changedPlatforms = [];

        if (
            updates.leetcodeUsername !== undefined &&
            updates.leetcodeUsername !== student.leetcodeUsername
        ) {
            student.leetcodeUsername = updates.leetcodeUsername;
            student.leetcodeStats.syncStatus = "PENDING";
            student.leetcodeStats.syncError = null;
            changedPlatforms.push("leetcode");
        }

        if (
            updates.codechefUsername !== undefined &&
            updates.codechefUsername !== student.codechefUsername
        ) {
            student.codechefUsername = updates.codechefUsername;
            student.codechefStats.syncStatus = "PENDING";
            student.codechefStats.syncError = null;
            changedPlatforms.push("codechef");
        }

        await student.save();

        /*
         * New handles are validated by actually fetching them. This happens
         * after the save so the response is immediate; the sync result is
         * reflected in the syncStatus field the profile page displays.
         */
        const syncResults = [];

        if (changedPlatforms.length) {
            for (const platform of changedPlatforms) {
                try {
                    const results = await syncStudent(student);
                    const result = results.find(
                        (item) => item.platform === platform
                    );
                    syncResults.push(result);
                } catch (error) {
                    syncResults.push({
                        platform,
                        status: "FAILED",
                        reason: error.message
                    });
                }
            }
        }

        const failed = syncResults.filter(
            (result) => result && result.status === "FAILED"
        );

        const fresh = await Student.findById(student._id).select(PUBLIC_FIELDS);

        return OK(res, 200, {
            message: failed.length
                ? PLATFORM_SYNC_ERRORS[failed[0].platform]
                : "Coding profiles updated successfully.",
            student: toLeaderboardRow(fresh),
            syncPartial: failed.length > 0,
            syncResults
        });
    } catch (error) {
        console.error("updateOwnProfile failed:", error.message);

        if (error.code === 11000) {
            return FAILED(res, 409, "That value is already in use");
        }

        return FAILED(res, 500, "Failed to update profile");
    }
};

module.exports = {
    getStudents,
    getStudentById,
    updateOwnProfile,
    toLeaderboardRow,
    escapeRegex
};
