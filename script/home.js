const state = { q: "", cat: "All", sort: "featured" };
let allBooks = [];

document.addEventListener("DOMContentLoaded", initHome);

async function initHome() {
  allBooks = await Data.books.list();
  renderChips();
  renderBooks();
  renderAuthorCards();
  setupDrawer();
  renderCartDrawer();
  renderHeroStats();
  bindEvents();
}

async function renderAuthorCards() {
  const books = await Data.books.list();
  const map = {};
  books.forEach((b) => {
    map[b.author] = (map[b.author] || 0) + 1;
  });
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const shown = entries.slice(0, 6);
  $("#authorCards").innerHTML =
    shown
      .map(
        ([name, count]) => `
    <a class="author-card" href="/author.html?name=${encodeURIComponent(name)}">
      <span class="ac-av">${esc(name.charAt(0).toUpperCase())}</span>
      <span class="ac-mid">
        <span class="ac-name">${esc(name)}</span>
        <span class="ac-count">${count} book${count === 1 ? "" : "s"}</span>
      </span>
      <svg class="ac-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>`
      )
      .join("") +
    `<a class="author-card all" href="/authors.html">
      <span class="ac-av ac-all">${entries.length}+</span>
      <span class="ac-mid">
        <span class="ac-name">View all authors</span>
        <span class="ac-count">Browse the full shelf</span>
      </span>
      <svg class="ac-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>`;
}

function renderChips() {
  const cats = [...new Set(allBooks.map((b) => b.category))].sort();
  const el = $("#catChips");
  el.innerHTML =
    `<button class="chip ${state.cat === "All" ? "active" : ""}" data-cat="All">All <span class="n">(${allBooks.length})</span></button>` +
    cats
      .map(
        (c) =>
          `<button class="chip ${state.cat === c ? "active" : ""}" data-cat="${esc(c)}">${esc(c)} <span class="n">(${allBooks.filter((b) => b.category === c).length})</span></button>`
      )
      .join("");
}

function filteredBooks() {
  let list = allBooks.filter((b) => {
    const q = state.q.toLowerCase();
    const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchC = state.cat === "All" || b.category === state.cat;
    return matchQ && matchC;
  });
  switch (state.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return list;
}

function renderBooks() {
  const grid = $("#booksGrid");
  const list = filteredBooks();
  $("#resultInfo").textContent = state.q
    ? `Results for "${state.q}" — ${list.length} book${list.length === 1 ? "" : "s"}`
    : `Showing ${list.length} book${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <h3 style="font-size:18px;margin-bottom:6px">No books found</h3>
        <p style="font-size:14px">Try a different search term or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (b) => `
    <a class="book-card" href="/product.html?id=${esc(b.id)}&kind=book">
      <div class="book-cover">
        <img src="${cover(b)}" alt="${esc(b.title)}" loading="lazy" onerror="imgErr(this)">
        <button class="btn btn-accent btn-sm quick-add" data-add="${esc(b.id)}" aria-label="Add to cart">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add
        </button>
      </div>
      <div class="book-info">
        <span class="badge badge-cat" style="align-self:flex-start">${esc(b.category)}</span>
        <h3 class="book-title">${esc(b.title)}</h3>
        <p class="book-author">by ${esc(b.author)}</p>
        <div class="book-foot">
          <span class="book-price">${money(b.price)}</span>
          <span class="view-link">View <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      </div>
    </a>`
    )
    .join("");
}

function bindEvents() {
  $("#searchInput").addEventListener("input", (e) => {
    clearTimeout(bindEvents._t);
    bindEvents._t = setTimeout(() => {
      state.q = e.target.value.trim();
      renderBooks();
    }, 180);
  });
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderBooks();
  });
  $("#catChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.cat = chip.dataset.cat;
    $$("#catChips .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderBooks();
  });
  $("#booksGrid").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      e.stopPropagation();
      const b = allBooks.find((x) => String(x.id) === add.dataset.add);
      if (b) addToCart(b.id, 1, "book");
    }
  });
}

async function renderHeroStats() {
  const books = await Data.books.list();
  const users = await Data.users.list();
  $("#heroBooks").textContent = books.length;
  $("#heroCats").textContent = new Set(books.map((b) => b.category)).size;
  $("#heroReaders").textContent = users.filter((u) => u.role === "user").length;
}
