import axios from "./axios";

async function processImageBase64(base64, mimeType = "image/jpeg", extra = {}) {
  try {
    const response = await axios.post(`/api/process`, {
      base64,
      mimeType,
      ...extra, // can include username, animal, latitude, longitude, metadata
    });
    console.log('this one', response);
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
export default processImageBase64;

