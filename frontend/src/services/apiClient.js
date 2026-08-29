import axios from "axios";

import { AUTH_TOKEN_STORAGE_KEY } from "../utils/constants.js";

/**
 * Central Axios instance.
 *
 * The backend base URL comes from VITE_API_BASE_URL (set in .env for
 * local dev, and as an Environment Variable in Render for production).
 * No URLs are hardcoded anywhere else in the frontend — every future
 * service module should import this client.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the stored JWT (if any) to every outgoing request. Individual
// services never need to touch headers themselves — this is what makes
// authService.getCurrentUser() / logout() work with a plain apiClient.get/post call.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
