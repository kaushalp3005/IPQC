const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
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

  update: (ipqcNo, data, credentials) => {
    const qs = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    }).toString();
    return request(`/qc/ipqc/${ipqcNo}?${qs}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (ipqcNo, credentials) => {
    const qs = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    }).toString();
    return request(`/qc/ipqc/${ipqcNo}?${qs}`, { method: "DELETE" });
  },

  approve: (ipqcNo, credentials) =>
    request(`/qc/ipqc/${ipqcNo}/approve`, {
      method: "POST",
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    }),
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
