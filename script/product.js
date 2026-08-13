let curItem = null;
let curKind = "book";
let curQty = 1;

document.addEventListener("DOMContentLoaded", initProduct);

async function initProduct() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const kind = params.get("kind") === "supply" ? "supply" : "book";
  curKind = kind;

  const pool = kind === "supply" ? await Data.supplies.list() : await Data.books.list();
  curItem = pool.find((x) => String(x.id) === String(id));
  if (!curItem) {
    location.href = "/";
    return;
  }

  document.title = curItem.title + " — BookFox";
  renderCrumbs();
  renderGallery();
  renderInfo();
  renderSpecs();
  renderTabs();
  bindActions();
  renderRelated(pool);
}

function renderCrumbs() {
  const home = '<a href="/">Home</a>';
  const listLink =
    curKind === "supply"
      ? '<a href="/stationery/">Stationery</a>'
      : '<a href="/#books">Books</a>';
  $("#crumbs").innerHTML = `${home} <span class="sep">›</span> ${listLink} <span class="sep">›</span> <span class="cur">${esc(curItem.title)}</span>`;
}

function renderGallery() {
  const imgs = gallery(curItem, curKind);
  const main = $("#pMainImg");
  main.innerHTML = `<img src="${imgs[0].src}" alt="${esc(curItem.title)}" onerror="imgErr(this)">`;

  $("#pThumbs").innerHTML = imgs
    .map(
      (g, i) => `
    <button class="p-thumb ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="${esc(g.label)}">
      <img src="${g.src}" alt="" onerror="imgErr(this)">
    </button>`
    )
    .join("");

  $("#pThumbs").addEventListener("click", (e) => {
    const t = e.target.closest(".p-thumb");
    if (!t) return;
    const i = +t.dataset.i;
    main.innerHTML = `<img src="${imgs[i].src}" alt="${esc(curItem.title)}" onerror="imgErr(this)">`;
    $$("#pThumbs .p-thumb").forEach((th) => th.classList.toggle("active", +th.dataset.i === i));
  });
}

function renderInfo() {
  const isBook = curKind !== "supply";
  const author = isBook ? curItem.author : curItem.category;
  const sub = isBook ? curItem.category : "Stationery";
  const av = (isBook ? curItem.author : curItem.category).charAt(0).toUpperCase();

  $("#pAuthor").innerHTML = `
    <span class="pa-av">${esc(av)}</span>
    <span>
      <span class="pa-name">${esc(author)}</span><br>
      <span class="pa-sub">${esc(sub)}</span>
    </span>`;
  $("#pAuthor").setAttribute(
    "href",
    isBook ? "/author.html?name=" + encodeURIComponent(curItem.author) : "/stationery/"
  );

  $("#pTitle").textContent = curItem.title;
  $("#pPrice").textContent = money(curItem.price).replace(/\$/, "");
  $("#pPriceCur").textContent = "USD";

  paintFav();
}

function renderSpecs() {
  const isBook = curKind !== "supply";
  const rows = isBook
    ? [
        ["Title", curItem.title],
        ["Author", curItem.author],
        ["Category", curItem.category],
        ["Unit price", money(curItem.price)],
        ["Availability", "In stock"],
      ]
    : [
        ["Item", curItem.title],
        ["Category", curItem.category],
        ["Unit price", money(curItem.price)],
        ["Availability", "In stock"],
      ];
  $("#pSpecs").innerHTML = rows
    .map(
      ([k, v]) => `
    <div class="row">
      <span class="k">${esc(k)}</span>
      <span class="v">${esc(v)}</span>
    </div>`
    )
    .join("");
}

function renderTabs() {
  $("#pTabs").addEventListener("click", (e) => {
    const t = e.target.closest(".p-tab");
    if (!t) return;
    const tab = t.dataset.tab;
    $$("#pTabs .p-tab").forEach((x) => x.classList.toggle("active", x === t));
    $$(".p-pane").forEach((p) => p.classList.toggle("active", p.id === "pane-" + tab));
  });
  $("#pDesc").textContent = curItem.description || "No description available.";
}

function paintFav() {
  const favs = store.get("bk_favs", []);
  const isFav = favs.some((f) => String(f.id) === String(curItem.id) && f.kind === curKind);
  const btn = $("#pFav");
  btn.classList.toggle("faved", isFav);
  btn.title = isFav ? "Remove from favorites" : "Add to favorites";
}

function bindActions() {
  $("#pPlus").addEventListener("click", () => {
    curQty = Math.min(20, curQty + 1);
    $("#pQty").textContent = curQty;
  });
  $("#pMinus").addEventListener("click", () => {
    curQty = Math.max(1, curQty - 1);
    $("#pQty").textContent = curQty;
  });
  $("#pAdd").addEventListener("click", () => {
    addToCart(curItem.id, curQty, curKind);
  });
  $("#pShare").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Link copied", "success");
    } catch {
      toast(location.href, "warn");
    }
  });
  $("#pFav").addEventListener("click", () => {
    let favs = store.get("bk_favs", []);
    const i = favs.findIndex((f) => String(f.id) === String(curItem.id) && f.kind === curKind);
    if (i > -1) {
      favs.splice(i, 1);
      toast("Removed from favorites", "warn");
    } else {
      favs.push({ id: curItem.id, kind: curKind });
      toast("Added to favorites", "success");
    }
    store.set("bk_favs", favs);
    paintFav();
  });
}

async function renderRelated(pool) {
  const sameCat = pool.filter(
    (x) => String(x.id) !== String(curItem.id) && x.category === curItem.category
  );
  let rest = pool.filter(
    (x) => String(x.id) !== String(curItem.id) && x.category !== curItem.category
  );
  const picks = [...sameCat, ...rest].slice(0, 4);

  $("#pRelated").innerHTML = picks.length
    ? picks
        .map(
          (x) => `
    <a class="book-card" href="/product.html?id=${esc(x.id)}&kind=${curKind}">
      <div class="book-cover">
        <img src="${curKind === "supply" ? productArt(x) : cover(x)}" alt="${esc(x.title)}" loading="lazy" onerror="imgErr(this)">
      </div>
      <div class="book-info">
        <span class="badge badge-cat" style="align-self:flex-start">${esc(x.category)}</span>
        <h3 class="book-title">${esc(x.title)}</h3>
        <p class="book-author">${curKind === "supply" ? esc(x.category) : "by " + esc(x.author)}</p>
        <div class="book-foot">
          <span class="book-price">${money(x.price)}</span>
        </div>
      </div>
    </a>`
        )
        .join("")
    : `<div class="empty">No related items yet.</div>`;
}

window.curItem = curItem;
window.curKind = curKind;
