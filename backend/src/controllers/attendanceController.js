const axios = require("axios");
const Student = require("../models/Student");
const { getLocalDateString } = require("../utils/date");

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:5001";

async function markAttendance(req, res) {
  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ message: "Face image is required to mark attendance" });
  }

  const student = await Student.findById(req.user.student._id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  if (!student.faceVerified || student.faceImages.length < 5) {
    return res.status(400).json({ message: "Complete mandatory Face ID registration first" });
  }

  const today = getLocalDateString();
  const alreadyMarked = student.attendance.some((item) => item.date === today);

  if (alreadyMarked) {
    return res.status(409).json({ message: "Attendance already marked for today" });
  }

  let recognition;
  try {
    const { data } = await axios.post(
      `${PYTHON_SERVICE_URL}/verify-user`,
      {
        employee_id: student.regNumber,
        image,
      },
      { timeout: 30000 }
    );
    recognition = data;
  } catch (err) {
    const remoteMessage = err.response?.data?.message;
    if (remoteMessage) {
      return res.status(err.response.status || 400).json({ message: remoteMessage });
    }
    return res.status(503).json({ message: "Face recognition service unavailable" });
  }

  if (!recognition?.success || String(recognition.employee_id).toUpperCase() !== String(student.regNumber).toUpperCase()) {
    return res.status(403).json({ message: "Face does not match the registered student profile" });
  }

  student.attendance.push({
    date: today,
    status: "PRESENT",
    markedAt: new Date(),
  });

  await student.save();

  return res.status(201).json({
    message: "Attendance marked successfully",
    attendance: student.attendance[student.attendance.length - 1],
  });
}

async function getMyAttendance(req, res) {
  const student = await Student.findById(req.user.student._id).select("attendance regNumber roll department email createdAt");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  return res.json({
    attendance: student.attendance,
    student,
  });
}

module.exports = {
  markAttendance,
  getMyAttendance,
};
