import apiClient from "./apiClient.js";

/**
 * All auth-related backend calls live here — components/context never
 * call axios directly (see services/README.md).
 */

export async function registerUser({ fullName, email, password, confirmPassword }) {
  const response = await apiClient.post("/api/v1/auth/register", {
    full_name: fullName,
    email,
    password,
    confirm_password: confirmPassword,
  });
  return response.data; // { message, user }
}

export async function loginUser({ email, password }) {
  const response = await apiClient.post("/api/v1/auth/login", {
    email,
    password,
  });
  return response.data; // { access_token, token_type, expires_in_minutes, user }
}

export async function logoutUser() {
  const response = await apiClient.post("/api/v1/auth/logout");
  return response.data; // { message }
}

export async function fetchCurrentUser() {
  const response = await apiClient.get("/api/v1/auth/me");
  return response.data; // user
}
