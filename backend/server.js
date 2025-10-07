import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import mongoose from "mongoose";
import authRouter from "./authRouter.js";
import capturesRouter from "./routers/captures.js";
import friendsRouter from "./routers/friends.js";
import leaderboardRouter from "./routers/leaderboard.js";
import mapRouter from "./routers/map.js";
import usersRouter from "./routers/users.js";

// mongoose.connect('mongodb://localhost:27017/trackr');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "exp://172.20.10.10:8081", // For testing. Later, lock this down to your actual domain if needed.
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
);
app.options("*", cors());
app.use(express.json({ limit: "10mb" })); // Increase limit for base64
app.use(cookieParser());

// Global dev-friendly rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 req/min in dev
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }),
);

const apiRouter = express.Router();

app.use("/api", apiRouter);
app.use("/api/users", usersRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/captures", capturesRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/map", mapRouter);

apiRouter.post("/process", async (req, res) => {
  console.log('Processing image and saving capture...');
  try {
    const { base64, mimeType, latitude, longitude, metadata } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "No base64 data provided" });
    }

    // Get user from auth header
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    // Verify JWT and get user
    const jwt = await import("jsonwebtoken");
    const payload = jwt.default.verify(token, process.env.JWT_SECRET || "devsecret");
    const { userId } = payload;

    const UserModule = await import("./models/Users.js");
    const User = UserModule.default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove data URI prefix if present
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const contentType = mimeType || "image/jpeg";

    // Get random animal from valid animals list
    const ittModule = await import("./itt.js");
    const { ALLOWED_ANIMALS } = ittModule;
    const randomAnimal = ALLOWED_ANIMALS[Math.floor(Math.random() * ALLOWED_ANIMALS.length)];

    // Generate a random rating between 1-100 for the animal
    const rating = Math.floor(Math.random() * 100) + 1;

    // Save capture to database
    const CapturedModule = await import("./models/Captured.js");
    const Captured = CapturedModule.default;
    const capture = await Captured.create({
      user_id: user._id,
      animal: randomAnimal,
      photo: cleanBase64,
      latitude,
      longitude,
      rating,
      metadata,
      capturedAt: new Date(),
    });

    // Update user's last location
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLocation: { latitude, longitude, at: new Date() } } },
    );

    // Return the result with the detected animal
    const result = { 
      animals: [{ name: randomAnimal }],
      capture: {
        id: capture._id,
        animal: randomAnimal,
        rating: rating,
        capturedAt: capture.capturedAt
      }
    };

    res.json(result);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.use("/auth", authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

async function start() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/trackr";
  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "trackr",
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

start();
