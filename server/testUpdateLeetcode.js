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
            console.log("No student with LeetCode username found.");
            return;
        }

        console.log("Updating:", student.leetcodeUsername);

        const stats = await updateLeetCodeStats(student);

        console.log("Updated stats:");
        console.log(stats);

    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        process.exit();
    }
};

test();