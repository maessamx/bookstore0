const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));

const money = (n) => "$" + Number(n || 0).toFixed(2);
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function isLogin() {
  return !!store.get("bk_session");
}

function getUser() {
  return store.get("bk_session", null);
}

function setSession(user) {
  store.set("bk_session", {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    governorate: user.governorate,
    role: user.role,
  });
}

async function login(email, pass) {
  const users = await Data.users.list();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.pass === pass
  );
  if (!user) return { ok: false, msg: "Invalid email or password." };
  setSession(user);
  return { ok: true };
}

async function register(info) {
  const users = await Data.users.list();
  if (users.some((u) => u.email.toLowerCase() === info.email.trim().toLowerCase()))
    return { ok: false, msg: "This email is already registered." };

  const user = {
    id: uid(),
    name: info.name.trim(),
    email: info.email.trim(),
    phone: info.phone.trim(),
    governorate: info.governorate.trim(),
    pass: info.pass,
    role: "user",
    joined: todayISO(),
  };
  await Data.users.add(user);
  setSession(user);
  return { ok: true };
}

function logout() {
  store.del("bk_session");
}

function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== "admin") {
    location.href = "/login/";
    return null;
  }
  return user;
}

function isDark() {
  return document.body.classList.contains("dark");
}

function initTheme() {
  if (store.get("bk_dark") === true) document.body.classList.add("dark");
  paintThemeButtons();
}

function toggledark() {
  document.body.classList.toggle("dark");
  store.set("bk_dark", isDark());
  paintThemeButtons();
}

function paintThemeButtons() {
  const dark = isDark();
  $$(".theme-toggle").forEach((b) => {
    b.innerHTML = dark ? IC.sun : IC.moon;
    b.title = dark ? "Switch to light mode" : "Switch to dark mode";
    b.setAttribute("aria-label", b.title);
    b.onclick = toggledark;
  });
}

const COVER_GRADS = [
  ["#2b3a5e", "#101a2e"],
  ["#8a4b2a", "#3c1e0c"],
  ["#1f6f68", "#0b2e2b"],
  ["#6b3b6e", "#2c112e"],
  ["#39446b", "#131a2c"],
  ["#7a5a2e", "#33230e"],
  ["#2f6b3a", "#0f2716"],
  ["#5d3a72", "#251330"],
  ["#7d4a3a", "#351c12"],
  ["#2a5a80", "#0e2236"],
];

function seedHue(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_GRADS[h % COVER_GRADS.length];
}

function wrapLines(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 5);
}

