
//This function checks to see if there are employee objects in the (JSON local storage) 
//if it hasn't been created then the function creates it.
function createDatabase(){
  //The if statement checks and sees if there are no employee objects in local storage, if not, it creates an empty array of employees.
    if (!localStorage.getItem("employees")) {

      //The localStorage can only store strings so everything in the array is converted to a string so that it can be stored
      localStorage.setItem("employees", JSON.stringify([]));
    }
  }
  

// This function adds a new employee to our database (JSON local storage)
function addEmployee(FirstName, LastName, DateOfBirth, Position, HourlyWage, Email) {
    // Get the current employees from localStorage
    // JSON.parse converts the string back into a JavaScript array
    const employees = JSON.parse(localStorage.getItem("employees"));
  
    // Creates a new employee object
    const newEmployee = {
      // Date.now() gives a unique number based on the time and can be used as an ID. An example would be (17342362342)
      id: Date.now(),
      FirstName: FirstName,
      LastName: LastName,
      DateOfBirth: DateOfBirth,
      Position: Position,
      HourlyWage: HourlyWage,
      Email: Email
    };
  
    // Add the new employee object to the array
    employees.push(newEmployee);
  
    // Save the updated array back to localStorage
    // JSON.stringify converts data into a string
    localStorage.setItem("employees", JSON.stringify(employees));
  }

//This function is called when the "Add Employee" button is clicked and 
// takes care of retrieving values from html page so that the employee can be added.
function handleAddEmployee(){
    //Retrieve values from add employee html fields
    const FirstName = document.getElementById("FirstName").value;
    const LastName = document.getElementById("LastName").value;
    const DateOfBirth = document.getElementById("DateOfBirth").value;
    const Position = document.getElementById("Position").value;
    const HourlyWage = document.getElementById("HourlyWage").value
    const Email = document.getElementById("Email").value;

    //Call addEmployee fucntion with the values retrieved from above to add employee
    addEmployee(FirstName, LastName, DateOfBirth, Position, HourlyWage, Email);

    //Display all current employees in UI 
    displayEmployees();
}

//This function runs when the remove employee button is clicked and removes the specified employee
function handleRemoveEmployee(id) {
  //Calls getEmployees function which returns an array of all the employee objects
  let employees = getEmployees();

  //Filters out the removed employee
  employees = employees.filter(emp => emp.id !== id);
  localStorage.setItem("employees", JSON.stringify(employees));

  //Calls the function displayEmployees and displays all employees in the employee table.
  displayEmployees();
}

//This function returns an array of all the employee objects
function getEmployees(){
  return JSON.parse(localStorage.getItem("employees"));
}


//This function reads all employees from localstorage and displays them in a table
function displayEmployees() {
    const table = document.getElementById("EmployeeTable");

    //Removes all exisitng rows from the EmployeeTable
    table.innerHTML = "";
  
    //getEmployees returns an array of all the employee objects and the loop parses through each one of them
    //creating a new row in the employee table for each one.
    getEmployees().forEach(employee => {
      //Creates a new table row
      const row = document.createElement("tr");
  
      //Fills the newly created row with the following
      row.innerHTML = `
        <td>${employee.FirstName} ${employee.LastName}</td>
        <td>${employee.Position}</td>
        <td>${employee.HourlyWage}</td>
        <td>${employee.Email}</td>
        <td>
          <button onclick="handleRemoveEmployee(${employee.id})">
            Remove
          </button>
        </td>
      `;
      
      //Adds the new row to the table
      table.appendChild(row);
    });
  }


//Run this once when the page loads
createDatabase();
displayEmployees();