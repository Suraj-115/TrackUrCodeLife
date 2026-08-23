const Student = require("../../models/Student");
const getLeetCodeData = require("./leetcodeService");

const updateLeetCodeStats = async (student) => {
    try {
        if (!student.leetcodeUsername) {
            return;
        }

        const data = await getLeetCodeData(student.leetcodeUsername);

        student.leetcodeStats = {
          problemsSolved: data.problemsSolved,
          contestRating: data.contestRating,
          contestsParticipated: data.contestsParticipated,
          lastParticipatedContestDate:
              data.lastParticipatedContestDate,

          lastUpdated: new Date(),
          syncStatus: "SUCCESS",
          syncError: null
        };

        await student.save();

        console.log(
            `LeetCode stats updated for ${student.leetcodeUsername}`
        );

        return student.leetcodeStats;

    } catch (error) {
        console.error(
            `LeetCode update failed for ${student.leetcodeUsername}:`,
            error.message
        );

        student.leetcodeStats.syncStatus = "FAILED";
        student.leetcodeStats.syncError = error.message;

        await student.save();

        throw error;
    }
};

module.exports = updateLeetCodeStats;