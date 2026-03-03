const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Mock mode toggle
const USE_MOCK = true;

// Simple in-memory "user" for mock purposes (temporary)
let mockUser = null;

function mockLogin({ email }) {
  mockUser = {
    id: "123",
    email,
    role: "vendor",
  };
  return Promise.resolve(mockUser);
}

function mockGetUser() {
  return Promise.resolve(mockUser);
}

function mockLogout() {
  mockUser = null;
  return Promise.resolve();
}

export async function login(credentials) {
  if (USE_MOCK) {
    return mockLogin(credentials);
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include", // critical
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error("Login failed");

  return res.json();
}

export async function getCurrentUser() {
  if (USE_MOCK) {
    return mockGetUser();
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include", // critical
  });

  if (!res.ok) return null;

  return res.json();
}

export async function logout() {
  if (USE_MOCK) {
    return mockLogout();
  }

  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
