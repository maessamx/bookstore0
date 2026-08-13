document.addEventListener("DOMContentLoaded", initMyOrders);

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}
const badgeCls = s => "badge-" + (s || "pending");

async function initMyOrders() {
  const user = getUser();
  if (!user) { location.href = "/login/"; return; }

  const orders = (await Data.orders.list())
    .filter((o) => o.userId === user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const host = $("#ordersList");
  if (!orders.length) {
    host.innerHTML = `
      <div class="empty" style="grid-column:auto">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <h3 style="font-size:18px;margin-bottom:6px">No orders yet</h3>
        <p style="font-size:14px">When you place an order, it will show up here.</p>
        <a class="btn btn-accent mt-16" href="/">Start shopping</a>
      </div>`;
    return;
  }

  host.innerHTML = orders.map(o => {
    const count = (o.items || []).reduce((s, i) => s + i.qty, 0);
    return `
    <div class="ord-card">
      <div class="ord-head">
        <div>
          <b>${esc(o.id)}</b>
          <span class="cell-sub"> · ${fmtDate(o.date)}</span>
        </div>
        <span class="badge ${badgeCls(o.status)}">${esc(o.status)}</span>
      </div>
      <div class="ord-items">
        ${(o.items || []).map(i => `
          <div class="oi">
            <span class="oi-name">${esc(i.title)}</span>
            <span class="muted">× ${i.qty}</span>
            <b>${money(i.price * i.qty)}</b>
          </div>`).join("")}
      </div>
      ${o.notes ? `<p class="ord-notes">📝 ${esc(o.notes)}</p>` : ""}
      <div class="ord-foot">
        <span class="muted">${count} item${count === 1 ? "" : "s"} · ${esc(o.payment || "Cash on delivery")}${o.shipping ? ` · ${money(o.shipping)} shipping` : ""}</span>
        <b>${money(o.total)}</b>
      </div>
    </div>`;
  }).join("");
}