function cover(book, w = 400, h = 600) {
  if (book.cover && String(book.cover).trim()) return String(book.cover).trim();
  const [c1, c2] = seedHue((book.title || "Book") + String(book.id));
  const title = book.title || "Untitled";
  const author = book.author || "";
  const lines = wrapLines(title, 13);
  const fs = lines.length <= 2 ? 42 : lines.length <= 4 ? 34 : 27;
  const ty = 255 - (lines.length * (fs + 8)) / 2;
  const dividerY = ty + lines.length * (fs + 8) + 16;
  const tspan = lines
    .map(
      (l, i) =>
        `<text x="200" y="${ty + i * (fs + 8)}" text-anchor="middle" font-family="Georgia, serif" font-size="${fs}" font-weight="700" fill="#f5efe0">${esc(l)}</text>`
    )
    .join("");
  const auth = wrapLines(author, 20)
    .slice(0, 2)
    .map(
      (l, i) =>
        `<text x="200" y="${504 + i * 24}" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-style="italic" fill="#d9c89a">${esc(l)}</text>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 400 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
</linearGradient></defs>
<rect width="400" height="600" fill="url(#g)"/>
<circle cx="330" cy="90" r="130" fill="rgba(255,255,255,.05)"/>
<circle cx="60" cy="520" r="110" fill="rgba(255,255,255,.04)"/>
<rect x="0" y="0" width="14" height="600" fill="rgba(255,255,255,.09)"/>
<text x="200" y="62" text-anchor="middle" font-family="Georgia, serif" font-size="15" letter-spacing="6" fill="#d9c89a">BOOKFOX</text>
<line x1="128" y1="84" x2="272" y2="84" stroke="#d9c89a" stroke-width="1.4" opacity=".7"/>
${tspan}
<line x1="150" y1="${dividerY}" x2="250" y2="${dividerY}" stroke="#d9c89a" stroke-width="2"/>
${auth}
<text x="200" y="566" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="3" fill="rgba(255,255,255,.5)">READ · BEYOND</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function artShapes(cat) {
  const btn = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#24314f"/>`;
  switch (cat) {
    case "Calculators":
      return `
        <rect x="120" y="108" width="160" height="192" rx="18" fill="#f5efe0"/>
        <rect x="136" y="124" width="128" height="46" rx="8" fill="#dfe7f5"/>
        <g>${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => btn(150 + c * 32, 186 + r * 26)).join("")).join("")}</g>`;
    case "Writing":
      return `
        <g transform="rotate(-45 200 200)">
          <rect x="182" y="108" width="36" height="184" rx="14" fill="#f5efe0"/>
          <polygon points="182,292 200,334 218,292" fill="#c9962e"/>
          <rect x="196" y="118" width="8" height="152" rx="4" fill="#24314f"/>
        </g>`;
    case "Notebooks":
      return `
        <g>
          <rect x="118" y="88" width="164" height="224" rx="10" fill="#f5efe0"/>
          <rect x="126" y="100" width="9" height="200" fill="#c9962e"/>
          <g stroke="#24314f" stroke-width="4" opacity=".35">${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="150" y1="${142 + i * 26}" x2="262" y2="${142 + i * 26}"/>`).join("")}</g>
          <rect x="150" y="252" width="72" height="12" rx="6" fill="#c9962e"/>
        </g>`;
    case "Geometry":
      return `
        <g transform="rotate(-18 200 200)">
          <circle cx="200" cy="200" r="82" fill="none" stroke="#f5efe0" stroke-width="14"/>
          <circle cx="200" cy="200" r="50" fill="none" stroke="#c9962e" stroke-width="6"/>
          <line x1="200" y1="118" x2="200" y2="282" stroke="#f5efe0" stroke-width="10"/>
          <line x1="118" y1="200" x2="282" y2="200" stroke="#f5efe0" stroke-width="10"/>
        </g>`;
    case "Bags":
      return `
        <g>
          <rect x="138" y="158" width="124" height="152" rx="20" fill="#f5efe0"/>
          <path d="M158 158 v-32 a42 42 0 0 1 84 0 v32" fill="none" stroke="#f5efe0" stroke-width="16"/>
          <rect x="183" y="116" width="34" height="22" rx="9" fill="#c9962e"/>
          <rect x="174" y="196" width="52" height="36" rx="8" fill="#24314f" opacity=".35"/>
        </g>`;
    case "Art":
      return `
        <g transform="rotate(-15 200 200)">
          <ellipse cx="200" cy="200" rx="112" ry="92" fill="#f5efe0"/>
          <circle cx="150" cy="168" r="14" fill="#c0392b"/>
          <circle cx="222" cy="148" r="14" fill="#2e7d4f"/>
          <circle cx="252" cy="210" r="14" fill="#2c6e9e"/>
          <circle cx="192" cy="252" r="14" fill="#b9770e"/>
          <circle cx="140" cy="232" r="14" fill="#7a5a2e"/>
          <line x1="200" y1="292" x2="200" y2="332" stroke="#c9962e" stroke-width="10" stroke-linecap="round"/>
        </g>`;
    case "Office":
      return `
        <g transform="rotate(-8 200 200)">
          <path d="M64 214 L336 170" stroke="#f5efe0" stroke-width="20" stroke-linecap="round"/>
          <path d="M64 214 L336 170" stroke="#24314f" stroke-width="9" stroke-linecap="round" opacity=".35"/>
          <circle cx="150" cy="198" r="20" fill="#c9962e"/>
          <circle cx="250" cy="184" r="20" fill="#c9962e"/>
        </g>`;
    default:
      return `<rect x="140" y="140" width="120" height="120" rx="20" fill="#f5efe0"/><text x="200" y="228" text-anchor="middle" font-size="44">📦</text>`;
  }
}

function productArt(item, w = 400, h = 400) {
  const [c1, c2] = seedHue((item.title || "Item") + String(item.id));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 400 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
</linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="200" cy="200" r="152" fill="rgba(255,255,255,.08)"/>
<circle cx="200" cy="200" r="106" fill="rgba(255,255,255,.10)"/>
${artShapes(item.category)}
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const FALLBACK_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#1b2440"/><text x="200" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#8b94ad">No image</text></svg>'
  );

function imgErr(img) {
  img.onerror = null;
  img.src = FALLBACK_IMG;
}

const ALT_GRADS = [
  ["#4a3b7c", "#1c1233"],
  ["#0e5e5a", "#04211f"],
  ["#7c3a3a", "#2e0f0f"],
  ["#2c5f8a", "#0e1f30"],
];

function coverVariant(book, idx) {
  const [c1, c2] = ALT_GRADS[idx % ALT_GRADS.length];
  const lines = wrapLines(book.title || "Untitled", 13);
  const fs = lines.length <= 2 ? 42 : 34;
  const ty = 255 - (lines.length * (fs + 8)) / 2;
  const tspan = lines
    .map(
      (l, i) =>
        `<text x="200" y="${ty + i * (fs + 8)}" text-anchor="middle" font-family="Georgia, serif" font-size="${fs}" font-weight="700" fill="#f5efe0">${esc(l)}</text>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="400" height="600" fill="url(#g)"/>
<circle cx="340" cy="80" r="120" fill="rgba(255,255,255,.05)"/>
<circle cx="50" cy="540" r="100" fill="rgba(255,255,255,.04)"/>
<text x="200" y="56" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="5" fill="rgba(255,255,255,.55)">BOOKFOX</text>
${tspan}
<text x="200" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="rgba(255,255,255,.4)">EDITORIAL · ${String(idx + 2).padStart(2, "0")}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function artVariant(item, idx) {
  const [c1, c2] = ALT_GRADS[idx % ALT_GRADS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="200" cy="200" r="150" fill="rgba(255,255,255,.07)"/>
<circle cx="200" cy="200" r="104" fill="rgba(255,255,255,.09)"/>
${artShapes(item.category)}
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function gallery(item, kind) {
  if (Array.isArray(item.gallery) && item.gallery.length) {
    return item.gallery.map((src) => ({ src, label: "View" }));
  }
  const base = kind === "supply" ? productArt(item) : cover(item);
  const label = kind === "supply" ? item.category : item.category;
  return [
    { src: base, label },
    { src: kind === "supply" ? artVariant(item, 1) : coverVariant(item, 0), label: "Cover 2" },
    { src: kind === "supply" ? artVariant(item, 2) : coverVariant(item, 1), label: "Cover 3" },
  ];
}

const IC = {
  sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  box: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  users: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  checkCircle:
    '<svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="#2e7d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
};

function toast(msg, type = "info") {
  if (!document || !document.body) return;
  let host = $("#toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    document.body.appendChild(host);
  }
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  const ic = type === "success" ? IC.checkCircle : type === "error" ? IC.x : "";
  t.innerHTML = (ic ? `<span>${ic}</span>` : "") + `<span>${esc(msg)}</span>`;
  host.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3400);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

function setupModals() {
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".modal-close");
    if (closeBtn) {
      const m = closeBtn.closest(".modal");
      if (m) closeModal(m.id);
      return;
    }
    const openM = e.target.closest(".modal");
    if (openM && e.target === openM) closeModal(openM.id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal.open").forEach((m) => closeModal(m.id));
  });
}

function confirmDialog(msg, opts = {}) {
  const { title = "Are you sure?", confirmText = "Delete" } = opts;
  return new Promise((resolve) => {
    let host = $("#confirmHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "confirmHost";
      document.body.appendChild(host);
    }
    host.innerHTML = `
      <div class="modal open">
        <div class="modal-card modal-sm">
          <div class="modal-head"><h3 class="modal-title">${esc(title)}</h3>
            <button class="icon-btn sm modal-close" data-act="no" aria-label="Close">${IC.x}</button>
          </div>
          <div class="modal-body">${esc(msg)}</div>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-act="no">Cancel</button>
            <button class="btn btn-danger" data-act="yes">${esc(confirmText)}</button>
          </div>
        </div>
      </div>`;
    const done = (v) => {
      host.innerHTML = "";
      resolve(v);
    };
    host.querySelectorAll('[data-act="no"]').forEach((b) => b.addEventListener("click", () => done(false)));
    host.querySelector('[data-act="yes"]').addEventListener("click", () => done(true));
    host.querySelector(".modal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) done(false);
    });
  });
}

