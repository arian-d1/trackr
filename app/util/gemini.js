import axios from "./axios";

async function processImageBase64(base64, mimeType = "image/jpeg") {
  try {
    const response = await axios.post(`/api/process`, {
      base64,
      mimeType,
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(
      "Error processing image:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

export { processImageBase64 };
