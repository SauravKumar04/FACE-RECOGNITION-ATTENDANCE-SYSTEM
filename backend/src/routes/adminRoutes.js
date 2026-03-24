const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const {
  listStudents,
  getStudentProfile,
  getStudentAttendance,
  removeStudent,
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth, requireRole("admin"));

router.get("/students", listStudents);
router.get("/students/:studentId", getStudentProfile);
router.get("/students/:studentId/attendance", getStudentAttendance);
router.delete("/students/:studentId", removeStudent);

module.exports = router;
