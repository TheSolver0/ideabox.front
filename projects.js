let currentProjectId = null;

async function loadProjects() {
  const projects = await apiFetch("/projects");
  document.getElementById("main-content").innerHTML = `<section class="space-y-6"><div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p class="eyebrow">Suivi léger</p><h1 class="text-3xl font-black">Mes projets</h1></div><button id="toggle-project-form" class="primary">Nouveau projet</button></div>
    <form id="new-project-form" class="panel hidden grid gap-3 sm:grid-cols-2"><label>Titre<input id="project-new-title" minlength="3" required /></label><label>Prochaine action<input id="project-new-action" /></label><label class="sm:col-span-2">Description<textarea id="project-new-description" rows="3"></textarea></label><button class="primary sm:col-span-2">Créer</button></form>
    <div class="grid gap-4 xl:grid-cols-5">${Object.entries(PROJECT_STATUS).map(([status, label]) => `<section class="rounded-2xl bg-slate-100 p-3"><h2 class="mb-3 font-bold">${label}</h2><div class="space-y-3">${projects.filter((project) => project.status === status).map(projectCard).join("") || '<p class="text-sm text-slate-400">Aucun projet</p>'}</div></section>`).join("")}</div></section>`;
  document.getElementById("toggle-project-form").addEventListener("click", () => document.getElementById("new-project-form").classList.toggle("hidden"));
  document.getElementById("new-project-form").addEventListener("submit", createProject);
  bindProjectCards();
}
function projectCard(project) { return `<button class="idea-card w-full" data-project-id="${project.id}"><span class="badge">${project.ideas?.length || 0} idée(s)</span><h3 class="mt-2 font-bold">${escapeHtml(project.title)}</h3>${project.nextAction ? `<p class="mt-2 text-xs text-indigo-700">${escapeHtml(project.nextAction)}</p>` : ""}</button>`; }
function bindProjectCards() { document.querySelectorAll("[data-project-id]").forEach((card) => card.addEventListener("click", () => showProjectDetail(Number(card.dataset.projectId)))); }
async function createProject(event) { event.preventDefault(); const button = event.submitter; setButtonBusy(button, true); try { await apiFetch("/projects", { method: "POST", body: JSON.stringify({ title: document.getElementById("project-new-title").value, description: document.getElementById("project-new-description").value, nextAction: document.getElementById("project-new-action").value }) }); toast("Projet créé"); await loadProjects(); } catch (error) { toast(error.message); setButtonBusy(button, false); } }

async function showProjectDetail(id) {
  currentProjectId = id; setLoading("Chargement du projet…");
  try {
    const project = await apiFetch(`/projects/${id}`);
    document.getElementById("main-content").innerHTML = `<section class="space-y-5"><button id="project-back" class="secondary">← Projets</button><form id="project-detail-form" class="panel space-y-4">
      <div><p class="eyebrow">Fiche projet</p><h1 class="text-3xl font-black">${escapeHtml(project.title)}</h1></div>
      <div class="grid gap-4 sm:grid-cols-2"><label>Titre<input id="project-title" minlength="3" required value="${escapeHtml(project.title)}" /></label><label>État<select id="project-status">${options(PROJECT_STATUS, project.status)}</select></label>
        <label>Prochaine action<input id="project-action" value="${escapeHtml(project.nextAction)}" /></label><label class="flex-row items-center gap-2 self-end"><input id="project-commercialized" class="h-5 w-5" type="checkbox" ${project.isCommercialized ? "checked" : ""}/> Commercialisé</label></div>
      <label>Description<textarea id="project-description" rows="4">${escapeHtml(project.description)}</textarea></label><div class="flex gap-2"><button class="primary">Enregistrer</button><button id="abandon-project" class="danger" type="button">Marquer abandonné</button></div></form>
      <section class="panel"><h2 class="mb-4 text-xl font-bold">Idées associées</h2><div class="grid gap-3 sm:grid-cols-2">${project.ideas?.length ? project.ideas.map(ideaCard).join("") : '<div class="empty sm:col-span-2">Aucune idée associée.</div>'}</div></section></section>`;
    document.getElementById("project-back").addEventListener("click", loadProjects);
    document.getElementById("project-detail-form").addEventListener("submit", saveProject);
    document.getElementById("abandon-project").addEventListener("click", abandonProject);
    bindIdeaCards();
  } catch (error) { showError(error); }
}
async function saveProject(event) { event.preventDefault(); const button = event.submitter; setButtonBusy(button, true); const body = { title: document.getElementById("project-title").value, description: document.getElementById("project-description").value, status: document.getElementById("project-status").value, nextAction: document.getElementById("project-action").value, isCommercialized: document.getElementById("project-commercialized").checked }; try { await apiFetch(`/projects/${currentProjectId}`, { method: "PATCH", body: JSON.stringify(body) }); toast("Projet mis à jour"); await showProjectDetail(currentProjectId); } catch (error) { toast(error.message); setButtonBusy(button, false); } }
async function abandonProject() { if (!confirm("Marquer ce projet comme abandonné ?")) return; try { await apiFetch(`/projects/${currentProjectId}`, { method: "DELETE" }); toast("Projet abandonné"); await showProjectDetail(currentProjectId); } catch (error) { toast(error.message); } }
