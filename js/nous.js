document.addEventListener("DOMContentLoaded", function () {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="nouse-toast" id="nouseToast">
      <div class="toast-dot"></div>
      <div>
        <strong>Nous Intelligence Network</strong>
        <p>Hello, Fanatic. Understanding begins with connection.</p>
        <button id="openNousToastBtn">Open Nous</button>
      </div>
    </div>

    <div class="nouse-widget" id="nouseWidget">
      <button class="nouse-button" id="nouseButton">
        <img src="images/NeurorderBody.png" alt="Nous">
      </button>

      <div class="nouse-panel" id="nousePanel">
        <div class="nouse-header">
          <strong>Nous</strong>
          <button id="closeNousBtn">×</button>
        </div>

        <div class="nouse-body">
          <p class="nouse-greeting">Hello Fanatic.</p>
          <p>
            I am Nous — Neurorder’s intelligence layer.
            Credit scoring, research and financial inclusion are my first missions.
          </p>

          <div class="nouse-options">
            <button>Explain credit scoring</button>
            <button>Summarise research</button>
            <button>Explore Neurorder</button>
          </div>
        </div>

        <div class="nouse-input">
          <input type="text" placeholder="Ask Nous soon...">
          <button disabled>Send</button>
        </div>
      </div>
    </div>
  `);

  const panel = document.getElementById("nousePanel");
  const toast = document.getElementById("nouseToast");

  document.getElementById("nouseButton").addEventListener("click", function () {
    panel.classList.toggle("open");
  });

  document.getElementById("closeNousBtn").addEventListener("click", function () {
    panel.classList.remove("open");
  });

  document.getElementById("openNousToastBtn").addEventListener("click", function () {
    toast.classList.remove("show");
    panel.classList.add("open");
  });

  setTimeout(function () {
    toast.classList.add("show");
  }, 6000);

  setTimeout(function () {
    toast.classList.remove("show");
  }, 16000);
});