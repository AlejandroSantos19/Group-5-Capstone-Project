import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";

    try {
      await signInWithEmailAndPassword(
        auth,
        loginEmail.value.trim(),
        loginPassword.value,
      );
      window.location.href = "dashboard.html";
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });
}

const resetForm = document.getElementById("resetForm");
const resetEmail = document.getElementById("resetEmail");
const resetMessage = document.getElementById("resetMessage");

if (resetForm) {
  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetMessage.textContent = "";

    try {
      await sendPasswordResetEmail(auth, resetEmail.value.trim());
      resetMessage.textContent = "Password reset email sent.";
      resetForm.reset();
    } catch (error) {
      resetMessage.textContent = error.message;
    }
  });
}
