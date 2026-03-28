import { users } from "./api";

export async function authenticateUser(username, password) {
  const trimmedUsername = username.trim().toLowerCase();
  const res = await users.login(trimmedUsername, password);
  return {
    userId: res.user_id,
    username: res.username,
    displayName: res.display_name,
    isAdmin: res.is_admin,
    token: res.token,
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

export function getToken() {
  if (typeof window === "undefined") return null;
  const session = getSession();
  return session?.token || null;
}

export function clearSession() {
  sessionStorage.removeItem("qc_user");
}
