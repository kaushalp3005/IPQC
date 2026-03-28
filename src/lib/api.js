import { getToken, clearSession } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };

  // Attach JWT token if available
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired or invalid — clear session and redirect to login
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Session expired — please log in again");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── IPQC ─────────────────────────────────

export const ipqc = {
  create: (data) =>
    request("/qc/ipqc", { method: "POST", body: JSON.stringify(data) }),

  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/qc/ipqc${qs ? `?${qs}` : ""}`);
  },

  get: (ipqcNo) => request(`/qc/ipqc/${ipqcNo}`),

  update: (ipqcNo, data) =>
    request(`/qc/ipqc/${ipqcNo}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (ipqcNo) =>
    request(`/qc/ipqc/${ipqcNo}`, { method: "DELETE" }),

  approve: (ipqcNo) =>
    request(`/qc/ipqc/${ipqcNo}/approve`, { method: "POST" }),
};

// ── Dropdown ─────────────────────────────

export const dropdown = {
  getFactoriesFloors: () => request("/qc/dropdown/factories-floors"),
};

// ── Factory CRUD ─────────────────────────

export const factories = {
  create: (data) =>
    request("/qc/factories", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/qc/factories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/qc/factories/${id}`, { method: "DELETE" }),
};

// ── Floor CRUD ───────────────────────────

export const floors = {
  create: (data) =>
    request("/qc/floors", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/qc/floors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/qc/floors/${id}`, { method: "DELETE" }),
};

// ── SKU Search ──────────────────────────

export const sku = {
  search: (search) => {
    const qs = new URLSearchParams({ search }).toString();
    return request(`/qc/ipqc/sku-search?${qs}`);
  },
};

// ── Users ───────────────────────────────

export const users = {
  login: (username, password) =>
    request("/qc/ipqc/users/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (data) =>
    request("/qc/ipqc/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: () => request("/qc/ipqc/users"),

  resetPassword: (username, newPassword) =>
    request("/qc/ipqc/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ username, new_password: newPassword }),
    }),
};
