import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.1.91:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// https://trackr-2fwo.onrender.com

export default instance;