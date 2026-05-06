const TASKS_STORAGE_KEY = "tasktopus_tasks";

let tasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];
let selectedFileDataURL = null;
let selectedFileName = null;
let selectedFileIsImage = false;

const fileInput = document.getElementById("taskFile");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const previewImg = document.getElementById("uploadPreviewImg");

function saveTasks() {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  selectedFileName = file.name;
  selectedFileIsImage = file.type.startsWith("image/");
  fileNameDisplay.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedFileDataURL = e.target.result;

    if (selectedFileIsImage) {
      previewImg.src = selectedFileDataURL;
      previewImg.style.display = "block";
    } else {
      previewImg.src = "";
      previewImg.style.display = "none";
    }
  };

  reader.readAsDataURL(file);
});

function addTask() {
  const name = document.getElementById("taskName").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;

  if (!name) {
    alert("Please enter a task name.");
    return;
  }

  tasks.push({
    id: Date.now(),
    name,
    desc,
    priority,
    fileDataURL: selectedFileDataURL,
    fileName: selectedFileName,
    fileIsImage: selectedFileIsImage,
  });

  saveTasks();
  renderTasks();

  document.getElementById("taskName").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "Medium";
  fileInput.value = "";
  fileNameDisplay.textContent = "No file chosen";
  previewImg.src = "";
  previewImg.style.display = "none";
  selectedFileDataURL = null;
  selectedFileName = null;
  selectedFileIsImage = false;
}

function removeTask(id) {
  if (!confirm("Remove this task?")) return;

  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  const tbody = document.getElementById("taskTableBody");
  tbody.innerHTML = "";

  tasks.forEach((task) => {
    const row = document.createElement("tr");

    let attachHTML = "—";

    if (task.fileDataURL && task.fileIsImage) {
      attachHTML = `<img class="task-thumb" src="${task.fileDataURL}" alt="${escapeHTML(task.fileName || "Task image")}" onclick="openLightbox('${task.fileDataURL}')" title="Click to enlarge" />`;
    } else if (task.fileName && task.fileDataURL) {
      attachHTML = `<a class="task-file-link" href="${task.fileDataURL}" download="${escapeHTML(task.fileName)}">📄 ${escapeHTML(task.fileName)}</a>`;
    }

    row.innerHTML = `
      <td>${escapeHTML(task.name)}</td>
      <td>${task.desc ? escapeHTML(task.desc) : "—"}</td>
      <td>${escapeHTML(task.priority)}</td>
      <td>${attachHTML}</td>
      <td><button onclick="removeTask(${task.id})">Remove</button></td>
    `;

    tbody.appendChild(row);
  });
}

function openLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightbox").classList.add("open");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sortTasksByPriority() {
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  saveTasks();
  renderTasks();
}

renderTasks();
