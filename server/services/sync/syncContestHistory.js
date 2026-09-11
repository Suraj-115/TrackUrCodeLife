const ContestParticipation = require("../../models/ContestParticipation");

/**
 * Persists a student's contest history for one platform, without creating
 * duplicates.
 *
 * Uses an unordered bulk upsert keyed on the unique
 * { student, platform, contestKey } index. Re-running a sync is therefore
 * idempotent, and because it is an upsert rather than an insert, a contest
 * that already exists is refreshed instead of throwing a duplicate-key error.
 */
const syncContestHistory = async (student, platform, contests) => {
    if (!Array.isArray(contests) || contests.length === 0) {
        return { upserted: 0, matched: 0 };
    }

    const operations = contests.map((contest) => ({
        updateOne: {
            filter: {
                student: student._id,
                platform,
                contestKey: contest.contestKey
            },
            update: {
                $set: {
                    title: contest.title || contest.contestKey,
                    participatedAt: contest.participatedAt,
                    rating: contest.rating ?? null,
                    rank: contest.rank ?? null,
                    problemsSolved: contest.problemsSolved ?? null,
                    section: student.section || ""
                },
                $setOnInsert: {
                    student: student._id,
                    platform,
                    contestKey: contest.contestKey
                }
            },
            upsert: true
        }
    }));

    const result = await ContestParticipation.bulkWrite(operations, {
        ordered: false
    });

    return {
        upserted: result.upsertedCount || 0,
        matched: result.matchedCount || 0
    };
};

/**
 * Keeps the denormalised `section` field on contest records aligned after a
 * student's section is changed by an admin.
 */
const syncSectionForStudent = async (studentId, section) => {
    await ContestParticipation.updateMany(
        { student: studentId },
        { $set: { section } }
    );
};

module.exports = syncContestHistory;
module.exports.syncSectionForStudent = syncSectionForStudent;
