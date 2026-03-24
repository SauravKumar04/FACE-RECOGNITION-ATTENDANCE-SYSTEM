const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      required: true,
    },
    markedAt: { type: Date, required: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    roll: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    faceImages: {
      type: [String],
      default: [],
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    allowFaceReregistration: {
      type: Boolean,
      default: false,
    },
    attendance: {
      type: [attendanceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
