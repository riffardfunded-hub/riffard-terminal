// services/api.js

const API_BASE_URL = "https://riffardfunded.com";
// ⚠️ Replace with the REAL URL of your Riffard Funded website !!

// ------------------------------
// TRADER LOGIN
// ------------------------------
export async function loginRequest(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Invalid credentials.");
  }

  return await res.json();
}

// ------------------------------
// GET CURRENT TRADING ACCOUNT
// ------------------------------
export async function getAccountRequest(token) {
  const res = await fetch(`${API_BASE_URL}/trading/account`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;
  return await res.json();
}
