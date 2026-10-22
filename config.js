const API_URL = String(window.IDEABOX_CONFIG?.apiUrl || "http://localhost:3001").replace(/\/$/, "");
let sessionAccessToken = null;

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (sessionAccessToken && !headers.Authorization) headers.Authorization = `Bearer ${sessionAccessToken}`;
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  if (response.status === 401 && !path.startsWith("/auth/")) showLogin();
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(" · ") : payload?.message;
    throw new Error(message || `Erreur HTTP ${response.status}`);
  }
  return payload;
}
