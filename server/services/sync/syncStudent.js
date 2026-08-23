const Student = require("../../models/Student");
const getLeetCodeData = require("../leetcode/leetcodeService");
const getCodeChefData = require("../codechef/codechefService");

const getSafeNumber = (value, defaultValue = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : defaultValue;
};

const getValidDate = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
};

const buildStatsUpdate = (prefix, data) => ({
    [`${prefix}.problemsSolved`]: getSafeNumber(data.problemsSolved),
    [`${prefix}.contestRating`]: Math.round(getSafeNumber(data.contestRating)),
    [`${prefix}.contestsParticipated`]: getSafeNumber(data.contestsParticipated),
    [`${prefix}.lastParticipatedContestDate`]: getValidDate(
        data.lastParticipatedContestDate
    ),
    [`${prefix}.lastUpdated`]: new Date(),
    [`${prefix}.syncStatus`]: "SUCCESS",
    [`${prefix}.syncError`]: null
});

const markSyncFailed = async (studentId, prefix, message) => {
    await Student.findByIdAndUpdate(studentId, {
        $set: {
            [`${prefix}.syncStatus`]: "FAILED",
            [`${prefix}.syncError`]: message,
            [`${prefix}.lastUpdated`]: new Date()
        }
    });
};

const syncStudent = async (student) => {
    console.log(`\nSyncing student: ${student.name}`);

    if (student.leetcodeUsername) {
        try {
            const data = await getLeetCodeData(student.leetcodeUsername);

            await Student.findByIdAndUpdate(
                student._id,
                { $set: buildStatsUpdate("leetcodeStats", data) },
                { runValidators: true }
            );

            console.log(`LeetCode stats updated for ${student.name}`);
        } catch (error) {
            console.error(
                `LeetCode update failed for ${student.name}:`,
                error.message
            );
            await markSyncFailed(student._id, "leetcodeStats", error.message);
        }
    } else {
        console.log(`LeetCode skipped for ${student.name}: username missing`);
    }

    if (student.codechefUsername) {
        try {
            const data = await getCodeChefData(student.codechefUsername);

            await Student.findByIdAndUpdate(
                student._id,
                { $set: buildStatsUpdate("codechefStats", data) },
                { runValidators: true }
            );

            console.log(`CodeChef stats updated for ${student.name}`);
        } catch (error) {
            console.error(
                `CodeChef update failed for ${student.name}:`,
                error.message
            );
            await markSyncFailed(student._id, "codechefStats", error.message);
        }
    } else {
        console.log(`CodeChef skipped for ${student.name}: username missing`);
    }

    console.log(`Finished syncing: ${student.name}`);
};

module.exports = syncStudent;
