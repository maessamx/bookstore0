document.addEventListener("DOMContentLoaded", initAuthors);

async function initAuthors() {
  const books = await Data.books.list();
  const authorData = await Data.authors.list();

  const map = {};
  books.forEach((b) => {
    map[b.author] = (map[b.author] || 0) + 1;
  });

  const entries = Object.entries(map)
    .map(([name, count]) => {
      const meta = authorData.find((a) => a.name === name);
      return { name, count, bio: meta ? meta.bio : "", type: meta ? meta.type : "Author", country: meta ? meta.country : "" };
    })
    .sort((a, b) => b.count - a.count);

  $("#allStats").innerHTML = `
    <div><b>${entries.length}</b><span>Authors</span></div>
    <div><b>${books.length}</b><span>Books total</span></div>
    <div><b>${entries.reduce((s, a) => s + a.count, 0)}</b><span>On the shelf</span></div>`;

  $("#allSub").textContent = `${entries.length} author${entries.length === 1 ? "" : "s"} — every book from each name`;
  renderGrid(entries);

  $("#authorSearch").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderGrid(entries.filter((a) => !q || a.name.toLowerCase().includes(q) || (a.country || "").toLowerCase().includes(q)));
  });
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderGrid(list) {
  $("#authorGrid").innerHTML = list.length
    ? list
        .map(
          (a) => `
    <a class="author-tile" href="/author.html?name=${encodeURIComponent(a.name)}">
      <span class="at-av">${esc(initials(a.name))}</span>
      <span class="at-mid">
        <span class="at-name">${esc(a.name)}</span>
        <span class="at-count">${a.count} book${a.count === 1 ? "" : "s"}${a.country ? " · " + esc(a.country) : ""}</span>
        <span class="at-bio">${esc((a.bio || "").slice(0, 90))}${(a.bio || "").length > 90 ? "…" : ""}</span>
      </span>
      <svg class="at-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>`
        )
        .join("")
    : `<div class="empty">No authors match your search.</div>`;
}
