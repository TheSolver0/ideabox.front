let currentIdeaId = null;
let ideaSearchTimer = null;

async function loadIdeas(archives = false) {
  const query = archives ? "?includeArchived=true&status=ARCHIVEE" : "";
  const ideas = await apiFetch(`/ideas${query}`);
  if (archives) return renderArchives(ideas);
  renderIdeasPage(ideas);
}

function renderIdeasPage(ideas) {
  const focus = ideas.filter((idea) => idea.focus);
  document.getElementById("main-content").innerHTML = `
    <section class="space-y-7">
      <div><p class="eyebrow">Capture rapide</p><h1 class="text-3xl font-black">Mes idées</h1></div>
      <form id="quick-idea-form" class="panel flex flex-col gap-3 sm:flex-row">
        <input id="quick-title" minlength="3" required placeholder="Une idée à noter…" aria-label="Titre de l'idée" />
        <button class="primary sm:w-auto" type="submit">Capturer</button>
      </form>
      <section><div class="mb-3 flex items-center justify-between"><h2 class="text-xl font-bold">Focus</h2><span class="badge">${focus.length}/3</span></div>
        <div class="grid gap-3 md:grid-cols-3">${focus.length ? focus.map(ideaCard).join("") : '<div class="empty md:col-span-3">Aucune idée en Focus.</div>'}</div>
      </section>
      <section class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input id="idea-search" placeholder="Rechercher…" aria-label="Rechercher" />
          <select id="idea-status"><option value="">Tous les états</option>${options(IDEA_STATUS).replace('<option value="ARCHIVEE">Archivée</option>', '')}</select>
          <select id="idea-priority">${options(PRIORITY, "", "Toutes les priorités")}</select>
          <select id="idea-focus"><option value="">Focus ou non</option><option value="true">Focus uniquement</option><option value="false">Hors Focus</option></select>
        </div>
        <div id="ideas-grid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${ideas.length ? ideas.map(ideaCard).join("") : '<div class="empty sm:col-span-2 lg:col-span-3">Aucune idée pour ces filtres.</div>'}</div>
      </section>
    </section>`;
  document.getElementById("quick-idea-form").addEventListener("submit", createQuickIdea);
  ["idea-status", "idea-priority", "idea-focus"].forEach((id) => document.getElementById(id).addEventListener("change", applyIdeaFilters));
  document.getElementById("idea-search").addEventListener("input", () => {
    clearTimeout(ideaSearchTimer); ideaSearchTimer = setTimeout(applyIdeaFilters, 250);
  });
  bindIdeaCards();
}

function ideaCard(idea) {
  return `<button class="idea-card" data-idea-id="${idea.id}">
    <div class="mb-3 flex flex-wrap gap-2"><span class="badge">${IDEA_STATUS[idea.status]}</span><span class="badge">${PRIORITY[idea.priority]}</span>${idea.focus ? '<span class="badge bg-amber-100 text-amber-800">Focus</span>' : ""}</div>
    <h3 class="text-lg font-bold">${escapeHtml(idea.title)}</h3>
    <p class="mt-2 line-clamp-3 text-sm text-slate-600">${escapeHtml(idea.description || "Aucune description")}</p>
    ${idea.nextAction ? `<p class="mt-3 text-xs font-semibold text-indigo-700">Prochaine action : ${escapeHtml(idea.nextAction)}</p>` : ""}
  </button>`;
}
function bindIdeaCards() { document.querySelectorAll("[data-idea-id]").forEach((card) => card.addEventListener("click", () => showIdeaDetail(Number(card.dataset.ideaId)))); }

async function createQuickIdea(event) {
  event.preventDefault(); const button = event.submitter; setButtonBusy(button, true);
  try { await apiFetch("/ideas", { method: "POST", body: JSON.stringify({ title: document.getElementById("quick-title").value }) }); toast("Idée capturée"); await loadIdeas(); }
  catch (error) { toast(error.message); setButtonBusy(button, false); }
}
async function applyIdeaFilters() {
  const parameters = new URLSearchParams();
  const pairs = [["search", "idea-search"], ["status", "idea-status"], ["priority", "idea-priority"], ["focus", "idea-focus"]];
  pairs.forEach(([key, id]) => { const value = document.getElementById(id)?.value; if (value) parameters.set(key, value); });
  try {
    const ideas = await apiFetch(`/ideas?${parameters}`);
    const grid = document.getElementById("ideas-grid");
    grid.innerHTML = ideas.length ? ideas.map(ideaCard).join("") : '<div class="empty sm:col-span-2 lg:col-span-3">Aucune idée pour ces filtres.</div>';
    bindIdeaCards();
  } catch (error) { toast(error.message); }
}

