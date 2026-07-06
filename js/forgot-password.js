const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const messageBox = document.getElementById("message");

function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.className = type;
}

forgotPasswordForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        showMessage("Please enter your email address.", "error");
        return;
    }

    const { error } =
    await supabaseClient.auth.resetPasswordForEmail(email, {

        redirectTo: window.location.origin + "/reset-password.html"

    });

    if (error) {

        showMessage(error.message, "error");
        return;

    }

    showMessage(
        "If this email exists, a password reset link has been sent to your inbox."
    );

    forgotPasswordForm.reset();

});