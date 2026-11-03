import { validationResult } from "express-validator";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    // express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: "Registration successful",
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ message: "Registration failed" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
};

// GET /api/auth/profile  (protected)
export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Could not fetch profile" });
  }
};

// GET /api/auth/admin  (admin only) — Exp 5 & 6
export const getAdminData = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      message: "Admin dashboard data",
      totalUsers: users.length,
      users,
    });
  } catch {
    res.status(500).json({ message: "Could not fetch admin data" });
  }
};
