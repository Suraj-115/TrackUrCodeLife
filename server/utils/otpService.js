const OTP = require("../models/OTP");
const sendEmail = require("./sendEmail");

const OTP_TTL_MINUTES = 5;
const OTP_VERIFIED_TTL_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Creates and emails a fresh OTP for the given purpose.
 *
 * Any previous codes for the same address and purpose are removed first, so
 * only the newest code is ever valid.
 */
const issueOTP = async (email, purpose) => {
    const otp = require("./generateOTP")();

    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OTP.deleteMany({ email, purpose });

    await OTP.create({
        email,
        otp,
        purpose,
        expiresAt
    });

    const isReset = purpose === "reset";

    await sendEmail(
        email,
        isReset
            ? "TrackUrCodeLife - Password Reset Code"
            : "TrackUrCodeLife - Email Verification",
        isReset
            ? `Your password reset code is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`
            : `Your OTP is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`
    );

    return otp;
};

/**
 * Checks a submitted code and marks it verified on success.
 *
 * Failed attempts are counted so a 6-digit code cannot be brute-forced; once
 * the limit is hit the record is destroyed and a new code must be requested.
 */
const consumeOTP = async (email, otp, purpose) => {
    const record = await OTP.findOne({ email, purpose });

    if (!record) {
        return { ok: false, message: "Invalid or expired OTP" };
    }

    if (record.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: record._id });
        return { ok: false, message: "Invalid or expired OTP" };
    }

    if (String(record.otp) !== String(otp)) {
        record.attempts += 1;

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await OTP.deleteOne({ _id: record._id });
            return {
                ok: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            };
        }

        await record.save();

        return { ok: false, message: "Invalid or expired OTP" };
    }

    record.verified = true;
    record.expiresAt = new Date(
        Date.now() + OTP_VERIFIED_TTL_MINUTES * 60 * 1000
    );

    await record.save();

    return { ok: true, record };
};

/**
 * Confirms a code was verified earlier and is still within its post-verify
 * window. Used to gate account creation and password resets.
 */
const findVerifiedOTP = async (email, purpose, otp) => {
    const record = await OTP.findOne({ email, purpose, verified: true });

    if (!record || record.expiresAt < new Date()) {
        return null;
    }

    /*
     * When a code is supplied it must be the verified one, which stops a
     * verification performed for one code from authorising a different one.
     */
    if (otp !== undefined && String(record.otp) !== String(otp)) {
        return null;
    }

    return record;
};

module.exports = {
    issueOTP,
    consumeOTP,
    findVerifiedOTP,
    OTP_TTL_MINUTES,
    MAX_OTP_ATTEMPTS
};
