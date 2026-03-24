const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  faceRegistrationValidation,
  requestValidation,
  profileUpdateValidation,
  getStudentMe,
  registerFaceImages,
  createFaceChangeRequest,
  updateStudentProfile,
} = require("../controllers/studentController");

const router = express.Router();

router.use(auth, requireRole("student"));

router.get("/me", getStudentMe);
router.put("/profile", profileUpdateValidation, validate, updateStudentProfile);
router.post("/face/register", faceRegistrationValidation, validate, registerFaceImages);
router.post("/face/change-request", requestValidation, validate, createFaceChangeRequest);

module.exports = router;
