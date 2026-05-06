// -----------------------------
// Load employees into datalist
// -----------------------------
async function loadEmployees() {
  const res = await fetch("http://localhost:3000/employees");
  const employees = await res.json();

  const datalist = document.getElementById("employeeList");

  datalist.innerHTML = "";

  employees.forEach(emp => {
    const option = document.createElement("option");

    // Display name to user
    option.value = `${emp.first_name} ${emp.last_name}`;

    datalist.appendChild(option);
  });
}

loadEmployees();


// -----------------------------
// Save shift 
// -----------------------------
document.getElementById("saveShiftBtn")?.addEventListener("click", async () => {

  const employeeName = document.getElementById("employeeSelect")?.value;
  const start_time = document.getElementById("startTime")?.value;
  const end_time = document.getElementById("endTime")?.value;

  // This MUST come from Calendar.js global variable
  const shift_date = window.selectedDate;

  // Validate inputs
  if (!employeeName || !start_time || !end_time || !shift_date) {
    alert("Missing shift information.");
    return;
  }

  // Convert date to MySQL format
  const formattedDate = new Date(shift_date).toISOString().split("T")[0];

  // Get employees to resolve ID
  const empRes = await fetch("http://localhost:3000/employees");
  const employees = await empRes.json();

  const emp = employees.find(e =>
    `${e.first_name} ${e.last_name}` === employeeName
  );

  if (!emp) {
    alert("Employee not found");
    return;
  }

  await fetch("http://localhost:3000/add-shift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: emp.id,
      shift_date: formattedDate,
      start_time,
      end_time
    })
  });

  alert("Shift added!");
});


// -----------------------------
// Load shifts into calendar
// -----------------------------
async function loadShifts() {
  const res = await fetch("http://localhost:3000/shifts");
  const shifts = await res.json();

  shifts.forEach(shift => {
    const cleanDate = shift.shift_date.split("T")[0];

    const cell = document.querySelector(`[data-date="${cleanDate}"]`);

    if (cell) {
      //  highlight the day
      cell.classList.add("has-shift");

      const div = document.createElement("div");

      div.innerHTML = `
        <strong>${shift.first_name}</strong><br>
        ${shift.start_time} - ${shift.end_time}
      `;

      cell.appendChild(div);
    }
  });
}



loadShifts();
