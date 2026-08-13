document.addEventListener("DOMContentLoaded", initAuthor);

async function initAuthor() {
  const name = new URLSearchParams(location.search).get("name");
  if (!name) {
    location.href = "/";
    return;
  }
  const books = await Data.books.list();
  const mine = books.filter((b) => b.author === name);
  if (!mine.length) {
    location.href = "/";
    return;
  }
  const authorData = await Data.authors.list();
  const meta = authorData.find((a) => a.name === name);

  document.title = name + " — BookFox";
  renderHero(mine, meta);
  renderShelf(mine);
  renderCrumbs(name);
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderHero(books, meta) {
  const name = books[0].author;
  $("#ahAvatar").textContent = initials(name);
  $("#ahName").textContent = name;

  const cats = [...new Set(books.map((b) => b.category))];
  $("#ahCats").innerHTML = cats
    .map((c) => `<span class="badge badge-cat">${esc(c)}</span>`)
    .join("");

  if (meta) {
    $("#ahCats").innerHTML += `
      <span class="badge ${meta.type === "Publisher" ? "badge-admin" : "badge-user"}">${esc(meta.type || "Author")}</span>
      ${meta.country ? `<span class="badge badge-user">${esc(meta.country)}</span>` : ""}`;
  }

  const total = books.length;
  $("#ahStats").innerHTML = `
    <div><b>${total}</b><span>Book${total === 1 ? "" : "s"}</span></div>
    <div><b>${cats.length}</b><span>Category${cats.length === 1 ? "" : "ies"}</span></div>
    <div><b>${money(books.reduce((s, b) => s + b.price, 0).toFixed(2)).replace(/\.00$/, "")}+</b><span>Shelf value</span></div>`;

  if (meta && meta.bio) {
    const bioEl = document.createElement("p");
    bioEl.className = "ah-bio";
    bioEl.textContent = meta.bio;
    $("#ahName").after(bioEl);
  }
}

function renderShelf(books) {
  $("#ahShelfTitle").textContent = `Books by ${books[0].author}`;
  $("#ahSub").textContent = `${books.length} title${books.length === 1 ? "" : "s"} on the shelf`;
  $("#ahBooks").innerHTML = books
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

  $("#ahBooks").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      e.stopPropagation();
      const b = books.find((x) => String(x.id) === add.dataset.add);
      if (b) addToCart(b.id, 1, "book");
    }
  });
}

function renderCrumbs(name) {
  $("#ahCrumbs").innerHTML = `
    <a href="/">Home</a>
    <span class="sep">›</span>
    <a href="/#authors">Authors</a>
    <span class="sep">›</span>
    <span class="cur">${esc(name)}</span>`;
}
