const Student = require("../../models/Student");
const getCodeChefData = require("./codechefService");

const updateCodeChefStats = async (student) => {
    try {
        if (!student.codechefUsername) {
            return;
        }

        const data = await getCodeChefData(student.codechefUsername);

        student.codechefStats = {
          problemsSolved: data.problemsSolved,
          contestRating: data.contestRating,
          contestsParticipated:
              data.contestsParticipated ?? 0,

          lastParticipatedContestDate:
              data.lastParticipatedContestDate ?? null,

          lastUpdated: new Date(),
          syncStatus: "SUCCESS",
          syncError: null
        };

        await student.save();

        return student.codechefStats;

    } catch (error) {
        console.error(
            `CodeChef update failed for ${student.codechefUsername}:`,
            error.message
        );

        student.codechefStats.syncStatus = "FAILED";
        student.codechefStats.syncError = error.message;

        await student.save();

        throw error;
    }
};

module.exports = updateCodeChefStats;