function getCart() {
  return store.get("bk_cart", []);
}

function saveCart(c) {
  store.set("bk_cart", c);
}

function cartCount() {
  return getCart().reduce((s, x) => s + x.qty, 0);
}

function updateCartBadge() {
  if (!document || !document.body) return;
  const el = $("#cartCount");
  if (el) el.textContent = cartCount();
}

async function resolveItem(id, kind) {
  const pool = kind === "supply" ? await Data.supplies.list() : await Data.books.list();
  return pool.find((x) => String(x.id) === String(id)) || null;
}

async function addToCart(id, qty, kind) {
  const item = await resolveItem(id, kind);
  if (!item || !document || !document.body) return;
  const cart = getCart();
  const found = cart.find((x) => String(x.id) === String(id));
  if (found) found.qty += qty;
  else cart.push({ id, qty, kind });
  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
  toast(`"${item.title}" added to cart`, "success");
}

function setCartQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter((x) => String(x.id) !== String(id));
  } else {
    const it = cart.find((x) => String(x.id) === String(id));
    if (it) it.qty = Math.min(99, qty);
  }
  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

async function showHeader() {
  const host = $("#header");
  if (!host) return;
  try {
    host.innerHTML = await (await fetch("/includes/header.html?v=17")).text();
    initHeader();
  } catch {
    host.innerHTML = "";
  }
}

