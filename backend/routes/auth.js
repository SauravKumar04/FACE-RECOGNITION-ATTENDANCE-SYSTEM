const express = require("express");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register - Register admin user
router.post("/register", async (req, res) => {
  try {
    console.log("Register request received:", req.body);
    const { name, email, password, employeeId, department, position, role, batch, semester, isAdminEmail } = req.body;

    // Validate required fields
    if (!name || !email || !password || !employeeId || !department || !position) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { employeeId }],
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: existingEmployee.email === email
          ? "Email already registered"
          : "Employee ID already exists",
      });
    }

    const employee = await Employee.create({
      name,
      email,
      password,
      employeeId: employeeId.toUpperCase(),
      department,
      position,
      batch: batch || "General",
      semester: semester || 1,
      role: role || "employee",
      isAdminEmail: isAdminEmail || false,
    });

    console.log("Employee created:", employee._id);

    res.status(201).json({
      success: true,
      token: generateToken(employee._id),
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position,
        role: employee.role,
        batch: employee.batch,
        faceRegistered: employee.faceRegistered,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Registration failed" 
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    console.log("Login successful:", employee._id);

    res.json({
      success: true,
      token: generateToken(employee._id),
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position,
        role: employee.role,
        faceRegistered: employee.faceRegistered,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Login failed" 
    });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, employee: req.user });
});

// POST /api/auth/verify-password - Verify password for sensitive operations
router.post("/verify-password", protect, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Verify email matches logged-in user
    if (email !== req.user.email) {
      return res.status(400).json({
        success: false,
        message: "Email does not match your account",
      });
    }

    const employee = await Employee.findById(req.user._id).select("+password");
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    res.json({
      success: true,
      message: "Password verified successfully",
    });
  } catch (error) {
    console.error("Verify password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Verification failed",
    });
  }
});

module.exports = router;