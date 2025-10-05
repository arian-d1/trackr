import axios from "axios";

const instance = axios.create({
  baseURL: "http://172.20.10.10:3000", // Your backend URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export default instance;
