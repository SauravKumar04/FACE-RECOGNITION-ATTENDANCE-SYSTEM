const axios = require("axios");
const { body } = require("express-validator");
const Student = require("../models/Student");
const Request = require("../models/Request");
const createImageKit = require("../config/imagekit");
const { getLocalDateString, getMonthPrefix } = require("../utils/date");

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:5001";

const faceRegistrationValidation = [
  body("images")
    .isArray({ min: 5, max: 5 })
    .withMessage("Exactly 5 face images are required"),
  body("images.*").isString().notEmpty().withMessage("Each face image must be a base64 string"),
];

const requestValidation = [
  body("type").equals("FACE_ID_CHANGE").withMessage("Only FACE_ID_CHANGE request is supported"),
];

const profileUpdateValidation = [
  body("fullName").optional().isString().isLength({ max: 80 }).withMessage("Full name must be under 80 characters"),
  body("phone").optional().isString().isLength({ max: 30 }).withMessage("Phone must be under 30 characters"),
  body("bio").optional().isString().isLength({ max: 220 }).withMessage("Bio must be under 220 characters"),
  body("profileImage").optional().isString().withMessage("Profile image must be a base64 string"),
];

function summarizeAttendance(student) {
  const today = getLocalDateString();
  const monthPrefix = getMonthPrefix(today);

  let presentDays = 0;
  let absentDays = 0;
  let monthlyPresent = 0;

  for (const item of student.attendance) {
    if (item.status === "PRESENT") {
      presentDays += 1;
      if (item.date.startsWith(monthPrefix)) monthlyPresent += 1;
    }
  }

  const registeredDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  absentDays = Math.max(0, registeredDays - presentDays);

  return {
    presentDays,
    absentDays,
    monthlySummary: {
      month: monthPrefix,
      presentDays: monthlyPresent,
      totalMarkedDays: student.attendance.filter((a) => a.date.startsWith(monthPrefix)).length,
    },
  };
}

async function getStudentMe(req, res) {
  const student = await Student.findById(req.user.student._id).select("-password");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const summary = summarizeAttendance(student);

  return res.json({
    student,
    summary,
  });
}

function normalizeBase64(input) {
  if (input.includes(",")) return input.split(",")[1];
  return input;
}

function toSafeStorageKey(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "student";
}

async function registerFaceImages(req, res) {
  const student = await Student.findById(req.user.student._id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const isFirstRegistration = student.faceImages.length === 0;
  if (!isFirstRegistration && !student.allowFaceReregistration) {
    return res.status(403).json({ message: "Face ID update not allowed. Create a change request first." });
  }

  const imagekit = createImageKit();
  const uploadedUrls = [];
  const uploadedFileIds = [];
  const safeStorageKey = toSafeStorageKey(student.regNumber);

  // Rebuild recognition samples for this student in python-service.
  try {
    await axios.delete(`${PYTHON_SERVICE_URL}/delete/${student.regNumber}`, { timeout: 15000 });
  } catch (err) {
    // Ignore delete errors; data may not exist yet.
  }

  try {
    for (let i = 0; i < req.body.images.length; i += 1) {
      const base64 = normalizeBase64(req.body.images[i]);
      const fileName = `${safeStorageKey}_${Date.now()}_${i + 1}.jpg`;

      let uploaded;
      try {
        uploaded = await imagekit.upload({
          file: base64,
          fileName,
          folder: `/attendance/${safeStorageKey}`,
        });
      } catch (uploadErr) {
        const uploadMessage =
          uploadErr.response?.data?.message ||
          uploadErr.message ||
          "Image upload failed";
        return res.status(502).json({
          message: `Face image upload failed: ${uploadMessage}`,
        });
      }

      uploadedUrls.push(uploaded.url);
      if (uploaded.fileId) {
        uploadedFileIds.push(uploaded.fileId);
      }

      try {
        await axios.post(
          `${PYTHON_SERVICE_URL}/register`,
          {
            employee_id: student.regNumber,
            image: req.body.images[i],
          },
          { timeout: 90000 }
        );
      } catch (pythonErr) {
        const upstreamMessage =
          pythonErr.response?.data?.message ||
          pythonErr.message ||
          "Recognition registration failed";
        const status = pythonErr.response?.status;
        return res.status(status || 502).json({
          message: `Face recognition registration failed: ${upstreamMessage}`,
        });
      }
    }
  } catch (err) {
    await Promise.allSettled(
      uploadedFileIds.map((fileId) => imagekit.deleteFile(fileId))
    );
    try {
      await axios.delete(`${PYTHON_SERVICE_URL}/delete/${student.regNumber}`, { timeout: 15000 });
    } catch (cleanupErr) {
      // Ignore cleanup errors.
    }

    const upstreamMessage = err.response?.data?.message;
    const status = err.response?.status;

    if (status) {
      return res.status(status).json({
        message: upstreamMessage || "Face registration failed. Please recapture with clear lighting.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        message: "Face registration timed out. Please keep camera steady and try again.",
      });
    }

    return res.status(503).json({
      message: "Face registration service is unavailable right now. Please try again shortly.",
    });
  }

  student.faceImages = uploadedUrls;
  student.faceVerified = true;
  student.allowFaceReregistration = false;
  await student.save();

  await Request.updateMany(
    {
      studentId: student._id,
      type: "FACE_ID_CHANGE",
      status: "APPROVED",
    },
    { $set: { status: "REJECTED" } }
  );

  return res.json({
    message: "Face ID registration completed",
    faceImages: student.faceImages,
  });
}

async function createFaceChangeRequest(req, res) {
  const student = await Student.findById(req.user.student._id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const existingPending = await Request.findOne({
    studentId: student._id,
    type: "FACE_ID_CHANGE",
    status: "PENDING",
  });

  if (existingPending) {
    return res.status(400).json({ message: "A pending request already exists" });
  }

  const request = await Request.create({
    studentId: student._id,
    type: "FACE_ID_CHANGE",
    status: "PENDING",
  });

  return res.status(201).json({
    message: "Face ID change request submitted",
    request,
  });
}

async function updateStudentProfile(req, res) {
  const student = await Student.findById(req.user.student._id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const { fullName, phone, bio, profileImage } = req.body || {};

  if (typeof fullName === "string") student.fullName = fullName.trim();
  if (typeof phone === "string") student.phone = phone.trim();
  if (typeof bio === "string") student.bio = bio.trim();

  if (profileImage && profileImage.trim()) {
    const imagekit = createImageKit();
    const safeStorageKey = toSafeStorageKey(student.regNumber);
    const uploaded = await imagekit.upload({
      file: normalizeBase64(profileImage),
      fileName: `${safeStorageKey}_profile_${Date.now()}.jpg`,
      folder: `/attendance/${safeStorageKey}/profile`,
    });
    student.profileImage = uploaded.url;
  }

  await student.save();

  return res.json({
    message: "Profile updated successfully",
    student,
  });
}

module.exports = {
  faceRegistrationValidation,
  requestValidation,
  profileUpdateValidation,
  getStudentMe,
  registerFaceImages,
  createFaceChangeRequest,
  updateStudentProfile,
};
