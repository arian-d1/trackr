import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import authRouter from "./authRouter.js";
import { processImage64 } from "./itt.js";
import mongoose from 'mongoose';

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


app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

const apiRouter = express.Router();

app.use("/api", apiRouter);

// Endpoint 1: Process image using itt.js
apiRouter.post("/process", async (req, res) => {
  try {
    const { base64, mimeType } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "No base64 data provided" });
    }

    // Remove data URI prefix if present
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const contentType = mimeType || "image/jpeg";

    const result = await processImage64(cleanBase64, contentType);

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
