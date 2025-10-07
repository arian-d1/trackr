import axios from "axios";

const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.91:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Attach token automatically
instance.interceptors.request.use((config) => {
  try {
    const token = globalThis.__TRACKR_TOKEN__;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Basic error handling normalization
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.error || data?.message || err.message;
    return Promise.reject({ status, message, data });
  },
);

// https://trackr-2fwo.onrender.com

export default instance;