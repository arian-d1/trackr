import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Gemini API Key:", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Allowed animals
const ALLOWED_ANIMALS = [
  "Raccoon",
  "Squirrel",
  "Bear",
  "Pigeon",
  "Crow",
  "Goose",
  "Dog"
];

// Generate Gemini prompt
function generatePrompt() {
  return `
You are an expert wildlife classifier. Analyze the image and identify which animals appear.

Return **strictly valid JSON**:
{
  "animals": [
    { "name": "<AnimalType>" }
  ]
}

Rules:
- Only use names from this list: ${JSON.stringify(ALLOWED_ANIMALS)}.
- Do NOT include any explanations, code fences, or extra text.
- If no allowed animals are found, return { "animals": [] }.
`;
}

// Parse Gemini response (strip ``` if needed)
function parseResponse(text) {
  text = text.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse response:", text);
    return null;
  }
}

// Process Expo image URI with Gemini
export async function processImage64(base64, mimeType = "image/jpeg") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = generatePrompt();

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64 } },
    ]);

    const responseText = await result.response.text();
    console.log("Gemini response:", parseResponse(responseText));
    return parseResponse(responseText);
  } catch (err) {
    throw err;
  }
}
