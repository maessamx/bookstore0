document.addEventListener("DOMContentLoaded", () => {
  if (location.hash === "#signup") switchTab("signup");

  $("#paneLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    if (!email || !pass) return toast("Please fill in all fields", "warn");
    const res = await login(email, pass);
    if (!res.ok) return toast(res.msg, "error");
    toast(`Welcome back, ${getUser().name}!`, "success");
    setTimeout(() => location.href = getUser().role === "admin" ? "/dashboard/" : "/", 700);
  });

  $("#paneSignup").addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#suName").value.trim();
    const email = $("#suEmail").value.trim();
    const phone = $("#suPhone").value.trim();
    const pass = $("#suPass").value;
    if (!name || !email || !phone) return toast("Please fill in all fields", "warn");
    if (pass.length < 6) return toast("Password must be at least 6 characters", "warn");
    const res = await register({ name, email, phone, governorate: $("#suGov").value, pass });
    if (!res.ok) return toast(res.msg, "error");
    toast("Account created — welcome to BookFox!", "success");
    setTimeout(() => location.href = "/", 700);
  });
});

function switchTab(which) {
  $("#tabLogin").classList.toggle("active", which === "login");
  $("#tabSignup").classList.toggle("active", which === "signup");
  $("#paneLogin").classList.toggle("active", which === "login");
  $("#paneSignup").classList.toggle("active", which === "signup");
  $("#authTitle").textContent = which === "login" ? "Sign in" : "Create account";
  $("#authSub").textContent = which === "login"
    ? "Enter your credentials to continue."
    : "Join BookFox in under a minute.";
}
