import { users } from "./api";

export async function authenticateUser(username, password) {
  const trimmedUsername = username.trim().toLowerCase();
  const res = await users.login(trimmedUsername, password);
  return {
    userId: res.user_id,
    username: res.username,
    displayName: res.display_name,
    isAdmin: res.is_admin,
  };
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("qc_user");
  return raw ? JSON.parse(raw) : null;
}

export function setSession(user) {
  sessionStorage.setItem("qc_user", JSON.stringify(user));
}

export function setCredentials(username, password) {
  sessionStorage.setItem("qc_credentials", JSON.stringify({ username, password }));
}

export function getCredentials() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("qc_credentials");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  sessionStorage.removeItem("qc_user");
  sessionStorage.removeItem("qc_credentials");
}
