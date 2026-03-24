const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const {
  listRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/requestController");

const router = express.Router();

router.use(auth, requireRole("admin"));

router.get("/", listRequests);
router.patch("/:requestId/approve", approveRequest);
router.patch("/:requestId/reject", rejectRequest);

module.exports = router;