function renderArchives(ideas) {
  document.getElementById("main-content").innerHTML = `<section class="space-y-5"><div><p class="eyebrow">Restaurables</p><h1 class="text-3xl font-black">Archives</h1></div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${ideas.length ? ideas.map(ideaCard).join("") : '<div class="empty sm:col-span-2 lg:col-span-3">Aucune idée archivée.</div>'}</div></section>`;
  bindIdeaCards();
}

async function showIdeaDetail(id) {
  currentIdeaId = id; setLoading("Chargement de l’idée…");
  try {
    const [idea, history, projects] = await Promise.all([apiFetch(`/ideas/${id}`), apiFetch(`/ideas/${id}/history`), apiFetch('/projects')]);
    const archived = idea.status === "ARCHIVEE";
    document.getElementById("main-content").innerHTML = `<section class="space-y-5">
      <button id="idea-back" class="secondary">← Retour</button>
      <form id="idea-detail-form" class="panel space-y-4">
        <div class="flex flex-col justify-between gap-3 sm:flex-row"><div><p class="eyebrow">Fiche idée</p><h1 class="text-3xl font-black">${escapeHtml(idea.title)}</h1></div>
          <label class="flex-row items-center gap-2"><input id="idea-focus-field" type="checkbox" class="h-5 w-5" ${idea.focus ? "checked" : ""} ${archived ? "disabled" : ""}/> Focus</label></div>
        <div class="grid gap-4 sm:grid-cols-2"><label>Titre<input id="idea-title" minlength="3" required value="${escapeHtml(idea.title)}" /></label>
          <label>État<select id="idea-state">${options(IDEA_STATUS, idea.status)}</select></label>
          <label>Priorité<select id="idea-priority-field">${options(PRIORITY, idea.priority)}</select></label>
          <label>Prochaine action<input id="idea-next-action" value="${escapeHtml(idea.nextAction)}" /></label></div>
        <label>Description<textarea id="idea-description" rows="3">${escapeHtml(idea.description)}</textarea></label>
        <div class="grid gap-4 sm:grid-cols-2"><label>Problème à résoudre<textarea id="idea-problem" rows="3">${escapeHtml(idea.problem)}</textarea></label>
          <label>Public visé<textarea id="idea-audience" rows="3">${escapeHtml(idea.targetAudience)}</textarea></label></div>
        <div class="flex flex-wrap gap-2"><button class="primary" type="submit">Enregistrer</button>
          ${archived ? '<button id="restore-idea" class="secondary" type="button">Restaurer</button>' : '<button id="archive-idea" class="danger" type="button">Archiver</button>'}</div>
      </form>
      <section class="panel space-y-4"><div class="flex items-center justify-between"><h2 class="text-xl font-bold">Projet associé</h2>${idea.project ? '<button id="detach-project" class="danger">Dissocier</button>' : '<button id="show-project-form" class="secondary">Créer un projet</button>'}</div>
        ${idea.project ? `<button class="idea-card w-full" data-project-id="${idea.project.id}"><strong>${escapeHtml(idea.project.title)}</strong><span class="badge ml-2">${PROJECT_STATUS[idea.project.status]}</span></button>` : `<form id="associate-project-form" class="flex flex-col gap-2 sm:flex-row"><select id="existing-project" ${projects.length ? '' : 'disabled'}>${projects.length ? projects.map((project) => `<option value="${project.id}">${escapeHtml(project.title)}</option>`).join('') : '<option>Aucun projet disponible</option>'}</select><button class="secondary" ${projects.length ? '' : 'disabled'}>Associer</button></form>`}
        <form id="idea-project-form" class="hidden grid gap-3 sm:grid-cols-2"><label>Titre<input id="new-project-title" minlength="3" value="${escapeHtml(idea.title)}" required /></label><label>Description<input id="new-project-description" value="${escapeHtml(idea.description)}" /></label><button class="primary sm:col-span-2">Créer et associer</button></form>
      </section>
      ${renderNotesSection(idea.analysis || [])}
      <section class="panel"><h2 class="mb-4 text-xl font-bold">Chronologie</h2><div class="timeline space-y-4">${history.length ? history.map(historyItem).join("") : '<p class="text-sm text-slate-500">Aucun événement.</p>'}</div></section>
    </section>`;
    bindIdeaDetail(idea);
  } catch (error) { showError(error); }
}

