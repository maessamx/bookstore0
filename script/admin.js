async function adminInit() {
  const me = requireAdmin();
  if (!me) return null;
  const nameEl = $("#adminName");
  const avatarEl = $("#adminAvatar");
  if (nameEl) nameEl.textContent = me.name;
  if (avatarEl) avatarEl.textContent = me.name.charAt(0).toUpperCase();
  const sideName = $("#sideName");
  const sideAvatar = $("#sideAvatar");
  if (sideName) sideName.textContent = me.name;
  if (sideAvatar) sideAvatar.textContent = me.name.charAt(0).toUpperCase();
  paintThemeButtons();
  const lb = $("#logoutBtn");
  if (lb) lb.addEventListener("click", () => { logout(); location.href = "/login/"; });
  return me;
}
