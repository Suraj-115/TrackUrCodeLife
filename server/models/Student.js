const mongoose = require("mongoose");

const SECTIONS = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

const platformStatsSchema = new mongoose.Schema(
    {
        problemsSolved: {
            type: Number,
            default: 0,
            min: 0
        },

        contestRating: {
            type: Number,
            default: 0,
            min: 0
        },

        contestsParticipated: {
            type: Number,
            default: 0,
            min: 0
        },

        lastParticipatedContestDate: {
            type: Date,
            default: null
        },

        lastUpdated: {
            type: Date,
            default: null
        },

        syncStatus: {
            type: String,
            enum: ["SUCCESS", "FAILED", "PENDING"],
            default: "PENDING"
        },

        syncError: {
            type: String,
            default: null
        },

        /*
         * When contest history was last written for this platform. Lets the
         * admin dashboard show whether analytics data is actually flowing.
         */
        contestHistorySyncedAt: {
            type: Date,
            default: null
        }
    },
    {
        _id: false
    }
);

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        collegeEmail: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        rollNo: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        section: {
            type: String,
            required: true,
            enum: SECTIONS
        },

        leetcodeUsername: {
            type: String,
            trim: true,
            default: ""
        },

        codechefUsername: {
            type: String,
            trim: true,
            default: ""
        },

        leetcodeStats: {
            type: platformStatsSchema,
            default: () => ({})
        },

        codechefStats: {
            type: platformStatsSchema,
            default: () => ({})
        }
    },
    {
        timestamps: true
    }
);

studentSchema.index({ name: 1 });
studentSchema.index({ section: 1 });

studentSchema.statics.SECTIONS = SECTIONS;

module.exports = mongoose.model("Student", studentSchema);
module.exports.SECTIONS = SECTIONS;
