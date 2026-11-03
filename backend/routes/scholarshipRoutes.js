import express from "express";
import { SAMPLE_SCHOLARSHIPS } from "../models/Scholarship.js";

const router = express.Router();

// GET /api/scholarships - Retrieve list of available scholarship schemes
router.get("/", (req, res) => {
  res.json({
    success: true,
    count: SAMPLE_SCHOLARSHIPS.length,
    disclaimer:
      "Sample scholarship listings for demonstration and testing purposes.",
    data: SAMPLE_SCHOLARSHIPS,
  });
});

// GET /api/scholarships/:id - Retrieve specific scholarship scheme
router.get("/:id", (req, res) => {
  const item = SAMPLE_SCHOLARSHIPS.find((s) => s.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Scholarship scheme not found" });
  }
  res.json({ success: true, data: item });
});

export default router;
