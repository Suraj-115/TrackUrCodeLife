const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

/**
 * Throttling for the OTP and credential endpoints.
 *
 * Without this, /auth/send-otp is an open relay: anyone can make the server
 * send unlimited Brevo emails to any address, which burns the sending quota
 * and lets an attacker brute-force 6-digit codes.
 */

const jsonHandler = (message) => (req, res) => {
    res.status(429).json({
        success: false,
        message
    });
};

/**
 * Keyed by client IP *and* the submitted email, so one noisy IP cannot lock
 * out every user, and one targeted address cannot be hammered from a single
 * host.
 *
 * ipKeyGenerator normalises IPv6 addresses to a /64 subnet; using req.ip
 * directly would let a single IPv6 user rotate through addresses to bypass
 * the limit.
 */
const byIpAndEmail = (req) => {
    const email = String(
        req.body?.collegeEmail || req.body?.email || ""
    ).toLowerCase().trim();

    return `${ipKeyGenerator(req.ip)}:${email}`;
};

const commonOptions = {
    windowMs: 10 * 60 * 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: byIpAndEmail
};

const otpLimiter = rateLimit({
    ...commonOptions,
    limit: 5,
    handler: jsonHandler(
        "Too many OTP requests. Please wait a few minutes and try again."
    )
});

const loginLimiter = rateLimit({
    ...commonOptions,
    limit: 20,
    handler: jsonHandler(
        "Too many login attempts. Please wait a few minutes and try again."
    )
});

// Verifying a 6-digit code is the other brute-forceable surface.
const otpVerifyLimiter = rateLimit({
    ...commonOptions,
    limit: 15,
    handler: jsonHandler(
        "Too many verification attempts. Please request a new OTP."
    )
});

module.exports = {
    otpLimiter,
    loginLimiter,
    otpVerifyLimiter
};
