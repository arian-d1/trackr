import axios from "axios";

const instance = axios.create({
  baseURL: "https://trackr-2fwo.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export default instance;