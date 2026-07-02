document.addEventListener("DOMContentLoaded", () => {
  const newsButtons = document.querySelectorAll(".news-sidebar button");

  newsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      newsButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
});