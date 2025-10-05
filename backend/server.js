import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { processImage64 } from "./itt.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increase limit for base64

// Endpoint 1: Process image using itt.js
app.post("/api/process", async (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
