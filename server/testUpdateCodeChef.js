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
            return;
        }


        const stats =
            await updateCodeChefStats(student);

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