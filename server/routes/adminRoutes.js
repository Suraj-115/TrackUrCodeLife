const express = require("express");

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

const router = express.Router();

/*
 * Every route in this file is admin-only. Applying the guard once at the
 * router level means a new endpoint cannot be added without it by accident.
 */
router.use(protect, adminOnly);

router.get("/overview", getAdminOverview);

router.get("/contest-analytics", getContestAnalyticsAdmin);

router.get("/students", getAllStudents);

/*
 * Static segments are registered before "/students/:id" so a request for
 * "/students/sync" is not captured as an id.
 */
router.post("/students/sync", syncAllStudentsAdmin);

router.post("/students/:id/sync", syncOneStudentAdmin);

router.put("/students/:id", updateStudentByAdmin);

router.delete("/students/:id", deleteStudentByAdmin);

module.exports = router;
