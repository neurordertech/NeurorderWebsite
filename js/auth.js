function showAuthMessage(message) {
  const box = document.getElementById("authMessage");

  if (box) {
    box.textContent = message;
  } else {
    alert(message);
  }
}

function signupPage() {
  window.location.href = "signup.html";
}

async function signUpWithEmail() {
  const fullName = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!fullName || !email || !password) {
    showAuthMessage("Please fill in all fields.");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: window.location.origin + "/dashboard.html"
    }
  });

  if (error) {
    showAuthMessage(error.message);
    return;
  }

  showAuthMessage("Check your email to confirm your account.");
}

async function loginWithEmail() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAuthMessage("Please enter your email and password.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showAuthMessage(error.message);
    return;
  }

  window.location.href = "dashboard.html";
}

async function loginWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/dashboard.html"
    }
  });

  if (error) {
    showAuthMessage(error.message);
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabaseClient) return;

  const { data } = await window.supabaseClient.auth.getUser();
  const user = data?.user;

  document.querySelectorAll(".auth-only").forEach(el => {
    el.style.display = user ? "" : "none";
  });

  document.querySelectorAll(".guest-only").forEach(el => {
    el.style.display = user ? "none" : "";
  });

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.supabaseClient.auth.signOut();
      window.location.href = "news.html";
    });
  }
});