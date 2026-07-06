function showAuthMessage(message) {
  const box = document.getElementById("authMessage");

  if (box) {
    box.textContent = message;
  } else {
    alert(message);
  }
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
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: "https://neurorder.com/login.html"
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
    email,
    password
  });

  if (error) {
    showAuthMessage(error.message);
    return;
  }

  const destination = localStorage.getItem("neurorderDestination");
  localStorage.removeItem("neurorderDestination");

  if (destination === "nous") {
    window.location.href = "nous.html";
  } else {
    window.location.href = "nous-news.html";
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

  document.querySelectorAll(".auth-only").forEach((el) => {
    el.style.display = user ? "" : "none";
  });

  document.querySelectorAll(".guest-only").forEach((el) => {
    el.style.display = user ? "none" : "";
  });

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
    });
  }
});