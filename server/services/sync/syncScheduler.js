const cron = require("node-cron");
const syncAllStudents = require("./syncAllStudents");

/**
 * Runs the full student synchronization on a schedule.
 *
 * Defaults to every 6 hours in IST, both overridable from the environment
 * (SYNC_CRON, SYNC_TIMEZONE) so the cadence can be changed without a deploy.
 */
const startSyncScheduler = () => {
    const schedule = process.env.SYNC_CRON || "0 */6 * * *";

    if (!cron.validate(schedule)) {
        console.error(
            `Invalid SYNC_CRON expression "${schedule}"; scheduler not started.`
        );
        return null;
    }

    const task = cron.schedule(
        schedule,
        async () => {
            try {
                const summary = await syncAllStudents();

                if (!summary.skipped) {
                    console.log(
                        `Scheduled sync finished: ${summary.succeeded} ok, ${summary.failed} with errors, ${summary.count} total.`
                    );
                }
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

    return task;
};

module.exports = startSyncScheduler;
