const mongoose = require("mongoose");

const platformStatsSchema = new mongoose.Schema(
    {
        problemsSolved: {
            type: Number,
            default: 0
        },

        contestRating: {
            type: Number,
            default: 0
        },

        contestsParticipated: {
            type: Number,
            default: 0
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
            enum: ["CSE-11", "CSE-14", "CSE-18", "CSE-22"]
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

module.exports = mongoose.model("Student", studentSchema);