
//This function is called when the "Add Employee" button is clicked and 
//takes care of retrieving values from html page so that the employee can be added.
async function handleAddEmployee(){
    //Retrieve values from add employee html fields
    const FirstName = document.getElementById("FirstName").value;
    const LastName = document.getElementById("LastName").value;
    const DateOfBirth = document.getElementById("DateOfBirth").value;
    const Position = document.getElementById("Position").value;
    const HourlyWage = document.getElementById("HourlyWage").value;
    const Email = document.getElementById("Email").value;
    const PhoneNumber = document.getElementById("PhoneNumber").value;

    const response = await fetch("http://localhost:3000/save", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      //Add the input fields inside JSON.stringify({____})
      body: JSON.stringify({FirstName, LastName, DateOfBirth, Position, HourlyWage, Email, PhoneNumber})
    })

     //This displays a pop-up message to the user and says whether the data was able to be saved or not in to the mysql data base
     const result = await response.json();
     alert(result.message);

    //Clears all Add Employee input fields
    const EmployeeInputFields = document.querySelectorAll(".add-employee-input");
    EmployeeInputFields.forEach(input => {
      input.value = "";
    })

    //Display all current employees in UI 
    displayEmployees();
}


//This function runs when the remove employee button is clicked and removes the specified employee
async function handleRemoveEmployee(id) {

  //This brings up a pop up message and asks the user if they want to delete the employee
  if(confirm("Are you sure you want to remove this employee?")){
    try{
      //The url contains the employee id of the employee id we want to remove.
      //This allows our server and MySQL to know which employee we want to remove
      const response = await fetch(`http://localhost:3000/employees/${id}`, {
      method: "DELETE"
      });

      //This is our response back to the server and lets the user know if the employee was able to be removed
      const result = await response.json();
      alert(result.message);

      //Calls the function displayEmployees and displays all employees in the employee table.
      displayEmployees();

      //This updates the search employee table if an employee was removed using the search employee table.
      handleSearchEmployee();
    } catch (error){
        console.error("There was an error deleting the employee:", error)
    }
  }
  else{
    //This brings up a pop up message letting the user know they canceled the action of deleting an employee
    alert("You have canceled the action of deleting the employee");
  }

}

//This function reads all employees from localstorage and displays them in a table
async function displayEmployees() {
  try{
      const response = await fetch("http://localhost:3000/employees");
      const employees = await response.json();

      const table = document.getElementById("EmployeeTable");

      //Removes all exisitng rows from the EmployeeTable
      table.innerHTML = "";
  
      //This loops through all of the employees and displays their information onto our html table
      employees.forEach(employee => {

        console.log(employee);

        //Creates a new table row
        const row = document.createElement("tr");
    
        //Fills the newly created row with the following
        //For each {employee. } the column name has to be the same as our MySQL employees table column names
        row.innerHTML = `
          <td>${employee.first_name} ${employee.last_name}</td>
          <td>${employee.position}</td>
          <td>${employee.hourly_wage}</td>
          <td>${employee.email}</td>
          <td>${employee.phone_number}</td>
          <td>
            <button onclick="handleRemoveEmployee(${employee.id})">
              Remove
            </button>
          </td>
        `;
        
        //Adds the new row to the table
        table.appendChild(row);
      });
    } catch(error) {
      console.error("There was an error loading the employees table: ",  error);
    }

}

async function displayQuickStats(){
  try{
    //This retrieves total number of employees, the total form the hourly wage column, the lowest hourly wage, and the highest hourly wage from our MySQl database. 
    //The results are saves into the stats variable
    const response = await fetch("http://localhost:3000/stats");
    const stats = await response.json();

    //This displays all the stats
    console.log(stats);
    document.getElementById("TotalNumberEmployees").textContent = stats.TotalNumberEmployees;
    document.getElementById("TotalHourlyWage").textContent = stats.TotalHourlyWage;
    document.getElementById("AverageHourlyWage").textContent = (stats.TotalHourlyWage / stats.TotalNumberEmployees).toFixed(2); //The average hourly wage is rounded to two decimal places
    document.getElementById("LowestHourlyWage").textContent = stats.LowestHourlyWage;
    document.getElementById("HighestHourlyWage").textContent = stats.HighestHourlyWage;
    

  } catch(error){
    //This displays an error if there was an error displaying the quick stats
    console.error("There was an error displaying the quick stats: ", error);
  }
}

async function handleSearchEmployee(){
  try{

    //This retrieves the first name of the employee that a user is wanting to search for
    const FirstName = document.getElementById("SearchFirstName").value;

    //This retrieves the employees from our MySQL table with the first name that was input by the user
    const response = await fetch(`http://localhost:3000/search/${FirstName}`, {
      method: "GET"
      });

     //This retrieves and stores all the employees that match with our search into the variable employees
     const employees = await response.json();

     //This retrieves our search employee table so we can update it 
     const table = document.getElementById("SearchEmployeeTable");

      //Removes all exisitng rows from the search employee table
      table.innerHTML = "";
  
      //This loops through all of the employees with the matched first name and displays their information onto our html table
      employees.forEach(employee => {

        console.log(employee);

        //Creates a new table row
        const row = document.createElement("tr");
    
        //Fills the newly created row with the following
        //For each {employee. } the column name has to be the same as our MySQL employees table column names
        row.innerHTML = `
          <td>${employee.first_name} ${employee.last_name}</td>
          <td>${employee.position}</td>
          <td>${employee.hourly_wage}</td>
          <td>${employee.email}</td>
          <td>${employee.phone_number}</td>
          <td>
            <button onclick="handleRemoveEmployee(${employee.id})">
              Remove
            </button>
          </td>
        `;
        
        //Adds the new row to the table
        table.appendChild(row);
      });
  }catch(error){
    console.error("There was an error searching for an employee: ", error);
  }
}


//These function run when the page loads and displays all of our employees in our website table.
displayEmployees();
displayQuickStats();
