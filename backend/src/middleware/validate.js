const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(400).json({
      message: errorList[0]?.msg || "Validation failed",
      errors: errorList,
    });
  }
  next();
}

module.exports = validate;
