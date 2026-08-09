console.log(
  "[NOUS FILE] app/js/personal-nous.js loaded"
);


(() => {
  "use strict";


  /* =========================================================
     STATE
  ========================================================= */

  const state = {

    user:
      null,

    conversationId:
      null,

    messages:
      [],

    busy:
      false,

    access:
      null

  };


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const form =
    document.getElementById(
      "nous-chat-form"
    );


  const input =
    document.getElementById(
      "nous-chat-input"
    );


  const sendButton =
    document.getElementById(
      "nous-chat-send"
    );


  const messageList =
    document.getElementById(
      "nous-message-list"
    );


  const conversation =
    document.getElementById(
      "nous-chat-conversation"
    );


  const welcome =
    document.querySelector(
      ".nous-chat-welcome"
    );


  const caption =
    document.querySelector(
      ".nous-chat-caption"
    );


  /* =========================================================
     HELPERS
  ========================================================= */

  function scrollToBottom() {

    if (!conversation) {
      return;
    }


    requestAnimationFrame(
      () => {

        conversation.scrollTo({
          top:
            conversation.scrollHeight,

          behavior:
            "smooth"
        });

      }
    );
  }


  function resizeInput() {

    if (!input) {
      return;
    }


    input.style.height =
      "auto";


    input.style.height =
      `${Math.min(
        input.scrollHeight,
        180
      )}px`;
  }


  function setBusy(
    value
  ) {

    state.busy =
      value;


    if (sendButton) {

      sendButton.disabled =
        value;


      sendButton.setAttribute(
        "aria-busy",
        String(
          value
        )
      );
    }


    /*
     * Keep the text box enabled while NOUS is thinking.
     *
     * This feels more natural in a chatroom.
     * The send function itself prevents duplicate sends.
     */

    if (input) {

      input.setAttribute(
        "aria-busy",
        String(
          value
        )
      );
    }
  }


  function updateUsageCaption() {

    if (!caption) {
      return;
    }


    const access =
      state.access;


    if (
      !access ||
      typeof access.remainingToday !==
        "number"
    ) {

      caption.textContent =
        "Your conversation with NOUS is private to your authenticated Personal space.";

      return;
    }


    caption.textContent =
      `${access.remainingToday} NOUS ${
        access.remainingToday === 1
          ? "message"
          : "messages"
      } remaining today · ${access.planCode || "NOUS"} membership`;
  }


  /* =========================================================
     MESSAGE ELEMENTS
  ========================================================= */

  function createMessageElement(
    role,
    content
  ) {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      `nous-message nous-message-${role}`;


    const body =
      document.createElement(
        "div"
      );


    body.className =
      "nous-message-body";


    body.textContent =
      content;


    article.appendChild(
      body
    );


    return article;
  }


  function addMessage(
    role,
    content
  ) {

    if (
      !messageList ||
      !content
    ) {
      return null;
    }


    const message = {

      role,

      content,

      createdAt:
        new Date()
          .toISOString()

    };


    state.messages.push(
      message
    );


    const element =
      createMessageElement(
        role,
        content
      );


    messageList.appendChild(
      element
    );


    if (
      welcome &&
      state.messages.length >
        0
    ) {

      welcome.classList.add(
        "is-condensed"
      );
    }


    scrollToBottom();


    return element;
  }


  /* =========================================================
     THINKING
  ========================================================= */

  function addThinkingMessage() {

    if (!messageList) {
      return null;
    }


    const article =
      document.createElement(
        "article"
      );


    article.className =
      [
        "nous-message",
        "nous-message-assistant",
        "nous-message-thinking"
      ].join(
        " "
      );


    article.setAttribute(
      "aria-label",
      "NOUS is thinking"
    );


    article.innerHTML = `
      <div class="nous-message-body">

        <span class="nous-thinking-dot"></span>

        <span class="nous-thinking-dot"></span>

        <span class="nous-thinking-dot"></span>

      </div>
    `;


    messageList.appendChild(
      article
    );


    scrollToBottom();


    return article;
  }


  /* =========================================================
     AUTHENTICATED USER
  ========================================================= */

  async function loadCurrentUser() {

    const client =
      window.NOUS_SUPABASE;


    if (!client) {

      throw new Error(
        "NOUS could not connect to your account."
      );
    }


    const {
      data: {
        session
      },

      error
    } =
      await client.auth
        .getSession();


    if (error) {
      throw error;
    }


    if (
      !session?.user
    ) {

      throw new Error(
        "Please sign in to talk with NOUS."
      );
    }


    state.user =
      session.user;


    return session;
  }


  /* =========================================================
     PERSONAL CONTEXT
  ========================================================= */

  function buildPersonalContext() {

    return {

      title:
        "NOUS Personal Companion",

      url:
        window.location.href,

      space:
        "personal"

    };
  }


  /* =========================================================
     LIVE NOUS COMPANION
  ========================================================= */

  async function requestNousResponse(
    userMessage
  ) {

    const client =
      window.NOUS_SUPABASE;


    if (!client) {

      throw new Error(
        "NOUS is unavailable right now."
      );
    }


    /*
     * Your deployed nous-companion Edge Function accepts:
     *
     * {
     *   message,
     *   mode,
     *   context,
     *   conversationId
     * }
     */


    const payload = {

      message:
        userMessage,

      mode:
        "personal",

      context:
        buildPersonalContext()

    };


    /*
     * After the first message, the Edge Function
     * gives us a conversationId.
     *
     * Every following message is assigned to that
     * same NOUS conversation.
     */

    if (
      state.conversationId
    ) {

      payload.conversationId =
        state.conversationId;
    }


    console.log(
      "[NOUS PERSONAL CHAT] Sending",
      {
        mode:
          payload.mode,

        conversationId:
          state.conversationId,

        messageLength:
          userMessage.length
      }
    );


    const {
      data,
      error
    } =
      await client.functions.invoke(
        "nous-companion",
        {
          body:
            payload
        }
      );


    /*
     * functions.invoke can return an error for
     * non-2xx responses.
     */

    if (error) {

      console.error(
        "[NOUS COMPANION INVOKE ERROR]",
        error
      );


      /*
       * Supabase sometimes exposes response data
       * differently depending on the HTTP error.
       */

      let message =
        error.message ||
        "NOUS could not complete that response.";


      try {

        if (
          error.context &&
          typeof error.context.json ===
            "function"
        ) {

          const details =
            await error.context.json();


          if (
            details?.error
          ) {

            message =
              details.error;
          }
        }


      } catch (
        parseError
      ) {

        console.warn(
          "[NOUS PERSONAL CHAT] Could not read function error response.",
          parseError
        );

      }


      throw new Error(
        message
      );
    }


    if (!data) {

      throw new Error(
        "NOUS returned an empty response."
      );
    }


    if (
      data.error
    ) {

      const responseError =
        new Error(
          data.error
        );


      responseError.code =
        data.code;


      responseError.upgradeRequired =
        Boolean(
          data.upgradeRequired
        );


      throw responseError;
    }


    if (
      !data.answer
    ) {

      throw new Error(
        "NOUS did not return an answer."
      );
    }


    /*
     * Save the conversation returned by the
     * server for following messages.
     */

    if (
      data.conversationId
    ) {

      state.conversationId =
        data.conversationId;
    }


    /*
     * Membership / usage information.
     */

    if (
      data.access
    ) {

      state.access =
        data.access;


      updateUsageCaption();
    }


    console.log(
      "[NOUS PERSONAL CHAT] Response received",
      {
        mode:
          data.mode,

        conversationId:
          data.conversationId,

        remainingToday:
          data.access
            ?.remainingToday
      }
    );


    return data.answer;
  }


  /* =========================================================
     SEND
  ========================================================= */

  async function sendMessage() {

    if (
      !input ||
      state.busy
    ) {
      return;
    }


    const userMessage =
      input.value
        .trim();


    if (!userMessage) {
      return;
    }


    if (
      userMessage.length >
      2000
    ) {

      addMessage(
        "assistant",
        "That message is longer than the current 2,000-character NOUS limit. Please shorten it slightly."
      );


      return;
    }


    /*
     * Show user's message immediately.
     */

    addMessage(
      "user",
      userMessage
    );


    input.value =
      "";


    resizeInput();


    setBusy(
      true
    );


    const thinking =
      addThinkingMessage();


    try {

      const answer =
        await requestNousResponse(
          userMessage
        );


      thinking?.remove();


      addMessage(
        "assistant",
        answer
      );


    } catch (error) {

      thinking?.remove();


      console.error(
        "[NOUS PERSONAL CHAT ERROR]",
        error
      );


      let message =
        error?.message ||
        "NOUS could not complete that response.";


      /*
       * Friendly handling for the server-side
       * membership allowance.
       */

      if (
        error?.code ===
        "USAGE_LIMIT_REACHED"
      ) {

        message =
          "You’ve reached today’s NOUS allowance for your current membership. You can continue when your allowance resets or review your membership.";
      }


      if (
        error?.code ===
        "AUTH_REQUIRED"
      ) {

        message =
          "Please sign in to continue your conversation with NOUS.";
      }


      addMessage(
        "assistant",
        message
      );


    } finally {

      setBusy(
        false
      );


      input?.focus();

    }
  }


  /* =========================================================
     EVENTS
  ========================================================= */

  form?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      sendMessage();

    }
  );


  input?.addEventListener(
    "input",
    resizeInput
  );


  input?.addEventListener(
    "keydown",
    (event) => {

      /*
       * Enter sends.
       *
       * Shift + Enter creates a new line.
       */

      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        sendMessage();
      }

    }
  );


  /* =========================================================
     INITIALISE
  ========================================================= */

  async function initialiseChat() {

    try {

      await loadCurrentUser();


      resizeInput();


      updateUsageCaption();


      input?.focus();


      console.info(
        "[NOUS PERSONAL CHAT] Live Companion ready.",
        {
          userId:
            state.user?.id
        }
      );


    } catch (error) {

      console.error(
        "[NOUS PERSONAL CHAT INIT ERROR]",
        error
      );


      if (input) {

        input.disabled =
          true;


        input.placeholder =
          "Sign in to talk with NOUS";
      }


      if (
        sendButton
      ) {

        sendButton.disabled =
          true;
      }


      addMessage(
        "assistant",
        error?.message ||
        "NOUS could not verify your account."
      );

    }
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialiseChat,
      {
        once: true
      }
    );


  } else {

    initialiseChat();

  }

})();