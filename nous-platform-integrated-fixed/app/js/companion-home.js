(() => {
  const form = document.getElementById("nous-command-form");
  const input = document.getElementById("nous-command-input");
  const submitButton = document.getElementById("nous-command-submit");
  const buttonLabel = document.getElementById(
    "nous-command-button-label"
  );
  const output = document.getElementById("nous-companion-output");
  const responseElement = document.getElementById(
    "nous-companion-response"
  );
  const statusElement = document.getElementById(
    "nous-command-status"
  );

  if (
    !form ||
    !input ||
    !submitButton ||
    !responseElement ||
    !output
  ) {
    console.warn("NOUS Companion homepage elements were not found.");
    return;
  }


  function setStatus(message = "", isError = false) {
    statusElement.textContent = message;
    statusElement.classList.toggle("is-error", isError);
  }

  function setResponse(message) {
    responseElement.textContent = message;
    output.hidden = false;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    input.disabled = isLoading;

    buttonLabel.textContent = isLoading
      ? "Thinking"
      : "Send";
  }

  function resizeInput() {
    input.style.height = "auto";

    input.style.height = `${Math.min(
      input.scrollHeight,
      180
    )}px`;
  }

  function isGreeting(message) {
    return /^(hello|hi|hey|howzit|good morning|good afternoon|good evening)[.!?\s]*$/i
      .test(message.trim());
  }

  function createGreeting(user) {
    const name =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "";

    const hour = new Date().getHours();

    let greeting = "Hello";

    if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 18) {
      greeting = "Good afternoon";
    } else {
      greeting = "Good evening";
    }

    return name
      ? `${greeting}, ${name}. What would you like to work on today?`
      : `${greeting}. What would you like to work on today?`;
  }

  function extractAssistantText(data) {
    const possibleValues = [
      data?.response,
      data?.reply,
      data?.message,
      data?.answer,
      data?.content,
      data?.output,
      data?.result?.response,
      data?.result?.message,
      data?.result?.content
    ];

    const response = possibleValues.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    );

    return response?.trim() || null;
  }

  async function getSession() {
    const supabase = window.NOUS_SUPABASE;

    if (!supabase) {
      throw new Error(
        "The NOUS Supabase client is unavailable."
      );
    }

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    return session;
  }

  async function sendToCompanion(message, session) {
    const supabase = window.NOUS_SUPABASE;
    if (!supabase) throw new Error("The NOUS Supabase client is unavailable.");

    const { data, error } =
      await supabase.functions.invoke(
        "nous-companion",
        {
          body: {
            message,
            space: "home",
            source: "nous_homepage"
          },
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

    if (error) {
      throw error;
    }

    const assistantText = extractAssistantText(data);

    if (!assistantText) {
      console.log(
        "Unexpected NOUS Companion response:",
        data
      );

      throw new Error(
        "NOUS responded, but no readable answer was returned."
      );
    }

    return assistantText;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const message = input.value.trim();

    if (!message) {
      setStatus(
        "Enter a message before sending.",
        true
      );

      input.focus();
      return;
    }

    setLoading(true);
    setStatus("NOUS is considering your request...");
    output.hidden = true;

    try {
      const session = await getSession();

      /*
       * Greetings do not need tokens, search or ORULE routing.
       * They can be handled locally and immediately.
       */
      if (isGreeting(message)) {
        setResponse(createGreeting(session.user));
        setStatus("Companion is ready.");

        input.value = "";
        resizeInput();
        return;
      }

      const assistantResponse =
        await sendToCompanion(message, session);

      setResponse(assistantResponse);
      setStatus("Response complete.");

      input.value = "";
      resizeInput();
    } catch (error) {
      console.error(
        "NOUS Companion request failed:",
        error
      );

      setResponse(
        "I could not complete that request right now."
      );

      setStatus(
        error?.message ||
          "The NOUS Companion service could not be reached.",
        true
      );
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  input.addEventListener("input", resizeInput);

  input.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", handleSubmit);

  resizeInput();
})();