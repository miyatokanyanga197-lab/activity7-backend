require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

// API guide for the marker
app.get("/", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campus Maintenance Requests API</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 860px; margin: 24px auto; padding: 0 16px; line-height: 1.5; color: #222; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #eef2f7; }
  pre { background: #f4f4f4; padding: 12px; overflow-x: auto; }
  .scroll { overflow-x: auto; }
</style>
</head>
<body>
<h1>Campus Maintenance Requests API</h1>
<p><strong>Student:</strong> Miyato Kanyanga &nbsp;|&nbsp; <strong>Student number:</strong> 202512628</p>
<p>ICT251 Activity 7. This backend stores campus maintenance requests (for example a broken light or a leaking tap) so that staff can track them from Pending to Completed.</p>
<p><strong>Live base URL:</strong> <a href="${base}">${base}</a></p>
<p>Quick links: <a href="/health">/health</a> | <a href="/api/records">/api/records</a></p>
<p><em>Note: this service runs on a free plan. If it has been idle, the first request may take up to a minute to start.</em></p>

<h2>Routes</h2>
<div class="scroll"><table>
<tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
<tr><td>GET</td><td>/</td><td>This API guide</td></tr>
<tr><td>GET</td><td>/health</td><td>Check the server and database</td></tr>
<tr><td>GET</td><td>/api/records</td><td>Read all records</td></tr>
<tr><td>GET</td><td>/api/records/:id</td><td>Read one record</td></tr>
<tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
<tr><td>PUT</td><td>/api/records/:id</td><td>Update a record (all four fields)</td></tr>
<tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
</table></div>

<h2>Fields (POST and PUT body)</h2>
<div class="scroll"><table>
<tr><th>Field</th><th>Rule</th></tr>
<tr><td>id</td><td>Made by the database. Do not send it.</td></tr>
<tr><td>title</td><td>Text, 3 to 80 characters</td></tr>
<tr><td>category</td><td>Text, 2 to 40 characters</td></tr>
<tr><td>description</td><td>Text, 5 to 300 characters</td></tr>
<tr><td>status</td><td>Exactly one of: Pending, In progress, Completed</td></tr>
</table></div>
<p>Example body for POST and PUT (send with Content-Type: application/json):</p>
<pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

<h2>Status codes</h2>
<div class="scroll"><table>
<tr><th>Code</th><th>Meaning</th></tr>
<tr><td>200</td><td>Success for GET, PUT and DELETE</td></tr>
<tr><td>201</td><td>Record created (POST)</td></tr>
<tr><td>400</td><td>Invalid input, invalid id or malformed JSON</td></tr>
<tr><td>404</td><td>Record or route not found</td></tr>
<tr><td>500</td><td>Unexpected server error</td></tr>
<tr><td>503</td><td>Database not responding (/health)</td></tr>
</table></div>
<p>Errors always return JSON like <code>{"message":"Title must have 3 to 80 characters."}</code></p>
</body>
</html>`);
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database is not responding." });
  }
});

app.use("/api/records", require("./routes/records"));

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (4 parameters)
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
