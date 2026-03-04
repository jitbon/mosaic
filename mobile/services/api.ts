import axios from "axios";
import { API_BASE_URL } from "../constants/config";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `API Error ${error.response.status}: ${error.response.data?.error || "Unknown error"}`
      );
    } else if (error.request) {
      console.error("Network error: No response received");
    }
    return Promise.reject(error);
  }
);

export default api;
