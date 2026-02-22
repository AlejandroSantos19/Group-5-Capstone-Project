let currentDate = new Date();

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

  // Blank spaces before first day
  for (let i = 0; i < firstDay; i++) {
    calendarDates.innerHTML += `<div></div>`;
  }

  // Actual days
  for (let day = 1; day <= lastDate; day++) {
    calendarDates.innerHTML += `<div class="date">${day}</div>`;
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// Run when page loads
renderCalendar();
