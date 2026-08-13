let books = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await adminInit();
  if (!admin) return;
  books = await Data.books.list();
  fillCatList();
  renderTable();
  bindEvents();
});

function fillCatList() {
  const cats = [...new Set(books.map((b) => b.category))].sort();
  $("#catList").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
}

function renderTable() {
  const q = ($("#bookSearch")?.value || "").toLowerCase();
  const list = books.filter(
    (b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
  $("#bookCount").textContent = `Books (${list.length})`;
  $("#bookRows").innerHTML = list.length
    ? list
        .map(
          (b) => `
      <tr>
        <td><img class="thumb" src="${cover(b)}" alt="" onerror="imgErr(this)"></td>
        <td class="cell-title">${esc(b.title)}</td>
        <td>${esc(b.author)}</td>
        <td><span class="badge badge-cat">${esc(b.category)}</span></td>
        <td>${money(b.price)}</td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-edit="${esc(b.id)}" title="Edit">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" data-del="${esc(b.id)}" title="Delete">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td class="empty-row" colspan="6">No books match your search.</td></tr>`;
}

function openForm(book) {
  editingId = book ? book.id : null;
  $("#bfTitle").textContent = book ? "Edit Book" : "Add Book";
  $("#bfId").value = book ? book.id : "";
  $("#bfTitleI").value = book ? book.title : "";
  $("#bfAuthor").value = book ? book.author : "";
  $("#bfCat").value = book ? book.category : "";
  $("#bfPrice").value = book ? book.price : "";
  $("#bfCover").value = book ? book.cover || "" : "";
  $("#bfGallery").value = book && Array.isArray(book.gallery) ? book.gallery.join(", ") : "";
  $("#bfDesc").value = book ? book.description || "" : "";
  openModal("bookFormModal");
  setTimeout(() => $("#bfTitleI").focus(), 60);
}

function bindEvents() {
  $("#addBookBtn").addEventListener("click", () => openForm(null));
  $("#bookSearch").addEventListener("input", renderTable);

  $("#bookRows").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const book = books.find((x) => String(x.id) === del.dataset.del);
      if (!book) return;
      const ok = await confirmDialog(`Delete "${book.title}"? This cannot be undone.`, {
        title: "Delete book",
      });
      if (!ok) return;
      books = await Data.books.remove(book.id);
      fillCatList();
      renderTable();
      toast(`"${book.title}" deleted`, "success");
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) openForm(books.find((x) => String(x.id) === edit.dataset.edit));
  });

  $("#bfSave").addEventListener("click", async () => {
    const title = $("#bfTitleI").value.trim();
    const author = $("#bfAuthor").value.trim();
    const category = $("#bfCat").value.trim();
    const price = parseFloat($("#bfPrice").value);
    if (!title || !author || !category || isNaN(price) || price < 0)
      return toast("Please fill in title, author, category and a valid price", "warn");

    const gallery = $("#bfGallery").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = {
      title,
      author,
      category,
      price: +price.toFixed(2),
      cover: $("#bfCover").value.trim(),
      gallery: gallery.length ? gallery : undefined,
      description: $("#bfDesc").value.trim(),
    };

    if (editingId) {
      books = await Data.books.update(editingId, data);
      toast("Book updated", "success");
    } else {
      books = await Data.books.add({ id: uid(), ...data });
      toast("Book added", "success");
    }
    fillCatList();
    renderTable();
    closeModal("bookFormModal");
  });
}
