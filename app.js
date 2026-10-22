let currentUser = null;
let currentView = "ideas";

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("login-form").addEventListener("submit", login);
  document.getElementById("logout-button").addEventListener("click", logout);
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  try {
    currentUser = await apiFetch("/auth/me");
    showApp();
    await navigate("ideas");
  } catch { showLogin(); }
});

async function login(event) {
  event.preventDefault();
  const button = event.submitter;
  const error = document.getElementById("login-error");
  error.classList.add("hidden"); setButtonBusy(button, true, "Connexion…");
  try {
    const result = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    }) });
    sessionAccessToken = result.accessToken;
    currentUser = result.user;
    document.getElementById("login-password").value = "";
    showApp(); await navigate("ideas");
  } catch (exception) { error.textContent = exception.message; error.classList.remove("hidden"); }
  finally { setButtonBusy(button, false); }
}

async function logout() {
  try { await apiFetch("/auth/logout", { method: "POST" }); }
  finally { sessionAccessToken = null; currentUser = null; showLogin(); }
}
function showLogin() {
  document.getElementById("app-view").classList.add("hidden");
  document.getElementById("login-view").classList.remove("hidden");
}
function showApp() {
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("app-view").classList.remove("hidden");
}
async function navigate(view) {
  currentView = view;
  setLoading();
  try {
    if (view === "projects") await loadProjects();
    else await loadIdeas(view === "archives");
  } catch (error) { showError(error); }
}
