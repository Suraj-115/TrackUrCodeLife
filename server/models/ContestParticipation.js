const mongoose = require("mongoose");

/**
 * One document per contest a student actually participated in.
 *
 * This is the only reliable source for date-based contest analytics.
 * Aggregate counters such as `codechefStats.contestsParticipated` cannot be
 * used to answer "how many contests in August" because they carry no dates.
 *
 * `contestKey` is the platform's own stable identifier:
 *   - CodeChef: the contest code, e.g. "START224D"
 *   - LeetCode: the contest title, e.g. "Weekly Contest 498"
 *
 * The unique compound index makes re-syncing idempotent, so a contest is
 * never recorded twice for the same student.
 */
const contestParticipationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true
        },

        platform: {
            type: String,
            enum: ["leetcode", "codechef"],
            required: true
        },

        contestKey: {
            type: String,
            required: true,
            trim: true
        },

        title: {
            type: String,
            default: "",
            trim: true
        },

        participatedAt: {
            type: Date,
            required: true
        },

        rating: {
            type: Number,
            default: null
        },

        rank: {
            type: Number,
            default: null
        },

        problemsSolved: {
            type: Number,
            default: null
        },

        /*
         * Denormalised from Student so contest analytics can group by section
         * without an extra lookup. Kept in sync when an admin changes a
         * student's section.
         */
        section: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

contestParticipationSchema.index(
    { student: 1, platform: 1, contestKey: 1 },
    { unique: true }
);

contestParticipationSchema.index({ participatedAt: 1, platform: 1 });
contestParticipationSchema.index({ participatedAt: 1, section: 1 });

module.exports = mongoose.model(
    "ContestParticipation",
    contestParticipationSchema
);
