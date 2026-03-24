const express = require("express");
const axios = require("axios");
const Employee = require("../models/Employee");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";

// GET /api/employees - Get all employees
router.get("/", protect, async (req, res) => {
  try {
    const { department, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);

    res.json({ success: true, employees, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/employees/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/employees - Add new employee (admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, employeeId, department, position, password } = req.body;

    const existing = await Employee.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) {
      return res.status(400).json({
        message: existing.email === email ? "Email already exists" : "Employee ID already exists",
      });
    }

    const employee = await Employee.create({
      name,
      email,
      employeeId: employeeId.toUpperCase(),
      department,
      position,
      password: password || "password123", // default password
    });

    res.status(201).json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/employees/:id - Update employee
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, department, position, isActive } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, department, position, isActive },
      { new: true }
    ).select("-password");

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/employees/:id/register-face - Register face via Python service
router.post("/:id/register-face", protect, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "Image is required" });

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    // Allow users to register their own face or admins to register others
    if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    console.log("Calling Python service at:", PYTHON_URL);

    // Call Python face recognition service
    let pyResponse;
    try {
      pyResponse = await axios.post(`${PYTHON_URL}/register`, {
        employee_id: employee.employeeId,
        image,
      }, { timeout: 30000 });
    } catch (axiosError) {
      const status = axiosError.response?.status;
      const remoteMessage = axiosError.response?.data?.message;
      if (status && status < 500) {
        return res.status(status).json({
          success: false,
          message: remoteMessage || "Face registration failed",
        });
      }

      console.error("Python service error:", axiosError.message);
      return res.status(503).json({ 
        success: false, 
        message: `Face recognition service unavailable: ${axiosError.message}. Make sure Python service is running on ${PYTHON_URL}` 
      });
    }

    if (pyResponse.data.success) {
      // Store base64 image (keep last 5 samples)
      if (!employee.faceImages) {
        employee.faceImages = [];
      }
      
      // Extract base64 from data URL if needed
      let imageData = image;
      if (image.includes(",")) {
        imageData = image.split(",")[1];
      }
      
      employee.faceImages.push(imageData);
      
      // Keep only last 5 images
      if (employee.faceImages.length > 5) {
        employee.faceImages = employee.faceImages.slice(-5);
      }

      employee.faceRegistered = true;
      employee.faceSamples = pyResponse.data.total_samples;
      await employee.save();

      res.json({
        success: true,
        message: pyResponse.data.message,
        faceSamples: pyResponse.data.total_samples,
        faceImages: employee.faceImages,
      });
    } else {
      res.status(400).json({ success: false, message: pyResponse.data.message || "Face registration failed" });
    }
  } catch (error) {
    console.error("Register face error:", error);
    if (error.response?.data) {
      return res.status(error.response.status || 400).json({ success: false, message: error.response.data.message });
    }
    res.status(500).json({ success: false, message: error.message || "Registration failed" });
  }
});

// DELETE /api/employees/:id/face - Delete face data
router.delete("/:id/face", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await axios.delete(`${PYTHON_URL}/delete/${employee.employeeId}`);

    employee.faceRegistered = false;
    employee.faceSamples = 0;
    await employee.save();

    res.json({ success: true, message: "Face data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/employees/:id/face-data - Get face registration data
router.get("/:id/face-data", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    // Only allow users to view their own face data or admins
    if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      faceRegistered: employee.faceRegistered,
      faceSamples: employee.faceSamples,
      faceImages: employee.faceImages || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, message: "Employee deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;