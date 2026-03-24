const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      default: "General",
      trim: true,
    },
    semester: {
      type: Number,
      default: 1,
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
    faceSamples: {
      type: Number,
      default: 0,
    },
    registeredFacePath: {
      type: String,
      default: "",
    },
    faceImages: [{
      type: String,  // Store base64 image strings
      required: false,
    }],
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    isAdminEmail: {
      type: Boolean,
      default: false,
    },
    adminAccessLevel: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
employeeSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);