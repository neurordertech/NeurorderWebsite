const params = new URLSearchParams(window.location.search);
const destination = params.get("destination");

if (destination) {
  localStorage.setItem("neurorderDestination", destination);
}