function initHeader() {
  paintThemeButtons();
  const page = document.body.dataset.page || "";
  $$("#mainNav a[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === page);
  });
  const area = $("#authArea");
  if (!area) return;
  const user = getUser();
  if (user) {
    area.innerHTML = `
      <div class="user-menu">
        <button class="user-chip" id="userMenuBtn" aria-haspopup="true" aria-expanded="false" title="${esc(user.email)}">
          <span class="user-avatar">${esc(user.name.charAt(0).toUpperCase())}</span>
          <span class="user-name">${esc(user.name)}</span>
          <svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="dropdown" id="userDropdown">
          <a href="/profile/">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </a>
          <a href="/my-orders/">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            My Orders
          </a>
          ${user.role === "admin" ? `
          <a href="/dashboard/">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
            Dashboard
          </a>` : ""}
          <div class="sep"></div>
          <button id="logoutBtn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>`;
    const btn = area.querySelector("#userMenuBtn");
    const dd = area.querySelector("#userDropdown");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        dd.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    area.querySelector("#logoutBtn").addEventListener("click", () => {
      logout();
      toast("Signed out successfully", "success");
      setTimeout(() => (location.href = "/"), 600);
    });
  } else {
    area.innerHTML = `
      <a class="btn btn-ghost btn-sm" href="/login/">Sign in</a>
      <a class="btn btn-accent btn-sm" href="/login/#signup">Join</a>`;
  }
  updateCartBadge();
}