function historyItem(entry) {
  const fields = Object.keys(entry.changes || {}).join(", ");
  return `<article><p class="text-sm font-bold">${escapeHtml(entry.action)} · ${escapeHtml(entry.entityType)}</p><p class="text-xs text-slate-500">${formatDate(entry.createdAt)}${fields ? ` — ${escapeHtml(fields)}` : ""}</p></article>`;
}
function bindIdeaDetail(idea) {
  document.getElementById("idea-back").addEventListener("click", () => navigate(idea.status === "ARCHIVEE" ? "archives" : "ideas"));
  document.getElementById("idea-detail-form").addEventListener("submit", saveIdeaDetail);
  document.getElementById("archive-idea")?.addEventListener("click", () => archiveIdea(idea.id));
  document.getElementById("restore-idea")?.addEventListener("click", () => restoreIdea(idea.id));
  document.getElementById("show-project-form")?.addEventListener("click", () => document.getElementById("idea-project-form").classList.toggle("hidden"));
  document.getElementById("idea-project-form")?.addEventListener("submit", createProjectFromIdea);
  document.getElementById("associate-project-form")?.addEventListener("submit", associateExistingProject);
  document.getElementById("detach-project")?.addEventListener("click", () => changeIdeaProject(null));
  document.querySelector("[data-project-id]")?.addEventListener("click", (event) => showProjectDetail(Number(event.currentTarget.dataset.projectId)));
  bindNoteActions();
}
async function saveIdeaDetail(event) {
  event.preventDefault(); const button = event.submitter; setButtonBusy(button, true);
  const body = { title: document.getElementById("idea-title").value, description: document.getElementById("idea-description").value,
    problem: document.getElementById("idea-problem").value, targetAudience: document.getElementById("idea-audience").value,
    status: document.getElementById("idea-state").value, priority: document.getElementById("idea-priority-field").value,
    focus: document.getElementById("idea-focus-field").checked, nextAction: document.getElementById("idea-next-action").value };
  try { await apiFetch(`/ideas/${currentIdeaId}`, { method: "PATCH", body: JSON.stringify(body) }); toast("Idée mise à jour"); await showIdeaDetail(currentIdeaId); }
  catch (error) { toast(error.message); setButtonBusy(button, false); }
}
async function archiveIdea(id) { if (!confirm("Archiver cette idée ?")) return; try { await apiFetch(`/ideas/${id}/archive`, { method: "POST" }); toast("Idée archivée"); await navigate("ideas"); } catch (error) { toast(error.message); } }
async function restoreIdea(id) { try { await apiFetch(`/ideas/${id}/restore`, { method: "POST" }); toast("Idée restaurée"); await showIdeaDetail(id); } catch (error) { toast(error.message); } }
async function createProjectFromIdea(event) { event.preventDefault(); const button = event.submitter; setButtonBusy(button, true); try { await apiFetch(`/ideas/${currentIdeaId}/project`, { method: "POST", body: JSON.stringify({ title: document.getElementById("new-project-title").value, description: document.getElementById("new-project-description").value }) }); toast("Projet créé et associé"); await showIdeaDetail(currentIdeaId); } catch (error) { toast(error.message); setButtonBusy(button, false); } }
async function associateExistingProject(event) { event.preventDefault(); await changeIdeaProject(Number(document.getElementById("existing-project").value)); }
async function changeIdeaProject(projectId) { try { await apiFetch(`/ideas/${currentIdeaId}`, { method: "PATCH", body: JSON.stringify({ projectId }) }); toast(projectId ? "Projet associé" : "Projet dissocié"); await showIdeaDetail(currentIdeaId); } catch (error) { toast(error.message); } }
