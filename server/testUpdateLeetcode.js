require("dotenv").config();

const connectDB = require("./config/db");
const Student = require("./models/Student");
const updateLeetCodeStats =
    require("./services/leetcode/updateLeetCodeStats");

const test = async () => {
    try {
        await connectDB();

        const student = await Student.findOne({
            leetcodeUsername: { $ne: "" }
        });

        if (!student) {
            return;
        }

        const stats = await updateLeetCodeStats(student);


    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        process.exit();
    }
};

test();