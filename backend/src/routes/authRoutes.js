const express = require("express");
const validate = require("../middleware/validate");
const {
  registerValidation,
  loginValidation,
  registerStudent,
  loginStudent,
  loginAdmin,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidation, validate, registerStudent);
router.post("/login", loginValidation, validate, loginStudent);
router.post("/admin/login", loginValidation, validate, loginAdmin);

module.exports = router;
