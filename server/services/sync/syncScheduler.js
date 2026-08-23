const cron = require("node-cron");

const syncAllStudents =
    require("./syncAllStudents");


const startSyncScheduler = () => {

    console.log(
        "Sync scheduler started"
    );


    // ==========================================
    // RUN EVERY 6 HOURS
    // ==========================================

    cron.schedule(
        "0 */6 * * *",
        async () => {

            console.log(
                "\n6-hour synchronization triggered"
            );

            try {

                await syncAllStudents();

            } catch (error) {

                console.error(
                    "Scheduled synchronization failed:",
                    error.message
                );
            }
        }
    );
};


module.exports = startSyncScheduler;