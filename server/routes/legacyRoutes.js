const express = require("express");

/*
 * Compatibility aliases for the paths the previously deployed frontend calls.
 *
 * The frontend and backend deploy separately, so for the window between the
 * two deploys the old paths must keep resolving. Each one is a straight
 * pass-through to the current controller, so there is no duplicated logic —
 * only duplicated routing, which is why this file can be deleted once the new
 * frontend is live.
 */

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

const {
    getStudents,
    updateOwnProfile
} = require("../controllers/studentController");

const {
    getAllStudents,
    updateStudentByAdmin,
    deleteStudentByAdmin,
    syncAllStudentsAdmin,
    syncOneStudentAdmin,
    getContestAnalyticsAdmin,
    getAdminOverview
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
    otpLimiter,
    loginLimiter,
    otpVerifyLimiter
} = require("../middleware/rateLimit");

const router = express.Router();

router.post("/send-otp", otpLimiter, sendSignupOTP);
router.post("/verify-otp", otpVerifyLimiter, verifySignupOTP);
router.post("/register", registerStudent);
router.post("/login", loginLimiter, login);
router.post("/admin/login", loginLimiter, loginAdmin);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-reset-otp", otpVerifyLimiter, verifyResetOTP);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getCurrentUser);

/*
 * "/dashboard" used to return the caller's raw student document under
 * `student`. The new frontend reads the equivalent from "/me", which is shaped
 * for the UI rather than for the database, so this older shape is reproduced
 * here instead of being aliased to a handler that returns something different.
 */
const legacyDashboard = async (req, res) => {
    try {
        const Student = require("../models/Student");

        const student = await Student.findById(req.studentId).select(
            "-password"
        );

        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Student not found" });
        }

        return res.status(200).json({ success: true, student });
    } catch (error) {
        console.error("legacy dashboard failed:", error.message);
        return res
            .status(500)
            .json({ success: false, message: "Failed to load dashboard" });
    }
};

/*
 * The old leaderboard was platform-scoped and returned a flat row per student
 * under `leaderboard`. The new directory returns both platforms per row under
 * `students`, so this reshapes rather than aliasing — an alias would return a
 * payload the old page cannot read.
 */
const legacyLeaderboard = async (req, res) => {
    try {
        const { platform = "leetcode", section } = req.query;

        if (!["leetcode", "codechef"].includes(platform)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid platform" });
        }

        const Student = require("../models/Student");

        const query = section ? { section } : {};

        const students = await Student.find(query)
            .select("name rollNo section leetcodeStats codechefStats")
            .sort({ [`${platform}Stats.contestRating`]: -1 });

        const leaderboard = students.map((student, index) => {
            const stats = student[`${platform}Stats`] || {};

            return {
                rank: index + 1,
                name: student.name,
                rollNo: student.rollNo,
                section: student.section,
                problemsSolved: stats.problemsSolved ?? 0,
                contestRating: stats.contestRating ?? 0,
                contestsParticipated: stats.contestsParticipated ?? 0,
                lastParticipatedContestDate: stats.lastParticipatedContestDate,
                lastUpdated: stats.lastUpdated,
                syncStatus: stats.syncStatus || "PENDING"
            };
        });

        return res.status(200).json({
            success: true,
            platform,
            metric: "contestRating",
            leaderboard
        });
    } catch (error) {
        console.error("legacy leaderboard failed:", error.message);
        return res
            .status(500)
            .json({ success: false, message: "Failed to load leaderboard" });
    }
};

router.get("/dashboard", protect, legacyDashboard);

router.get("/leaderboard", protect, legacyLeaderboard);

router.get("/admin/overview", protect, adminOnly, getAdminOverview);
router.get("/admin/contest-analytics", protect, adminOnly, getContestAnalyticsAdmin);
router.get("/admin/students", protect, adminOnly, getAllStudents);
router.post("/admin/sync", protect, adminOnly, syncAllStudentsAdmin);
router.post("/admin/students/:id/sync", protect, adminOnly, syncOneStudentAdmin);
router.put("/admin/students/:id", protect, adminOnly, updateStudentByAdmin);
router.delete("/admin/students/:id", protect, adminOnly, deleteStudentByAdmin);

router.put("/profile", protect, updateOwnProfile);

module.exports = router;
