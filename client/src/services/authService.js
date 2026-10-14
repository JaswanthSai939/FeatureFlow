
const API_URL = "http://localhost:5000/api/auth";

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function registerUser(name, email, password) {
  return authRequest("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser(email, password) {
  const data = await authRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in first.");
  }

  return authRequest("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutUser() {
  localStorage.removeItem("token");
}
