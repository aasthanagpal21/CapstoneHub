const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const validStatuses = ["Pending", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isStudent(req, res) {
  if (req.user.role !== "student") {
    res.status(403).json({
      success: false,
      message: "Only students can manage tasks.",
    });
    return false;
  }

  return true;
}

// Confirm that the project belongs to the logged-in student.
// The Project model uses "owner" for its owner field.
async function getOwnedProject(projectId, userId) {
  if (!isValidId(projectId)) return null;

  return Project.findOne({
    _id: projectId,
    owner: userId,
  });
}

// GET /api/tasks?projectId=PROJECT_ID
router.get("/", async (req, res) => {
  try {
    if (!isStudent(req, res)) return;

    const { projectId } = req.query;

    if (!projectId || !isValidId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid project.",
      });
    }

    const project = await getOwnedProject(
      projectId,
      req.user.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied.",
      });
    }

    const tasks = await Task.find({
      project: project._id,
      student: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks.",
    });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    if (!isStudent(req, res)) return;

    const {
      title,
      description = "",
      projectId,
      dueDate = "",
      priority = "Medium",
    } = req.body;

    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Task title must be between 3 and 100 characters.",
      });
    }

    if (
      typeof description !== "string" ||
      description.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters.",
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid priority.",
      });
    }

    if (!projectId || !isValidId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid project.",
      });
    }

    let parsedDueDate = null;

    if (dueDate) {
      parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid due date.",
        });
      }
    }

    const project = await getOwnedProject(
      projectId,
      req.user.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied.",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      project: project._id,
      student: req.user.userId,
      dueDate: parsedDueDate,
      priority,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create task.",
    });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!isStudent(req, res)) return;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      student: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const { title, description, dueDate, status, priority } =
      req.body;

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        title.trim().length < 3 ||
        title.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Task title must be between 3 and 100 characters.",
        });
      }

      task.title = title.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 1000 characters.",
        });
      }

      task.description = description.trim();
    }

    if (dueDate !== undefined) {
      if (dueDate === "" || dueDate === null) {
        task.dueDate = null;
      } else {
        const parsedDate = new Date(dueDate);

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid due date.",
          });
        }

        task.dueDate = parsedDate;
      }
    }

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }

      task.status = status;
    }

    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }

      task.priority = priority;
    }

    await task.save();

    return res.json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task.",
    });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!isStudent(req, res)) return;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      student: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task.",
    });
  }
});

module.exports = router;