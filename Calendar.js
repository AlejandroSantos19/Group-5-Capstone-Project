/*
 * calendar.js
   Functions:
 - Handles calendar and month navigation.
 - Displays the current month and year
 - Generates correct number of days for each month
 - Aligns first day of month with correct weekday
 - Allows navigation to previous and next months
 */

// Store the currently displayed date 
let currentDate = new Date();

function renderCalendar() {
// Get references to HTML elements used for display
  const monthYear = document.getElementById("monthYear");
  const calendarDates = document.getElementById("calendarDates");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();

  // Determines the total number of days in the month
  // (Using month + 1 and day 0 gives last day of current month)
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  // The array of month names
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  //Display for the formatted month and year, e.g. "March 2026" title
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
// Moves the calendar to the previous month then re renders the display
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}
// Moves the calendar to the next month . . .
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// Run initial render when page first loads
renderCalendar();
