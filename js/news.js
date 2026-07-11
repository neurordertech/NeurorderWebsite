document.addEventListener("DOMContentLoaded", function () {
  /* =========================================================
     PAGE ELEMENTS
  ========================================================= */

  const list = document.getElementById("liveNewsList");
  const ticker = document.getElementById("newsTicker");

  const tempBox = document.getElementById("userTemp");
  const placeBox = document.getElementById("userPlace");

  const searchInput = document.getElementById("nousSearch");

  const filterButtons = document.querySelectorAll(
    ".nous-signal-tabs button[data-filter]"
  );

  const emptyState = document.getElementById("newsEmptyState");

  const featuredTitle = document.getElementById("featuredTitle");
  const featuredSummary = document.getElementById("featuredSummary");
  const featuredSource = document.getElementById("featuredSource");
  const featuredDate = document.getElementById("featuredDate");
  const featuredLink = document.getElementById("featuredLink");
  const totalSignalCount = document.getElementById("totalSignalCount");
  const news24SignalCount = document.getElementById("news24SignalCount");
  const undpSignalCount = document.getElementById("undpSignalCount");

  let allArticles = [];
  let activeFilter = "all";

  const NEWS_IMAGE = "images/newsintelligencersa.png";

  function renderSignalCounts(items) {
  if (totalSignalCount) {
    totalSignalCount.textContent = items.length;
  }

  if (news24SignalCount) {
    const news24Count = items.filter(function (item) {
      return item.source === "News24";
    }).length;

    news24SignalCount.textContent = news24Count;
  }

  if (undpSignalCount) {
    const undpCount = items.filter(function (item) {
      return item.source === "UNDP";
    }).length;

    undpSignalCount.textContent = undpCount;
  }
}

  /* =========================================================
     FALLBACK CONTENT
  ========================================================= */

  const fallbackItems = [
    {
      title:
        "Digital public infrastructure continues shaping Africa’s financial future",
      summary:
        "Explore how identity, payments and digital systems can support wider economic participation.",
      source: "Neurorder Intelligence",
      category: "DPI",
      url: "research.html",
      publishedAt: null,
      image: NEWS_IMAGE
    },
    {
      title:
        "Alternative credit scoring can help informal earners build financial identity",
      summary:
        "Neurorder is researching how voluntary financial activity can form a clearer financial story.",
      source: "Neurorder Research",
      category: "Credit Scoring",
      url: "credit-scoring.html",
      publishedAt: null,
      image: NEWS_IMAGE
    },
    {
      title:
        "AI reasoning systems are becoming central to research and decision-making",
      summary:
        "Nous is being developed as a clearer interface between information, reasoning and understanding.",
      source: "Nous Intelligence",
      category: "AI",
      url: "nous.html",
      publishedAt: null,
      image: NEWS_IMAGE
    },
    {
      title:
        "Fintech, payments and data systems remain key to financial inclusion",
      summary:
        "Digital financial infrastructure can help make overlooked economic activity more visible.",
      source: "Neurorder Intelligence",
      category: "Fintech",
      url: "research.html",
      publishedAt: null,
      image: NEWS_IMAGE
    }
  ];

  /* =========================================================
     LOAD NEWS
  ========================================================= */

  async function loadNewsFeed() {
    if (!list && !ticker) {
      return;
    }

    showLoadingState();

    try {
      const response = await fetch(
        `/api/news?refresh=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(`News API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.articles)) {
        throw new Error("Invalid news response.");
      }

      const articles = data.articles
        .filter(function (article) {
          return article && article.title && article.url;
        })
        .slice(0, 18);

      if (articles.length === 0) {
        throw new Error("No articles were returned.");
      }

      allArticles = articles;
    } catch (error) {
      console.error("Unable to load automatic news:", error);

      allArticles = fallbackItems;
    }

    renderFeaturedSignal(allArticles[0]);
    renderSignalCounts(allArticles);
    renderFilteredNews();
    renderTicker(allArticles);

    if (list) {
      list.setAttribute("aria-busy", "false");
    }
  }

  /* =========================================================
     LOADING CARD
  ========================================================= */

  function showLoadingState() {
    if (!list) {
      return;
    }

    list.setAttribute("aria-busy", "true");

    list.innerHTML = `
      <article class="nous-feed-card live-news-item">

        <div class="live-news-image">
          <img
            src="${NEWS_IMAGE}"
            alt=""
          >
        </div>

        <div class="live-news-card-content">

          <div class="live-news-meta">
            <span class="live-news-source">
              Connecting
            </span>

            <span class="live-news-category">
              Public Intelligence
            </span>
          </div>

          <h3>
            Loading the latest intelligence signals…
          </h3>

          <p class="live-news-summary">
            Connecting to News24 and UNDP.
          </p>

        </div>

      </article>
    `;
  }

  /* =========================================================
     FEATURED SIGNAL
  ========================================================= */

  function renderFeaturedSignal(article) {
    if (!article || !featuredTitle || !featuredLink) {
      return;
    }

    featuredTitle.textContent =
      article.title || "Latest intelligence signal";

    if (featuredSummary) {
      featuredSummary.textContent =
        article.summary ||
        "Open the original publication to explore this intelligence signal.";
    }

    if (featuredSource) {
      const source =
        article.source || "Public Intelligence";

      const category =
        article.category || "Latest";

      featuredSource.textContent =
        `${source} · ${category}`;
    }

    if (featuredDate) {
      featuredDate.textContent =
        formatArticleDate(article.publishedAt);
    }

    const url = safeUrl(article.url);

    featuredLink.href = url;

    if (isExternalUrl(url)) {
      featuredLink.target = "_blank";
      featuredLink.rel = "noopener noreferrer";
    } else {
      featuredLink.removeAttribute("target");
      featuredLink.removeAttribute("rel");
    }
  }

  /* =========================================================
     FILTER AND SEARCH
  ========================================================= */

  function renderFilteredNews() {
    const searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const visibleItems = allArticles.filter(function (item) {
      const source =
        String(item.source || "").toLowerCase();

      const category =
        String(item.category || "").toLowerCase();

      const title =
        String(item.title || "").toLowerCase();

      const summary =
        String(item.summary || "").toLowerCase();

      const filterValue =
        activeFilter.toLowerCase();

      const matchesFilter =
        activeFilter === "all" ||
        source.includes(filterValue) ||
        category.includes(filterValue) ||
        title.includes(filterValue) ||
        summary.includes(filterValue);

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        summary.includes(searchTerm) ||
        source.includes(searchTerm) ||
        category.includes(searchTerm);

      return matchesFilter && matchesSearch;
    });

    renderNewsItems(visibleItems);

    if (emptyState) {
      emptyState.hidden =
        visibleItems.length !== 0;
    }
  }

  /* =========================================================
     RENDER LIVE NEWS CARDS
  ========================================================= */

  function renderNewsItems(items) {
    if (!list) {
      return;
    }

    list.innerHTML = items
      .map(function (item) {
        const title =
          escapeHtml(item.title);

        const summary =
          escapeHtml(
            item.summary ||
            "Open the original publication to read the complete story."
          );

        const source =
          escapeHtml(
            item.source ||
            "Public Intelligence"
          );

        const category =
          escapeHtml(
            item.category ||
            "Latest Signal"
          );

        const url =
          safeUrl(item.url);

        const date =
          formatArticleDate(item.publishedAt);

        /*
         * All news cards intentionally use the
         * Neurorder South African intelligence image.
         */
        const image = NEWS_IMAGE;

        const externalAttributes =
          isExternalUrl(url)
            ? 'target="_blank" rel="noopener noreferrer"'
            : "";

        return `
          <article class="nous-feed-card live-news-item">

            <a
              class="live-news-image"
              href="${url}"
              ${externalAttributes}
              aria-label="Open ${title}"
            >
              <img
                src="${image}"
                alt=""
                loading="lazy"
                onerror="this.onerror=null;this.src='${NEWS_IMAGE}';"
              >
            </a>

            <div class="live-news-card-content">

              <div class="live-news-meta">

                <span class="live-news-source">
                  ${source}
                </span>

                <span class="live-news-category">
                  ${category}
                </span>

              </div>

              <h3>
                <a
                  href="${url}"
                  ${externalAttributes}
                >
                  ${title}
                </a>
              </h3>

              <p class="live-news-summary">
                ${summary}
              </p>

              <div class="live-news-footer">

                ${
                  date
                    ? `
                      <time class="live-news-date">
                        ${date}
                      </time>
                    `
                    : "<span></span>"
                }

                <a
                  class="live-news-link"
                  href="${url}"
                  ${externalAttributes}
                >
                  Read signal →
                </a>

              </div>

            </div>

          </article>
        `;
      })
      .join("");
  }

  /* =========================================================
     NEWS TICKER
  ========================================================= */

  function renderTicker(items) {
    if (!ticker) {
      return;
    }

    ticker.textContent = items
      .slice(0, 12)
      .map(function (item) {
        const source =
          item.source || "Signal";

        return `${source}: ${item.title}`;
      })
      .join("   •   ");
  }

  /* =========================================================
     FILTER BUTTONS
  ========================================================= */

  function setupFilters() {
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter =
          button.dataset.filter || "all";

        filterButtons.forEach(function (item) {
          item.classList.toggle(
            "active",
            item === button
          );
        });

        renderFilteredNews();
      });
    });
  }

  /* =========================================================
     SEARCH INPUT
  ========================================================= */

  function setupSearch() {
    if (!searchInput) {
      return;
    }

    searchInput.addEventListener(
      "input",
      function () {
        renderFilteredNews();
      }
    );
  }

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  function formatArticleDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  /* =========================================================
     SECURITY HELPERS
  ========================================================= */

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    if (!value) {
      return "#";
    }

    try {
      const url =
        new URL(value, window.location.origin);

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {
        return "#";
      }

      return url.href;
    } catch (error) {
      return "#";
    }
  }

  function isExternalUrl(value) {
    try {
      const url =
        new URL(value, window.location.origin);

      return (
        url.origin !== window.location.origin
      );
    } catch (error) {
      return false;
    }
  }

  /* =========================================================
     OPTIONAL WEATHER
  ========================================================= */

  function setupWeather() {
    if (!tempBox || !placeBox) {
      return;
    }

    if (!navigator.geolocation) {
      tempBox.textContent = "--°C";
      placeBox.textContent =
        "Location unavailable.";

      return;
    }

    tempBox.textContent = "--°C";
    placeBox.textContent =
      "Allow location for local weather.";

    navigator.geolocation.getCurrentPosition(
      async function (position) {
        try {
          const lat =
            position.coords.latitude;

          const lon =
            position.coords.longitude;

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
          );

          if (!response.ok) {
            throw new Error(
              "Weather request failed."
            );
          }

          const data =
            await response.json();

          if (
            data &&
            data.current &&
            data.current.temperature_2m !== undefined
          ) {
            tempBox.textContent =
              `${Math.round(
                data.current.temperature_2m
              )}°C`;

            placeBox.textContent =
              "Live temperature near you.";
          }
        } catch (error) {
          console.error(
            "Weather request failed:",
            error
          );

          tempBox.textContent = "--°C";
          placeBox.textContent =
            "Weather unavailable.";
        }
      },
      function () {
        tempBox.textContent = "--°C";
        placeBox.textContent =
          "Location permission needed.";
      }
    );
  }

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  function setupMobileMenu() {
    const menuToggle =
      document.getElementById("menuToggle");

    const sidebar =
      document.querySelector(".ni-sidebar") ||
      document.querySelector(".nous-app-sidebar");

    const overlay =
      document.getElementById("mobileOverlay");

    if (!menuToggle || !sidebar || !overlay) {
      return;
    }

    menuToggle.addEventListener(
      "click",
      function () {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
      }
    );

    overlay.addEventListener(
      "click",
      function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      }
    );
  }

  /* =========================================================
     START
  ========================================================= */

  setupFilters();
  setupSearch();
  setupWeather();
  setupMobileMenu();

  loadNewsFeed();

  /*
   * Refresh the feed every 30 minutes
   * while the dashboard remains open.
   */
  window.setInterval(
    loadNewsFeed,
    30 * 60 * 1000
  );
});