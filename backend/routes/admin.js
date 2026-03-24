const express = require("express");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get all employees (admin only)
router.get("/employees", protect, adminOnly, async (req, res) => {
  try {
    const { batch, search, isActive } = req.query;
    let filter = {};

    if (batch) filter.batch = batch;
    if (isActive) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const employees = await Employee.find(filter).select("-password");
    res.json({
      success: true,
      employees,
      total: employees.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get attendance report for a student (admin only)
router.get("/student-attendance/:employeeId", protect, adminOnly, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    let query = { employeeId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    
    const stats = {
      totalDays: records.length,
      present: records.filter(r => r.status === "present").length,
      late: records.filter(r => r.status === "late").length,
      absent: records.filter(r => r.status === "absent").length,
      halfDay: records.filter(r => r.status === "half-day").length,
      attendancePercentage: records.length > 0 
        ? Math.round(((records.filter(r => r.status !== "absent").length / records.length) * 100))
        : 0,
    };

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        batch: employee.batch,
        department: employee.department,
      },
      stats,
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get class attendance summary (admin only)
router.get("/class-attendance", protect, adminOnly, async (req, res) => {
  try {
    const { batch, date } = req.query;
    const queryDate = date || new Date().toISOString().split("T")[0];

    // Get all employees in batch
    let employeeFilter = {};
    if (batch) employeeFilter.batch = batch;

    const employees = await Employee.find(employeeFilter).select("_id employeeId name batch department");
    const employeeIds = employees.map(e => e.employeeId);

    // Get attendance for the date
    const attendance = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: queryDate,
    });

    const summary = {
      totalStudents: employees.length,
      present: attendance.filter(a => a.status === "present").length,
      late: attendance.filter(a => a.status === "late").length,
      absent: attendance.filter(a => a.status === "absent").length,
      halfDay: attendance.filter(a => a.status === "half-day").length,
      attendanceRate: employees.length > 0
        ? Math.round(((attendance.filter(a => a.status !== "absent").length / employees.length) * 100))
        : 0,
    };

    const detailedReport = employees.map(emp => {
      const attend = attendance.find(a => a.employeeId === emp.employeeId);
      return {
        ...emp.toObject(),
        status: attend?.status || "absent",
        checkIn: attend?.checkIn || null,
        checkOut: attend?.checkOut || null,
        confidence: attend?.confidence || 0,
      };
    });

    res.json({
      success: true,
      date: queryDate,
      batch: batch || "All",
      summary,
      detailedReport,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get batch summary (admin only)
router.get("/batch-summary", protect, adminOnly, async (req, res) => {
  try {
    const batches = await Employee.aggregate([
      {
        $group: {
          _id: "$batch",
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          faceRegistered: {
            $sum: { $cond: [{ $eq: ["$faceRegistered", true] }, 1, 0] }
          },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Add today's attendance stats
    const today = getTodayDate();
    const batchesSummary = await Promise.all(
      batches.map(async (batch) => {
        const batchEmployees = await Employee.find({ batch: batch._id }).select("employeeId");
        const batchEmployeeIds = batchEmployees.map((e) => e.employeeId);
        const attendanceToday = await Attendance.countDocuments({
          date: today,
          status: { $ne: "absent" },
          employeeId: { $in: batchEmployeeIds },
        });
        return {
          ...batch,
          attendanceToday,
        };
      })
    );

    res.json({
      success: true,
      batches: batchesSummary,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get dashboard stats (admin only)
router.get("/dashboard-stats", protect, adminOnly, async (req, res) => {
  try {
    const today = getTodayDate();

    const [
      totalEmployees,
      faceRegisteredCount,
      todayAttendance,
      batches,
    ] = await Promise.all([
      Employee.countDocuments({ isActive: true }),
      Employee.countDocuments({ faceRegistered: true }),
      Attendance.find({ date: today }),
      Employee.distinct("batch"),
    ]);

    const stats = {
      totalEmployees,
      faceRegistered: faceRegisteredCount,
      faceRegistrationRate: totalEmployees > 0 
        ? Math.round((faceRegisteredCount / totalEmployees) * 100)
        : 0,
      todayPresentCount: todayAttendance.filter(a => a.status === "present").length,
      todayLateCount: todayAttendance.filter(a => a.status === "late").length,
      todayAbsentCount: totalEmployees - todayAttendance.filter(a => a.status !== "absent").length,
      todayAttendanceRate: totalEmployees > 0
        ? Math.round((todayAttendance.filter(a => a.status !== "absent").length / totalEmployees) * 100)
        : 0,
      totalBatches: batches.length,
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get monthly attendance statistics
router.get("/monthly-stats", protect, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const queryMonth = month || (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const queryYear = year || currentDate.getFullYear();

    const datePrefix = `${queryYear}-${queryMonth}`;

    const attendance = await Attendance.find({
      date: { $regex: `^${datePrefix}` }
    });

    const dailyData = {};
    attendance.forEach(record => {
      if (!dailyData[record.date]) {
        dailyData[record.date] = {
          present: 0,
          late: 0,
          absent: 0,
          halfDay: 0,
        };
      }
      dailyData[record.date][record.status]++;
    });

    const stats = Object.entries(dailyData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, counts]) => ({
        date,
        ...counts,
      }));

    res.json({ success: true, month: queryMonth, year: queryYear, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export for face image viewed via admin
router.get("/employee-face/:employeeId", protect, adminOnly, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });
    
    if (!employee || !employee.registeredFacePath) {
      return res.status(404).json({ success: false, message: "No face image found" });
    }

    res.json({
      success: true,
      employeeId: employee.employeeId,
      name: employee.name,
      facePath: employee.registeredFacePath,
      faceRegistered: employee.faceRegistered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
