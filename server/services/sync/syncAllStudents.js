const Student = require("../../models/Student");
const syncStudent = require("./syncStudent");
const delay = require("../../utils/delay");

let isSyncing = false;

const getSyncDelayMs = () => {
    const value = Number(process.env.SYNC_DELAY_MS);
    return Number.isFinite(value) && value >= 0 ? value : 2000;
};

/**
 * Refreshes every student, one at a time, with a pause between requests.
 *
 * The pause keeps the outgoing request rate low enough that CodeChef's
 * rate limiting (HTTP 429) does not start rejecting the whole run.
 */
const syncAllStudents = async () => {
    if (isSyncing) {
        return { skipped: true };
    }

    isSyncing = true;

    try {
        const students = await Student.find({});
        const pauseMs = getSyncDelayMs();

        const summary = {
            skipped: false,
            count: students.length,
            succeeded: 0,
            failed: 0
        };

        for (let index = 0; index < students.length; index += 1) {
            const student = students[index];

            try {
                const results = await syncStudent(student);

                const failed = results.filter(
                    (result) => result.status === "FAILED"
                ).length;

                if (failed > 0) {
                    summary.failed += 1;
                } else {
                    summary.succeeded += 1;
                }
            } catch (error) {
                /*
                 * syncStudent already isolates per-platform failures. This
                 * catch only covers something unexpected, and the batch keeps
                 * going so one bad record cannot stall the whole run.
                 */
                summary.failed += 1;
                console.error(
                    `Synchronization failed for ${student.name}:`,
                    error.message
                );
            }

            if (index < students.length - 1 && pauseMs > 0) {
                await delay(pauseMs);
            }
        }

        return summary;
    } finally {
        isSyncing = false;
    }
};

syncAllStudents.isSyncing = () => isSyncing;

module.exports = syncAllStudents;
