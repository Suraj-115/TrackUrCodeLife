const ContestParticipation = require("../../models/ContestParticipation");

/**
 * Builds the [start, end) range for a preset period.
 *
 * Presets are resolved in IST because that is the timezone the students and
 * admins experience contest dates in; using the server's UTC day boundary
 * would move late-evening contests into the next day.
 */
const IST_OFFSET_MINUTES = 330;

const startOfDayIST = (year, month, day) => {
    // Convert an IST wall-clock midnight into the equivalent UTC instant.
    return new Date(
        Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000
    );
};

const getISTParts = (date) => {
    const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);

    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(),
        day: shifted.getUTCDate()
    };
};

const resolvePeriod = (period, startDate, endDate) => {
    const now = new Date();
    const today = getISTParts(now);

    switch (period) {
        case "this-month": {
            return {
                start: startOfDayIST(today.year, today.month, 1),
                end: startOfDayIST(today.year, today.month + 1, 1),
                label: "This month"
            };
        }

        case "last-month": {
            return {
                start: startOfDayIST(today.year, today.month - 1, 1),
                end: startOfDayIST(today.year, today.month, 1),
                label: "Last month"
            };
        }

        case "custom": {
            if (!startDate || !endDate) {
                return { error: "Start date and end date are required" };
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return { error: "Invalid date range" };
            }

            if (start > end) {
                return { error: "Start date must be before end date" };
            }

            return {
                start,
                /*
                 * The end date is inclusive: an admin picking 1–15 August
                 * expects contests on the 15th to be counted, so the range
                 * runs to the start of the following day.
                 */
                end: new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1),
                label: "Custom range"
            };
        }

        default: {
            return {
                start: startOfDayIST(today.year, today.month, 1),
                end: startOfDayIST(today.year, today.month + 1, 1),
                label: "This month"
            };
        }
    }
};

/**
 * Aggregates real contest records over a date range.
 *
 * This counts ContestParticipation documents — actual dated records — and
 * never derives history from the aggregate `contestsParticipated` counter,
 * which cannot be attributed to a period.
 */
const getContestAnalytics = async ({ period, startDate, endDate, section }) => {
    const range = resolvePeriod(period, startDate, endDate);

    if (range.error) {
        return { error: range.error };
    }

    const match = {
        participatedAt: { $gte: range.start, $lte: range.end }
    };

    if (section && section !== "All") {
        match.section = section;
    }

    const [byPlatform, bySection, byMonth, uniqueStudents, studentBreakdown] = await Promise.all([
        ContestParticipation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$platform",
                    count: { $sum: 1 },
                    students: { $addToSet: "$student" }
                }
            }
        ]),

        ContestParticipation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { section: "$section", platform: "$platform" },
                    count: { $sum: 1 }
                }
            }
        ]),

        /*
         * A per-month breakdown over the same range, so a custom multi-month
         * range can be read month by month rather than as one number.
         */
        ContestParticipation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: { date: "$participatedAt", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$participatedAt", timezone: "Asia/Kolkata" } },
                        platform: "$platform"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),

        ContestParticipation.distinct("student", match),

        /*
         * Break down participation by individual student so admins can see exactly
         * who did what in the selected period.
         */
        ContestParticipation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { student: "$student", platform: "$platform" },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "_id.student",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" }
        ])
    ]);

    const platforms = {
        leetcode: { count: 0, students: 0 },
        codechef: { count: 0, students: 0 }
    };

    byPlatform.forEach((entry) => {
        if (platforms[entry._id]) {
            platforms[entry._id] = {
                count: entry.count,
                students: entry.students.length
            };
        }
    });

    /*
     * Every section is present in the response even when it has no activity,
     * so the UI shows a real zero instead of a missing bar.
     */
    const sections = {};

    bySection.forEach((entry) => {
        const name = entry._id.section || "Unknown";

        if (!sections[name]) {
            sections[name] = { total: 0, leetcode: 0, codechef: 0 };
        }

        sections[name][entry._id.platform] = entry.count;
        sections[name].total += entry.count;
    });

    const monthMap = new Map();

    byMonth.forEach((entry) => {
        const key = `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`;

        if (!monthMap.has(key)) {
            monthMap.set(key, {
                month: key,
                leetcode: 0,
                codechef: 0,
                total: 0
            });
        }

        const bucket = monthMap.get(key);
        bucket[entry._id.platform] = entry.count;
        bucket.total += entry.count;
    });

    const studentMap = new Map();
    studentBreakdown.forEach((entry) => {
        const studentId = entry._id.student.toString();
        const info = entry.studentInfo;
        
        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
                id: studentId,
                name: info.name,
                rollNo: info.rollNo,
                section: info.section,
                leetcode: 0,
                codechef: 0,
                total: 0
            });
        }

        const stats = studentMap.get(studentId);
        stats[entry._id.platform] = entry.count;
        stats.total += entry.count;
    });

    return {
        range: {
            start: range.start,
            end: range.end,
            label: range.label,
            period: period || "this-month"
        },
        totals: {
            overall: platforms.leetcode.count + platforms.codechef.count,
            leetcode: platforms.leetcode.count,
            codechef: platforms.codechef.count,
            students: uniqueStudents.length
        },
        activeStudents: {
            leetcode: platforms.leetcode.students,
            codechef: platforms.codechef.students
        },
        sections,
        months: Array.from(monthMap.values()),
        studentDetails: Array.from(studentMap.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    };
};

/**
 * Per-section totals across all time, used for the overview cards.
 */
const getSectionOverview = async () => {
    const results = await ContestParticipation.aggregate([
        {
            $group: {
                _id: "$section",
                count: { $sum: 1 }
            }
        }
    ]);

    return results.reduce((accumulator, entry) => {
        accumulator[entry._id || "Unknown"] = entry.count;
        return accumulator;
    }, {});
};

module.exports = {
    getContestAnalytics,
    getSectionOverview,
    resolvePeriod,
    IST_OFFSET_MINUTES
};
