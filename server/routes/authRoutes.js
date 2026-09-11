const express = require("express");

const {
    sendSignupOTP,
    verifySignupOTP,
    registerStudent,
    login,
    loginAdmin,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    getCurrentUser
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const {
    otpLimiter,
    loginLimiter,
    otpVerifyLimiter
} = require("../middleware/rateLimit");

const router = express.Router();

/* Signup: request a code, prove ownership of the college email, then register. */
router.post("/send-otp", otpLimiter, sendSignupOTP);

router.post("/verify-otp", otpVerifyLimiter, verifySignupOTP);

router.post("/register", registerStudent);

/* A single login endpoint; the role in the token decides where the UI routes. */
router.post("/login", loginLimiter, login);

router.post("/admin/login", loginLimiter, loginAdmin);

/* Forgot password, reached from Login rather than the main navigation. */
router.post("/forgot-password", otpLimiter, forgotPassword);

router.post("/verify-reset-otp", otpVerifyLimiter, verifyResetOTP);

router.post("/reset-password", resetPassword);

router.get("/me", protect, getCurrentUser);

module.exports = router;
