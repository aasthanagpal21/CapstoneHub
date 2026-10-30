
const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All project routes require authentication.
router.use(authMiddleware);

// CREATE a project
router.post(
  "/",
  [
    body("title")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters."),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required.")
      .isLength({ max: 2000 })
      .withMessage("Description cannot exceed 2000 characters."),
    body("category")
      .optional()
      .trim()
      .isLength({ max: 60 })
      .withMessage("Category cannot exceed 60 characters."),
    body("deadline")
      .optional({ values: "falsy" })
      .isISO8601()
      .withMessage("Please provide a valid deadline."),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { title, description, category, deadline } = req.body;

      const projectData = {
        title,
        description,
        category: category || "Other",
        owner: req.user.userId,
      };

      if (deadline) {
        const parsedDeadline = new Date(deadline);

        if (Number.isNaN(parsedDeadline.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid deadline.",
          });
        }

        projectData.deadline = parsedDeadline;
      }

      const project = await Project.create(projectData);

      return res.status(201).json({
        success: true,
        message: "Project created successfully.",
        project,
      });
    } catch (error) {
      console.error("Create project error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to create project.",
      });
    }
  }
);

// GET all projects owned by the logged-in user
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Fetch projects error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch projects.",
    });
  }
});

// GET one project owned by the logged-in user
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Fetch project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project.",
    });
  }
});

// UPDATE a project owned by the logged-in user
router.patch(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Title must be between 3 and 100 characters."),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 2000 })
      .withMessage("Description must contain 1 to 2000 characters."),
    body("category")
      .optional()
      .trim()
      .isLength({ max: 60 })
      .withMessage("Category cannot exceed 60 characters."),
    body("status")
      .optional()
      .isIn(["Planning", "In Progress", "Completed"])
      .withMessage("Invalid project status."),
    body("deadline")
      .optional()
      .custom((value) => {
        if (value === null || value === "") return true;
        return (
          typeof value === "string" &&
          mongoose.isValidObjectId("000000000000000000000000") &&
          !Number.isNaN(Date.parse(value))
        );
      })
      .withMessage("Please provide a valid deadline."),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      const allowedFields = [
        "title",
        "description",
        "category",
        "status",
        "deadline",
      ];

      const updates = {};

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] =
            field === "deadline" && req.body[field] === ""
              ? null
              : req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one field to update.",
        });
      }

      const project = await Project.findOneAndUpdate(
        {
          _id: req.params.id,
          owner: req.user.userId,
        },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Project updated successfully.",
        project,
      });
    } catch (error) {
      console.error("Update project error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update project.",
      });
    }
  }
);

// DELETE a project owned by the logged-in user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete project.",
    });
  }
});

module.exports = router;
