// Store the currently displayed date
let currentDate = new Date();
let selectedDate = null;

// Make it accessible globally for shifts.js (if still used)
window.selectedDate = null;

// ================= NEW: store shifts =================
let allShifts = [];

function renderCalendar() {
  const monthYear = document.getElementById("monthYear");
  const calendarDates = document.getElementById("calendarDates");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  monthYear.innerText = `${monthNames[month]} ${year}`;

  calendarDates.innerHTML = "";

  // Blank cells
  for (let i = 0; i < firstDay; i++) {
    calendarDates.innerHTML += `<div></div>`;
  }

  // Days
  for (let day = 1; day <= lastDate; day++) {

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    calendarDates.innerHTML += `
      <div class="date"
           data-date="${dateStr}"
           onclick="handleDayClick(${day}, '${dateStr}')">
        ${day}
      </div>
    `;
  }
}

// -----------------------------
// DELETE SHIFT
// -----------------------------
async function deleteShift(id) {

  if (!confirm("Remove this shift?")) return;

  try {
    const response = await fetch(`http://localhost:3000/shifts/${id}`, {
      method: "DELETE"
    });

    const result = await response.json();
    alert(result.message);

    // 🔄 refresh shifts
    allShifts = [];

    handleDayClick(
      selectedDate.getDate(),
      selectedDate.toISOString().split("T")[0]
    );

  } catch (error) {
    console.error("Error deleting shift:", error);
  }
}


// -----------------------------
// NEW: HANDLE DAY CLICK
// -----------------------------
async function handleDayClick(day, dateStr) {

  selectedDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day
  );

  window.selectedDate = selectedDate;

  document.getElementById("selectedDayTitle").innerText =
    selectedDate.toDateString();

  if (allShifts.length === 0) {
    const res = await fetch("http://localhost:3000/shifts");
    allShifts = await res.json();
  }

  const shiftList = document.getElementById("shiftList");
  shiftList.innerHTML = "";

  const filtered = allShifts.filter(
    s => s.shift_date.split("T")[0] === dateStr
  );

  if (filtered.length === 0) {
    shiftList.innerHTML = "<p>No shifts</p>";
    return;
  }

  filtered.forEach(shift => {
    const div = document.createElement("div");

    div.innerHTML = `
  <div class="shift-item">
    <div>
      <strong>${shift.first_name} ${shift.last_name}</strong><br>
      ${shift.start_time} - ${shift.end_time}
    </div>
    <button class="delete-shift-btn" onclick="deleteShift(${shift.id})">✖</button>
  </div>
`;

    shiftList.appendChild(div);
  });
}

// -----------------------------
// Navigation
// -----------------------------
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

renderCalendar();

// -----------------------------
// EXISTING MODAL FUNCTIONS (UNCHANGED)
// -----------------------------
function openModal(day, dateStr) {
  selectedDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day
  );

  window.selectedDate = selectedDate;

  document.getElementById("shiftModal").style.display = "block";

  document.getElementById("selectedDateText").innerText =
    "Selected Date: " + selectedDate.toDateString();
}

function closeModal() {
  document.getElementById("shiftModal").style.display = "none";
}

// -----------------------------
// SAVE SHIFT
// -----------------------------
async function saveShift() {

  const employeeName = document.getElementById("shiftEmployee").value;
  const start = document.getElementById("shiftStart").value;
  const end = document.getElementById("shiftEnd").value;

  if (!selectedDate) {
    alert("No date selected");
    return;
  }

  if (!employeeName || !start || !end) {
    alert("Missing shift details");
    return;
  }

  const shift_date = selectedDate.toISOString().split("T")[0];

  const res = await fetch("http://localhost:3000/employees");
  const employees = await res.json();

  const emp = employees.find(e =>
    `${e.first_name} ${e.last_name}` === employeeName
  );

  if (!emp) {
    alert("Employee not found");
    return;
  }

  const response = await fetch("http://localhost:3000/add-shift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: emp.id,
      shift_date,
      start_time: start,
      end_time: end
    })
  });

  const result = await response.json();
  alert(result.message);

  closeModal();

  // ================= NEW: refresh panel =================
  allShifts = [];
  handleDayClick(
    selectedDate.getDate(),
    selectedDate.toISOString().split("T")[0]
  );

  document.getElementById("shiftEmployee").value = "";
  document.getElementById("shiftStart").value = "";
  document.getElementById("shiftEnd").value = "";
}
