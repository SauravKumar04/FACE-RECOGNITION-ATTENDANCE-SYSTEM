import axios from "axios";

// Use absolute URL to backend (no proxy issues)
const API = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;