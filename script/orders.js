const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
let orders = [];
const state = { status: "All", q: "" };

const STATUS_META = {
  All: { label: "All", cls: "all" },
  pending: { label: "Pending", cls: "pending" },
  processing: { label: "Processing", cls: "processing" },
  shipped: { label: "Shipped", cls: "shipped" },
  delivered: { label: "Delivered", cls: "delivered" },
  cancelled: { label: "Cancelled", cls: "cancelled" },
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function badgeCls(s) {
  return "badge-" + (s || "pending");
}

function itemsCount(o) {
  return (o.items || []).reduce((s, i) => s + i.qty, 0);
}

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await adminInit();
  if (!admin) return;
  orders = await Data.orders.list();
  renderChips();
  renderTable();
  bindEvents();
});

function renderChips() {
  const counts = { All: orders.length };
  STATUSES.forEach((s) => (counts[s] = orders.filter((o) => o.status === s).length));
  $("#statusChips").innerHTML = ["All", ...STATUSES]
    .map((s) => {
      const m = STATUS_META[s];
      return `
      <button class="st-chip st-${m.cls} ${state.status === s ? "active" : ""}" data-status="${s}">
        <span class="dot"></span>
        ${m.label}
        <span class="n">${counts[s] || 0}</span>
      </button>`;
    })
    .join("");
}

function filtered() {
  const q = state.q.toLowerCase();
  return orders
    .filter(
      (o) =>
        (state.status === "All" || o.status === state.status) &&
        (!q ||
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          (o.email || "").toLowerCase().includes(q))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTable() {
  const list = filtered();
  $("#orderCount").textContent = `Orders (${list.length})`;
  $("#orderRows").innerHTML = list.length
    ? list
        .map(
          (o) => `
      <tr>
        <td class="cell-title">${esc(o.id)}</td>
        <td>${esc(o.customer)}<div class="cell-sub">${esc(o.email)}</div></td>
        <td>${itemsCount(o)} item${itemsCount(o) === 1 ? "" : "s"}</td>
        <td>${money(o.total)}</td>
        <td class="cell-sub">${fmtDate(o.date)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="badge ${badgeCls(o.status)}">${esc(o.status)}</span>
            <select class="input st-select" data-order="${esc(o.id)}" aria-label="Change status" style="width:auto;padding:4px 26px 4px 8px;font-size:12.5px">
              ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
        </td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-view="${esc(o.id)}" title="View details">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </button>
            <button class="btn btn-danger btn-sm" data-del="${esc(o.id)}" title="Delete">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td class="empty-row" colspan="7">No orders found.</td></tr>`;
}

function openOrder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) return;
  $("#ovId").textContent = o.id;
  $("#ovCustomer").textContent = o.customer;
  $("#ovEmail").textContent = o.email || "—";
  $("#ovDate").textContent = fmtDate(o.date);
  $("#ovStatus").textContent = o.status;
  $("#ovStatus").className = "badge " + badgeCls(o.status);
  $("#ovItems").innerHTML = (o.items || [])
    .map(
      (i) => `
    <tr>
      <td>${esc(i.title)}</td>
      <td>${i.qty}</td>
      <td style="text-align:right">${money(i.price)}</td>
      <td style="text-align:right">${money(i.price * i.qty)}</td>
    </tr>`
    )
    .join("");
  $("#ovTotal").textContent = money(o.total);
  openModal("orderModal");
}

function bindEvents() {
  $("#statusChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".st-chip");
    if (!chip) return;
    state.status = chip.dataset.status;
    $$("#statusChips .st-chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderTable();
  });
  $("#orderSearch").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    renderTable();
  });

  $("#orderRows").addEventListener("click", async (e) => {
    const view = e.target.closest("[data-view]");
    if (view) {
      openOrder(view.dataset.view);
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) {
      const ok = await confirmDialog(`Delete order ${del.dataset.del}? This cannot be undone.`, {
        title: "Delete order",
      });
      if (!ok) return;
      orders = await Data.orders.remove(del.dataset.del);
      renderChips();
      renderTable();
      toast("Order deleted", "success");
    }
  });

  $("#orderRows").addEventListener("change", async (e) => {
    const sel = e.target.closest(".st-select");
    if (!sel) return;
    orders = await Data.orders.update(sel.dataset.order, { status: sel.value });
    renderChips();
    renderTable();
    toast(`Order ${sel.dataset.order} → ${sel.value}`, "success");
  });
}
