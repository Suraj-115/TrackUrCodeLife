const Student = require("../../models/Student");

const getLeetCodeData =
    require("../leetcode/leetcodeService");

const getCodeChefData =
    require("../codechef/codechefService");


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


const syncStudent = async (student) => {

    console.log(
        `\nSyncing student: ${student.name}`
    );


    // ==========================================
    // LEETCODE
    // ==========================================

    if (student.leetcodeUsername) {

        try {

            const data =
                await getLeetCodeData(
                    student.leetcodeUsername
                );


            const problemsSolved =
                getSafeNumber(
                    data.problemsSolved
                );


            const contestRating =
                Math.round(
                    getSafeNumber(
                        data.contestRating
                    )
                );


            const contestsParticipated =
                getSafeNumber(
                    data.contestsParticipated
                );


            const lastParticipatedContestDate =
                getValidDate(
                    data.lastParticipatedContestDate
                );


            await Student.findByIdAndUpdate(
                student._id,
                {
                    $set: {
                        "leetcodeStats.problemsSolved":
                            problemsSolved,

                        "leetcodeStats.contestRating":
                            contestRating,

                        "leetcodeStats.contestsParticipated":
                            contestsParticipated,

                        "leetcodeStats.lastParticipatedContestDate":
                            lastParticipatedContestDate,

                        "leetcodeStats.lastUpdated":
                            new Date()
                    }
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            );


            console.log(
                `LeetCode stats updated for ${student.name}`
            );

        } catch (error) {

            console.error(
                `LeetCode update failed for ${student.name}:`,
                error.message
            );
        }

    } else {

        console.log(
            `LeetCode skipped for ${student.name}: username missing`
        );
    }


    // ==========================================
    // CODECHEF
    // ==========================================

    if (student.codechefUsername) {

        try {

            const data =
                await getCodeChefData(
                    student.codechefUsername
                );


            const problemsSolved =
                getSafeNumber(
                    data.problemsSolved
                );


            const contestRating =
                Math.round(
                    getSafeNumber(
                        data.contestRating
                    )
                );


            const contestsParticipated =
                getSafeNumber(
                    data.contestsParticipated
                );


            const lastParticipatedContestDate =
                getValidDate(
                    data.lastParticipatedContestDate
                );


            await Student.findByIdAndUpdate(
                student._id,
                {
                    $set: {
                        "codechefStats.problemsSolved":
                            problemsSolved,

                        "codechefStats.contestRating":
                            contestRating,

                        "codechefStats.contestsParticipated":
                            contestsParticipated,

                        "codechefStats.lastParticipatedContestDate":
                            lastParticipatedContestDate,

                        "codechefStats.lastUpdated":
                            new Date()
                    }
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            );


            console.log(
                `CodeChef stats updated for ${student.name}`
            );

        } catch (error) {

            console.error(
                `CodeChef update failed for ${student.name}:`,
                error.message
            );
        }

    } else {

        console.log(
            `CodeChef skipped for ${student.name}: username missing`
        );
    }


    console.log(
        `Finished syncing: ${student.name}`
    );
};


module.exports = syncStudent;