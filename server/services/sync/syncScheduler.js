const cron = require("node-cron");
const syncAllStudents = require("./syncAllStudents");

const startSyncScheduler = () => {
    const schedule = process.env.SYNC_CRON || "0 */6 * * *";
+  cron.schedule(
        schedule,
        async () => {

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
