const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const { markAttendance, getMyAttendance } = require("../controllers/attendanceController");

const router = express.Router();

router.use(auth, requireRole("student"));

router.post("/mark", markAttendance);
router.get("/me", getMyAttendance);

module.exports = router;
