const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    otp: {
        type: String,
        required: true
    },

    verified: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }
});

module.exports = mongoose.model("OTP", otpSchema);