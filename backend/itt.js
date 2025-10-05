import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

dotenv.config();

// Check if API key is present
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[extension] || "image/jpeg";
}

async function detectImage() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Please provide a path to an image file.");
    console.error("Usage: node itt.js <path-to-image>");
    process.exit(1);
  }

  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: File '${imagePath}' does not exist`);
      process.exit(1);
    }

    const base64ImageFile = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    const mimeType = await getMimeType(imagePath);

    const prompt =
      "Identify the animal(s) in this image and describe their quality. Return the answer in JSON format with the keys 'animals' which is an array of objects with keys 'name' and 'quality'.";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64ImageFile,
        },
      },
    ]);

    const response = await result.response;
    console.log(response.text());
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

detectImage();
