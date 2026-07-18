document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error(
            "Supabase client was not found. Check js/supabase.js."
        );

        return;
    }

    const DEFAULT_AVATAR = "assets/logo/nouslogo.png";
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

    const allowedAvatarTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const identityForm =
        document.getElementById("identityForm");

    const profileImageInput =
        document.getElementById("profileImageInput");

    const profileImagePreview =
        document.getElementById("profileImagePreview");

    const sidebarProfileImage =
        document.getElementById("sidebarProfileImage");

    const sidebarAvatarButton =
        document.getElementById("sidebarAvatarButton");

    const removeProfileImageButton =
        document.getElementById("removeProfileImageButton");

    const displayNameInput =
        document.getElementById("displayName");

    const usernameInput =
        document.getElementById("username");

    const firstNameInput =
        document.getElementById("firstName");

    const surnameInput =
        document.getElementById("surname");

    const occupationInput =
        document.getElementById("occupation");

    const organisationInput =
        document.getElementById("organisation");

    const bioInput =
        document.getElementById("bio");

    const sidebarDisplayName =
        document.getElementById("sidebarDisplayName");

    const sidebarUsername =
        document.getElementById("sidebarUsername");

    const currentEmail =
        document.getElementById("currentEmail");

    const emailVerificationStatus =
        document.getElementById("emailVerificationStatus");

    const profileSaveStatus =
        document.getElementById("profileSaveStatus");

    const usernameStatus =
        document.getElementById("usernameStatus");

    const signOutButton =
        document.getElementById("signOutButton");

    const passwordResetButton =
        document.getElementById("passwordResetButton");

    const changeEmailButton =
        document.getElementById("changeEmailButton");

    const navigationButtons =
        document.querySelectorAll(".identity-nav-button[data-section]");

    const panels =
        document.querySelectorAll(".identity-panel[data-panel]");

    const themeCards =
        document.querySelectorAll("[data-theme-choice]");

    const characterCards =
        document.querySelectorAll("[data-character]");

    let currentUser = null;
    let currentProfile = null;
    let selectedAvatarFile = null;
    let avatarShouldBeRemoved = false;

    function setStatus(message, type = "") {
        if (!profileSaveStatus) {
            return;
        }

        profileSaveStatus.textContent = message;
        profileSaveStatus.dataset.status = type;
    }

    function setAvatar(url) {
        const avatarUrl = url || DEFAULT_AVATAR;

        if (profileImagePreview) {
            profileImagePreview.src = avatarUrl;
        }

        if (sidebarProfileImage) {
            sidebarProfileImage.src = avatarUrl;
        }

        document
            .querySelectorAll("[data-user-avatar]")
            .forEach((image) => {
                image.src = avatarUrl;
            });
    }

    function normaliseUsername(value) {
        return value
            .trim()
            .toLowerCase()
            .replace(/^@/, "")
            .replace(/[^a-z0-9._-]/g, "");
    }

    function updateSidebarPreview() {
        const displayName =
            displayNameInput?.value.trim() ||
            currentUser?.email?.split("@")[0] ||
            "Nous User";

        const username =
            normaliseUsername(usernameInput?.value || "") ||
            "user";

        if (sidebarDisplayName) {
            sidebarDisplayName.textContent = displayName;
        }

        if (sidebarUsername) {
            sidebarUsername.textContent = `@${username}`;
        }
    }

    function showPanel(sectionName) {
        navigationButtons.forEach((button) => {
            const isActive =
                button.dataset.section === sectionName;

            button.classList.toggle("active", isActive);
        });

        panels.forEach((panel) => {
            const isActive =
                panel.dataset.panel === sectionName;

            panel.classList.toggle("active", isActive);
            panel.hidden = !isActive;
        });
    }

    async function requireAuthenticatedUser() {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        if (!user) {
            window.location.href = "login.html";
            return null;
        }

        return user;
    }

    async function loadProfile() {
        const {
            data,
            error
        } = await supabaseClient
            .from("user_profiles")
            .select(`
                display_name,
                username,
                first_name,
                surname,
                occupation,
                organisation,
                bio,
                avatar_url,
                appearance_theme,
                companion_character
            `)
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        currentProfile = data;

        if (!data) {
            await createInitialProfile();
            return;
        }

        populateProfile(data);
    }

    async function createInitialProfile() {
        const metadata = currentUser.user_metadata || {};

        const initialDisplayName =
            metadata.display_name ||
            metadata.full_name ||
            currentUser.email?.split("@")[0] ||
            "Nous User";

        const initialProfile = {
            id: currentUser.id,
            display_name: initialDisplayName,
            username: null,
            first_name: metadata.first_name || "",
            surname: metadata.surname || "",
            occupation: "",
            organisation: "",
            bio: "",
            avatar_url: metadata.avatar_url || null,
            appearance_theme: "dark",
            companion_character: "boipelo"
        };

        const {
            data,
            error
        } = await supabaseClient
            .from("user_profiles")
            .insert(initialProfile)
            .select()
            .single();

        if (error) {
            throw error;
        }

        currentProfile = data;
        populateProfile(data);
    }

    function populateProfile(profile) {
        if (displayNameInput) {
            displayNameInput.value =
                profile.display_name || "";
        }

        if (usernameInput) {
            usernameInput.value =
                profile.username || "";
        }

        if (firstNameInput) {
            firstNameInput.value =
                profile.first_name || "";
        }

        if (surnameInput) {
            surnameInput.value =
                profile.surname || "";
        }

        if (occupationInput) {
            occupationInput.value =
                profile.occupation || "";
        }

        if (organisationInput) {
            organisationInput.value =
                profile.organisation || "";
        }

        if (bioInput) {
            bioInput.value =
                profile.bio || "";
        }

        setAvatar(profile.avatar_url);
        updateSidebarPreview();

        applyTheme(profile.appearance_theme || "dark");
        selectCompanionCharacter(
            profile.companion_character || "boipelo"
        );
    }

    function displayAccountEmail() {
        if (currentEmail) {
            currentEmail.textContent =
                currentUser.email || "No email available";
        }

        if (emailVerificationStatus) {
            emailVerificationStatus.textContent =
                currentUser.email_confirmed_at
                    ? "Email verified"
                    : "Email verification required";
        }
    }

    async function checkUsernameAvailability() {
        if (!usernameInput || !usernameStatus) {
            return true;
        }

        const username =
            normaliseUsername(usernameInput.value);

        usernameInput.value = username;

        if (!username) {
            usernameStatus.textContent =
                "This will be used for future Nous messaging.";

            return true;
        }

        if (username.length < 3) {
            usernameStatus.textContent =
                "Username must contain at least 3 characters.";

            return false;
        }

        usernameStatus.textContent =
            "Checking username...";

        const {
            data,
            error
        } = await supabaseClient
            .from("user_profiles")
            .select("id")
            .eq("username", username)
            .neq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error(error);

            usernameStatus.textContent =
                "Could not check the username.";

            return false;
        }

        if (data) {
            usernameStatus.textContent =
                "That username is already being used.";

            return false;
        }

        usernameStatus.textContent =
            "Username is available.";

        return true;
    }

    async function uploadAvatar(file) {
        const extension =
            file.name.split(".").pop()?.toLowerCase() || "webp";

        const filePath =
            `${currentUser.id}/profile.${extension}`;

        const {
            error: uploadError
        } = await supabaseClient
            .storage
            .from("avatars")
            .upload(filePath, file, {
                cacheControl: "3600",
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data
        } = supabaseClient
            .storage
            .from("avatars")
            .getPublicUrl(filePath);

        return `${data.publicUrl}?updated=${Date.now()}`;
    }

    async function removeStoredAvatar() {
        if (!currentProfile?.avatar_url) {
            return;
        }

        const storedPath =
            extractStoragePath(currentProfile.avatar_url);

        if (!storedPath) {
            return;
        }

        const {
            error
        } = await supabaseClient
            .storage
            .from("avatars")
            .remove([storedPath]);

        if (error) {
            console.warn(
                "Avatar database value will be removed, but the stored file could not be deleted:",
                error.message
            );
        }
    }

    function extractStoragePath(publicUrl) {
        try {
            const url = new URL(publicUrl);

            const marker =
                "/storage/v1/object/public/avatars/";

            const markerIndex =
                url.pathname.indexOf(marker);

            if (markerIndex === -1) {
                return null;
            }

            return decodeURIComponent(
                url.pathname.slice(
                    markerIndex + marker.length
                )
            );
        } catch {
            return null;
        }
    }

    async function saveProfile(event) {
        event.preventDefault();

        setStatus("Saving your identity...", "loading");

        const usernameAvailable =
            await checkUsernameAvailability();

        if (!usernameAvailable) {
            setStatus(
                "Please choose another username.",
                "error"
            );

            return;
        }

        try {
            let avatarUrl =
                currentProfile?.avatar_url || null;

            if (avatarShouldBeRemoved) {
                await removeStoredAvatar();
                avatarUrl = null;
            }

            if (selectedAvatarFile) {
                avatarUrl =
                    await uploadAvatar(selectedAvatarFile);
            }

            const profileData = {
                id: currentUser.id,
                display_name:
                    displayNameInput?.value.trim() || null,

                username:
                    normaliseUsername(
                        usernameInput?.value || ""
                    ) || null,

                first_name:
                    firstNameInput?.value.trim() || null,

                surname:
                    surnameInput?.value.trim() || null,

                occupation:
                    occupationInput?.value.trim() || null,

                organisation:
                    organisationInput?.value.trim() || null,

                bio:
                    bioInput?.value.trim() || null,

                avatar_url: avatarUrl
            };

            const {
                data,
                error
            } = await supabaseClient
                .from("user_profiles")
                .upsert(profileData, {
                    onConflict: "id"
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            await supabaseClient.auth.updateUser({
                data: {
                    display_name:
                        profileData.display_name,

                    username:
                        profileData.username,

                    avatar_url:
                        profileData.avatar_url
                }
            });

            currentProfile = data;
            selectedAvatarFile = null;
            avatarShouldBeRemoved = false;

            setAvatar(data.avatar_url);
            updateSidebarPreview();

            localStorage.setItem(
                "nous-profile-updated",
                String(Date.now())
            );

            window.dispatchEvent(
                new CustomEvent("nous-profile-updated", {
                    detail: data
                })
            );

            setStatus(
                "Identity saved successfully.",
                "success"
            );
        } catch (error) {
            console.error(error);

            setStatus(
                error.message ||
                    "Nous could not save your identity.",
                "error"
            );
        }
    }

    function handleAvatarSelection(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!allowedAvatarTypes.includes(file.type)) {
            setStatus(
                "Choose a PNG, JPEG or WebP image.",
                "error"
            );

            profileImageInput.value = "";
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setStatus(
                "The profile picture must be smaller than 5 MB.",
                "error"
            );

            profileImageInput.value = "";
            return;
        }

        selectedAvatarFile = file;
        avatarShouldBeRemoved = false;

        const temporaryUrl =
            URL.createObjectURL(file);

        setAvatar(temporaryUrl);

        setStatus(
            'Image selected. Press "Save identity" to upload it.',
            "success"
        );
    }

    function handleAvatarRemoval() {
        selectedAvatarFile = null;
        avatarShouldBeRemoved = true;

        if (profileImageInput) {
            profileImageInput.value = "";
        }

        setAvatar(DEFAULT_AVATAR);

        setStatus(
            'Profile picture marked for removal. Press "Save identity".',
            "success"
        );
    }

    function applyTheme(theme) {
        const validThemes = [
            "dark",
            "light",
            "system"
        ];

        const selectedTheme =
            validThemes.includes(theme)
                ? theme
                : "dark";

        let activeTheme = selectedTheme;

        if (selectedTheme === "system") {
            activeTheme =
                window.matchMedia(
                    "(prefers-color-scheme: light)"
                ).matches
                    ? "light"
                    : "dark";
        }

        document.body.dataset.theme = activeTheme;

        localStorage.setItem(
            "nous-theme",
            selectedTheme
        );

        themeCards.forEach((card) => {
            card.classList.toggle(
                "active",
                card.dataset.themeChoice === selectedTheme
            );
        });
    }

    async function saveTheme(theme) {
        applyTheme(theme);

        const {
            error
        } = await supabaseClient
            .from("user_profiles")
            .update({
                appearance_theme: theme
            })
            .eq("id", currentUser.id);

        if (error) {
            console.error(error);
        }
    }

    function selectCompanionCharacter(character) {
        characterCards.forEach((card) => {
            card.classList.toggle(
                "active",
                card.dataset.character === character
            );
        });
    }

    async function saveCompanionCharacter(character) {
        selectCompanionCharacter(character);

        const {
            error
        } = await supabaseClient
            .from("user_profiles")
            .update({
                companion_character: character
            })
            .eq("id", currentUser.id);

        if (error) {
            console.error(error);
        }
    }

    async function resetPassword() {
        if (!currentUser?.email) {
            return;
        }

        const {
            error
        } = await supabaseClient.auth.resetPasswordForEmail(
            currentUser.email,
            {
                redirectTo:
                    `${window.location.origin}/reset-password.html`
            }
        );

        if (error) {
            window.alert(error.message);
            return;
        }

        window.alert(
            "Nous sent a password reset link to your email."
        );
    }

    async function signOut() {
        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {
            window.alert(error.message);
            return;
        }

        window.location.href = "login.html";
    }

    navigationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            showPanel(button.dataset.section);
        });
    });

    themeCards.forEach((card) => {
        card.addEventListener("click", () => {
            saveTheme(card.dataset.themeChoice);
        });
    });

    characterCards.forEach((card) => {
        card.addEventListener("click", () => {
            saveCompanionCharacter(
                card.dataset.character
            );
        });
    });

    if (identityForm) {
        identityForm.addEventListener(
            "submit",
            saveProfile
        );
    }

    if (profileImageInput) {
        profileImageInput.addEventListener(
            "change",
            handleAvatarSelection
        );
    }

    if (sidebarAvatarButton && profileImageInput) {
        sidebarAvatarButton.addEventListener(
            "click",
            () => profileImageInput.click()
        );
    }

    if (removeProfileImageButton) {
        removeProfileImageButton.addEventListener(
            "click",
            handleAvatarRemoval
        );
    }

    if (displayNameInput) {
        displayNameInput.addEventListener(
            "input",
            updateSidebarPreview
        );
    }

    if (usernameInput) {
        usernameInput.addEventListener(
            "input",
            updateSidebarPreview
        );

        usernameInput.addEventListener(
            "blur",
            checkUsernameAvailability
        );
    }

    if (signOutButton) {
        signOutButton.addEventListener(
            "click",
            signOut
        );
    }

    if (passwordResetButton) {
        passwordResetButton.addEventListener(
            "click",
            resetPassword
        );
    }

    if (changeEmailButton) {
        changeEmailButton.addEventListener(
            "click",
            () => {
                window.alert(
                    "Email changes will be added to the security centre."
                );
            }
        );
    }

    try {
        currentUser =
            await requireAuthenticatedUser();

        if (!currentUser) {
            return;
        }

        displayAccountEmail();
        await loadProfile();
    } catch (error) {
        console.error(error);

        setStatus(
            error.message ||
                "Nous could not load your profile.",
            "error"
        );
    }
});