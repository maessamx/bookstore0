let supplies = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await adminInit();
  if (!admin) return;
  supplies = await Data.supplies.list();
  fillCatList();
  renderTable();
  bindEvents();
});

function fillCatList() {
  const cats = [...new Set(supplies.map((s) => s.category))].sort();
  $("#sfCatList").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
}

function renderTable() {
  const q = ($("#supplySearch")?.value || "").toLowerCase();
  const list = supplies.filter(
    (s) => !q || s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  );
  $("#supplyCount").textContent = `Supplies (${list.length})`;
  $("#supplyRows").innerHTML = list.length
    ? list
        .map(
          (s) => `
      <tr>
        <td><img class="thumb sq" src="${productArt(s)}" alt="" onerror="imgErr(this)"></td>
        <td class="cell-title">${esc(s.title)}</td>
        <td><span class="badge badge-cat">${esc(s.category)}</span></td>
        <td>${money(s.price)}</td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-edit="${esc(s.id)}" title="Edit">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" data-del="${esc(s.id)}" title="Delete">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td class="empty-row" colspan="5">No supplies match your search.</td></tr>`;
}

function openForm(item) {
  editingId = item ? item.id : null;
  $("#sfTitle").textContent = item ? "Edit Supply" : "Add Supply";
  $("#sfId").value = item ? item.id : "";
  $("#sfTitleI").value = item ? item.title : "";
  $("#sfCat").value = item ? item.category : "";
  $("#sfPrice").value = item ? item.price : "";
  $("#sfGallery").value = item && Array.isArray(item.gallery) ? item.gallery.join(", ") : "";
  $("#sfDesc").value = item ? item.description || "" : "";
  openModal("supplyFormModal");
  setTimeout(() => $("#sfTitleI").focus(), 60);
}

function bindEvents() {
  $("#addSupplyBtn").addEventListener("click", () => openForm(null));
  $("#supplySearch").addEventListener("input", renderTable);

  $("#supplyRows").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const item = supplies.find((x) => String(x.id) === del.dataset.del);
      if (!item) return;
      const ok = await confirmDialog(`Delete "${item.title}"? This cannot be undone.`, {
        title: "Delete supply",
      });
      if (!ok) return;
      supplies = await Data.supplies.remove(item.id);
      fillCatList();
      renderTable();
      toast(`"${item.title}" deleted`, "success");
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) openForm(supplies.find((x) => String(x.id) === edit.dataset.edit));
  });

  $("#sfSave").addEventListener("click", async () => {
    const title = $("#sfTitleI").value.trim();
    const category = $("#sfCat").value.trim();
    const price = parseFloat($("#sfPrice").value);
    if (!title || !category || isNaN(price) || price < 0)
      return toast("Please fill in title, category and a valid price", "warn");

    const gallery = $("#sfGallery").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = {
      title,
      category,
      price: +price.toFixed(2),
      gallery: gallery.length ? gallery : undefined,
      description: $("#sfDesc").value.trim(),
    };

    if (editingId) {
      supplies = await Data.supplies.update(editingId, data);
      toast("Supply updated", "success");
    } else {
      supplies = await Data.supplies.add({ id: uid(), ...data });
      toast("Supply added", "success");
    }
    fillCatList();
    renderTable();
    closeModal("supplyFormModal");
  });
}
