const express = require("express");
const axios = require("axios");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001";

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// POST /api/attendance/mark - Mark attendance via face recognition
router.post("/mark", protect, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Image is required" });

    // Get logged-in user's employee record FIRST
    const loggedInEmployee = await Employee.findById(req.user._id);
    if (!loggedInEmployee) {
      return res.status(404).json({ success: false, message: "Your employee record not found" });
    }

    console.log(`User ${loggedInEmployee.employeeId} attempting to mark attendance`);

    // Step 1: Recognize face via Python service
    let pyResponse;
    try {
      pyResponse = await axios.post(`${PYTHON_URL}/recognize`, { image }, { timeout: 30000 });
    } catch (axiosError) {
      const status = axiosError.response?.status;
      const remoteMessage = axiosError.response?.data?.message;
      if (status && status < 500) {
        return res.status(status).json({
          success: false,
          message: remoteMessage || "Face recognition failed",
        });
      }
      console.error("Python service error:", axiosError.message);
      return res.status(503).json({
        success: false,
        message: `Face recognition service unavailable: ${axiosError.message}. Ensure Python service is running on ${PYTHON_URL}`,
      });
    }

    if (!pyResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: pyResponse.data.message || "Face not recognized",
      });
    }

    const { employee_id, confidence } = pyResponse.data;

    // Step 2: CRITICAL - Verify recognized person is the LOGGED-IN USER
    if (employee_id !== loggedInEmployee.employeeId) {
      console.warn(`Security Alert: User ${loggedInEmployee.employeeId} tried to mark as ${employee_id}`);
      return res.status(403).json({
        success: false,
        message: "Face does not match your registered profile. You can only mark your own attendance.",
      });
    }

    // Step 3: Validate confidence is high enough
    const MIN_CONFIDENCE = 75; // Require 75% confidence minimum
    if (confidence < MIN_CONFIDENCE) {
      return res.status(400).json({ 
        success: false, 
        message: `Face match confidence too low (${confidence}%). Position your face clearly and ensure adequate lighting.` 
      });
    }

    const today = getTodayDate();
    const now = new Date();

    // Step 4: Check existing attendance record
    let attendance = await Attendance.findOne({ employeeId: employee_id, date: today });

    if (!attendance) {
      // First scan = Check In
      const hour = now.getHours();
      const status = hour >= 10 ? "late" : "present"; // Late after 10 AM

      attendance = await Attendance.create({
        employee: loggedInEmployee._id,
        employeeId: employee_id,
        date: today,
        checkIn: now,
        status,
        confidence,
      });

      return res.json({
        success: true,
        action: "check-in",
        message: `✅ Check-in recorded for ${loggedInEmployee.name}`,
        employee: {
          name: loggedInEmployee.name,
          employeeId: loggedInEmployee.employeeId,
          department: loggedInEmployee.department,
          position: loggedInEmployee.position,
        },
        attendance: {
          checkIn: attendance.checkIn,
          status: attendance.status,
          confidence,
        },
      });
    } else if (!attendance.checkOut) {
      // Second scan = Check Out
      attendance.checkOut = now;
      await attendance.save();

      return res.json({
        success: true,
        action: "check-out",
        message: `✅ Check-out recorded for ${loggedInEmployee.name}`,
        employee: {
          name: loggedInEmployee.name,
          employeeId: loggedInEmployee.employeeId,
          department: loggedInEmployee.department,
          position: loggedInEmployee.position,
        },
        attendance: {
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workingHours: attendance.workingHours,
          status: attendance.status,
          confidence,
        },
      });
    } else {
      return res.json({
        success: true,
        action: "already-marked",
        message: `ℹ️ ${loggedInEmployee.name} already checked in and out today`,
        employee: {
          name: loggedInEmployee.name,
          employeeId: loggedInEmployee.employeeId,
          department: loggedInEmployee.department,
        },
        attendance: {
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workingHours: attendance.workingHours,
          status: attendance.status,
        },
      });
    }
  } catch (error) {
    if (error.response?.data) {
      return res.status(400).json({ message: error.response.data.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attendance - Get attendance records
router.get("/", protect, async (req, res) => {
  try {
    const { date, employeeId, department, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query)
      .populate("employee", "name employeeId department position")
      .sort({ date: -1, checkIn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({ success: true, records, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attendance/today - Today's attendance summary
router.get("/today", protect, async (req, res) => {
  try {
    const today = getTodayDate();
    const records = await Attendance.find({ date: today })
      .populate("employee", "name employeeId department position")
      .sort({ checkIn: -1 });

    const totalEmployees = await Employee.countDocuments({ isActive: true });

    res.json({
      success: true,
      date: today,
      total: records.length,
      totalEmployees,
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      checkedOut: records.filter((r) => r.checkOut !== null).length,
      absent: totalEmployees - records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attendance/stats - Overall stats
router.get("/stats", protect, async (req, res) => {
  try {
    const today = getTodayDate();
    const thisMonth = today.substring(0, 7); // "YYYY-MM"

    const [todayCount, monthCount, totalEmployees, lateCount] = await Promise.all([
      Attendance.countDocuments({ date: today }),
      Attendance.countDocuments({ date: { $regex: `^${thisMonth}` } }),
      Employee.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: today, status: "late" }),
    ]);

    // Attendance trend - last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = await Attendance.countDocuments({ date: dateStr });
      last7Days.push({ date: dateStr, count });
    }

    // Department-wise today
    const deptStats = await Attendance.aggregate([
      { $match: { date: today } },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "emp",
        },
      },
      { $unwind: "$emp" },
      { $group: { _id: "$emp.department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      todayPresent: todayCount,
      todayAbsent: totalEmployees - todayCount,
      todayLate: lateCount,
      monthTotal: monthCount,
      totalEmployees,
      attendanceRate: totalEmployees > 0 ? ((todayCount / totalEmployees) * 100).toFixed(1) : 0,
      trend: last7Days,
      departmentStats: deptStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attendance/employee/:employeeId - Employee's own records
router.get("/employee/:employeeId", protect, async (req, res) => {
  try {
    const { month } = req.query;
    const query = { employeeId: req.params.employeeId };
    if (month) query.date = { $regex: `^${month}` };

    const records = await Attendance.find(query).sort({ date: -1 }).limit(30);

    const present = records.filter((r) => r.status === "present" || r.status === "late").length;
    const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);

    res.json({
      success: true,
      records,
      summary: {
        totalDays: records.length,
        present,
        late: records.filter((r) => r.status === "late").length,
        totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attendance/student-stats/:employeeId - Student's own attendance statistics
router.get("/student-stats/:employeeId", protect, async (req, res) => {
  try {
    const { employeeId } = req.params;
    // Verify student is accessing their own data
    if (req.user.employeeId !== employeeId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const records = await Attendance.find({ employeeId }).sort({ date: -1 });

    const stats = {
      totalDays: records.length,
      present: records.filter(r => r.status === "present").length,
      late: records.filter(r => r.status === "late").length,
      absent: records.filter(r => r.status === "absent").length,
      halfDay: records.filter(r => r.status === "half-day").length,
      attendancePercentage: records.length > 0
        ? Math.round((records.filter(r => r.status !== "absent").length / records.length) * 100)
        : 0,
      recentRecords: records.slice(0, 10),
    };

    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/student-today/:employeeId - Check if student marked attendance today
router.get("/student-today/:employeeId", protect, async (req, res) => {
  try {
    const { employeeId } = req.params;
    // Verify student is accessing their own data
    if (req.user.employeeId !== employeeId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const today = getTodayDate();
    const record = await Attendance.findOne({ employeeId, date: today });

    res.json({
      success: true,
      marked: !!record,
      status: record?.status || null,
      checkIn: record?.checkIn || null,
      checkOut: record?.checkOut || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/student-monthly/:employeeId - Monthly attendance data for student
router.get("/student-monthly/:employeeId", protect, async (req, res) => {
  try {
    const { employeeId } = req.params;
    // Verify student is accessing their own data
    if (req.user.employeeId !== employeeId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;

    const records = await Attendance.find({
      employeeId,
      date: { $regex: `^${monthStr}` }
    }).sort({ date: 1 });

    const monthlyData = records.map(r => ({
      date: r.date,
      status: r.status,
      isPresent: r.status !== "absent" ? 1 : 0,
    }));

    res.json({ success: true, records: monthlyData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;