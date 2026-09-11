const syncStudent = require("../services/sync/syncStudent");

/**
 * Refreshes a student in the background, after the HTTP response has been
 * sent.
 *
 * A platform sync makes outbound requests that can take seconds, so awaiting
 * it inside a request handler would make the caller wait on — or time out
 * during — work that does not change the response. Failures are logged rather
 * than thrown because they are already recorded per platform in the student's
 * `syncStatus` and `syncError` fields, which the UI reads.
 *
 * Takes a student document rather than an id so callers that have just saved
 * one pass the values they already hold instead of triggering another read.
 */
const queueStudentSync = (student) => {
    setImmediate(() => {
        syncStudent(student).catch((error) => {
            console.error(
                `Background sync failed for ${student.name}:`,
                error.message
            );
        });
    });
};

module.exports = queueStudentSync;
