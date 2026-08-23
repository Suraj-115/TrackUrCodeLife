const express = require("express");

const {
    sendOTP,
    verifyOTP,
    registerStudent,
    loginStudent,
    loginAdmin,
    getDashboard,
    getLeaderboard,
    getAllStudents,
    updateStudent,
    updateStudentByAdmin,
    deleteStudentByAdmin
} = require("../controllers/studentController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/register", registerStudent);

router.post("/login", loginStudent);

router.post("/admin/login", loginAdmin);

router.get(
    "/dashboard",
    protect,
    getDashboard
);

router.get(
    "/me",
    protect,
    getDashboard
);

router.get(
    "/leaderboard",
    protect,
    getLeaderboard
);

router.get(
    "/admin/students",
    protect,
    adminOnly,
    getAllStudents
);

router.put(
    "/profile",
    protect,
    updateStudent
);

router.put(
    "/admin/students/:id",
    protect,
    adminOnly,
    updateStudentByAdmin
);

router.delete(
    "/admin/students/:id",
    protect,
    adminOnly,
    deleteStudentByAdmin
);

module.exports = router;
