const Request = require("../models/Request");
const Student = require("../models/Student");

async function listRequests(req, res) {
  const requests = await Request.find({ type: "FACE_ID_CHANGE" })
    .populate("studentId", "regNumber roll department email")
    .sort({ createdAt: -1 });

  return res.json({ requests });
}

async function approveRequest(req, res) {
  const request = await Request.findById(req.params.requestId);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "APPROVED";
  await request.save();

  await Student.findByIdAndUpdate(request.studentId, {
    allowFaceReregistration: true,
  });

  return res.json({ message: "Request approved", request });
}

async function rejectRequest(req, res) {
  const request = await Request.findById(req.params.requestId);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "REJECTED";
  await request.save();

  return res.json({ message: "Request rejected", request });
}

module.exports = {
  listRequests,
  approveRequest,
  rejectRequest,
};
