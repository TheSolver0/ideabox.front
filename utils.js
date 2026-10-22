const IDEA_STATUS = { CAPTUREE: "Capturée", A_CREUSER: "À creuser", A_TESTER: "À tester", RETENUE: "Retenue", ARCHIVEE: "Archivée" };
const PRIORITY = { BASSE: "Basse", MOYENNE: "Moyenne", HAUTE: "Haute" };
const PROJECT_STATUS = { PREVU: "Prévu", EN_COURS: "En cours", LANCE_REALISE: "Lancé / réalisé", EN_PAUSE: "En pause", ABANDONNE: "Abandonné" };

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
function formatDate(value) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : ""; }
function setLoading(label = "Chargement…") { document.getElementById("main-content").innerHTML = `<div class="empty">${escapeHtml(label)}</div>`; }
function showError(error) { document.getElementById("main-content").innerHTML = `<div class="error">${escapeHtml(error.message || error)}</div>`; }
function toast(message) {
  const element = document.getElementById("toast"); element.textContent = message; element.classList.remove("hidden");
  window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.add("hidden"), 3000);
}
function setButtonBusy(button, busy, busyText = "Enregistrement…") {
  if (!button) return; if (busy) { button.dataset.label = button.textContent; button.textContent = busyText; button.disabled = true; }
  else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; }
}
function options(labels, selected, emptyLabel) {
  const empty = emptyLabel ? `<option value="">${escapeHtml(emptyLabel)}</option>` : "";
  return empty + Object.entries(labels).map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
}
