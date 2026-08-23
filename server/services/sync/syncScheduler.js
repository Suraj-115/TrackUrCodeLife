const cron = require("node-cron");
const syncAllStudents = require("./syncAllStudents");

const startSyncScheduler = () => {
    const schedule = process.env.SYNC_CRON || "0 */6 * * *";

    console.log(`Sync scheduler started (${schedule})`);

    cron.schedule(
        schedule,
        async () => {
            console.log("\nScheduled synchronization triggered");

            try {
                await syncAllStudents();
            } catch (error) {
                console.error(
                    "Scheduled synchronization failed:",
                    error.message
                );
            }
        },
        {
            timezone: process.env.SYNC_TIMEZONE || "Asia/Kolkata"
        }
    );
};

module.exports = startSyncScheduler;
