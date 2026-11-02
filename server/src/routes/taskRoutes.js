import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = express.Router();

const allowedCategories = ["Assignment", "Study", "Project", "Exam", "Personal"];
const allowedPriorities = ["Low", "Medium", "High"];

function validateTaskInput(body, partial = false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      errors.push("A task title is required.");
    }
  }
  if (body.title !== undefined && body.title.length > 120) {
    errors.push("Title must be 120 characters or fewer.");
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push("Description must be text.");
  }
  if (body.category !== undefined && !allowedCategories.includes(body.category)) {
    errors.push("Choose a valid category.");
  }
  if (body.priority !== undefined && !allowedPriorities.includes(body.priority)) {
    errors.push("Choose a valid priority.");
  }
  if (body.dueDate !== undefined && typeof body.dueDate !== "string") {
    errors.push("Due date must be text.");
  }
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    errors.push("Completed must be true or false.");
  }
  return errors;
}

router.get("/", async (_req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateTaskInput(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0] });

    const task = await Task.create({
      title: req.body.title.trim(),
      description: req.body.description ?? "",
      category: req.body.category ?? "Study",
      priority: req.body.priority ?? "Medium",
      dueDate: req.body.dueDate ?? ""
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }
    const errors = validateTaskInput(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors[0] });

    const updates = {};
    for (const key of ["title", "description", "category", "priority", "dueDate"]) {
      if (req.body[key] !== undefined) {
        updates[key] = key === "title" ? req.body[key].trim() : req.body[key];
      }
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/toggle", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
