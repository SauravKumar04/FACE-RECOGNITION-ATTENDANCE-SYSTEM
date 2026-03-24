const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    type: {
      type: String,
      enum: ["FACE_ID_CHANGE"],
      default: "FACE_ID_CHANGE",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

requestSchema.index({ studentId: 1, type: 1, status: 1 });

module.exports = mongoose.model("Request", requestSchema);
