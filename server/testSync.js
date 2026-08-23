require("dotenv").config();

const connectDB = require("./config/db");
const Student = require("./models/Student");

const getLeetCodeData =
    require("./services/leetcode/leetcodeService");

const getCodeChefData =
    require("./services/codechef/codechefService");


// ============================================
// SAFE DATE CONVERTER
// ============================================

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


// ============================================
// SAFE NUMBER CONVERTER
// ============================================

const getSafeNumber = (value, defaultValue = 0) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return defaultValue;
    }

    return number;
};


// ============================================
// SYNC ONE STUDENT
// ============================================

const syncStudent = async (student) => {
    // ========================================
    // LEETCODE
    // ========================================

    if (student.leetcodeUsername) {

        try {

            const data = await getLeetCodeData(
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


    // ========================================
    // CODECHEF
    // ========================================

    if (student.codechefUsername) {

        try {

            const data = await getCodeChefData(
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
};


// ============================================
// SYNC ALL STUDENTS
// ============================================

const syncAllStudents = async () => {

    try {

        await connectDB();


        const students = await Student.find({});

        // ------------------------------------
        // Process students one by one
        // ------------------------------------

        for (const student of students) {

            try {

                await syncStudent(student);

            } catch (error) {

                console.error(
                    `Student synchronization failed for ${student.name}:`,
                    error.message
                );

                // Continue with next student
                continue;
            }
        }
        process.exit(0);

    } catch (error) {

        console.error(
            "\nSynchronization process failed:"
        );

        console.error(error);


        process.exit(1);
    }
};


// ============================================
// START SYNC
// ============================================

syncAllStudents();