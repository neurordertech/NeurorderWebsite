const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

function createReference() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `NCC-${year}-${random}`;
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const reference = createReference();

  const payload = {
    reference,
    full_name: document.getElementById("contactName").value.trim(),
    email: document.getElementById("contactEmail").value.trim(),
    subject: document.getElementById("contactSubject").value.trim(),
    department: document.getElementById("contactDepartment").value,
    message: document.getElementById("contactMessage").value.trim()
  };

  const { error } = await supabaseClient
    .from("contact_messages")
    .insert([payload]);

  if (error) {
  console.error("Contact form error:", error);
  contactStatus.textContent = error.message;
  return;
}

  contactStatus.textContent = `Message sent. Your reference is ${reference}.`;
  contactForm.reset();
});