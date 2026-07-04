document.addEventListener("DOMContentLoaded", function () {
  const list = document.getElementById("liveNewsList");
  const ticker = document.getElementById("newsTicker");
  const tempBox = document.getElementById("userTemp");
  const placeBox = document.getElementById("userPlace");

  const intelligenceItems = [
    {
      title: "Digital public infrastructure continues shaping Africa’s financial future",
      source: "Neurorder Intelligence • DPI"
    },
    {
      title: "Alternative credit scoring can help informal earners build financial identity",
      source: "Neurorder Research • Credit Scoring"
    },
    {
      title: "AI reasoning systems are becoming central to research and decision-making",
      source: "Nous Intelligence • AI"
    },
    {
      title: "Fintech, payments and data systems remain key to financial inclusion",
      source: "African Economy • Fintech"
    }
  ];

  if (list) {
    list.innerHTML = intelligenceItems.map(item => `
      <article class="live-news-item">
        <h3>${item.title}</h3>
        <p>${item.source}</p>
      </article>
    `).join("");
  }

  if (ticker) {
    ticker.textContent = intelligenceItems.map(item => item.title).join("  •  ");
  }

  if (tempBox && placeBox) {
    if (!navigator.geolocation) {
      tempBox.textContent = "--°C";
      placeBox.textContent = "Location unavailable.";
    } else {
      tempBox.textContent = "--°C";
      placeBox.textContent = "Allow location for local weather.";

      navigator.geolocation.getCurrentPosition(
        async function (position) {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
            );

            const data = await response.json();

            if (data && data.current && data.current.temperature_2m !== undefined) {
              tempBox.textContent = `${Math.round(data.current.temperature_2m)}°C`;
              placeBox.textContent = "Live temperature near you.";
            }
          } catch (error) {
            tempBox.textContent = "--°C";
            placeBox.textContent = "Weather unavailable.";
          }
        },
        function () {
          tempBox.textContent = "--°C";
          placeBox.textContent = "Location permission needed.";
        }
      );
    }
  }

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".ni-sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", function () {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }
});