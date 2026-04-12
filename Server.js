//Allows us to create a server (A Node.js Module)
const http = require("http");

//Allows us to communicate with our mysql database (A Node.js library)
const mysql = require("mysql2");

//This allows us to create a connection with our mysql database with the given information
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "IUSB2026!", //iusb2026!
    database: "Test_db"
});

//This actually connects us to our mysql database and informs us whether the connection was a success or if an error(err) is thrown
connection.connect((err) => {

    //Checks if there was an error connecting to the database
    if(err){
        //Displays this if there was an error connecting to the database in our console
        console.log("There was an error connecting to the database :(");
        return;
    }

    //Displays this if connection was successful
    console.log("A connection has been established :)");
})


//This creates an HTTP server
// req = is the request from the browser to our browser
// res = is the response we send back to the browser from our server
const server = http.createServer((req, res) => {

    //This tells the web browser that our server allows any website to send requests (since we are only running our server locally, only our local website can send requests)
    res.setHeader("Access-Control-Allow-Origin", "*");
    //This tell the web browser what kind of requests our server can recieve
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    //This allows the web browser to send a "Content-Type" header to our server such as ("Content-Type": "application/json")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    //Our server first checks to see if the request is of type "OPTIONS" (A preflight request before sending something like a GET, POST, or others)
    //The "OPTIONS" req asks our server what kind of requests it accepts and lets our browser know what kind of requests our server can recieve.
    if (req.method === "OPTIONS") {
        
        //This adds a 200 OK status code which indicates that the request has succeeded to our response
        res.writeHead(200);

        //This ends our response and is sent back to the browser
        res.end();
        return;
    }


    //Checks if the req is a "POST" method (A method used to send and update data)
    //Checks if the req is to the "/save" endpoint which is used to identify what the request wants to do (Save data).
    //This if statment runs if our webbrowser wants to save data to our MySQL database
    if(req.method === "POST" && req.url === "/save"){

        //This is used to store data sent from the browser
        let sentData = "";

        //Data on browsers is sent in chunks so we add all the chucnks together and store it in our variable "sentData"
        req.on("data", chunk => {
            sentData = sentData + chunk.toString();
           //console.log(sentData);
        })

        //This runs once all of the sent data has been recieved and added to "sentData" variable
        req.on("end", () => {

        //********** This section can be changed to add more input fields  **********/
            //This converts all the data that was sent into a javascript object
            const data = JSON.parse(sentData);

            //This looks and stores the name, email, and age value from our "data" variable above
            const FirstName = data.FirstName;
            const LastName = data.LastName;
            const DateOfBirth = data.DateOfBirth;
            const Position = data.Position;
            const HourlyWage =parseFloat(data.HourlyWage);
            const Email = data.Email;
            const PhoneNumber = data.PhoneNumber;

            //This is our sql statment that we will use to add the name into our MySQL database
            //The ? are place holder values
            const sql = "INSERT INTO employees (first_name, last_name, date_of_birth, position, hourly_wage, email, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)";

        //********** This section can be changed to add more input fields **********/


            //This runs and querys the sql statment we created above
                //The values we want to store must go in the [] 
            connection.query(sql, [FirstName, LastName, DateOfBirth, Position, HourlyWage, Email, PhoneNumber], (err, result) => {

                //This runs if there was an error adding the employee to our MySQL database
                if(err){
                    //This sends a 500 Internal Server Error code which indicates there was a problem with the server.
                    res.writeHead(500, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Database error"}));
                    return
                }

                //If everything worked okay then this runs and sends a message that the employee was saved to our MySQL database.
                //This sends a 200 OK status code which indicates that the request has succeeded
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Employee information was saved!"}));
            });
        });
    }
    
    //This if statement will run if our web browser wants to retrieve data
    if(req.method === "GET" && req.url === "/employees"){
        
        //This is our sql statement that will be used to retrieve all the columns and rows from our employees table in MySQL
        const sql = "SELECT * FROM employees";

        //This runs our sql statement created above to retrieve all the employees
        connection.query(sql, (err, results) => {
            if(err){
                //This sends a 500 Internal Server Error code which indicates there was a problem with the server.
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Database error"}));
                return;
            }

            //If everything worked okay then this runs and sends the results in form of JSON.
            //This sends a 200 OK status code which indicates that the request has succeeded
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(results));
        });
    }

    //This checks our webrowser sent a DELETE req and if was it for an employee
    if(req.method === "DELETE" && req.url.startsWith("/employees/")){
        console.log(req.url);

        //Get the employee id from end of the url sent
        //How it works: This gets the url, splits the strings at each /, creates an array of each string, and selects the array index 2 which is the employee id.
        //The req url will look like  /employees/23 with 23 being the id of the employee
        const id = req.url.split("/")[2];
        console.log("Employee with this ID was removed: " + id);

        //This is the sql statment that will be used to delete the employee
        const sql = "DELETE FROM employees WHERE id = ?"

        //This runs the sql statement that we created above to delete the employee with the specified id
        connection.query(sql, [id], (err, results) => {

            //This checks if there was en error deleting the employee
            if(err){
                //This sends a 500 Internal Server Error code which indicates there was a problem with the server.
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Database error"}));
                return;
            }

            //If everything worked okay then this runs and sends a message to indicate the the employee was removed
            //This sends a 200 OK status code which indicates that the request has succeeded
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({message: "Employee was deleted successfully"}));
        });
    }

    if(req.method === "GET" && req.url === "/stats"){

        //This is the sql statement used to retrieve the stats we want from our MySQL database
        const sql = "SELECT COUNT(*) AS TotalNumberEmployees, SUM(hourly_wage) AS TotalHourlyWage, MIN(hourly_wage) AS LowestHourlyWage, MAX(hourly_wage) AS HighestHourlyWage FROM employees";
        
        //This executes and runs the sql statement above
        connection.query(sql, (err, results) => {

           // console.log("err: " + err);
           // console.log("res: " + results);

            if(err){
                //This sends a 500 Internal Server Error code which indicates there was a problem with the server.
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Database error"}));
                return;
            }

            //This stores and saves the stats retrieved from the sql statement that we created above
            const TotalNumberEmployees = results[0].TotalNumberEmployees;
            const TotalHourlyWage = results[0].TotalHourlyWage;
            const LowestHourlyWage = results[0].LowestHourlyWage;
            const HighestHourlyWage = results[0].HighestHourlyWage;

            //This sends the results back to our Algorithm.js file so that the stats can be displayed
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({TotalNumberEmployees, TotalHourlyWage, LowestHourlyWage, HighestHourlyWage}));
        })

    }

    if(req.method === "GET" && req.url.startsWith("/search/")){
        //This retrieves the name given by the user from the url. The name is stored in the variable name
        const name = req.url.split("/")[2];
        console.log(name);

        //This is the sql statement used to retrieve the employees that matches the first name given by the user. 
        //The ? is a placeholder value which is replaced by the name given by the user
        const sql = "SELECT * FROM employees WHERE first_name = ?";

        //This executes the sql command that we created above
        connection.query(sql, [name], (err, results) => {
            if(err){
                //This sends a 500 Internal Server Error code which indicates there was a problem with the server.
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Database error"}));
                return;
            }

            //If everything worked okay then this runs and sends the results in form of JSON.
            //This sends a 200 OK status code which indicates that the request has succeeded
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(results));
        });
    }
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});