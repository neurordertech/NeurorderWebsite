document.addEventListener("DOMContentLoaded", () => {
  const cities = [
    "Cape Town",
    "Johannesburg",
    "Pretoria",
    "Durban",
    "Bloemfontein",
    "Gqeberha",
    "Polokwane",
    "Mbombela",
  ];

  const temperatures = [
    17,
    21,
    22,
    24,
    19,
    18,
    23,
    25,
  ];

  const weather =
    document.getElementById("weatherTrack");

  if (weather) {
    cities.forEach((city, index) => {
      const partlyCloudy =
        index % 3 === 0;

      const item =
        document.createElement("article");

      item.className =
        "weather-ticker-item";

      item.innerHTML = `
        <strong>${city}</strong>

        <span class="weather-condition">
          ${partlyCloudy ? "Partly cloudy" : "Clear"}
        </span>

        <i
          class="fas ${
            partlyCloudy
              ? "fa-cloud-sun"
              : "fa-sun"
          }"
          aria-hidden="true"
        ></i>

        <span class="weather-temperature">
          ${temperatures[index]}°
        </span>
      `;

      weather.appendChild(item);
    });
  }

  const currentNewsDate =
    document.getElementById("currentNewsDate");

  if (currentNewsDate) {
    currentNewsDate.textContent =
      new Intl.DateTimeFormat(
        "en-ZA",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      ).format(new Date());
  }

  /*
   * Lead-story slideshow
   */

  const slides = [
    ...document.querySelectorAll(
      ".lead-story-slide",
    ),
  ];

  const dots = [
    ...document.querySelectorAll(
      "#leadDots button",
    ),
  ];

  let index = 0;

  function showSlide(nextIndex) {
    if (!slides.length) {
      return;
    }

    index =
      (nextIndex + slides.length) %
      slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle(
        "active",
        slideIndex === index,
      );
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle(
        "active",
        dotIndex === index,
      );
    });
  }

  const leadPrevious =
    document.getElementById("leadPrev");

  const leadNext =
    document.getElementById("leadNext");

  if (leadPrevious) {
    leadPrevious.addEventListener(
      "click",
      () => showSlide(index - 1),
    );
  }

  if (leadNext) {
    leadNext.addEventListener(
      "click",
      () => showSlide(index + 1),
    );
  }

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener(
      "click",
      () => showSlide(dotIndex),
    );
  });

  if (slides.length > 1) {
    window.setInterval(
      () => showSlide(index + 1),
      8000,
    );
  }

  /*
   * Mobile menu
   */

  const menu =
    document.getElementById(
      "newsMobileMenu",
    );

  const menuButton =
    document.getElementById(
      "newsMenuButton",
    );

  if (menu && menuButton) {
    menuButton.addEventListener(
      "click",
      () => {
        const open =
          menu.classList.toggle("open");

        menuButton.setAttribute(
          "aria-expanded",
          String(open),
        );
      },
    );
  }

  /*
   * Search panel
   */

  const searchPanel =
    document.getElementById(
      "newsSearchPanel",
    );

  const searchToggle =
    document.getElementById(
      "newsSearchToggle",
    );

  const searchClose =
    document.getElementById(
      "newsSearchClose",
    );

  const searchInput =
    document.getElementById(
      "newsSearchInput",
    );

  if (
    searchPanel &&
    searchToggle &&
    searchInput
  ) {
    searchToggle.addEventListener(
      "click",
      () => {
        searchPanel.hidden = false;
        searchInput.focus();
      },
    );
  }

  if (searchPanel && searchClose) {
    searchClose.addEventListener(
      "click",
      () => {
        searchPanel.hidden = true;
      },
    );
  }

  /*
   * News records
   */

  const articles = [
    {
      category: "technology",
      title:
        "Digital public infrastructure continues shaping access across Africa.",
      summary:
        "Identity systems, digital payments and connected public services are changing how people access opportunity.",
      image:
        "images/newsintelligencersa.png",
      date: "21 Jul 2026",
    },
    {
      category: "finance",
      title:
        "Alternative data could help more people participate in responsible finance.",
      summary:
        "Researchers are examining how transaction activity and financial behaviour can support more inclusive credit systems.",
      image: "images/nciimage.png",
      date: "21 Jul 2026",
    },
    {
      category: "education",
      title:
        "Adaptive technology is changing how students access learning support.",
      summary:
        "Digital resources and responsive educational systems are creating new ways for students to understand difficult subjects.",
      image:
        "images/nousclassroom.png",
      date: "21 Jul 2026",
    },
    {
      category: "business",
      title:
        "Small businesses are adopting more connected digital tools.",
      summary:
        "Digital services are helping emerging businesses manage payments, communication and operations.",
      image:
        "images/nouspersonal.png",
      date: "20 Jul 2026",
    },
    {
      category: "research",
      title:
        "Researchers are studying how public systems can include informal economies.",
      summary:
        "New work explores identity, financial activity and community trust as paths to inclusion.",
      image:
        "images/newsintelligence.png",
      date: "20 Jul 2026",
    },
    {
      category: "world",
      title:
        "Global institutions continue investing in digital public systems.",
      summary:
        "Governments and development organisations are expanding digital identity and public-service infrastructure.",
      image:
        "images/newsintelligencersa.png",
      date: "19 Jul 2026",
    },
  ];

  const grid =
    document.getElementById(
      "organisedNewsGrid",
    );

  /*
   * Latest-update signal
   */

  if (grid?.parentNode) {
    const push =
      document.createElement("section");

    push.className =
      "news-push-signal";

    push.innerHTML = `
      <div class="push-left">
        <div class="push-dot"></div>

        <div class="push-copy">
          <small>
            LATEST UPDATE
          </small>

          <h3 id="pushTitle">
            Checking for updates...
          </h3>

          <p id="pushSummary">
            Nous News is checking the latest verified signal.
          </p>
        </div>
      </div>

      <a
        class="push-button"
        id="pushButton"
        href="#"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open
      </a>
    `;

    grid.parentNode.insertBefore(
      push,
      grid,
    );
  }

  let filter = "all";

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function render() {
    if (!grid) {
      return;
    }

    const query =
      searchInput?.value
        .trim()
        .toLowerCase() ?? "";

    const filteredArticles =
      articles.filter((article) => {
        const matchesCategory =
          filter === "all" ||
          article.category === filter;

        const searchableText = `
          ${article.title}
          ${article.summary}
        `.toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        return (
          matchesCategory &&
          matchesSearch
        );
      });

    grid.innerHTML =
      filteredArticles
        .map(
          (article) => `
            <article class="news-card">
              <div class="news-card-image">
                <img
                  src="${article.image}"
                  alt=""
                >
              </div>

              <div class="news-card-body">
                <div class="news-card-meta">
                  <span>NOUS NEWS</span>
                  <span>
                    ${article.category}
                  </span>
                </div>

                <h3>
                  ${article.title}
                </h3>

                <p>
                  ${article.summary}
                </p>

                <div class="news-card-actions">
                  <span>
                    ${article.date}
                  </span>

                  <button
                    type="button"
                    class="card-ask"
                    data-title="${
                      escapeAttribute(
                        article.title,
                      )
                    }"
                  >
                    Ask Nous
                  </button>
                </div>
              </div>
            </article>
          `,
        )
        .join("") ||
      "<p>No matching signals were found.</p>";

    grid
      .querySelectorAll(".card-ask")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            askAbout(
              button.dataset.title ?? "",
            );
          },
        );
      });
  }

  render();

  const channelInformation = {
    all: [
      "SIGNALS",
      "What Nous News is following",
      "Current reporting selected and organised to help you understand what matters.",
    ],

    africa: [
      "AFRICA",
      "Across the continent",
      "Reporting on development, society and change across Africa.",
    ],

    technology: [
      "TECHNOLOGY",
      "Technology and digital systems",
      "Artificial intelligence, digital infrastructure and emerging technology.",
    ],

    business: [
      "BUSINESS",
      "Companies, markets and enterprise",
      "Business developments, entrepreneurship and economic activity.",
    ],

    finance: [
      "FINANCE",
      "Money, markets and access",
      "Financial systems, inclusion, investment and banking.",
    ],

    education: [
      "EDUCATION",
      "Learning and development",
      "Schools, universities and educational opportunity.",
    ],

    research: [
      "RESEARCH",
      "Research and new ideas",
      "Scientific work, evidence and emerging knowledge.",
    ],

    world: [
      "WORLD",
      "Developments around the world",
      "Global reporting organised to make complex events easier to understand.",
    ],
  };

  document
    .querySelectorAll("[data-filter]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          document
            .querySelectorAll(
              "[data-filter]",
            )
            .forEach((item) => {
              item.classList.remove(
                "active",
              );
            });

          button.classList.add(
            "active",
          );

          filter =
            button.dataset.filter ??
            "all";

          const channel =
            channelInformation[filter] ??
            channelInformation.all;

          const eyebrow =
            document.getElementById(
              "channelEyebrow",
            );

          const title =
            document.getElementById(
              "channelTitle",
            );

          const description =
            document.getElementById(
              "channelDescription",
            );

          if (eyebrow) {
            eyebrow.textContent =
              channel[0];
          }

          if (title) {
            title.textContent =
              channel[1];
          }

          if (description) {
            description.textContent =
              channel[2];
          }

          render();
        },
      );
    });

  searchInput?.addEventListener(
    "input",
    render,
  );

  /*
   * Refresh latest news
   */

  const refreshNews =
    document.getElementById(
      "refreshNews",
    );

  refreshNews?.addEventListener(
    "click",
    async () => {
      const pushTitle =
        document.getElementById(
          "pushTitle",
        );

      const pushSummary =
        document.getElementById(
          "pushSummary",
        );

      const pushButton =
        document.getElementById(
          "pushButton",
        );

      if (pushTitle) {
        pushTitle.textContent =
          "Checking for updates...";
      }

      try {
        const response =
          await fetch("/api/news");

        if (!response.ok) {
          throw new Error(
            `News service returned ${response.status}.`,
          );
        }

        const data =
          await response.json();

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          const latest = data[0];

          if (pushTitle) {
            pushTitle.textContent =
              latest.title ??
              "Latest verified signal";
          }

          if (pushSummary) {
            pushSummary.textContent =
              latest.summary ??
              "Open this signal to read more.";
          }

          if (
            pushButton &&
            latest.url
          ) {
            pushButton.href =
              latest.url;
          }
        } else if (pushTitle) {
          pushTitle.textContent =
            "No new verified updates.";
        }
      } catch (error) {
        console.error(
          "News refresh failed:",
          error,
        );

        if (pushTitle) {
          pushTitle.textContent =
            "No new verified updates.";
        }

        if (pushSummary) {
          pushSummary.textContent =
            "The live news feed could not be reached.";
        }
      }

      render();
    },
  );

  const loadMoreNews =
    document.getElementById(
      "loadMoreNews",
    );

  loadMoreNews?.addEventListener(
    "click",
    (event) => {
      event.currentTarget.textContent =
        "All current signals are displayed";
    },
  );

  /*
   * Conversation cards
   */

  const conversation =
    document.getElementById(
      "conversationGrid",
    );

  if (conversation) {
    conversation.innerHTML =
      articles
        .slice(0, 3)
        .map(
          (article, articleIndex) => `
            <article class="signal-card">
              <span class="signal-category">
                ${article.category.toUpperCase()}
              </span>

              <h3>
                ${article.title}
              </h3>

              <p>
                <strong>
                  Why it matters:
                </strong>

                ${article.summary}
              </p>

              <div class="signal-actions">
                <button
                  type="button"
                  data-pulse
                >
                  ◉ Send a Pulse

                  <span>
                    ${
                      [18, 31, 24][
                        articleIndex
                      ]
                    }
                  </span>
                </button>

                <button type="button">
                  ◯ Discuss
                  <span>0</span>
                </button>

                <button
                  type="button"
                  class="ask-signal"
                  data-title="${
                    escapeAttribute(
                      article.title,
                    )
                  }"
                >
                  ✣ Ask Nous
                </button>

                <button
                  type="button"
                  data-share
                >
                  ⇧ Share
                </button>
              </div>
            </article>
          `,
        )
        .join("");

    conversation
      .querySelectorAll("[data-pulse]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const counter =
              button.querySelector(
                "span",
              );

            if (counter) {
              counter.textContent =
                String(
                  Number(
                    counter.textContent,
                  ) + 1,
                );
            }

            button.disabled = true;
          },
        );
      });

    conversation
      .querySelectorAll(
        ".ask-signal",
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            askAbout(
              button.dataset.title ??
                "",
            );
          },
        );
      });

    conversation
      .querySelectorAll("[data-share]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            try {
              await navigator.clipboard
                .writeText(
                  window.location.href,
                );

              button.textContent =
                "Copied";
            } catch (error) {
              console.error(
                "Share copy failed:",
                error,
              );

              button.textContent =
                "Copy failed";
            }
          },
        );
      });
  }

  /*
   * Nous Companion
   */

  const askNousForm =
    document.getElementById(
      "askNousForm",
    );

  const askNousInput =
    document.getElementById(
      "askNousInput",
    );

  const askNousResponse =
    document.getElementById(
      "askNousResponse",
    );

  function askAbout(title) {
    if (!askNousInput) {
      return;
    }

    askNousInput.value =
      `Explain why this matters: ${title}`;

    document
      .getElementById("askNousNews")
      ?.scrollIntoView({
        behavior: "smooth",
      });

    window.setTimeout(
      () => askNousInput.focus(),
      400,
    );
  }

  document
    .querySelectorAll(
      ".question-suggestions button",
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          if (!askNousInput) {
            return;
          }

          askNousInput.value =
            button.textContent?.trim() ??
            "";

          askNousInput.focus();
        },
      );
    });

  function getSupabaseClient() {
    if (
      window.supabaseClient &&
      window.supabaseClient.auth
    ) {
      return window.supabaseClient;
    }

    if (
      window.neurorderSupabase &&
      window.neurorderSupabase.auth
    ) {
      return window.neurorderSupabase;
    }

    if (
      window.supabase &&
      window.supabase.auth &&
      typeof window.supabase
        .functions?.invoke ===
        "function"
    ) {
      return window.supabase;
    }

    return null;
  }

  askNousForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const question =
        askNousInput?.value.trim() ??
        "";

      if (!question) {
        if (askNousResponse) {
          askNousResponse.textContent =
            "Please enter a question.";
        }

        return;
      }

      const supabaseClient =
        getSupabaseClient();

      if (!supabaseClient) {
        console.error(
          "The Supabase client is not available.",
        );

        if (askNousResponse) {
          askNousResponse.textContent =
            "Nous could not connect because the Supabase client is unavailable.";
        }

        return;
      }

      const submitButton =
        askNousForm.querySelector(
          'button[type="submit"]',
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

      if (askNousInput) {
        askNousInput.disabled = true;
      }

      if (askNousResponse) {
        askNousResponse.textContent =
          "Nous is organising the context…";
      }

      try {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabaseClient.auth
            .getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          if (askNousResponse) {
            askNousResponse.textContent =
              "Please log in before using Nous Companion.";
          }

          return;
        }

        const {
          data,
          error,
        } =
          await supabaseClient.functions
            .invoke(
              "nous-companion",
              {
                body: {
                  mode: "news",
                  message: question,
                  context: {
                    page: "nous-news",
                    category: filter,
                    pageTitle:
                      document.title,
                    pageUrl:
                      window.location.href,
                  },
                },
              },
            );

        if (error) {
          let detailedMessage =
            error.message;

          try {
            const errorContext =
              error.context;

            if (
              errorContext &&
              typeof errorContext.json ===
                "function"
            ) {
              const errorBody =
                await errorContext.json();

              detailedMessage =
                errorBody?.error ??
                errorBody?.message ??
                detailedMessage;
            }
          } catch (
            contextReadError
          ) {
            console.warn(
              "Could not read the Edge Function error response:",
              contextReadError,
            );
          }

          throw new Error(
            detailedMessage ||
              "Nous Companion could not answer the question.",
          );
        }

        const answer =
          data?.answer ??
          data?.response ??
          data?.output ??
          data?.text ??
          data?.message;

        if (!answer) {
          throw new Error(
            "Nous returned an empty response.",
          );
        }

        if (askNousResponse) {
          askNousResponse.textContent =
            answer;
        }
      } catch (error) {
        console.error(
          "Nous Companion request failed:",
          error,
        );

        if (askNousResponse) {
          askNousResponse.textContent =
            error instanceof Error
              ? error.message
              : "Nous Companion could not connect.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }

        if (askNousInput) {
          askNousInput.disabled = false;
          askNousInput.focus();
        }
      }
    },
  );

  /*
   * Voice control placeholder
   */

  const voiceQuestion =
    document.getElementById(
      "voiceQuestion",
    );

  voiceQuestion?.addEventListener(
    "click",
    () => {
      if (askNousResponse) {
        askNousResponse.textContent =
          "Voice questions are being prepared for Nous Companion.";
      }
    },
  );

  /*
   * Newsletter
   */

  const newsletterForm =
    document.getElementById(
      "newsletterForm",
    );

  newsletterForm?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const newsletterMessage =
        document.getElementById(
          "newsletterMessage",
        );

      if (newsletterMessage) {
        newsletterMessage.textContent =
          "Thank you. Your interest in Nous News has been recorded.";
      }

      newsletterForm.reset();
    },
  );
});