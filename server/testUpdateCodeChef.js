require("dotenv").config();

const connectDB = require("./config/db");
const Student = require("./models/Student");

const updateCodeChefStats =
    require("./services/codechef/updateCodeChefStats");

const test = async () => {
    try {
        await connectDB();

        const student = await Student.findOne({
            codechefUsername: { $ne: "" }
        });

        if (!student) {
            console.log("No student with CodeChef username found.");
            return;
        }

        console.log(
            "Updating:",
            student.codechefUsername
        );

        const stats =
            await updateCodeChefStats(student);

        console.log("Updated stats:");
        console.log(stats);

    } catch (error) {
        console.error(
            "Test failed:",
            error.message
        );
    } finally {
        process.exit();
    }
};

test();