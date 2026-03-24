const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const Student = require("../models/Student");
const { signToken } = require("../utils/jwt");

const registerValidation = [
  body("regNumber").trim().notEmpty().withMessage("Registration number is required"),
  body("roll").trim().notEmpty().withMessage("Roll number is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

async function registerStudent(req, res) {
  const { regNumber, roll, department, email, password } = req.body;

  const existing = await Student.findOne({
    $or: [{ email: email.toLowerCase() }, { regNumber: regNumber.toUpperCase() }],
  });

  if (existing) {
    return res.status(400).json({ message: "Email or registration number already exists" });
  }

  const hashed = await bcrypt.hash(password, 12);

  const student = await Student.create({
    regNumber,
    roll,
    department,
    email,
    password: hashed,
  });

  const token = signToken({ id: student._id, role: "student" });

  return res.status(201).json({
    token,
    user: {
      id: student._id,
      role: "student",
      fullName: student.fullName || "",
      regNumber: student.regNumber,
      roll: student.roll,
      department: student.department,
      email: student.email,
      profileImage: student.profileImage || "",
      faceVerified: student.faceVerified,
    },
  });
}

async function loginStudent(req, res) {
  const { email, password } = req.body;

  const student = await Student.findOne({ email: email.toLowerCase() });
  if (!student) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: student._id, role: "student" });

  return res.json({
    token,
    user: {
      id: student._id,
      role: "student",
      fullName: student.fullName || "",
      regNumber: student.regNumber,
      roll: student.roll,
      department: student.department,
      email: student.email,
      profileImage: student.profileImage || "",
      faceVerified: student.faceVerified,
    },
  });
}

async function loginAdmin(req, res) {
  const { email, password } = req.body;

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ message: "Admin credentials are not configured" });
  }

  const emailOk = email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const passOk = password === process.env.ADMIN_PASSWORD;

  if (!emailOk || !passOk) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = signToken({ role: "admin", email: process.env.ADMIN_EMAIL });

  return res.json({
    token,
    user: {
      role: "admin",
      email: process.env.ADMIN_EMAIL,
    },
  });
}

module.exports = {
  registerValidation,
  loginValidation,
  registerStudent,
  loginStudent,
  loginAdmin,
};
