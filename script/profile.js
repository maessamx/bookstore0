document.addEventListener("DOMContentLoaded", initProfile);

async function initProfile() {
  const user = getUser();
  if (!user) { location.href = "/login/"; return; }

  $("#pName").textContent = user.name;
  $("#pEmail").textContent = user.email;
  $("#pRole").textContent = user.role;
  $("#pAvatar").textContent = user.name.charAt(0).toUpperCase();
  $("#pFName").value = user.name || "";
  $("#pFPhone").value = user.phone || "";
  $("#pFGov").value = user.governorate || "Cairo";

  $("#profileForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#pFName").value.trim();
    const phone = $("#pFPhone").value.trim();
    const gov = $("#pFGov").value;
    if (!name) return toast("Please enter your name", "warn");

    await Data.users.update(user.id, { name, phone, governorate: gov });
    store.set("bk_session", { ...user, name, phone, governorate: gov });

    $("#pName").textContent = name;
    $("#pAvatar").textContent = name.charAt(0).toUpperCase();
    toast("Profile updated", "success");
    setTimeout(() => location.reload(), 700);
  });
}
