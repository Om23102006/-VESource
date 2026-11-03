import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import scholarshipRoutes from "./routes/scholarshipRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ── Socket.IO (Exp 8: Real-time status notifications & chat) ────────────────
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Provide io instance to Express routes
app.set("io", io);

io.on("connection", (socket) => {
  // Join authenticated user's private notification room
  socket.on("joinUser", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Join admin broadcast room
  socket.on("joinAdmin", () => {
    socket.join("admins");
  });

  // Exp 8: Real-time broadcast chat
  socket.on("chatMessage", (data) => {
    io.emit("chatMessage", {
      username: data.username || "Anonymous",
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {});
});

// ── Security Middleware (Exp 5) ─────────────────────────────────────────────
app.use(helmet());

// General rate limiter: 300 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth rate limiter: 30 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many auth attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ── Core Middleware ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Docker frontend (Nginx on host port 3000)
  "http://localhost:80",
  "http://localhost",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Health Route ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "VESource Backend is running", status: "ok" });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/scholarships", scholarshipRoutes);

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ── Connect MongoDB & Start ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  });
