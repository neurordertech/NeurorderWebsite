(() => {
  "use strict";

  /* =========================================================
     NOUS NEWS
     Web Community v1

     RULES

     - Public can read.
     - Signed-in users can like and discuss.
     - Only approved NEURORDER publishers can create posts.
     - Only real database posts are displayed.
     - All likes/comments shown are real database counts.
     - Original post media uploads to Supabase Storage.
     - External sources keep their original source URL.
     - Community publishing opens later.
  ========================================================== */


  /* =========================================================
     CONFIG
  ========================================================== */

  const client =
    window.NOUS_SUPABASE ||
    window.supabaseClient ||
    null;

  const NOUS_COMPANION_URL =
    "./nous-platform-integrated-fixed/app/personal-nous.html?from=nous-news";

  const NEWS_MEDIA_BUCKET =
    "nous-news-media";

  const MAX_IMAGE_SIZE =
    6 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];


  /* =========================================================
     STATE
  ========================================================== */

  const state = {
    session: null,
    user: null,
    isPublisher: false,
    posts: [],
    activeFilter: "all",
    activePostId: null,
    comments: [],
    imports: [],
  };


  /* =========================================================
     DOM
  ========================================================== */

  const feed =
    document.getElementById("newsFeed");

  const publishButton =
    document.getElementById("newsPublishButton");

  const publishLabel =
    document.getElementById("newsPublishLabel");

  const mobilePublishButton =
    document.getElementById("mobileNewsPublishButton");

  const profileName =
    document.getElementById("newsProfileName");

  const profileStatus =
    document.getElementById("newsProfileStatus");

  const searchInput =
    document.getElementById("newsSearchInput");

  const searchButton =
    document.getElementById("newsSearchButton");

  const modal =
    document.getElementById("newsModal");

  const modalCard =
    document.getElementById("newsModalCard");


  /* =========================================================
     BASIC HELPERS
  ========================================================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHTML(value);
  }


  function categoryLabel(category) {
    const labels = {
      general: "General",
      economy: "Economy",
      technology: "Technology",
      science: "Science",
      education: "Education",
      africa: "Africa",
      community: "Community",
      research: "Research",
      civic: "Civic",
    };

    return labels[category] || "General";
  }


  function formatTime(value) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    const milliseconds =
      Date.now() - date.getTime();

    const minutes =
      Math.floor(milliseconds / 60000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h`;
    }

    const days =
      Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d`;
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }


  function truncate(
    value,
    maximum = 90
  ) {
    const text =
      String(value || "").trim();

    if (text.length <= maximum) {
      return text;
    }

    return (
      text
        .slice(0, maximum)
        .trim() + "…"
    );
  }


  function validHttpUrl(value) {
    if (!value) {
      return true;
    }

    try {
      const url =
        new URL(value);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  }


  function getDisplayName() {
    if (!state.user) {
      return "Guest";
    }

    const metadata =
      state.user.user_metadata || {};

    return (
      metadata.full_name ||
      metadata.name ||
      metadata.username ||
      state.user.email ||
      "NOUS Member"
    );
  }


  function sourcePlatformLabel(platform) {
    const labels = {
      instagram: "Instagram",
      web: "Web",
      neurorder: "NEURORDER",
      nous: "NOUS",
      other: "External source",
    };

    return labels[platform] || null;
  }


  function sanitiseFileName(fileName) {
    const original =
      String(fileName || "image");

    const lastDot =
      original.lastIndexOf(".");

    const extension =
      lastDot >= 0
        ? original
            .slice(lastDot + 1)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
        : "";

    const base =
      (lastDot >= 0
        ? original.slice(0, lastDot)
        : original
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) ||
      "image";

    return extension
      ? `${base}.${extension}`
      : base;
  }


  function buildStoragePath(file) {
    const safeName =
      sanitiseFileName(file.name);

    const unique =
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    return `${state.user.id}/${Date.now()}-${unique}-${safeName}`;
  }


  function getStoragePathFromPublicUrl(url) {
    if (!url) {
      return null;
    }

    try {
      const parsed =
        new URL(url);

      const marker =
        `/storage/v1/object/public/${NEWS_MEDIA_BUCKET}/`;

      const index =
        parsed.pathname.indexOf(marker);

      if (index === -1) {
        return null;
      }

      return decodeURIComponent(
        parsed.pathname.slice(
          index + marker.length
        )
      );
    } catch {
      return null;
    }
  }


  function validateImageFile(file) {
    if (!file) {
      return {
        valid: true,
        message: "",
      };
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      return {
        valid: false,
        message:
          "Please choose a JPEG, PNG or WebP image.",
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        message:
          "The image is larger than 6 MB. Please choose a smaller image.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }


  /* =========================================================
     STORAGE
  ========================================================== */

  async function uploadNewsImage(file) {
    if (
      !client ||
      !state.user ||
      !state.isPublisher
    ) {
      throw new Error(
        "You are not authorised to upload NOUS News media."
      );
    }

    const validation =
      validateImageFile(file);

    if (!validation.valid) {
      throw new Error(
        validation.message
      );
    }

    const path =
      buildStoragePath(file);

    const {
      error: uploadError,
    } =
      await client.storage
        .from(NEWS_MEDIA_BUCKET)
        .upload(
          path,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data,
    } =
      client.storage
        .from(NEWS_MEDIA_BUCKET)
        .getPublicUrl(path);

    const publicUrl =
      data?.publicUrl || null;

    if (!publicUrl) {
      await removeNewsImageByPath(
        path
      );

      throw new Error(
        "The image uploaded, but NOUS could not create its public URL."
      );
    }

    return {
      path,
      publicUrl,
    };
  }


  async function removeNewsImageByPath(path) {
    if (
      !client ||
      !path
    ) {
      return;
    }

    const {
      error,
    } =
      await client.storage
        .from(NEWS_MEDIA_BUCKET)
        .remove([path]);

    if (error) {
      console.warn(
        "[NOUS NEWS] Media cleanup failed:",
        error
      );
    }
  }


  async function removeNewsImageByUrl(url) {
    const path =
      getStoragePathFromPublicUrl(url);

    if (!path) {
      return;
    }

    await removeNewsImageByPath(path);
  }


  /* =========================================================
     MODAL
  ========================================================== */

  function openModal(html) {
    if (!modal || !modalCard) {
      return;
    }

    modalCard.innerHTML =
      html;

    modal.classList.add("open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeModal() {
    if (!modal || !modalCard) {
      return;
    }

    modal.classList.remove("open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modalCard.innerHTML = "";
  }


  modal?.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeModal();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    }
  );


  /* =========================================================
     NAVIGATION
  ========================================================== */

  function initialiseNavigation() {
    const controls =
      document.querySelectorAll(
        "[data-news-filter]"
      );

    controls.forEach(
      (control) => {
        control.addEventListener(
          "click",
          () => {
            const filter =
              control.dataset.newsFilter ||
              "all";

            state.activeFilter =
              filter;

            updateActiveFilterUI(
              filter
            );

            renderPosts();
          }
        );
      }
    );
  }


  function updateActiveFilterUI(filter) {
    document
      .querySelectorAll(
        "[data-news-filter]"
      )
      .forEach(
        (control) => {
          control.classList.toggle(
            "active",
            control.dataset.newsFilter ===
              filter
          );
        }
      );
  }


  /* =========================================================
     SEARCH
  ========================================================== */

  function initialiseSearch() {
    searchInput?.addEventListener(
      "input",
      () => {
        renderPosts();
      }
    );

    searchButton?.addEventListener(
      "click",
      () => {
        if (
          searchInput &&
          window.innerWidth > 920
        ) {
          searchInput.focus();
          return;
        }

        const value =
          window.prompt(
            "Search NOUS News"
          );

        if (value === null) {
          return;
        }

        if (searchInput) {
          searchInput.value =
            value;
        }

        renderPosts();
      }
    );
  }


  /* =========================================================
     AUTH
  ========================================================== */

  async function loadAuthentication() {
    if (!client) {
      console.error(
        "[NOUS NEWS] Supabase client is unavailable."
      );

      updateIdentityUI();
      return;
    }

    try {
      const {
        data,
        error,
      } =
        await client.auth
          .getSession();

      if (error) {
        throw error;
      }

      state.session =
        data?.session || null;

      state.user =
        state.session?.user || null;

      await checkPublisherStatus();

      updateIdentityUI();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Authentication error:",
        error
      );

      state.session = null;
      state.user = null;
      state.isPublisher = false;

      updateIdentityUI();
    }
  }


  async function checkPublisherStatus() {
    state.isPublisher = false;

    if (
      !client ||
      !state.user
    ) {
      return;
    }

    try {
      const {
        data,
        error,
      } =
        await client.rpc(
          "is_nous_news_publisher"
        );

      if (error) {
        throw error;
      }

      state.isPublisher =
        data === true;
    } catch (error) {
      console.error(
        "[NOUS NEWS] Publisher check failed:",
        error
      );

      state.isPublisher = false;
    }
  }


  function updateIdentityUI() {
    if (profileName) {
      profileName.textContent =
        getDisplayName();
    }

    if (profileStatus) {
      if (state.isPublisher) {
        profileStatus.textContent =
          "NEURORDER Publisher";
      } else if (state.user) {
        profileStatus.textContent =
          "NOUS Member";
      } else {
        profileStatus.textContent =
          "Public reader";
      }
    }

    if (state.isPublisher) {
      publishButton
        ?.classList
        .remove(
          "community-locked"
        );

      if (publishLabel) {
        publishLabel.textContent =
          "Create Post";
      }
    } else {
      publishButton
        ?.classList
        .add(
          "community-locked"
        );

      if (publishLabel) {
        publishLabel.textContent =
          "Posting soon";
      }
    }
  }


  /* =========================================================
     AUTH STATE CHANGES
  ========================================================== */

  function initialiseAuthListener() {
    if (!client) {
      return;
    }

    client.auth.onAuthStateChange(
      (_event, session) => {
        state.session =
          session || null;

        state.user =
          session?.user || null;

        setTimeout(
          async () => {
            await checkPublisherStatus();
            updateIdentityUI();
            await loadPosts();
          },
          0
        );
      }
    );
  }


  /* =========================================================
     FEED STATES
  ========================================================== */

  function renderLoading() {
    if (!feed) {
      return;
    }

    feed.innerHTML = `
      <div class="feed-state">
        <div>
          <span class="feed-state-icon">
            <i class="fa-solid fa-spinner fa-spin"></i>
          </span>

          <h2>
            Loading NOUS News
          </h2>

          <p>
            Checking for published updates from NEURORDER.
          </p>
        </div>
      </div>
    `;
  }


  function renderEmpty() {
    if (!feed) {
      return;
    }

    const category =
      state.activeFilter === "all"
        ? null
        : categoryLabel(
            state.activeFilter
          );

    feed.innerHTML = `
      <div class="feed-state">
        <div>
          <span class="feed-state-icon">
            <i class="fa-regular fa-newspaper"></i>
          </span>

          <h2>
            ${
              category
                ? `No ${escapeHTML(
                    category
                  )} updates yet`
                : "The first NOUS News post is coming."
            }
          </h2>

          <p>
            ${
              category
                ? `NEURORDER has not published anything in ${escapeHTML(
                    category
                  )} yet.`
                : "NOUS News is live, but the feed starts from zero. NEURORDER will publish the first official update here."
            }
          </p>
        </div>
      </div>
    `;
  }


  function renderError(message) {
    if (!feed) {
      return;
    }

    feed.innerHTML = `
      <div class="feed-state">
        <div>
          <span class="feed-state-icon">
            <i class="fa-solid fa-circle-exclamation"></i>
          </span>

          <h2>
            NOUS News could not load
          </h2>

          <p>
            ${escapeHTML(
              message ||
              "Please try again."
            )}
          </p>
        </div>
      </div>
    `;
  }


  /* =========================================================
     LOAD POSTS
  ========================================================== */

  async function loadPosts() {
    if (
      !client ||
      !feed
    ) {
      renderError(
        "The NOUS data connection is unavailable."
      );
      return;
    }

    renderLoading();

    try {
      const {
        data,
        error,
      } =
        await client
          .from(
            "nous_news_posts"
          )
          .select(`
            id,
            user_id,
            headline,
            body,
            category,
            source_url,
            image_url,
            status,
            source_platform,
            source_account,
            source_title,
            source_caption,
            source_preview_image,
            imported_at,
            created_at,
            updated_at
          `)
          .eq(
            "status",
            "published"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        throw error;
      }

      state.posts =
        data || [];

      await loadEngagement();

      renderPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Feed error:",
        error
      );

      renderError(
        error?.message ||
        "The community feed could not be loaded."
      );
    }
  }


  /* =========================================================
     REAL ENGAGEMENT
  ========================================================== */

  async function loadEngagement() {
    if (
      !client ||
      state.posts.length === 0
    ) {
      return;
    }

    const ids =
      state.posts.map(
        (post) => post.id
      );

    const [
      reactionResult,
      commentResult,
    ] =
      await Promise.all([
        client
          .from(
            "nous_news_reactions"
          )
          .select(
            "post_id,user_id,reaction_type"
          )
          .in(
            "post_id",
            ids
          ),

        client
          .from(
            "nous_news_comments"
          )
          .select(
            "id,post_id"
          )
          .in(
            "post_id",
            ids
          ),
      ]);

    if (reactionResult.error) {
      console.error(
        "[NOUS NEWS] Reaction count error:",
        reactionResult.error
      );
    }

    if (commentResult.error) {
      console.error(
        "[NOUS NEWS] Comment count error:",
        commentResult.error
      );
    }

    const reactions =
      reactionResult.data || [];

    const comments =
      commentResult.data || [];

    state.posts =
      state.posts.map(
        (post) => {
          const postLikes =
            reactions.filter(
              (reaction) =>
                reaction.post_id ===
                  post.id &&
                reaction.reaction_type ===
                  "like"
            );

          const postComments =
            comments.filter(
              (comment) =>
                comment.post_id ===
                post.id
            );

          return {
            ...post,

            likeCount:
              postLikes.length,

            commentCount:
              postComments.length,

            currentUserLiked:
              Boolean(
                state.user &&
                postLikes.some(
                  (reaction) =>
                    reaction.user_id ===
                    state.user.id
                )
              ),
          };
        }
      );
  }


  /* =========================================================
     FILTER POSTS
  ========================================================== */

  function getVisiblePosts() {
    let posts =
      [...state.posts];

    if (
      state.activeFilter !==
      "all"
    ) {
      posts =
        posts.filter(
          (post) =>
            post.category ===
            state.activeFilter
        );
    }

    const query =
      (
        searchInput?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    if (query) {
      posts =
        posts.filter(
          (post) => {
            const searchable =
              [
                post.headline,
                post.body,
                post.category,
                post.source_account,
                post.source_title,
                post.source_caption,
                post.source_platform,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              query
            );
          }
        );
    }

    return posts;
  }


  /* =========================================================
     RENDER FEED
  ========================================================== */

  function renderPosts() {
    if (!feed) {
      return;
    }

    const visible =
      getVisiblePosts();

    if (visible.length === 0) {
      renderEmpty();
      return;
    }

    feed.innerHTML =
      visible
        .map(
          (post) =>
            renderPost(post)
        )
        .join("");

    bindPostEvents();
  }


  function renderPost(post) {
    const isOwner =
      Boolean(
        state.user &&
        state.user.id ===
          post.user_id
      );

    const category =
      categoryLabel(
        post.category
      );

    const headline =
      escapeHTML(
        post.headline ||
        post.source_title ||
        "NEURORDER Update"
      );

    const body =
      escapeHTML(
        post.body || ""
      );

    const platform =
      sourcePlatformLabel(
        post.source_platform
      );

    const sourceAccount =
      post.source_account
        ? escapeHTML(
            post.source_account
          )
        : "";

    const sourceDescription =
      platform
        ? `${escapeHTML(
            platform
          )}${
            sourceAccount
              ? ` · ${sourceAccount}`
              : ""
          }`
        : null;

    const image =
      post.image_url ||
      post.source_preview_image ||
      null;

    let visual;

    if (image) {
      visual = `
        <div class="post-visual has-image">
          <img
            src="${escapeAttribute(
              image
            )}"
            alt="${escapeAttribute(
              post.headline ||
              "NOUS News"
            )}"
            loading="lazy"
          >
        </div>
      `;
    } else {
      visual = `
        <div class="post-visual">
          <div>
            <span class="post-category">
              ${escapeHTML(
                category
              )}
            </span>

            <h2 class="post-headline">
              ${headline}
            </h2>
          </div>
        </div>
      `;
    }

    const sourceLink =
      post.source_url
        ? `
          <a
            class="post-link"
            href="${escapeAttribute(
              post.source_url
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${
              post.source_platform ===
                "instagram"
                ? '<i class="fa-brands fa-instagram"></i>'
                : '<i class="fa-solid fa-arrow-up-right-from-square"></i>'
            }

            View original source
          </a>
        `
        : "";

    return `
      <article
        class="news-post"
        data-post-id="${escapeAttribute(
          post.id
        )}"
      >

        <header class="post-header">

          <div class="publisher">

            <div class="publisher-avatar">
              <img
                src="images/NeurorderBody.png"
                alt=""
              >
            </div>

            <div class="publisher-copy">

              <div class="publisher-name">
                NEURORDER

                <i
                  class="fa-solid fa-circle-check"
                  aria-label="Official publisher"
                ></i>
              </div>

              <span class="publisher-meta">

                ${escapeHTML(
                  category
                )}

                ·

                ${escapeHTML(
                  formatTime(
                    post.created_at
                  )
                )}

                ${
                  sourceDescription
                    ? ` · ${sourceDescription}`
                    : ""
                }

              </span>

            </div>

          </div>

          ${
            isOwner &&
            state.isPublisher
              ? `
                <button
                  class="post-more manage-post-button"
                  type="button"
                  data-post-id="${escapeAttribute(
                    post.id
                  )}"
                  aria-label="Manage post"
                >
                  <i class="fa-solid fa-ellipsis"></i>
                </button>
              `
              : ""
          }

        </header>

        ${visual}

        <div class="post-actions">

          <div class="post-action-group">

            <button
              class="social-button like-button ${
                post.currentUserLiked
                  ? "liked"
                  : ""
              }"
              type="button"
              data-post-id="${escapeAttribute(
                post.id
              )}"
              aria-label="Like"
            >
              <i
                class="${
                  post.currentUserLiked
                    ? "fa-solid"
                    : "fa-regular"
                } fa-heart"
              ></i>
            </button>

            <button
              class="social-button comment-button"
              type="button"
              data-post-id="${escapeAttribute(
                post.id
              )}"
              aria-label="Discuss"
            >
              <i class="fa-regular fa-comment"></i>
            </button>

            <button
              class="social-button ask-nous-button"
              type="button"
              data-post-id="${escapeAttribute(
                post.id
              )}"
              aria-label="Ask NOUS"
            >
              <i class="fa-solid fa-brain"></i>
            </button>

            <button
              class="social-button share-post-button"
              type="button"
              data-post-id="${escapeAttribute(
                post.id
              )}"
              aria-label="Share"
            >
              <i class="fa-regular fa-paper-plane"></i>
            </button>

          </div>

        </div>

        <div class="post-content">

          <p class="engagement-count">

            ${Number(
              post.likeCount || 0
            )}
            ${
              Number(
                post.likeCount || 0
              ) === 1
                ? "like"
                : "likes"
            }

            ·

            ${Number(
              post.commentCount || 0
            )}
            ${
              Number(
                post.commentCount || 0
              ) === 1
                ? "discussion"
                : "discussions"
            }

          </p>

          <p class="caption">
            <strong>
              ${headline}
            </strong>

            ${body}
          </p>

          ${
            post.source_caption
              ? `
                <p class="caption">
                  <strong>
                    Original source:
                  </strong>

                  ${escapeHTML(
                    truncate(
                      post.source_caption,
                      320
                    )
                  )}
                </p>
              `
              : ""
          }

          ${sourceLink}

          <button
            class="comments-link comment-button"
            type="button"
            data-post-id="${escapeAttribute(
              post.id
            )}"
          >
            ${
              Number(
                post.commentCount || 0
              ) > 0
                ? "View discussion"
                : "Start discussion"
            }
          </button>

        </div>

        <aside class="nous-context">

          <span class="context-label">
            ✦ NOUS CONTEXT
          </span>

          <p>
            Ask NOUS to explain this update,
            connect it to wider context,
            or help you understand why it matters.
          </p>

          <button
            class="post-link ask-nous-button"
            type="button"
            data-post-id="${escapeAttribute(
              post.id
            )}"
          >
            Ask NOUS about this

            <i class="fa-solid fa-arrow-right"></i>
          </button>

        </aside>

      </article>
    `;
  }


  /* =========================================================
     PUBLISH BUTTON
  ========================================================== */

  function initialisePublishButtons() {
    publishButton?.addEventListener(
      "click",
      handlePublishButton
    );

    mobilePublishButton?.addEventListener(
      "click",
      handlePublishButton
    );
  }


  function handlePublishButton() {
    if (state.isPublisher) {
      openPublisherMenu();
      return;
    }

    openCommunityPostingInfo();
  }


  /* =========================================================
     COMMUNITY POSTING INFO
  ========================================================== */

  function openCommunityPostingInfo() {
    openModal(`
      <h2>
        Community publishing is coming.
      </h2>

      <p>
        NOUS News is opening in stages.
        NEURORDER is currently the publisher
        while we prepare account verification,
        moderation and publishing controls.
      </p>

      <p>
        ${
          state.user
            ? "Your NOUS account can already participate in likes and discussions."
            : "You can read NOUS News publicly. Sign in with a NOUS account to participate in likes and discussions."
        }
      </p>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
          flex-wrap:wrap;
          margin-top:22px;
        "
      >

        ${
          !state.user
            ? `
              <a
                href="login.html?returnTo=${encodeURIComponent(
                  "/nous-news.html"
                )}"
                class="modal-button"
              >
                Sign in
              </a>

              <a
                href="signup.html?returnTo=${encodeURIComponent(
                  "/nous-news.html"
                )}"
                class="modal-button"
              >
                Create account
              </a>
            `
            : ""
        }

        <button
          class="modal-button"
          id="closeCommunityModal"
          type="button"
        >
          Close
        </button>

      </div>
    `);

    document
      .getElementById(
        "closeCommunityModal"
      )
      ?.addEventListener(
        "click",
        closeModal
      );
  }


  /* =========================================================
     PUBLISHER MENU
  ========================================================== */

  function openPublisherMenu() {
    openModal(`
      <h2>
        NOUS News Desk
      </h2>

      <p>
        Publish an original NEURORDER update,
        bring an external source into NOUS News,
        or review sources waiting in the News Desk.
      </p>

      <div
        style="
          display:grid;
          gap:10px;
          margin-top:22px;
        "
      >

        <button
          class="modal-button"
          id="createOriginalPost"
          type="button"
        >
          Write original post
        </button>

        <button
          class="modal-button"
          id="importSourcePost"
          type="button"
        >
          Import source
        </button>

        <button
          class="modal-button"
          id="reviewNewsImports"
          type="button"
        >
          Review imports
        </button>

        <button
          class="modal-button"
          id="closePublisherMenu"
          type="button"
        >
          Cancel
        </button>

      </div>
    `);

    document
      .getElementById(
        "createOriginalPost"
      )
      ?.addEventListener(
        "click",
        openOriginalComposer
      );

    document
      .getElementById(
        "importSourcePost"
      )
      ?.addEventListener(
        "click",
        openImportComposer
      );

    document
      .getElementById(
        "reviewNewsImports"
      )
      ?.addEventListener(
        "click",
        openImportDesk
      );

    document
      .getElementById(
        "closePublisherMenu"
      )
      ?.addEventListener(
        "click",
        closeModal
      );
  }


  /* =========================================================
     ORIGINAL POST COMPOSER
     NOW USES REAL SUPABASE STORAGE
  ========================================================== */

  function openOriginalComposer(
    existingPost = null
  ) {
    if (
      !state.isPublisher ||
      !state.user
    ) {
      openCommunityPostingInfo();
      return;
    }

    const editing =
      Boolean(existingPost);

    const currentImage =
      existingPost?.image_url ||
      null;

    openModal(`
      <h2>
        ${
          editing
            ? "Edit NOUS News post"
            : "Create NOUS News post"
        }
      </h2>

      <form
        id="originalPostForm"
        style="
          display:grid;
          gap:13px;
          margin-top:20px;
        "
      >

        <input
          id="originalHeadline"
          type="text"
          maxlength="180"
          required
          placeholder="Headline"
          value="${escapeAttribute(
            existingPost?.headline ||
            ""
          )}"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            outline:0;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <textarea
          id="originalBody"
          rows="7"
          maxlength="3000"
          required
          placeholder="Write the update..."
          style="
            resize:vertical;
            padding:13px;
            border:1px solid var(--border);
            border-radius:12px;
            outline:0;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >${escapeHTML(
          existingPost?.body ||
          ""
        )}</textarea>

        <select
          id="originalCategory"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            outline:0;
            background:#07101c;
            color:white;
          "
        >
          ${categoryOptions(
            existingPost?.category ||
            "general"
          )}
        </select>

        <input
          id="originalSource"
          type="url"
          placeholder="Supporting source URL (optional)"
          value="${escapeAttribute(
            existingPost?.source_url ||
            ""
          )}"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            outline:0;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <div
          style="
            display:grid;
            gap:8px;
            padding:14px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.02);
          "
        >

          <label
            for="originalImageFile"
            style="
              font-size:.72rem;
              font-weight:700;
            "
          >
            Post image
          </label>

          <input
            id="originalImageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="
              width:100%;
              color:var(--muted);
              font-size:.72rem;
            "
          >

          <span
            style="
              color:var(--faint);
              font-size:.65rem;
              line-height:1.5;
            "
          >
            JPEG, PNG or WebP · Maximum 6 MB
          </span>

          ${
            currentImage
              ? `
                <div
                  id="currentImagePanel"
                  style="
                    display:grid;
                    gap:9px;
                    margin-top:4px;
                  "
                >

                  <span
                    style="
                      color:var(--muted);
                      font-size:.65rem;
                    "
                  >
                    Current image
                  </span>

                  <img
                    src="${escapeAttribute(
                      currentImage
                    )}"
                    alt="Current post image"
                    style="
                      width:100%;
                      max-height:260px;
                      object-fit:cover;
                      border-radius:10px;
                      border:1px solid var(--border);
                    "
                  >

                  <label
                    style="
                      display:flex;
                      align-items:center;
                      gap:8px;
                      color:var(--muted);
                      font-size:.68rem;
                    "
                  >
                    <input
                      id="removeCurrentImage"
                      type="checkbox"
                    >

                    Remove current image
                  </label>

                </div>
              `
              : ""
          }

          <div
            id="newImagePreview"
            style="
              display:none;
              margin-top:4px;
            "
          >
            <span
              style="
                display:block;
                margin-bottom:7px;
                color:var(--muted);
                font-size:.65rem;
              "
            >
              New image preview
            </span>

            <img
              id="newImagePreviewImage"
              alt="Selected image preview"
              style="
                width:100%;
                max-height:260px;
                object-fit:cover;
                border-radius:10px;
                border:1px solid var(--border);
              "
            >
          </div>

        </div>

        <p
          id="originalPostMessage"
          style="
            min-height:18px;
            margin:0;
            color:var(--muted);
            font-size:.72rem;
          "
        ></p>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:9px;
          "
        >

          <button
            class="modal-button"
            type="button"
            id="cancelOriginalPost"
          >
            Cancel
          </button>

          <button
            class="modal-button"
            id="originalPostSubmit"
            type="submit"
          >
            ${
              editing
                ? "Save changes"
                : "Publish"
            }
          </button>

        </div>

      </form>
    `);

    document
      .getElementById(
        "cancelOriginalPost"
      )
      ?.addEventListener(
        "click",
        closeModal
      );

    const imageInput =
      document.getElementById(
        "originalImageFile"
      );

    const preview =
      document.getElementById(
        "newImagePreview"
      );

    const previewImage =
      document.getElementById(
        "newImagePreviewImage"
      );

    let previewObjectUrl =
      null;

    imageInput?.addEventListener(
      "change",
      () => {
        const file =
          imageInput.files?.[0] ||
          null;

        const message =
          document.getElementById(
            "originalPostMessage"
          );

        if (previewObjectUrl) {
          URL.revokeObjectURL(
            previewObjectUrl
          );

          previewObjectUrl = null;
        }

        if (!file) {
          if (preview) {
            preview.style.display =
              "none";
          }

          if (previewImage) {
            previewImage.removeAttribute(
              "src"
            );
          }

          return;
        }

        const validation =
          validateImageFile(file);

        if (!validation.valid) {
          imageInput.value = "";

          if (message) {
            message.textContent =
              validation.message;
          }

          if (preview) {
            preview.style.display =
              "none";
          }

          return;
        }

        if (message) {
          message.textContent = "";
        }

        previewObjectUrl =
          URL.createObjectURL(file);

        if (previewImage) {
          previewImage.src =
            previewObjectUrl;
        }

        if (preview) {
          preview.style.display =
            "block";
        }

        const removeCurrent =
          document.getElementById(
            "removeCurrentImage"
          );

        if (removeCurrent) {
          removeCurrent.checked =
            false;
        }
      }
    );

    document
      .getElementById(
        "originalPostForm"
      )
      ?.addEventListener(
        "submit",
        (event) =>
          submitOriginalPost(
            event,
            existingPost
          )
      );
  }


  function categoryOptions(selected) {
    const categories = [
      "general",
      "economy",
      "technology",
      "science",
      "education",
      "africa",
      "community",
      "research",
      "civic",
    ];

    return categories
      .map(
        (category) => `
          <option
            value="${category}"
            ${
              category === selected
                ? "selected"
                : ""
            }
          >
            ${categoryLabel(
              category
            )}
          </option>
        `
      )
      .join("");
  }


  async function submitOriginalPost(
    event,
    existingPost
  ) {
    event.preventDefault();

    if (
      !client ||
      !state.user ||
      !state.isPublisher
    ) {
      return;
    }

    const headline =
      document
        .getElementById(
          "originalHeadline"
        )
        ?.value
        .trim() ||
      "";

    const body =
      document
        .getElementById(
          "originalBody"
        )
        ?.value
        .trim() ||
      "";

    const category =
      document
        .getElementById(
          "originalCategory"
        )
        ?.value ||
      "general";

    const sourceUrl =
      document
        .getElementById(
          "originalSource"
        )
        ?.value
        .trim() ||
      null;

    const imageInput =
      document.getElementById(
        "originalImageFile"
      );

    const imageFile =
      imageInput?.files?.[0] ||
      null;

    const removeCurrentImage =
      Boolean(
        document
          .getElementById(
            "removeCurrentImage"
          )
          ?.checked
      );

    const message =
      document.getElementById(
        "originalPostMessage"
      );

    const submitButton =
      document.getElementById(
        "originalPostSubmit"
      );

    if (
      !headline ||
      !body
    ) {
      if (message) {
        message.textContent =
          "Headline and content are required.";
      }

      return;
    }

    if (
      !validHttpUrl(
        sourceUrl
      )
    ) {
      if (message) {
        message.textContent =
          "Please use a valid http or https source URL.";
      }

      return;
    }

    const validation =
      validateImageFile(
        imageFile
      );

    if (!validation.valid) {
      if (message) {
        message.textContent =
          validation.message;
      }

      return;
    }

    if (submitButton) {
      submitButton.disabled =
        true;
    }

    let uploadedMedia =
      null;

    const oldImageUrl =
      existingPost?.image_url ||
      null;

    try {
      let finalImageUrl =
        oldImageUrl;

      if (imageFile) {
        if (message) {
          message.textContent =
            "Uploading image...";
        }

        uploadedMedia =
          await uploadNewsImage(
            imageFile
          );

        finalImageUrl =
          uploadedMedia.publicUrl;
      } else if (
        removeCurrentImage
      ) {
        finalImageUrl =
          null;
      }

      if (message) {
        message.textContent =
          existingPost
            ? "Saving changes..."
            : "Publishing...";
      }

      let result;

      if (existingPost) {
        result =
          await client
            .from(
              "nous_news_posts"
            )
            .update({
              headline,
              body,
              category,
              source_url:
                sourceUrl,
              image_url:
                finalImageUrl,
            })
            .eq(
              "id",
              existingPost.id
            )
            .eq(
              "user_id",
              state.user.id
            );
      } else {
        result =
          await client
            .from(
              "nous_news_posts"
            )
            .insert({
              user_id:
                state.user.id,

              headline,
              body,
              category,

              source_url:
                sourceUrl,

              image_url:
                finalImageUrl,

              source_platform:
                "neurorder",

              status:
                "published",
            });
      }

      if (result.error) {
        throw result.error;
      }

      /*
       * Database save succeeded.
       * We can now safely remove the previous image
       * if it was replaced or intentionally removed.
       */

      if (
        existingPost &&
        oldImageUrl &&
        (
          imageFile ||
          removeCurrentImage
        )
      ) {
        await removeNewsImageByUrl(
          oldImageUrl
        );
      }

      closeModal();

      await loadPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Publish error:",
        error
      );

      /*
       * If a NEW image uploaded but the database
       * operation failed, remove the orphaned file.
       */

      if (uploadedMedia?.path) {
        await removeNewsImageByPath(
          uploadedMedia.path
        );
      }

      if (message) {
        message.textContent =
          error?.message ||
          "NOUS News could not save this post.";
      }

      if (submitButton) {
        submitButton.disabled =
          false;
      }
    }
  }


  /* =========================================================
     IMPORT SOURCE COMPOSER
  ========================================================== */

  function openImportComposer() {
    if (
      !state.isPublisher ||
      !state.user
    ) {
      return;
    }

    openModal(`
      <h2>
        Import a source
      </h2>

      <p>
        Add an Instagram post or another public source
        to the NOUS News Desk.
        It will not appear publicly until a publisher
        reviews and publishes it.
      </p>

      <form
        id="importSourceForm"
        style="
          display:grid;
          gap:13px;
          margin-top:20px;
        "
      >

        <select
          id="importPlatform"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:#07101c;
            color:white;
          "
        >
          <option value="instagram">
            Instagram
          </option>

          <option value="web">
            Website
          </option>

          <option value="other">
            Other
          </option>
        </select>

        <input
          id="importUrl"
          type="url"
          required
          placeholder="https://www.instagram.com/p/..."
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <input
          id="importAccount"
          type="text"
          maxlength="120"
          placeholder="Source account, e.g. @publisher (optional)"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <input
          id="importTitle"
          type="text"
          maxlength="180"
          placeholder="Working headline (optional)"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <select
          id="importCategory"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:#07101c;
            color:white;
          "
        >
          ${categoryOptions(
            "general"
          )}
        </select>

        <textarea
          id="importEditorNote"
          rows="5"
          maxlength="2000"
          placeholder="Why should NOUS News share this?"
          style="
            resize:vertical;
            padding:13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        ></textarea>

        <p
          id="importMessage"
          style="
            min-height:18px;
            margin:0;
            color:var(--muted);
            font-size:.72rem;
          "
        ></p>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:9px;
          "
        >

          <button
            class="modal-button"
            type="button"
            id="cancelImport"
          >
            Cancel
          </button>

          <button
            class="modal-button"
            type="submit"
          >
            Add to Review
          </button>

        </div>

      </form>
    `);

    document
      .getElementById(
        "cancelImport"
      )
      ?.addEventListener(
        "click",
        closeModal
      );

    document
      .getElementById(
        "importSourceForm"
      )
      ?.addEventListener(
        "submit",
        submitImport
      );
  }


  async function submitImport(event) {
    event.preventDefault();

    if (
      !client ||
      !state.user ||
      !state.isPublisher
    ) {
      return;
    }

    const sourcePlatform =
      document
        .getElementById(
          "importPlatform"
        )
        ?.value ||
      "instagram";

    const sourceUrl =
      document
        .getElementById(
          "importUrl"
        )
        ?.value
        .trim() ||
      "";

    const sourceAccount =
      document
        .getElementById(
          "importAccount"
        )
        ?.value
        .trim() ||
      null;

    const sourceTitle =
      document
        .getElementById(
          "importTitle"
        )
        ?.value
        .trim() ||
      null;

    const category =
      document
        .getElementById(
          "importCategory"
        )
        ?.value ||
      "general";

    const editorNote =
      document
        .getElementById(
          "importEditorNote"
        )
        ?.value
        .trim() ||
      null;

    const message =
      document.getElementById(
        "importMessage"
      );

    if (
      !sourceUrl ||
      !validHttpUrl(
        sourceUrl
      )
    ) {
      if (message) {
        message.textContent =
          "Enter a valid public source URL.";
      }

      return;
    }

    if (
      sourcePlatform ===
        "instagram" &&
      !sourceUrl
        .toLowerCase()
        .includes(
          "instagram.com"
        )
    ) {
      if (message) {
        message.textContent =
          "That does not look like an Instagram URL.";
      }

      return;
    }

    if (message) {
      message.textContent =
        "Adding to the News Desk...";
    }

    try {
      const {
        error,
      } =
        await client
          .from(
            "nous_news_imports"
          )
          .insert({
            submitted_by:
              state.user.id,

            source_platform:
              sourcePlatform,

            source_url:
              sourceUrl,

            source_account:
              sourceAccount,

            source_title:
              sourceTitle,

            category,

            editor_note:
              editorNote,

            status:
              "pending",
          });

      if (error) {
        throw error;
      }

      closeModal();

      openSuccessMessage(
        "Added to the News Desk",
        "The source is waiting for review and has not been published."
      );
    } catch (error) {
      console.error(
        "[NOUS NEWS] Import error:",
        error
      );

      if (message) {
        if (
          String(error?.code) ===
          "23505"
        ) {
          message.textContent =
            "This source URL is already in the News Desk.";
        } else {
          message.textContent =
            error?.message ||
            "NOUS News could not import this source.";
        }
      }
    }
  }


  /* =========================================================
     IMPORT DESK
  ========================================================== */

  async function openImportDesk() {
    if (
      !client ||
      !state.isPublisher
    ) {
      return;
    }

    openModal(`
      <h2>
        News Desk
      </h2>

      <p>
        Loading sources waiting for review...
      </p>
    `);

    try {
      const {
        data,
        error,
      } =
        await client
          .from(
            "nous_news_imports"
          )
          .select(`
            id,
            submitted_by,
            source_platform,
            source_url,
            source_account,
            source_title,
            source_caption,
            source_preview_image,
            category,
            editor_note,
            status,
            published_post_id,
            created_at,
            reviewed_at
          `)
          .in(
            "status",
            [
              "pending",
              "approved",
            ]
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        throw error;
      }

      state.imports =
        data || [];

      renderImportDesk();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Import desk error:",
        error
      );

      openModal(`
        <h2>
          News Desk unavailable
        </h2>

        <p>
          ${escapeHTML(
            error?.message ||
            "The import queue could not be loaded."
          )}
        </p>

        <button
          class="modal-button"
          id="closeImportError"
          type="button"
        >
          Close
        </button>
      `);

      document
        .getElementById(
          "closeImportError"
        )
        ?.addEventListener(
          "click",
          closeModal
        );
    }
  }


  function renderImportDesk() {
    if (
      state.imports.length ===
      0
    ) {
      openModal(`
        <h2>
          News Desk
        </h2>

        <p>
          There are no sources waiting for review.
        </p>

        <button
          class="modal-button"
          id="closeEmptyDesk"
          type="button"
        >
          Close
        </button>
      `);

      document
        .getElementById(
          "closeEmptyDesk"
        )
        ?.addEventListener(
          "click",
          closeModal
        );

      return;
    }

    const items =
      state.imports
        .map(
          (item) => `
            <article
              style="
                padding:16px 0;
                border-bottom:1px solid var(--border);
              "
            >

              <span
                style="
                  color:var(--blue-bright);
                  font-size:.6rem;
                  text-transform:uppercase;
                  letter-spacing:.12em;
                "
              >
                ${escapeHTML(
                  sourcePlatformLabel(
                    item.source_platform
                  ) ||
                  item.source_platform
                )}
                ·
                ${escapeHTML(
                  categoryLabel(
                    item.category
                  )
                )}
              </span>

              <h3
                style="
                  margin:9px 0 0;
                  font-size:.95rem;
                "
              >
                ${escapeHTML(
                  item.source_title ||
                  item.source_account ||
                  "External source"
                )}
              </h3>

              ${
                item.editor_note
                  ? `
                    <p>
                      ${escapeHTML(
                        item.editor_note
                      )}
                    </p>
                  `
                  : ""
              }

              <a
                href="${escapeAttribute(
                  item.source_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display:inline-block;
                  margin-top:8px;
                  color:var(--blue-bright);
                  font-size:.7rem;
                "
              >
                Open original source ↗
              </a>

              <div
                style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                  margin-top:14px;
                "
              >

                <button
                  class="modal-button publish-import-button"
                  type="button"
                  data-import-id="${escapeAttribute(
                    item.id
                  )}"
                >
                  Review &amp; Publish
                </button>

                <button
                  class="modal-button reject-import-button"
                  type="button"
                  data-import-id="${escapeAttribute(
                    item.id
                  )}"
                >
                  Reject
                </button>

              </div>

            </article>
          `
        )
        .join("");

    openModal(`
      <h2>
        News Desk
      </h2>

      <p>
        Sources waiting for editorial review.
      </p>

      <div
        style="
          margin-top:16px;
        "
      >
        ${items}
      </div>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-top:18px;
        "
      >
        <button
          class="modal-button"
          id="closeImportDesk"
          type="button"
        >
          Close
        </button>
      </div>
    `);

    document
      .getElementById(
        "closeImportDesk"
      )
      ?.addEventListener(
        "click",
        closeModal
      );

    document
      .querySelectorAll(
        ".publish-import-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              const item =
                state.imports.find(
                  (candidate) =>
                    candidate.id ===
                    button.dataset.importId
                );

              if (item) {
                openImportReview(
                  item
                );
              }
            }
          );
        }
      );

    document
      .querySelectorAll(
        ".reject-import-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              rejectImport(
                button.dataset.importId
              )
          );
        }
      );
  }


  /* =========================================================
     REVIEW IMPORT BEFORE PUBLICATION
  ========================================================== */

  function openImportReview(item) {
    openModal(`
      <h2>
        Publish imported source
      </h2>

      <p>
        The original source will remain linked.
        The headline and explanation below are
        what NOUS News will publish.
      </p>

      <form
        id="publishImportForm"
        style="
          display:grid;
          gap:13px;
          margin-top:18px;
        "
      >

        <input
          id="reviewHeadline"
          type="text"
          maxlength="180"
          required
          placeholder="NOUS News headline"
          value="${escapeAttribute(
            item.source_title ||
            ""
          )}"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >

        <textarea
          id="reviewBody"
          rows="6"
          maxlength="3000"
          required
          placeholder="Why are we sharing this?"
          style="
            resize:vertical;
            padding:13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:rgba(255,255,255,.03);
            color:white;
          "
        >${escapeHTML(
          item.editor_note ||
          ""
        )}</textarea>

        <select
          id="reviewCategory"
          style="
            min-height:46px;
            padding:0 13px;
            border:1px solid var(--border);
            border-radius:12px;
            background:#07101c;
            color:white;
          "
        >
          ${categoryOptions(
            item.category
          )}
        </select>

        <p
          id="publishImportMessage"
          style="
            min-height:18px;
            margin:0;
            color:var(--muted);
            font-size:.72rem;
          "
        ></p>

        <div
          style="
            display:flex;
            gap:9px;
            justify-content:flex-end;
          "
        >

          <button
            class="modal-button"
            id="backToImportDesk"
            type="button"
          >
            Back
          </button>

          <button
            class="modal-button"
            type="submit"
          >
            Publish
          </button>

        </div>

      </form>
    `);

    document
      .getElementById(
        "backToImportDesk"
      )
      ?.addEventListener(
        "click",
        openImportDesk
      );

    document
      .getElementById(
        "publishImportForm"
      )
      ?.addEventListener(
        "submit",
        (event) =>
          publishImport(
            event,
            item
          )
      );
  }


  async function publishImport(
    event,
    item
  ) {
    event.preventDefault();

    if (
      !client ||
      !state.user ||
      !state.isPublisher
    ) {
      return;
    }

    const headline =
      document
        .getElementById(
          "reviewHeadline"
        )
        ?.value
        .trim() ||
      "";

    const body =
      document
        .getElementById(
          "reviewBody"
        )
        ?.value
        .trim() ||
      "";

    const category =
      document
        .getElementById(
          "reviewCategory"
        )
        ?.value ||
      item.category ||
      "general";

    const message =
      document.getElementById(
        "publishImportMessage"
      );

    if (
      !headline ||
      !body
    ) {
      if (message) {
        message.textContent =
          "Headline and explanation are required.";
      }

      return;
    }

    if (message) {
      message.textContent =
        "Publishing...";
    }

    try {
      const {
        data,
        error,
      } =
        await client
          .from(
            "nous_news_posts"
          )
          .insert({
            user_id:
              state.user.id,

            headline,
            body,
            category,

            source_url:
              item.source_url,

            source_platform:
              item.source_platform,

            source_account:
              item.source_account,

            source_title:
              item.source_title,

            source_caption:
              item.source_caption,

            source_preview_image:
              item.source_preview_image,

            imported_at:
              new Date()
                .toISOString(),

            status:
              "published",
          })
          .select("id")
          .single();

      if (error) {
        throw error;
      }

      const {
        error: updateError,
      } =
        await client
          .from(
            "nous_news_imports"
          )
          .update({
            status:
              "published",

            published_post_id:
              data.id,

            reviewed_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            item.id
          );

      if (updateError) {
        console.error(
          "[NOUS NEWS] Import status update failed:",
          updateError
        );
      }

      closeModal();

      await loadPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Imported publication failed:",
        error
      );

      if (message) {
        message.textContent =
          error?.message ||
          "This source could not be published.";
      }
    }
  }


  async function rejectImport(
    importId
  ) {
    if (
      !client ||
      !state.isPublisher
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Reject this source?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } =
        await client
          .from(
            "nous_news_imports"
          )
          .update({
            status:
              "rejected",

            reviewed_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            importId
          );

      if (error) {
        throw error;
      }

      await openImportDesk();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Reject import failed:",
        error
      );
    }
  }


  /* =========================================================
     LIKES
  ========================================================== */

  async function toggleLike(
    postId
  ) {
    if (!client) {
      return;
    }

    if (!state.user) {
      openSignInModal(
        "Sign in to like this update."
      );

      return;
    }

    const post =
      state.posts.find(
        (candidate) =>
          candidate.id === postId
      );

    if (!post) {
      return;
    }

    try {
      if (
        post.currentUserLiked
      ) {
        const {
          error,
        } =
          await client
            .from(
              "nous_news_reactions"
            )
            .delete()
            .eq(
              "post_id",
              postId
            )
            .eq(
              "user_id",
              state.user.id
            )
            .eq(
              "reaction_type",
              "like"
            );

        if (error) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await client
            .from(
              "nous_news_reactions"
            )
            .insert({
              post_id:
                postId,

              user_id:
                state.user.id,

              reaction_type:
                "like",
            });

        if (error) {
          throw error;
        }
      }

      await loadPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Like failed:",
        error
      );
    }
  }


  /* =========================================================
     COMMENTS
  ========================================================== */

  async function openDiscussion(
    postId
  ) {
    if (!client) {
      return;
    }

    state.activePostId =
      postId;

    openModal(`
      <h2>
        Discussion
      </h2>

      <p>
        Loading discussion...
      </p>
    `);

    try {
      const {
        data,
        error,
      } =
        await client
          .from(
            "nous_news_comments"
          )
          .select(`
            id,
            post_id,
            user_id,
            parent_comment_id,
            body,
            created_at,
            updated_at
          `)
          .eq(
            "post_id",
            postId
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (error) {
        throw error;
      }

      state.comments =
        data || [];

      renderDiscussion();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Discussion failed:",
        error
      );

      openModal(`
        <h2>
          Discussion unavailable
        </h2>

        <p>
          ${escapeHTML(
            error?.message ||
            "Comments could not be loaded."
          )}
        </p>

        <button
          class="modal-button"
          id="closeDiscussionError"
          type="button"
        >
          Close
        </button>
      `);

      document
        .getElementById(
          "closeDiscussionError"
        )
        ?.addEventListener(
          "click",
          closeModal
        );
    }
  }


  function renderDiscussion() {
    const discussion =
      state.comments.length
        ? state.comments
            .map(
              (comment) => `
                <article
                  style="
                    padding:13px 0;
                    border-bottom:1px solid var(--border);
                  "
                >

                  <strong
                    style="
                      display:block;
                      font-size:.7rem;
                    "
                  >
                    NOUS Member
                  </strong>

                  <p
                    style="
                      margin:7px 0 0;
                    "
                  >
                    ${escapeHTML(
                      comment.body
                    )}
                  </p>

                  <span
                    style="
                      display:block;
                      margin-top:7px;
                      color:var(--faint);
                      font-size:.6rem;
                    "
                  >
                    ${escapeHTML(
                      formatTime(
                        comment.created_at
                      )
                    )}
                  </span>

                </article>
              `
            )
            .join("")
        : `
          <p>
            No discussion yet.
          </p>
        `;

    openModal(`
      <h2>
        Discussion
      </h2>

      <div
        style="
          margin-top:16px;
        "
      >
        ${discussion}
      </div>

      ${
        state.user
          ? `
            <form
              id="discussionForm"
              style="
                display:grid;
                gap:10px;
                margin-top:18px;
              "
            >

              <textarea
                id="discussionBody"
                rows="4"
                maxlength="1500"
                required
                placeholder="Join the discussion..."
                style="
                  resize:vertical;
                  padding:12px;
                  border:1px solid var(--border);
                  border-radius:12px;
                  background:rgba(255,255,255,.03);
                  color:white;
                "
              ></textarea>

              <button
                class="modal-button"
                type="submit"
              >
                Comment
              </button>

            </form>
          `
          : `
            <button
              class="modal-button"
              id="discussionSignIn"
              type="button"
              style="
                margin-top:18px;
              "
            >
              Sign in to participate
            </button>
          `
      }

      <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-top:18px;
        "
      >
        <button
          class="modal-button"
          id="closeDiscussion"
          type="button"
        >
          Close
        </button>
      </div>
    `);

    document
      .getElementById(
        "closeDiscussion"
      )
      ?.addEventListener(
        "click",
        closeModal
      );

    document
      .getElementById(
        "discussionSignIn"
      )
      ?.addEventListener(
        "click",
        () => {
          closeModal();

          openSignInModal(
            "Sign in to join this discussion."
          );
        }
      );

    document
      .getElementById(
        "discussionForm"
      )
      ?.addEventListener(
        "submit",
        submitComment
      );
  }


  async function submitComment(
    event
  ) {
    event.preventDefault();

    if (
      !client ||
      !state.user ||
      !state.activePostId
    ) {
      return;
    }

    const body =
      document
        .getElementById(
          "discussionBody"
        )
        ?.value
        .trim() ||
      "";

    if (!body) {
      return;
    }

    try {
      const {
        error,
      } =
        await client
          .from(
            "nous_news_comments"
          )
          .insert({
            post_id:
              state.activePostId,

            user_id:
              state.user.id,

            body,
          });

      if (error) {
        throw error;
      }

      await openDiscussion(
        state.activePostId
      );

      await loadPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Comment failed:",
        error
      );
    }
  }


  /* =========================================================
     MANAGE OWN POST
  ========================================================== */

  function openManagePost(
    postId
  ) {
    const post =
      state.posts.find(
        (candidate) =>
          candidate.id === postId
      );

    if (
      !post ||
      !state.user ||
      post.user_id !==
        state.user.id ||
      !state.isPublisher
    ) {
      return;
    }

    openModal(`
      <h2>
        Manage post
      </h2>

      <p>
        Edit or remove this NOUS News post.
      </p>

      <div
        style="
          display:grid;
          gap:10px;
          margin-top:20px;
        "
      >

        <button
          class="modal-button"
          id="editManagedPost"
          type="button"
        >
          Edit
        </button>

        <button
          class="modal-button"
          id="deleteManagedPost"
          type="button"
        >
          Delete
        </button>

        <button
          class="modal-button"
          id="closeManagedPost"
          type="button"
        >
          Cancel
        </button>

      </div>
    `);

    document
      .getElementById(
        "editManagedPost"
      )
      ?.addEventListener(
        "click",
        () =>
          openOriginalComposer(
            post
          )
      );

    document
      .getElementById(
        "deleteManagedPost"
      )
      ?.addEventListener(
        "click",
        () =>
          deletePost(
            post.id
          )
      );

    document
      .getElementById(
        "closeManagedPost"
      )
      ?.addEventListener(
        "click",
        closeModal
      );
  }


  async function deletePost(
    postId
  ) {
    if (
      !client ||
      !state.user ||
      !state.isPublisher
    ) {
      return;
    }

    const post =
      state.posts.find(
        (candidate) =>
          candidate.id === postId
      );

    if (!post) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this NOUS News post?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } =
        await client
          .from(
            "nous_news_posts"
          )
          .delete()
          .eq(
            "id",
            postId
          )
          .eq(
            "user_id",
            state.user.id
          );

      if (error) {
        throw error;
      }

      /*
       * Delete the uploaded Storage image only
       * after the database post has been removed.
       */

      if (post.image_url) {
        await removeNewsImageByUrl(
          post.image_url
        );
      }

      closeModal();

      await loadPosts();
    } catch (error) {
      console.error(
        "[NOUS NEWS] Delete failed:",
        error
      );
    }
  }


  /* =========================================================
     ASK NOUS
  ========================================================== */

  function askNous(
    postId
  ) {
    const post =
      state.posts.find(
        (candidate) =>
          candidate.id === postId
      );

    if (!post) {
      return;
    }

    const context = {
      title:
        post.headline ||
        post.source_title ||
        "NOUS News",

      category:
        post.category,

      summary:
        post.body,

      source:
        post.source_platform
          ? `NOUS News · ${sourcePlatformLabel(
              post.source_platform
            )}`
          : "NOUS News",

      url:
        post.source_url ||
        location.href,

      metadata: {
        postId:
          post.id,

        sourcePlatform:
          post.source_platform ||
          null,

        sourceAccount:
          post.source_account ||
          null,
      },
    };

    sessionStorage.setItem(
      "nous_news_context",
      JSON.stringify(
        context
      )
    );

    sessionStorage.setItem(
      "nous_pending_message",
      `Help me understand this NOUS News update: ${
        post.headline ||
        truncate(
          post.body,
          120
        )
      }`
    );

    window.location.href =
      NOUS_COMPANION_URL;
  }


  /* =========================================================
     SHARE
  ========================================================== */

  async function sharePost(
    postId
  ) {
    const post =
      state.posts.find(
        (candidate) =>
          candidate.id === postId
      );

    if (!post) {
      return;
    }

    const title =
      post.headline ||
      "NOUS News";

    const text =
      `${title}\n\n${post.body}`;

    const url =
      post.source_url ||
      window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });

        return;
      }

      await navigator.clipboard
        .writeText(
          `${text}\n\n${url}`
        );

      openSuccessMessage(
        "Copied",
        "The post has been copied to your clipboard."
      );
    } catch (error) {
      console.warn(
        "[NOUS NEWS] Share cancelled:",
        error
      );
    }
  }


  /* =========================================================
     SIGN-IN
  ========================================================== */

  function openSignInModal(
    message
  ) {
    openModal(`
      <h2>
        Join NOUS News
      </h2>

      <p>
        ${escapeHTML(
          message
        )}
      </p>

      <p>
        You can read publicly.
        A NOUS account is required for likes and discussions.
      </p>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:9px;
          flex-wrap:wrap;
          margin-top:20px;
        "
      >

        <a
          class="modal-button"
          href="login.html?returnTo=${encodeURIComponent(
            "/nous-news.html"
          )}"
        >
          Sign in
        </a>

        <a
          class="modal-button"
          href="signup.html?returnTo=${encodeURIComponent(
            "/nous-news.html"
          )}"
        >
          Create account
        </a>

        <button
          class="modal-button"
          id="cancelSignIn"
          type="button"
        >
          Cancel
        </button>

      </div>
    `);

    document
      .getElementById(
        "cancelSignIn"
      )
      ?.addEventListener(
        "click",
        closeModal
      );
  }


  /* =========================================================
     SUCCESS
  ========================================================== */

  function openSuccessMessage(
    title,
    message
  ) {
    openModal(`
      <h2>
        ${escapeHTML(
          title
        )}
      </h2>

      <p>
        ${escapeHTML(
          message
        )}
      </p>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-top:20px;
        "
      >

        <button
          class="modal-button"
          id="closeSuccess"
          type="button"
        >
          Done
        </button>

      </div>
    `);

    document
      .getElementById(
        "closeSuccess"
      )
      ?.addEventListener(
        "click",
        closeModal
      );
  }


  /* =========================================================
     BIND POST EVENTS
  ========================================================== */

  function bindPostEvents() {
    document
      .querySelectorAll(
        ".like-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              toggleLike(
                button.dataset.postId
              )
          );
        }
      );

    document
      .querySelectorAll(
        ".comment-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              openDiscussion(
                button.dataset.postId
              )
          );
        }
      );

    document
      .querySelectorAll(
        ".ask-nous-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              askNous(
                button.dataset.postId
              )
          );
        }
      );

    document
      .querySelectorAll(
        ".share-post-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              sharePost(
                button.dataset.postId
              )
          );
        }
      );

    document
      .querySelectorAll(
        ".manage-post-button"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              openManagePost(
                button.dataset.postId
              )
          );
        }
      );
  }


  /* =========================================================
     INITIALISE
  ========================================================== */

  async function initialise() {
    initialiseNavigation();
    initialiseSearch();
    initialisePublishButtons();

    if (!client) {
      console.error(
        "[NOUS NEWS] window.NOUS_SUPABASE was not found."
      );

      updateIdentityUI();

      renderError(
        "NOUS News could not connect to its data service."
      );

      return;
    }

    await loadAuthentication();

    initialiseAuthListener();

    await loadPosts();
  }


  initialise();

})();