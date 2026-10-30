
const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },
    mentorResponse: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent multiple pending requests between the same student and mentor.
mentorshipRequestSchema.index(
  { student: 1, mentor: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Pending" },
  }
);

module.exports = mongoose.model(
  "MentorshipRequest",
  mentorshipRequestSchema
);
