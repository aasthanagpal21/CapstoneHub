
const express = require("express");
const mongoose = require("mongoose");
const MentorshipRequest = require("../models/MentorshipRequest");
const Mentor = require("../models/Mentor");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getUserId(req) {
  return req.user.userId;
}

// GET /api/mentorship/mine
// Students see their outgoing requests.
// Mentors see their incoming requests.
router.get("/mine", async (req, res) => {
  try {
    const userId = getUserId(req);
    let query;

    if (req.user.role === "student") {
      query = { student: userId };
    } else if (req.user.role === "mentor") {
      const mentorProfile = await Mentor.findOne({
        user: userId,
      });

      if (!mentorProfile) {
        return res.status(404).json({
          success: false,
          message: "Mentor profile not found for this account.",
        });
      }

      query = { mentor: mentorProfile._id };
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Only students and mentors can view mentorship requests.",
      });
    }

    const requests = await MentorshipRequest.find(query)
      .populate("student", "name email")
      .populate({
        path: "mentor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (error) {
    console.error("Fetch mentorship requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load mentorship requests.",
    });
  }
});

// POST /api/mentorship
// A student sends a mentorship request.
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can send mentorship requests.",
      });
    }

    const { mentorId, message } = req.body;

    if (!mentorId || !isValidId(mentorId)) {
      return res.status(400).json({
        message: "Please select a valid mentor.",
      });
    }

    if (
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Your message must contain 10 to 1000 characters.",
      });
    }

    const mentor = await Mentor.findById(mentorId);

    if (!mentor || mentor.availability === "Unavailable") {
      return res.status(404).json({
        message: "This mentor is not currently available for requests.",
      });
    }

    const studentId = getUserId(req);

    const existingRequest = await MentorshipRequest.findOne({
      student: studentId,
      mentor: mentor._id,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "You already have a pending request for this mentor.",
      });
    }

    const request = await MentorshipRequest.create({
      student: studentId,
      mentor: mentor._id,
      message: message.trim(),
    });

    const populatedRequest = await MentorshipRequest.findById(
      request._id
    )
      .populate("student", "name email")
      .populate({
        path: "mentor",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    return res.status(201).json({
      message: "Mentorship request sent successfully.",
      request: populatedRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a pending request for this mentor.",
      });
    }

    console.error("Create mentorship request error:", error);

    return res.status(500).json({
      message: "Unable to send mentorship request.",
    });
  }
});

// PATCH /api/mentorship/:id/respond
// The assigned mentor accepts or rejects a request.
router.patch("/:id/respond", async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can respond to mentorship requests.",
      });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid request ID.",
      });
    }

    const { status, mentorResponse = "" } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Choose Accepted or Rejected.",
      });
    }

    if (
      typeof mentorResponse !== "string" ||
      mentorResponse.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "The response must be 1000 characters or fewer.",
      });
    }

    const mentorProfile = await Mentor.findOne({
      user: getUserId(req),
    });

    if (!mentorProfile) {
      return res.status(404).json({
        message: "Create your mentor profile before responding.",
      });
    }

    const request = await MentorshipRequest.findOne({
      _id: req.params.id,
      mentor: mentorProfile._id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Mentorship request not found.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({
        message: "This request has already been answered.",
      });
    }

    request.status = status;
    request.mentorResponse = mentorResponse.trim();

    await request.save();

    const populatedRequest = await MentorshipRequest.findById(
      request._id
    )
      .populate("student", "name email")
      .populate({
        path: "mentor",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    return res.json({
      message: `Request ${status.toLowerCase()} successfully.`,
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Respond to mentorship request error:", error);

    return res.status(500).json({
      message: "Unable to respond to mentorship request.",
    });
  }
});

module.exports = router;
