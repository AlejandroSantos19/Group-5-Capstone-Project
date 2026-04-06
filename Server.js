// Allows us to create a server (A Node.js Module)
const http = require("http");
const { randomBytes } = require("crypto");

// Allows us to communicate with our MySQL database (A Node.js library)
const mysql = require("mysql2");

// This allows us to create a connection with our MySQL database with the given information
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "iusb2026!",
  database: "Test_db",
});

let hasEmployeeWorkspaceColumn = false;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function parseRequestBody(req, callback) {
  let sentData = "";

  req.on("data", (chunk) => {
    sentData += chunk.toString();
  });

  req.on("end", () => {
    if (!sentData) {
      callback(null, {});
      return;
    }

    try {
      callback(null, JSON.parse(sentData));
    } catch {
      callback(new Error("Invalid JSON body"));
    }
  });
}

function query(sql, values, callback) {
  connection.query(sql, values, callback);
}

function normalizeInviteCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 8; i += 1) {
    const randomIndex = randomBytes(1)[0] % alphabet.length;
    code += alphabet[randomIndex];
  }

  return code;
}

function generateUniqueInviteCode(maxAttempts, callback) {
  let attempts = 0;

  const tryCode = () => {
    attempts += 1;
    const code = generateInviteCode();
    const sql = "SELECT id FROM workspaces WHERE invite_code = ? LIMIT 1";

    query(sql, [code], (err, results) => {
      if (err) {
        callback(err);
        return;
      }

      if (results.length === 0) {
        callback(null, code);
        return;
      }

      if (attempts >= maxAttempts) {
        callback(new Error("Unable to generate unique workspace code."));
        return;
      }

      tryCode();
    });
  };

  tryCode();
}

function resolveWorkspaceIdFromRequest(req, parsedUrl, callback) {
  const queryWorkspaceId = parsedUrl.searchParams.get("workspaceId");
  const queryWorkspaceCode = parsedUrl.searchParams.get("workspaceCode");
  const headerWorkspaceCode = req.headers["x-workspace-code"];
  const workspaceCode = normalizeInviteCode(
    queryWorkspaceCode || headerWorkspaceCode,
  );

  if (queryWorkspaceId) {
    const workspaceId = Number(queryWorkspaceId);
    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
      callback(new Error("Invalid workspaceId query value."));
      return;
    }

    callback(null, workspaceId);
    return;
  }

  if (!workspaceCode) {
    callback(null, null);
    return;
  }

  query(
    "SELECT id FROM workspaces WHERE invite_code = ? LIMIT 1",
    [workspaceCode],
    (err, results) => {
      if (err) {
        callback(err);
        return;
      }

      if (results.length === 0) {
        callback(new Error("Workspace code was not found."));
        return;
      }

      callback(null, results[0].id);
    },
  );
}

function buildWorkspaceWhereClause(workspaceId) {
  if (!hasEmployeeWorkspaceColumn || workspaceId === null) {
    return { sql: "", params: [] };
  }

  return {
    sql: " WHERE workspace_id = ?",
    params: [workspaceId],
  };
}

function requiresWorkspaceColumn(workspaceId, res) {
  if (workspaceId !== null && !hasEmployeeWorkspaceColumn) {
    sendJson(res, 500, {
      message:
        "Workspace filtering requested, but employees.workspace_id column is missing. Run the workspace migration first.",
    });
    return true;
  }

  return false;
}

