const intro = document.getElementById("intro");

setTimeout(() => {

    intro.classList.add("fade-out");

}, 3200);

setTimeout(() => {

    window.location.href = "app.html";

}, 4200);