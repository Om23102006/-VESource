import express from "express";
import mongoose from "mongoose";
import Application from "./models/Application.js";
import { protect } from "./middleware/auth.js";
import { adminOnly } from "./middleware/adminOnly.js";

const router = express.Router();

// GET all applications — admin sees all, students see their own
router.get("/", protect, async (req, res) => {
  try {
    let applications;
    if (req.user.role === "admin") {
      const query = {};
      if (req.query.status) {
        query.status = req.query.status;
      }
      applications = await Application.find(query).sort({ createdAt: -1 });
    } else {
      applications = await Application.find({ userId: req.user.id }).sort({
        createdAt: -1,
      });
    }
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to retrieve applications" });
  }
});

// GET single application by ID (owner or admin)
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const isOwner = application.userId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied to this application" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// POST new application — student submits
router.post("/", protect, async (req, res) => {
  try {
    const {
      studentName,
      scholarshipName,
      studentDetails,
      attachedDocuments,
    } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ message: "Student name is required" });
    }
    if (!scholarshipName || !scholarshipName.trim()) {
      return res.status(400).json({ message: "Scholarship scheme name is required" });
    }

    const application = new Application({
      studentName: studentName.trim(),
      scholarshipName: scholarshipName.trim(),
      userId: req.user.id,
      status: "Submitted",
      studentDetails: studentDetails || {},
      attachedDocuments: Array.isArray(attachedDocuments) ? attachedDocuments : [],
    });

    const saved = await application.save();

    // Notify connected admins in real time
    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("newApplication", {
        applicationId: saved._id,
        studentName: saved.studentName,
        scholarshipName: saved.scholarshipName,
        createdAt: saved.createdAt,
      });
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to submit application" });
  }
});

// PATCH update status — admin only
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const { status, correctionRemarks } = req.body;
    const validStatuses = [
      "Submitted",
      "Under Review",
      "Correction Required",
      "Approved",
      "Rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (status === "Correction Required" && (!correctionRemarks || !correctionRemarks.trim())) {
      return res.status(400).json({
        message: "Correction remarks are required when marking status as Correction Required",
      });
    }

    const updateData = { status };
    if (correctionRemarks !== undefined) {
      updateData.correctionRemarks = correctionRemarks.trim();
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Emit real-time WebSocket notification to the specific student
    const io = req.app.get("io");
    if (io && updated.userId) {
      const studentRoom = `user:${updated.userId.toString()}`;
      io.to(studentRoom).emit("statusNotification", {
        type: "STATUS_UPDATE",
        applicationId: updated._id,
        scholarshipName: updated.scholarshipName,
        status: updated.status,
        correctionRemarks: updated.correctionRemarks,
        timestamp: new Date().toISOString(),
        message:
          status === "Correction Required"
            ? `Correction needed for ${updated.scholarshipName}: "${updated.correctionRemarks}"`
            : `Your application for ${updated.scholarshipName} is now ${status}.`,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update status" });
  }
});

// PATCH re-submit correction — student updates application after addressing remarks
router.patch("/:id/correction", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own applications" });
    }

    const { studentDetails, attachedDocuments, responseRemarks } = req.body;

    if (studentDetails) {
      application.studentDetails = {
        ...application.studentDetails,
        ...studentDetails,
      };
    }

    if (Array.isArray(attachedDocuments)) {
      application.attachedDocuments = attachedDocuments;
    }

    // Append response and set status back to Under Review
    if (responseRemarks) {
      application.correctionRemarks = `[Student Update]: ${responseRemarks.trim()} (Previous note: ${application.correctionRemarks})`;
    }

    application.status = "Under Review";
    const saved = await application.save();

    // Notify admins
    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("correctionSubmitted", {
        applicationId: saved._id,
        studentName: saved.studentName,
        scholarshipName: saved.scholarshipName,
      });
    }

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to re-submit application" });
  }
});

// DELETE application — admin or student (if in Submitted status)
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = application.userId?.toString() === req.user.id.toString();

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot delete this application" });
    }

    // Students can only delete if the application is still in "Submitted" status
    if (!isAdmin && application.status !== "Submitted") {
      return res.status(400).json({
        message: "You cannot delete an application that is already under review or processed.",
      });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete application" });
  }
});

export default router;
