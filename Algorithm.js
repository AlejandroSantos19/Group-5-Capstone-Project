
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

    const ValidationError = validateEmployeeData(FirstName, LastName, HourlyWage, Email, PhoneNumber);
    if(ValidationError){
      alert(ValidationError);
      return;
    }

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

//This function validates user input for adding an employee using regular expressions (Regex)
//If there is an entry field that is not valid it returns an error string, otherwise it returns null value.
function validateEmployeeData(FirstName, LastName, HourlyWage, Email, PhoneNumber){
  //This validates that the first and last name is at least one character long and less than 40 characters long.
  //It also checks that the first letter is capitilized.
  const nameRegex = /^[A-Z][a-zA-z]{0,39}$/;
  if(!nameRegex.test(FirstName)){
    return "Invalid first name. Name must start with a captial letter and be less than 40 characters long";
  }
  else if(!nameRegex.test(LastName)){
    return "Invalid last name. Name must start with a capital letter and be less than 40 characters long";
  }

  //This validates that the hourly wage input by the user has one or more digits before the decimal,
  //a decimal point, and two digits after the decimal.
  const wageRegex = /^\d+\.\d{2}$/;
  if(!wageRegex.test(HourlyWage)){
    return "Invalid hourly wage. Enter a valid hourly wage. One or more digits before the decimal, a decimal point, and two digits after the decimal.";
  }

  //This validates that the email input by the user is in the form: username@doman.extension 
  // * Username: can have letters, numbers, and/or the characters ._%+-
  // * Domain: can have letters, numbers, and/or the characters .-
  // * Extension: must have at least two letters (eg. .com, .org, .edu)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(!emailRegex.test(Email)){
    return "Invalid email address. Enter a valid email address."
  }

  //This checks that the phone number input by the user is in the form XXX-XXX-XXXX 
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  if(!phoneRegex.test(PhoneNumber)){
    return "Invalid phone number, it must have the format xxx-xxx-xxxx.";
  }

  //Everything was valid
  return null; 
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

      const NumberEmployeesDisplayed = document.getElementById("NumberEmployeesDisplayed").value;
      console.log(NumberEmployeesDisplayed);

      //This checks to see how many employees are needed to be displayed and stores the value in the limit variable 
      let limit;
      if(NumberEmployeesDisplayed === "all"){
        //All employees are to be displayed on the table
        limit = employees.length;
      } else{
        //This stores the drop down selector value into the limit variable as a number so only a set amount of employees can be displayed on the table
        limit = Number(NumberEmployeesDisplayed);
      }
  
      //This loops through the employees and displays them on the html table up to the limit provided by the drop down selector.
      for(let i = 0; i < limit && i < employees.length; i++){
        let employee = employees[i];

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
      };

      //When the user changes the number of employees they want displayed, this updates and redisplays the employee table
      document.getElementById("NumberEmployeesDisplayed").addEventListener("change", displayEmployees);
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
