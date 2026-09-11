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

    /*
     * Separates the signup code from the password-reset code so a code issued
     * for one flow can never be replayed against the other.
     */
    purpose: {
        type: String,
        enum: ["signup", "reset"],
        default: "signup",
        index: true
    },

    verified: {
        type: Boolean,
        default: false
    },

    /*
     * Number of failed verification attempts for this code. A code is
     * invalidated once this passes MAX_OTP_ATTEMPTS, which stops a 6-digit
     * code from being brute-forced.
     */
    attempts: {
        type: Number,
        default: 0
    },

    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }
});

otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("OTP", otpSchema);
