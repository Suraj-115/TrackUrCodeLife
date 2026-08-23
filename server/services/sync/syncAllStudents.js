const Student = require("../../models/Student");
const syncStudent = require("./syncStudent");
const delay = require("../../utils/delay");

let isSyncing = false;

const getSyncDelayMs = () => {
    const value = Number(process.env.SYNC_DELAY_MS);
    return Number.isFinite(value) && value >= 0 ? value : 2000;
};

const syncAllStudents = async () => {
    if (isSyncing) {
        console.log("Synchronization already in progress, skipping");
        return { skipped: true };
    }

    isSyncing = true;

    console.log("\n========================================");
    console.log("Starting student synchronization");
    console.log("========================================");

    try {
        const students = await Student.find({});
        const pauseMs = getSyncDelayMs();

        console.log(`Students found: ${students.length}`);

        for (let index = 0; index < students.length; index += 1) {
            const student = students[index];

            try {
                await syncStudent(student);
            } catch (error) {
                console.error(
                    `Synchronization failed for ${student.name}:`,
                    error.message
                );
            }

            if (index < students.length - 1 && pauseMs > 0) {
                await delay(pauseMs);
            }
        }

        console.log("\n========================================");
        console.log("Student synchronization completed");
        console.log("========================================");

        return { skipped: false, count: students.length };
    } catch (error) {
        console.error(
            "Failed to start student synchronization:",
            error.message
        );
        throw error;
    } finally {
        isSyncing = false;
    }
};

syncAllStudents.isSyncing = () => isSyncing;

module.exports = syncAllStudents;
