const Student = require("../../models/Student");
const getLeetCodeData = require("../leetcode/leetcodeService");
const getCodeChefData = require("../codechef/codechefService");
const syncContestHistory = require("./syncContestHistory");

const PLATFORM_FETCHERS = {
    leetcode: getLeetCodeData,
    codechef: getCodeChefData
};

const PLATFORM_USERNAME_FIELDS = {
    leetcode: "leetcodeUsername",
    codechef: "codechefUsername"
};

const PLATFORM_STATS_FIELDS = {
    leetcode: "leetcodeStats",
    codechef: "codechefStats"
};

/**
 * Only writes fields the platform actually reported.
 *
 * The platform services return `null` for anything missing, so building the
 * update this way means a partially rendered page or a changed API shape
 * cannot overwrite a previously valid number with 0.
 */
const buildStatsUpdate = (prefix, data) => {
    const update = {
        [`${prefix}.lastUpdated`]: new Date(),
        [`${prefix}.syncStatus`]: "SUCCESS",
        [`${prefix}.syncError`]: null
    };

    if (Number.isFinite(data.problemsSolved)) {
        update[`${prefix}.problemsSolved`] = Math.max(
            0,
            Math.round(data.problemsSolved)
        );
    }

    if (Number.isFinite(data.contestRating)) {
        update[`${prefix}.contestRating`] = Math.max(
            0,
            Math.round(data.contestRating)
        );
    }

    if (Number.isFinite(data.contestsParticipated)) {
        update[`${prefix}.contestsParticipated`] = Math.max(
            0,
            Math.round(data.contestsParticipated)
        );
    }

    /*
     * An empty history is meaningful (the student has no contests yet), but
     * a missing key means the platform did not report it, so the previous
     * valid date is kept rather than cleared.
     */
    if (Array.isArray(data.contests)) {
        update[`${prefix}.lastParticipatedContestDate`] =
            data.lastParticipatedContestDate || null;
        update[`${prefix}.contestHistorySyncedAt`] = new Date();
    }

    return update;
};

const markSyncFailed = async (studentId, prefix, message) => {
    await Student.findByIdAndUpdate(studentId, {
        $set: {
            [`${prefix}.syncStatus`]: "FAILED",
            /*
             * Kept short — this is surfaced in the admin UI, and raw stack
             * traces or response bodies are not useful there.
             */
            [`${prefix}.syncError`]: String(message || "Sync failed").slice(0, 300)
        }
    });
};

const syncPlatform = async (student, platform) => {
    const username = student[PLATFORM_USERNAME_FIELDS[platform]];
    const statsPrefix = PLATFORM_STATS_FIELDS[platform];

    if (!username) {
        return { platform, status: "SKIPPED", reason: "username missing" };
    }

    try {
        const data = await PLATFORM_FETCHERS[platform](username);

        await Student.findByIdAndUpdate(
            student._id,
            { $set: buildStatsUpdate(statsPrefix, data) },
            { runValidators: true }
        );

        const history = await syncContestHistory(
            student,
            platform,
            data.contests || []
        );

        return { platform, status: "SUCCESS", history };
    } catch (error) {
        /*
         * A failure here intentionally leaves every previously stored value
         * untouched apart from the status fields, so a platform outage never
         * destroys valid statistics.
         */
        await markSyncFailed(student._id, statsPrefix, error.message);

        return { platform, status: "FAILED", reason: error.message };
    }
};

/**
 * Refreshes one student's platform statistics and contest history.
 *
 * The two platforms are independent: a CodeChef failure never prevents the
 * LeetCode update from being saved.
 */
const syncStudent = async (student) => {
    const results = [];

    results.push(await syncPlatform(student, "leetcode"));
    results.push(await syncPlatform(student, "codechef"));

    return results;
};

module.exports = syncStudent;
