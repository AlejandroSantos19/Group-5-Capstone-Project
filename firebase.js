import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdpmhy5cSR7P2r2qDY3asX0EUAeOl9KMI",
  authDomain: "tasktopus-capstone.firebaseapp.com",
  projectId: "tasktopus-capstone",
  storageBucket: "tasktopus-capstone.firebasestorage.app",
  messagingSenderId: "87561286935",
  appId: "1:87561286935:web:43d7aa9e420c79da23f352",
  measurementId: "G-3B158VVKWG",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
