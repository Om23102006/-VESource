import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Document from "../models/Document.js";
import { protect } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure private upload directory (NOT served as static files)
const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${sanitizedExt}`);
  },
});

// Allowed file types: PDF and images (JPEG, PNG)
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, JPG, and PNG files are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

const router = express.Router();

// POST /api/documents/upload - Upload a new academic document
router.post(
  "/upload",
  protect,
  (req, res, next) => {
    upload.single("document")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "File size exceeds 5MB limit" });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No document file uploaded" });
      }

      const { title, documentType } = req.body;
      if (!title || !title.trim()) {
        // Remove uploaded file if validation fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: "Document title is required" });
      }

      const newDoc = new Document({
        userId: req.user.id,
        title: title.trim(),
        documentType: documentType || "Other",
        fileName: req.file.originalname,
        fileKey: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
      });

      const savedDoc = await newDoc.save();
      res.status(201).json(savedDoc);
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: error.message || "Failed to save document" });
    }
  }
);

// GET /api/documents - List documents
// Students see only their own documents; Admins can view a student's documents with ?userId=...
router.get("/", protect, async (req, res) => {
  try {
    let filter = { userId: req.user.id };
    if (req.user.role === "admin" && req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      filter = { userId: req.query.userId };
    }
    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch documents" });
  }
});

// GET /api/documents/:id/download - Secure download/preview with access control
router.get("/:id/download", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Role-based access check: Only owner student or admin can access
    const isOwner = doc.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not authorized to view this document" });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: "File missing on server storage" });
    }

    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.fileName)}"`
    );
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to stream document" });
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const isOwner = doc.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot delete another user's document" });
    }

    // Remove file from disk
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch {}
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete document" });
  }
});

export default router;
