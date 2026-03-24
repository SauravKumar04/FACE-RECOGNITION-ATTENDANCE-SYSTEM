const Student = require("../models/Student");

async function listStudents(req, res) {
  const { department } = req.query;
  const query = {};
  if (department) query.department = department;

  const students = await Student.find(query)
    .select("regNumber roll department email fullName profileImage faceImages faceVerified createdAt")
    .sort({ createdAt: -1 });

  return res.json({ students });
}

async function getStudentProfile(req, res) {
  const student = await Student.findById(req.params.studentId).select("-password");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

async function getStudentAttendance(req, res) {
  const student = await Student.findById(req.params.studentId).select("regNumber roll department email fullName profileImage faceImages attendance createdAt");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({
    student,
    attendance: student.attendance,
  });
}

async function removeStudent(req, res) {
  const deleted = await Student.findByIdAndDelete(req.params.studentId);
  if (!deleted) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ message: "Student removed" });
}

module.exports = {
  listStudents,
  getStudentProfile,
  getStudentAttendance,
  removeStudent,
};
