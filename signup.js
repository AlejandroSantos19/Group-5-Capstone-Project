import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.getElementById("signupForm");
const emailInput = document.getElementById("signupEmail");
const passwordInput = document.getElementById("signupPassword");
const message = document.getElementById("signupMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    message.textContent = "Account created.";
    form.reset();
  } catch (error) {
    message.textContent = error.message;
  }
});
