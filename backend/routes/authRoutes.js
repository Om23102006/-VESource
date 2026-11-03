import express from "express";
import { body } from "express-validator";
import { register, login, profile, getAdminData } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = express.Router();

// Validation rules for registration (Exp 5)
const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
];

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", login);

// Protected routes (Exp 5 & 6)
router.get("/profile", protect, profile);

// Admin-only route (Exp 5 & 6)
router.get("/admin", protect, adminOnly, getAdminData);

export default router;
