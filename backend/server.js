import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { processImage } from "./itt.js";
import { body, validationResult } from "express-validator";

const checkBody = [
  body("latitiude").isFloat({ min: -90, max: 90 }).withMessage("WRONG"),

  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("wrong"),
];

const checkValidation = (req, res, next) => {
  if (req.errors.isEmpty()) {
    return next();
  }

  return res.status(200).json({
    success: false,
    error: "YAN",
    mesage: "There was an error",
  });
};

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Store coordinates temporarily (in production, use a proper database)
let database = [];

// Endpoint 1: Process image using itt.js
app.post(
  "/api/process-image",
  checkBody,
  checkValidation,
  upload.single("image"),
  async (req, res) => {
    const { latitiude, longitude } = req.body;

    console.log(latitiude, longitude);

    const banana = {
      id: Date.now(),
      latitude,
      longitude,
      timestamp: new Date(),
    };

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convert buffer to base64
      const base64Image = req.file.buffer.toString("base64");

      // Process image using detectImage function
      const result = await processImage(base64Image, req.file.mimetype);

      console.log(result);

      database.push(banana);
      
      res.json({ result });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  },
);

// Endpoint 3: Get all coordinates
app.get("/api/coordinates", (req, res) => {
  res.json(coordinates);
});

app.listen(port);
