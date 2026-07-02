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