let authors = [];
let books = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await adminInit();
  if (!admin) return;
  authors = await Data.authors.list();
  books = await Data.books.list();
  renderTable();
  bindEvents();
});

function bookCount(name) {
  return books.filter((b) => b.author === name).length;
}

function renderTable() {
  const q = ($("#authorSearch")?.value || "").toLowerCase();
  const list = authors.filter((a) => !q || a.name.toLowerCase().includes(q));
  $("#authorCount").textContent = `Authors (${list.length})`;
  $("#authorRows").innerHTML = list.length
    ? list
        .map(
          (a) => `
      <tr>
        <td>
          <div class="user-cell">
            <span class="avatar">${esc(a.name.charAt(0).toUpperCase())}</span>
            <div>
              <div class="cell-title">${esc(a.name)}</div>
              <div class="cell-sub">${esc(a.bio || "").slice(0, 60)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${a.type === "Publisher" ? "badge-admin" : "badge-user"}">${esc(a.type || "Author")}</span></td>
        <td>${esc(a.country || "—")}</td>
        <td>${bookCount(a.name)}</td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-edit="${esc(a.id)}" title="Edit">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" data-del="${esc(a.id)}" title="Delete">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td class="empty-row" colspan="5">No authors found.</td></tr>`;
}

function openForm(author) {
  editingId = author ? author.id : null;
  $("#afTitle").textContent = author ? "Edit Author" : "Add Author";
  $("#afId").value = author ? author.id : "";
  $("#afName").value = author ? author.name : "";
  $("#afType").value = author ? author.type || "Author" : "Author";
  $("#afCountry").value = author ? author.country || "" : "";
  $("#afJoined").value = author ? author.joined || "" : "";
  $("#afBio").value = author ? author.bio || "" : "";
  openModal("authorFormModal");
  setTimeout(() => $("#afName").focus(), 60);
}

function bindEvents() {
  $("#addAuthorBtn").addEventListener("click", () => openForm(null));
  $("#authorSearch").addEventListener("input", renderTable);

  $("#authorRows").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const a = authors.find((x) => String(x.id) === del.dataset.del);
      if (!a) return;
      const ok = await confirmDialog(`Delete "${a.name}"? This cannot be undone.`, {
        title: "Delete author",
      });
      if (!ok) return;
      authors = await Data.authors.remove(a.id);
      renderTable();
      toast(`"${a.name}" deleted`, "success");
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) openForm(authors.find((x) => String(x.id) === edit.dataset.edit));
  });

  $("#afSave").addEventListener("click", async () => {
    const name = $("#afName").value.trim();
    if (!name) return toast("Please enter a name", "warn");

    const data = {
      name,
      type: $("#afType").value,
      country: $("#afCountry").value.trim(),
      joined: $("#afJoined").value.trim(),
      bio: $("#afBio").value.trim(),
    };

    if (editingId) {
      authors = await Data.authors.update(editingId, data);
      toast("Author updated", "success");
    } else {
      authors = await Data.authors.add({ id: uid(), ...data });
      toast("Author added", "success");
    }
    renderTable();
    closeModal("authorFormModal");
  });
}
