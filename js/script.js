function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const button = document.querySelector(".mobile-menu-btn");

  menu.classList.toggle("open");
  button.classList.toggle("active");
}

document.addEventListener("click", function (event) {
  const menu = document.getElementById("mobileMenu");
  const button = document.querySelector(".mobile-menu-btn");

  if (!menu || !button) return;

  const clickedInsideMenu = menu.contains(event.target);
  const clickedButton = button.contains(event.target);

  if (!clickedInsideMenu && !clickedButton) {
    menu.classList.remove("open");
    button.classList.remove("active");
  }
});

const newsButtons = document.querySelectorAll(".news-sidebar button");

newsButtons.forEach((button) => {
  button.addEventListener("click", () => {
    newsButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

function toggleNous() {
  const panel = document.getElementById("nousePanel");

  if (panel) {
    panel.classList.toggle("open");
  }
}

function openNousFromToast() {
  const toast = document.getElementById("nouseToast");
  const panel = document.getElementById("nousePanel");

  if (toast) toast.classList.remove("show");
  if (panel) panel.classList.add("open");
}

document.addEventListener("DOMContentLoaded", function () {
  const toast = document.getElementById("nouseToast");

  if (toast) {
    setTimeout(function () {
      toast.classList.add("show");
    }, 6000);

    setTimeout(function () {
      toast.classList.remove("show");
    }, 16000);
  }
});