async function showFooter() {
  const host = $("#footer");
  if (!host) return;
  try {
   const response = await fetch(`/includes/footer.html?v=${Date.now()}`, {
  cache: "no-store"
});

const footerHTML = await response.text();

console.log("Footer HTML:", footerHTML);

host.innerHTML = footerHTML;

console.log(
  "Footer columns:",
  host.querySelectorAll(".f-col").length
);
  } catch {
    host.innerHTML = "";
  }
}

function setupDrawer() {
  const drawer = $("#cartDrawer");
  const overlay = $("#drawerOverlay");
  if (!drawer) return;

  const open = () => {
    drawer.classList.add("open");
    overlay.classList.add("show");
  };
  const close = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("#cartBtn")) {
      drawer.classList.contains("open") ? close() : open();
    }
  });
  overlay.addEventListener("click", close);
  const closeBtn = $("#cartClose");
  if (closeBtn) closeBtn.addEventListener("click", close);
  window.closeDrawer = close;

  drawer.addEventListener("click", (e) => {
    const qb = e.target.closest("[data-qty]");
    if (qb) {
      const cart = getCart();
      const it = cart.find((x) => String(x.id) === String(qb.dataset.qty));
      setCartQty(qb.dataset.qty, (it ? it.qty : 0) + +qb.dataset.delta);
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      setCartQty(rm.dataset.remove, 0);
      toast("Item removed from cart", "warn");
      return;
    }
    if (e.target.closest("#checkoutBtn")) {
      if (!getUser()) {
        toast("Please sign in to checkout", "warn");
        setTimeout(() => (location.href = "/login/"), 900);
        return;
      }
      location.href = "/checkout/";
    }
  });
}

async function renderCartDrawer() {
  if (!document || !document.body) return;
  const body = $("#cartItems");
  if (!body) return;
  const cart = getCart();
  const totalEl = $("#cartTotal");
  const btn = $("#checkoutBtn");

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <p style="font-size:38px;margin-bottom:8px">🛒</p>
      <p>Your cart is empty.</p>
      <p class="muted" style="font-size:13px;margin-top:4px">Add some great books or supplies to get started.</p>
    </div>`;
    if (totalEl) totalEl.textContent = money(0);
    if (btn) btn.disabled = true;
    return;
  }

  const rows = await Promise.all(cart.map(async (it) => ({ it, item: await resolveItem(it.id, it.kind) })));
  let html = "";
  let total = 0;
  for (const { it, item } of rows) {
    if (!item) continue;
    total += item.price * it.qty;
    const img = it.kind === "supply" ? productArt(item) : cover(item);
    html += `
      <div class="cart-item">
        <img src="${img}" alt="${esc(item.title)}" onerror="imgErr(this)">
        <div class="ci-info">
          <div class="ci-title">${esc(item.title)}</div>
          <div class="ci-author">${it.kind === "supply" ? esc(item.category) : esc(item.author)}</div>
          <div class="ci-price">${money(item.price)}</div>
        </div>
        <div class="qty">
          <button data-qty="${esc(it.id)}" data-delta="-1">−</button>
          <span>${it.qty}</span>
          <button data-qty="${esc(it.id)}" data-delta="1">+</button>
        </div>
        <button class="icon-btn sm danger" data-remove="${esc(it.id)}" title="Remove" aria-label="Remove">${IC.x}</button>
      </div>`;
  }
  body.innerHTML = html;
  if (totalEl) totalEl.textContent = money(total);
  if (btn) btn.disabled = false;
}

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupModals();
  await Promise.all([showHeader(), showFooter()]);
  paintThemeButtons();
  updateCartBadge();
});

window.imgErr = imgErr;
window.cover = cover;
window.productArt = productArt;
window.esc = esc;
window.money = money;
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggledark = toggledark;
window.logout = logout;
window.isLogin = isLogin;
window.getUser = getUser;
