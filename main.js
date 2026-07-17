let isdark = false;

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("dark");
  if (saved === "true") {
    isdark = true;
    document.getElementById("toggle1").setAttribute("class", "toggle1 active");
    document.getElementById("body").setAttribute("class", "dark");
  }
});

function toggledark() {
  isdark = !isdark;
  if (isdark) {
    document.getElementById("toggle1").setAttribute("class", "toggle1 active");
    document.getElementById("body").setAttribute("class", "dark");
  } else {
    document.getElementById("toggle1").setAttribute("class", "toggle1");
    document.getElementById("body").removeAttribute("class");
  }

  localStorage.setItem("dark", isdark);
}
function initializeUser() {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const user2 = JSON.parse(user);
      console.log(user2);

      const nameHeader = document.getElementById("nameheader");
      const emailHeader = document.getElementById("emailheader");
      const menuM = document.getElementById("menum");
      const loginli = document.getElementById("loginli");
      if (nameHeader) nameHeader.textContent = user2.name;
      if (emailHeader) emailHeader.textContent = user2.email;
      if (menuM) menuM.setAttribute("class", "relative menum active");
      if (loginli) loginli.setAttribute("class", "none");
    } catch (e) {
      console.error("Error parsing user data from localStorage", e);
    }
  }
}
function showmenu() {
  document.getElementById("menu").classList.toggle("active");
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
function showheader() {
  fetch("header.html")
    .then((res) => res.text())
    .then((data) => {
      const headerEl = document.getElementById("header");
      if (headerEl) {
        headerEl.innerHTML = data;
        // If the header was loaded dynamically, initialize the user now
        initializeUser();
      }
    });
}
function showfooter() {
  fetch("footer.html")
    .then((res) => res.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });
}
