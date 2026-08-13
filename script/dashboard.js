const STAT_COLORS = [
  ["#4f6ed6", "#2f4a9e"],
  ["#e0a33a", "#b97f1f"],
  ["#2e9e6b", "#1e7a4f"],
  ["#e07a5f", "#b4553b"],
  ["#9a5fd4", "#7136ab"],
];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}
const badgeCls = s => "badge-" + (s || "pending");

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await adminInit();
  if (!admin) return;
  const [books, supplies, orders, users] = await Promise.all([
    Data.books.list(),
    Data.supplies.list(),
    Data.orders.list(),
    Data.users.list(),
  ]);
  renderStats(books, supplies, orders, users);
  renderRecent(orders);
  renderCats(books);
  renderTop(books, supplies, orders);
});

function renderStats(books, supplies, orders, users) {
  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status === "pending").length;
  const cards = [
    { label: "Total Books", value: books.length, icon: "book" },
    { label: "Supplies", value: supplies.length, icon: "pen" },
    { label: "Total Orders", value: orders.length, icon: "box" },
    { label: "Revenue", value: money(revenue), icon: "dollar" },
    { label: "Users", value: users.length, icon: "users" },
  ];
  $("#statCards").innerHTML = cards.map((c, i) => `
    <div class="stat">
      <div class="stat-ic" style="background:linear-gradient(135deg,${STAT_COLORS[i][0]},${STAT_COLORS[i][1]})">${IC[c.icon]}</div>
      <div>
        <b>${esc(c.value)}</b>
        <span>${c.label}${c.label === "Total Orders" && pending ? ` · ${pending} pending` : ""}</span>
      </div>
    </div>`).join("");
}

function renderRecent(orders) {
  const rows = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map(o => `
      <tr>
        <td class="cell-title">${esc(o.id)}</td>
        <td>${esc(o.customer)}</td>
        <td>${money(o.total)}</td>
        <td><span class="badge ${badgeCls(o.status)}">${esc(o.status)}</span></td>
        <td class="cell-sub">${fmtDate(o.date)}</td>
      </tr>`).join("");
  $("#recentTable tbody").innerHTML = rows || `<tr><td class="empty-row" colspan="5">No orders yet</td></tr>`;
}

function renderCats(books) {
  const counts = {};
  books.forEach(b => counts[b.category] = (counts[b.category] || 0) + 1);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(e => e[1]));
  $("#catBars").innerHTML = entries.length
    ? entries.map(([cat, n]) => `
        <div class="bar-item">
          <span class="lbl">${esc(cat)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(n / max) * 100}%"></div></div>
          <span class="val">${n}</span>
        </div>`).join("")
    : `<p class="muted">No books yet.</p>`;
}

function renderTop(books, supplies, orders) {
  const sold = {};
  orders.filter(o => o.status !== "cancelled").forEach(o =>
    (o.items || []).forEach(it => sold[it.id || it.bookId] = (sold[it.id || it.bookId] || 0) + it.qty));
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $("#topSellers").innerHTML = top.length
    ? top.map(([id, qty], i) => {
        const b = books.find(x => String(x.id) === id);
        const s = supplies.find(x => String(x.id) === id);
        const name = b ? b.title : s ? s.title : "Product";
        const sub = b ? b.author : s ? s.category : "";
        return `
        <div class="top-item">
          <span class="rank">${i + 1}</span>
          <div class="ti-info">
            <div class="ti-title">${esc(name)}</div>
            <div class="ti-sub">${esc(sub)} · ${qty} sold</div>
          </div>
        </div>`;
      }).join("")
    : `<p class="muted">No sales yet — orders will appear here.</p>`;
}
