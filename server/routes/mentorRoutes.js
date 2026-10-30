
const express = require("express");
const mongoose = require("mongoose");
const Mentor = require("../models/Mentor");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all available mentor profiles
router.get("/", authMiddleware, async (req, res) => {
  try {
    const mentors = await Mentor.find({
      availability: { $ne: "Unavailable" },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(mentors);
  } catch (error) {
    console.error("Fetch mentors error:", error.message);
    res.status(500).json({ message: "Failed to fetch mentors." });
  }
});

// Get the logged-in mentor's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can access this profile.",
      });
    }

    const mentor = await Mentor.findOne({
    user: req.user.userId,
    }).populate("user", "name email");

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found.",
      });
    }

    res.status(200).json(mentor);
  } catch (error) {
    console.error("Fetch own mentor profile error:", error.message);
    res.status(500).json({ message: "Failed to fetch mentor profile." });
  }
});

// Create or update the logged-in mentor's profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        message: "Only mentors can create or update mentor profiles.",
      });
    }

    const { expertise, skills, experience, bio, availability } = req.body;

    if (
      !Array.isArray(expertise) ||
      expertise.length === 0 ||
      !expertise.every(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    ) {
      return res.status(400).json({
        message: "Please provide at least one valid expertise area.",
      });
    }

    if (
      skills !== undefined &&
      (!Array.isArray(skills) ||
        !skills.every(
          (item) => typeof item === "string" && item.trim().length > 0
        ))
    ) {
      return res.status(400).json({
        message: "Skills must be an array of non-empty strings.",
      });
    }

    if (
      experience !== undefined &&
      (!Number.isInteger(experience) || experience < 0)
    ) {
      return res.status(400).json({
        message: "Experience must be a non-negative whole number.",
      });
    }

    if (
      bio !== undefined &&
      (typeof bio !== "string" || bio.length > 500)
    ) {
      return res.status(400).json({
        message: "Bio must be a string of at most 500 characters.",
      });
    }

    const allowedAvailability = [
      "Available",
      "Busy",
      "Unavailable",
    ];

    if (
      availability !== undefined &&
      !allowedAvailability.includes(availability)
    ) {
      return res.status(400).json({
        message: "Invalid availability value.",
      });
    }

    const update = {
      expertise: expertise.map((item) => item.trim()),
    };

    if (skills !== undefined) {
      update.skills = skills.map((item) => item.trim());
    }

    if (experience !== undefined) {
      update.experience = experience;
    }

    if (bio !== undefined) {
      update.bio = bio.trim();
    }

    if (availability !== undefined) {
      update.availability = availability;
    }

    const userId = req.user.userId;

    const mentor = await Mentor.findOneAndUpdate(
    { user: userId },
    {
        $set: update,
        $setOnInsert: { user: userId },
    },
    {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
    }
    ).populate("user", "name email");

    res.status(200).json({
      message: "Mentor profile saved successfully.",
      mentor,
    });
  } catch (error) {
    console.error("Save mentor profile error:", error.message);
    res.status(500).json({ message: "Failed to save mentor profile." });
  }
});

// Get a mentor profile by its ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mentor ID.",
      });
    }

    const mentor = await Mentor.findById(req.params.id)
      .populate("user", "name email");

    if (!mentor || mentor.availability === "Unavailable") {
      return res.status(404).json({
        message: "Mentor profile not found.",
      });
    }

    res.status(200).json(mentor);
  } catch (error) {
    console.error("Fetch mentor profile error:", error.message);
    res.status(500).json({ message: "Failed to fetch mentor profile." });
  }
});

module.exports = router;
