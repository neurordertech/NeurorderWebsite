document.addEventListener("DOMContentLoaded", async () => {

  const accountLoading =
    document.getElementById("accountLoading");

  const accountRequired =
    document.getElementById("accountRequired");

  const accountConfirmed =
    document.getElementById("accountConfirmed");

  const accountEmail =
    document.getElementById("accountEmail");

  const profileForm =
    document.getElementById("financialProfileForm");

  const profileMessage =
    document.getElementById("profileMessage");

  const saveProfileBtn =
    document.getElementById("saveProfileBtn");


  function showSignedOutState() {

    accountLoading.hidden = true;
    accountRequired.hidden = false;
    accountConfirmed.hidden = true;
    profileForm.hidden = true;

  }


  function showSignedInState(user) {

    accountLoading.hidden = true;
    accountRequired.hidden = true;
    accountConfirmed.hidden = false;
    profileForm.hidden = false;

    accountEmail.textContent =
      user.email
        ? `Signed in as ${user.email}`
        : "Your Financial Story is connected securely.";

  }


  /*
   * Confirm that the required HTML exists.
   */

  if (
    !accountLoading ||
    !accountRequired ||
    !accountConfirmed ||
    !profileForm
  ) {

    console.error(
      "Financial Story account elements are missing from credit-scoring.html."
    );

    return;

  }


  /*
   * Confirm that Supabase loaded.
   */

  if (typeof supabaseClient === "undefined") {

    console.error(
      "supabaseClient is not available. Check js/supabase.js."
    );

    accountLoading.hidden = true;
    accountRequired.hidden = false;

    accountRequired.querySelector("h3").textContent =
      "The secure Neurorder connection could not be loaded.";

    return;

  }


  /*
   * Check the current Supabase user.
   */

  let currentUser = null;

  try {

    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {

      showSignedOutState();
      return;

    }

    currentUser = user;

    showSignedInState(user);

    await loadExistingProfile();

  } catch (error) {

    console.error(
      "Supabase authentication check failed:",
      error
    );

    showSignedOutState();

  }


  /*
   * Load an existing financial profile.
   */

  async function loadExistingProfile() {

    const { data, error } = await supabaseClient
      .from("financial_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {

      console.error(
        "Could not load financial profile:",
        error
      );

      profileMessage.textContent =
        "Your account is verified, but your saved profile could not be loaded.";

      profileMessage.className =
        "form-message error";

      return;

    }

    if (!data) {

      profileMessage.textContent =
        "No financial profile has been created yet.";

      profileMessage.className =
        "form-message info";

      return;

    }

    document.getElementById("displayName").value =
      data.display_name || "";

    document.getElementById("profileType").value =
      data.profile_type || "";

    document.getElementById("businessName").value =
      data.business_name || "";

    document.getElementById("businessType").value =
      data.business_type || "";

    document.getElementById("province").value =
      data.province || "";

    saveProfileBtn.textContent =
      "Update Financial Profile";

    profileMessage.textContent =
      "Your saved financial profile has been loaded.";

    profileMessage.className =
      "form-message success";

  }


  /*
   * Save or update the financial profile.
   */

  profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) {

      showSignedOutState();
      return;

    }

    const consentFinancialProfile =
      document.getElementById(
        "consentFinancialProfile"
      ).checked;

    const consentDataProcessing =
      document.getElementById(
        "consentDataProcessing"
      ).checked;

    const consentResearch =
      document.getElementById(
        "consentResearch"
      ).checked;

    if (
      !consentFinancialProfile ||
      !consentDataProcessing ||
      !consentResearch
    ) {

      profileMessage.textContent =
        "Please accept the three required consent statements first.";

      profileMessage.className =
        "form-message error";

      document
        .getElementById("consent")
        .scrollIntoView({
          behavior: "smooth"
        });

      return;

    }

    const profileData = {

      user_id: currentUser.id,

      display_name:
        document
          .getElementById("displayName")
          .value
          .trim(),

      profile_type:
        document
          .getElementById("profileType")
          .value,

      business_name:
        document
          .getElementById("businessName")
          .value
          .trim() || null,

      business_type:
        document
          .getElementById("businessType")
          .value
          .trim() || null,

      province:
        document
          .getElementById("province")
          .value,

      profile_status: "submitted"

    };

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    profileMessage.textContent =
      "Creating your financial profile securely...";

    profileMessage.className =
      "form-message info";

    const { error } = await supabaseClient
      .from("financial_profiles")
      .upsert(
        profileData,
        {
          onConflict: "user_id"
        }
      );

    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent =
      "Update Financial Profile";

    if (error) {

      console.error(
        "Financial profile save failed:",
        error
      );

      profileMessage.textContent =
        error.message;

      profileMessage.className =
        "form-message error";

      return;

    }

    profileMessage.textContent =
      "Your financial profile was saved successfully.";

    profileMessage.className =
      "form-message success";

  });

});