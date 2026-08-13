let users = [];
let me = null;
const state = { q: "" };

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  me = await adminInit();
  if (!me) return;
  users = await Data.users.list();
  renderTable();
  bindEvents();
});

function renderTable() {
  const q = state.q.toLowerCase();
  const list = users.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  const admins = users.filter((u) => u.role === "admin").length;
  $("#userCount").textContent = `Users (${list.length}) · ${admins} admin${admins === 1 ? "" : "s"} · ${users.length - admins} customers`;

  $("#userRows").innerHTML = list.length
    ? list
        .map(
          (u) => `
      <tr>
        <td>
          <div class="user-cell">
            <span class="avatar">${esc(u.name.charAt(0).toUpperCase())}</span>
            <div>
              <div class="cell-title">${esc(u.name)} ${u.id === me.id ? '<span class="muted" style="font-size:11px">(you)</span>' : ""}</div>
              <div class="cell-sub">${esc(u.email)}</div>
            </div>
          </div>
        </td>
        <td>${esc(u.phone || "—")}</td>
        <td>${esc(u.governorate || "—")}</td>
        <td><span class="badge ${u.role === "admin" ? "badge-admin" : "badge-user"}">${esc(u.role)}</span></td>
        <td class="cell-sub">${fmtDate(u.joined)}</td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            ${u.id !== me.id
              ? `<button class="btn btn-ghost btn-sm" data-role="${esc(u.id)}" title="Change role">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  ${u.role === "admin" ? "Make user" : "Make admin"}
                </button>
                <button class="btn btn-danger btn-sm" data-del="${esc(u.id)}" title="Delete">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>`
              : '<span class="muted" style="font-size:12.5px">—</span>'}
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td class="empty-row" colspan="6">No users found.</td></tr>`;
}

function bindEvents() {
  $("#userSearch").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    renderTable();
  });

  $("#userRows").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const u = users.find((x) => x.id === del.dataset.del);
      if (!u) return;
      const ok = await confirmDialog(
        `Delete user "${u.name}" (${u.email})? Their orders will remain in the order history.`,
        { title: "Delete user" }
      );
      if (!ok) return;
      users = await Data.users.remove(u.id);
      renderTable();
      toast(`User "${u.name}" deleted`, "success");
      return;
    }

    const role = e.target.closest("[data-role]");
    if (role) {
      const u = users.find((x) => x.id === role.dataset.role);
      if (!u || u.id === me.id) return;
      const nextRole = u.role === "admin" ? "user" : "admin";
      users = await Data.users.update(u.id, { role: nextRole });
      renderTable();
      toast(`${u.name} is now ${nextRole}`, "success");
    }
  });
}
