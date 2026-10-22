function renderNotesSection(notes) {
  return `<section class="panel space-y-4"><h2 class="text-xl font-bold">Notes de maturation</h2>
    <div id="notes-list" class="space-y-3">${notes.length ? notes.map(noteCard).join("") : '<p class="text-sm text-slate-500">Aucune note.</p>'}</div>
    <form id="note-form" class="grid gap-3"><input id="note-id" type="hidden" /><label>Titre<input id="note-title" required placeholder="Ex. Hypothèse à vérifier" /></label>
      <label>Contenu<textarea id="note-content" required rows="4"></textarea></label><div class="flex gap-2"><button class="primary" type="submit">Ajouter la note</button><button id="cancel-note-edit" class="secondary hidden" type="button">Annuler</button></div></form></section>`;
}
function noteCard(note) {
  return `<article class="rounded-xl border border-slate-200 p-4"><h3 class="font-bold">${escapeHtml(note.title)}</h3><p class="mt-2 whitespace-pre-wrap text-sm text-slate-600">${escapeHtml(note.content)}</p>
    <div class="mt-3 flex gap-2"><button class="secondary note-edit" data-note='${escapeHtml(JSON.stringify({ id: note.id, title: note.title, content: note.content }))}'>Modifier</button><button class="danger note-archive" data-note-id="${note.id}">Archiver</button></div></article>`;
}
function bindNoteActions() {
  document.getElementById("note-form")?.addEventListener("submit", saveNote);
  document.querySelectorAll(".note-archive").forEach((button) => button.addEventListener("click", () => archiveNote(Number(button.dataset.noteId))));
  document.querySelectorAll(".note-edit").forEach((button) => button.addEventListener("click", () => {
    const note = JSON.parse(button.dataset.note); document.getElementById("note-id").value = note.id; document.getElementById("note-title").value = note.title;
    document.getElementById("note-content").value = note.content; document.querySelector("#note-form button[type=submit]").textContent = "Enregistrer la note";
    document.getElementById("cancel-note-edit").classList.remove("hidden"); document.getElementById("note-title").focus();
  }));
  document.getElementById("cancel-note-edit")?.addEventListener("click", resetNoteForm);
}
function resetNoteForm() { const form = document.getElementById("note-form"); form.reset(); document.getElementById("note-id").value = ""; document.querySelector("#note-form button[type=submit]").textContent = "Ajouter la note"; document.getElementById("cancel-note-edit").classList.add("hidden"); }
async function saveNote(event) {
  event.preventDefault(); const button = event.submitter; setButtonBusy(button, true);
  const id = document.getElementById("note-id").value; const body = { title: document.getElementById("note-title").value, content: document.getElementById("note-content").value };
  if (!id) body.ideaId = currentIdeaId;
  try { await apiFetch(id ? `/analysis/${id}` : "/analysis", { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }); toast(id ? "Note modifiée" : "Note ajoutée"); await showIdeaDetail(currentIdeaId); }
  catch (error) { toast(error.message); setButtonBusy(button, false); }
}
async function archiveNote(id) { if (!confirm("Archiver cette note ?")) return; try { await apiFetch(`/analysis/${id}/archive`, { method: "POST" }); toast("Note archivée"); await showIdeaDetail(currentIdeaId); } catch (error) { toast(error.message); } }
