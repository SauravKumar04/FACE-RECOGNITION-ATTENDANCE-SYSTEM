const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin") {
      req.user = { role: "admin", email: decoded.email };
      return next();
    }

    const student = await Student.findById(decoded.id).select("-password");
    if (!student) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = { role: "student", student };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = {
  auth,
  requireRole,
};
