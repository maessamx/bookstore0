const state = { q: "", cat: "All", sort: "featured" };
let allItems = [];

document.addEventListener("DOMContentLoaded", initSupplies);

async function initSupplies() {
  const params = new URLSearchParams(location.search);
  if (params.get("cat")) state.cat = params.get("cat");
  allItems = await Data.supplies.list();
  renderChips();
  renderGrid();
  setupDrawer();
  renderCartDrawer();
  bindEvents();
}

function renderChips() {
  const cats = [...new Set(allItems.map((i) => i.category))].sort();
  const el = $("#catChips");
  el.innerHTML =
    `<button class="chip ${state.cat === "All" ? "active" : ""}" data-cat="All">All <span class="n">(${allItems.length})</span></button>` +
    cats
      .map(
        (c) =>
          `<button class="chip ${state.cat === c ? "active" : ""}" data-cat="${esc(c)}">${esc(c)} <span class="n">(${allItems.filter((i) => i.category === c).length})</span></button>`
      )
      .join("");
}

function filtered() {
  let list = allItems.filter((i) => {
    const q = state.q.toLowerCase();
    const matchQ = !q || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchC = state.cat === "All" || i.category === state.cat;
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

function renderGrid() {
  const grid = $("#itemsGrid");
  const list = filtered();
  $("#resultInfo").textContent = state.q
    ? `Results for "${state.q}" — ${list.length} item${list.length === 1 ? "" : "s"}`
    : `Showing ${list.length} item${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <h3 style="font-size:18px;margin-bottom:6px">No items found</h3>
        <p style="font-size:14px">Try a different search term or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (i) => `
    <a class="book-card" href="/product.html?id=${esc(i.id)}&kind=supply">
      <div class="book-cover prod-cover">
        <img src="${productArt(i)}" alt="${esc(i.title)}" loading="lazy" onerror="imgErr(this)">
        <button class="btn btn-accent btn-sm quick-add" data-add="${esc(i.id)}" aria-label="Add to cart">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add
        </button>
      </div>
      <div class="book-info">
        <span class="badge badge-cat" style="align-self:flex-start">${esc(i.category)}</span>
        <h3 class="book-title">${esc(i.title)}</h3>
        <p class="book-author">${esc(i.description.split(".")[0])}</p>
        <div class="book-foot">
          <span class="book-price">${money(i.price)}</span>
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
      renderGrid();
    }, 180);
  });
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
  $("#catChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.cat = chip.dataset.cat;
    $$("#catChips .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderGrid();
  });
  $("#itemsGrid").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      e.stopPropagation();
      const it = allItems.find((x) => String(x.id) === add.dataset.add);
      if (it) addToCart(it.id, 1, "supply");
    }
  });
}