function handleCreateOwnerWorkspace(req, res) {
  parseRequestBody(req, (bodyErr, body) => {
    if (bodyErr) {
      sendJson(res, 400, { message: bodyErr.message });
      return;
    }

    const firebaseUid = String(body.firebaseUid || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const requestedWorkspaceName = String(body.workspaceName || "").trim();
    const workspaceName = requestedWorkspaceName || "My Workspace";

    if (!firebaseUid || !email) {
      sendJson(res, 400, { message: "firebaseUid and email are required." });
      return;
    }

    const existingUserSql =
      "SELECT wu.workspace_id, wu.role, w.name, w.invite_code FROM workspace_users wu INNER JOIN workspaces w ON w.id = wu.workspace_id WHERE wu.firebase_uid = ? LIMIT 1";

    query(existingUserSql, [firebaseUid], (existingErr, existingResults) => {
      if (existingErr) {
        sendJson(res, 500, {
          message: "Database error",
          details: existingErr.message,
        });
        return;
      }

      if (existingResults.length > 0) {
        sendJson(res, 200, {
          message: "User is already assigned to a workspace.",
          workspaceId: existingResults[0].workspace_id,
          workspaceName: existingResults[0].name,
          inviteCode: existingResults[0].invite_code,
          role: existingResults[0].role,
        });
        return;
      }

      generateUniqueInviteCode(15, (codeErr, inviteCode) => {
        if (codeErr) {
          sendJson(res, 500, { message: codeErr.message });
          return;
        }

        connection.beginTransaction((txErr) => {
          if (txErr) {
            sendJson(res, 500, { message: "Failed to start transaction." });
            return;
          }

          const insertWorkspaceSql =
            "INSERT INTO workspaces (name, invite_code) VALUES (?, ?)";

          query(
            insertWorkspaceSql,
            [workspaceName, inviteCode],
            (workspaceErr, workspaceResult) => {
              if (workspaceErr) {
                connection.rollback(() => {
                  sendJson(res, 500, {
                    message: "Failed to create workspace.",
                    details: workspaceErr.message,
                  });
                });
                return;
              }

              const workspaceId = workspaceResult.insertId;
              const insertOwnerSql =
                "INSERT INTO workspace_users (workspace_id, firebase_uid, email, role) VALUES (?, ?, ?, 'owner')";

              query(
                insertOwnerSql,
                [workspaceId, firebaseUid, email],
                (ownerErr, ownerResult) => {
                  if (ownerErr) {
                    connection.rollback(() => {
                      sendJson(res, 500, {
                        message: "Failed to create workspace owner.",
                        details: ownerErr.message,
                      });
                    });
                    return;
                  }

                  const updateWorkspaceOwnerSql =
                    "UPDATE workspaces SET owner_user_id = ? WHERE id = ?";

                  query(
                    updateWorkspaceOwnerSql,
                    [ownerResult.insertId, workspaceId],
                    (updateErr) => {
                      if (updateErr) {
                        connection.rollback(() => {
                          sendJson(res, 500, {
                            message: "Failed to set workspace owner.",
                            details: updateErr.message,
                          });
                        });
                        return;
                      }

                      connection.commit((commitErr) => {
                        if (commitErr) {
                          connection.rollback(() => {
                            sendJson(res, 500, {
                              message: "Failed to commit workspace creation.",
                              details: commitErr.message,
                            });
                          });
                          return;
                        }

                        sendJson(res, 201, {
                          message: "Workspace created successfully.",
                          workspaceId,
                          workspaceName,
                          inviteCode,
                          role: "owner",
                        });
                      });
                    },
                  );
                },
              );
            },
          );
        });
      });
    });
  });
}

function handleJoinWorkspace(req, res) {
  parseRequestBody(req, (bodyErr, body) => {
    if (bodyErr) {
      sendJson(res, 400, { message: bodyErr.message });
      return;
    }

    const firebaseUid = String(body.firebaseUid || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const inviteCode = normalizeInviteCode(body.inviteCode);

    if (!firebaseUid || !email || !inviteCode) {
      sendJson(res, 400, {
        message: "firebaseUid, email, and inviteCode are required.",
      });
      return;
    }

    const workspaceSql =
      "SELECT id, name, invite_code FROM workspaces WHERE invite_code = ? LIMIT 1";

    query(workspaceSql, [inviteCode], (workspaceErr, workspaceResults) => {
      if (workspaceErr) {
        sendJson(res, 500, {
          message: "Database error",
          details: workspaceErr.message,
        });
        return;
      }

      if (workspaceResults.length === 0) {
        sendJson(res, 404, { message: "Invite code is invalid." });
        return;
      }

      const workspace = workspaceResults[0];
      const existingUserSql =
        "SELECT workspace_id, role FROM workspace_users WHERE firebase_uid = ? LIMIT 1";

      query(existingUserSql, [firebaseUid], (existingErr, existingResults) => {
        if (existingErr) {
          sendJson(res, 500, {
            message: "Database error",
            details: existingErr.message,
          });
          return;
        }

        if (existingResults.length > 0) {
          const existingUser = existingResults[0];
          if (existingUser.workspace_id === workspace.id) {
            sendJson(res, 200, {
              message: "User is already in this workspace.",
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              inviteCode: workspace.invite_code,
              role: existingUser.role,
            });
            return;
          }

          sendJson(res, 409, {
            message:
              "User is already assigned to a different workspace. Multi-workspace membership is not enabled.",
          });
          return;
        }

        const joinSql =
          "INSERT INTO workspace_users (workspace_id, firebase_uid, email, role) VALUES (?, ?, ?, 'member')";

        query(joinSql, [workspace.id, firebaseUid, email], (joinErr) => {
          if (joinErr) {
            sendJson(res, 500, {
              message: "Failed to join workspace.",
              details: joinErr.message,
            });
            return;
          }

          sendJson(res, 201, {
            message: "Workspace joined successfully.",
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            inviteCode: workspace.invite_code,
            role: "member",
          });
        });
      });
    });
  });
}

function handleGetUserWorkspace(res, firebaseUid) {
  const cleanFirebaseUid = String(firebaseUid || "").trim();
  if (!cleanFirebaseUid) {
    sendJson(res, 400, { message: "firebaseUid is required." });
    return;
  }

  const sql =
    "SELECT wu.workspace_id, wu.role, wu.email, w.name, w.invite_code FROM workspace_users wu INNER JOIN workspaces w ON w.id = wu.workspace_id WHERE wu.firebase_uid = ? LIMIT 1";

  query(sql, [cleanFirebaseUid], (err, results) => {
    if (err) {
      sendJson(res, 500, { message: "Database error", details: err.message });
      return;
    }

    if (results.length === 0) {
      sendJson(res, 404, {
        message: "Workspace membership not found for user.",
      });
      return;
    }

    sendJson(res, 200, {
      workspaceId: results[0].workspace_id,
      workspaceName: results[0].name,
      inviteCode: results[0].invite_code,
      role: results[0].role,
      email: results[0].email,
    });
  });
}

function handleSaveEmployee(req, res, parsedUrl) {
  resolveWorkspaceIdFromRequest(req, parsedUrl, (workspaceErr, workspaceId) => {
    if (workspaceErr) {
      sendJson(res, 400, { message: workspaceErr.message });
      return;
    }

    if (requiresWorkspaceColumn(workspaceId, res)) {
      return;
    }

    parseRequestBody(req, (bodyErr, data) => {
      if (bodyErr) {
        sendJson(res, 400, { message: bodyErr.message });
        return;
      }

      const firstName = data.FirstName;
      const lastName = data.LastName;
      const dateOfBirth = data.DateOfBirth;
      const position = data.Position;
      const hourlyWage = parseFloat(data.HourlyWage);
      const email = data.Email;
      const phoneNumber = data.PhoneNumber;

      if (Number.isNaN(hourlyWage)) {
        sendJson(res, 400, { message: "HourlyWage must be a number." });
        return;
      }

      const sqlWithWorkspace =
        "INSERT INTO employees (workspace_id, first_name, last_name, date_of_birth, position, hourly_wage, email, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const sqlWithoutWorkspace =
        "INSERT INTO employees (first_name, last_name, date_of_birth, position, hourly_wage, email, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)";
      const sql = hasEmployeeWorkspaceColumn
        ? sqlWithWorkspace
        : sqlWithoutWorkspace;
      const params = hasEmployeeWorkspaceColumn
        ? [
            workspaceId,
            firstName,
            lastName,
            dateOfBirth,
            position,
            hourlyWage,
            email,
            phoneNumber,
          ]
        : [
            firstName,
            lastName,
            dateOfBirth,
            position,
            hourlyWage,
            email,
            phoneNumber,
          ];

      query(sql, params, (err) => {
        if (err) {
          sendJson(res, 500, {
            message: "Database error",
            details: err.message,
          });
          return;
        }

        sendJson(res, 200, {
          message: "Employee information was saved!",
          workspaceId,
        });
      });
    });
  });
}

function handleGetEmployees(req, res, parsedUrl) {
  resolveWorkspaceIdFromRequest(req, parsedUrl, (workspaceErr, workspaceId) => {
    if (workspaceErr) {
      sendJson(res, 400, { message: workspaceErr.message });
      return;
    }

    if (requiresWorkspaceColumn(workspaceId, res)) {
      return;
    }

    const whereClause = buildWorkspaceWhereClause(workspaceId);
    const sql = `SELECT * FROM employees${whereClause.sql}`;

    query(sql, whereClause.params, (err, results) => {
      if (err) {
        sendJson(res, 500, { message: "Database error", details: err.message });
        return;
      }

      sendJson(res, 200, results);
    });
  });
}

function handleDeleteEmployee(req, res, parsedUrl, employeeId) {
  resolveWorkspaceIdFromRequest(req, parsedUrl, (workspaceErr, workspaceId) => {
    if (workspaceErr) {
      sendJson(res, 400, { message: workspaceErr.message });
      return;
    }

    if (requiresWorkspaceColumn(workspaceId, res)) {
      return;
    }

    const numericEmployeeId = Number(employeeId);
    if (!Number.isInteger(numericEmployeeId) || numericEmployeeId <= 0) {
      sendJson(res, 400, { message: "Invalid employee id." });
      return;
    }

    const sql =
      hasEmployeeWorkspaceColumn && workspaceId !== null
        ? "DELETE FROM employees WHERE id = ? AND workspace_id = ?"
        : "DELETE FROM employees WHERE id = ?";
    const params =
      hasEmployeeWorkspaceColumn && workspaceId !== null
        ? [numericEmployeeId, workspaceId]
        : [numericEmployeeId];

    query(sql, params, (err, results) => {
      if (err) {
        sendJson(res, 500, { message: "Database error", details: err.message });
        return;
      }

      if (results.affectedRows === 0) {
        sendJson(res, 404, {
          message: "Employee not found for this workspace.",
        });
        return;
      }

      sendJson(res, 200, { message: "Employee was deleted successfully" });
    });
  });
}

function handleGetStats(req, res, parsedUrl) {
  resolveWorkspaceIdFromRequest(req, parsedUrl, (workspaceErr, workspaceId) => {
    if (workspaceErr) {
      sendJson(res, 400, { message: workspaceErr.message });
      return;
    }

    if (requiresWorkspaceColumn(workspaceId, res)) {
      return;
    }

    const whereClause = buildWorkspaceWhereClause(workspaceId);
    const sql = `SELECT COUNT(*) AS TotalNumberEmployees, SUM(hourly_wage) AS TotalHourlyWage, MIN(hourly_wage) AS LowestHourlyWage, MAX(hourly_wage) AS HighestHourlyWage FROM employees${whereClause.sql}`;

    query(sql, whereClause.params, (err, results) => {
      if (err) {
        sendJson(res, 500, { message: "Database error", details: err.message });
        return;
      }

      const totalNumberEmployees = results[0].TotalNumberEmployees || 0;
      const totalHourlyWage = results[0].TotalHourlyWage || 0;
      const lowestHourlyWage = results[0].LowestHourlyWage || 0;
      const highestHourlyWage = results[0].HighestHourlyWage || 0;

      sendJson(res, 200, {
        TotalNumberEmployees: totalNumberEmployees,
        TotalHourlyWage: totalHourlyWage,
        LowestHourlyWage: lowestHourlyWage,
        HighestHourlyWage: highestHourlyWage,
      });
    });
  });
}

function handleSearchEmployees(req, res, parsedUrl, firstName) {
  resolveWorkspaceIdFromRequest(req, parsedUrl, (workspaceErr, workspaceId) => {
    if (workspaceErr) {
      sendJson(res, 400, { message: workspaceErr.message });
      return;
    }

    if (requiresWorkspaceColumn(workspaceId, res)) {
      return;
    }

    const decodedFirstName = decodeURIComponent(firstName || "");
    const whereClause =
      hasEmployeeWorkspaceColumn && workspaceId !== null
        ? "WHERE first_name = ? AND workspace_id = ?"
        : "WHERE first_name = ?";
    const params =
      hasEmployeeWorkspaceColumn && workspaceId !== null
        ? [decodedFirstName, workspaceId]
        : [decodedFirstName];
    const sql = `SELECT * FROM employees ${whereClause}`;

    query(sql, params, (err, results) => {
      if (err) {
        sendJson(res, 500, { message: "Database error", details: err.message });
        return;
      }

      sendJson(res, 200, results);
    });
  });
}

// This actually connects us to our MySQL database and informs us whether the connection was a success or if an error (err) is thrown
connection.connect((err) => {
  if (err) {
    console.log("There was an error connecting to the database :(");
    return;
  }

  query(
    "SHOW COLUMNS FROM employees LIKE 'workspace_id'",
    [],
    (columnErr, results) => {
      if (!columnErr && results.length > 0) {
        hasEmployeeWorkspaceColumn = true;
      }

      console.log("A connection has been established :)");
      if (!hasEmployeeWorkspaceColumn) {
        console.log(
          "employees.workspace_id not detected. Run the workspace migration for tenant isolation.",
        );
      }
    },
  );
});

// This creates an HTTP server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Workspace-Code",
  );

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, "http://localhost:3000");
  const pathname = parsedUrl.pathname;

  if (req.method === "POST" && pathname === "/workspace/create-owner") {
    handleCreateOwnerWorkspace(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/workspace/join") {
    handleJoinWorkspace(req, res);
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/workspace/user/")) {
    const firebaseUid = pathname.split("/")[3];
    handleGetUserWorkspace(res, firebaseUid);
    return;
  }

  if (req.method === "POST" && pathname === "/save") {
    handleSaveEmployee(req, res, parsedUrl);
    return;
  }

  if (req.method === "GET" && pathname === "/employees") {
    handleGetEmployees(req, res, parsedUrl);
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/employees/")) {
    const employeeId = pathname.split("/")[2];
    handleDeleteEmployee(req, res, parsedUrl, employeeId);
    return;
  }

  if (req.method === "GET" && pathname === "/stats") {
    handleGetStats(req, res, parsedUrl);
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/search/")) {
    const firstName = pathname.split("/")[2];
    handleSearchEmployees(req, res, parsedUrl, firstName);
    return;
  }

  sendJson(res, 404, { message: "Endpoint not found." });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
