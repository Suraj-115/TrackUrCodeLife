const Student = require("../../models/Student");

const syncStudent =
    require("./syncStudent");


const syncAllStudents = async () => {

    console.log(
        "\n========================================"
    );

    console.log(
        "Starting student synchronization"
    );

    console.log(
        "========================================"
    );


    try {

        const students =
            await Student.find({});


        console.log(
            `Students found: ${students.length}`
        );


        for (const student of students) {

            try {

                await syncStudent(student);

            } catch (error) {

                console.error(
                    `Synchronization failed for ${student.name}:`,
                    error.message
                );

                // Continue with next student
                continue;
            }
        }


        console.log(
            "\n========================================"
        );

        console.log(
            "Student synchronization completed"
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "Failed to start student synchronization:",
            error.message
        );

        throw error;
    }
};


module.exports = syncAllStudents;