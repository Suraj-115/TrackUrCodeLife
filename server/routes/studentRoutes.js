const express = require("express");

const {
    getStudents,
    getStudentById,
    updateOwnProfile
} = require("../controllers/studentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* The directory behind both dashboards: search, section filter, sort. */
router.get("/", protect, getStudents);

/*
 * A student may read their own record; an admin may read anyone's. The check
 * lives in the controller so a crafted id cannot bypass it.
 */
router.get("/:id", protect, getStudentById);

/*
 * Self-service edit. Only the two platform handles are writable — name,
 * email, roll number and section are rejected server-side.
 */
router.put("/me", protect, updateOwnProfile);

module.exports = router;
