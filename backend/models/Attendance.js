const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" format for easy querying
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half-day"],
      default: "present",
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number, // Face recognition confidence %
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate working hours before saving
attendanceSchema.pre("save", function () {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);