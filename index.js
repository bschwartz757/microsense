const express = require("express");
const bodyParser = require("body-parser");
const readers = require("./data/readers");
const health = require("./data/health");
const operations = require("./data/operations");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("port", process.env.PORT || 3000);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.options("*", cors());

app.get("/api/readers", cors(), (req, res) => {
  res.json(readers);
});

app.get("/api/health", cors(), (req, res) => {
  res.json(health);
});

app.get("/api/operations", cors(), (req, res) => {
  res.json(operations);
});

app.post("/api/jobs", cors(), (req, res) => {
  if (!req.body) return res.status(400).send("Empty Request");

  const operation = req.body.operation;
  const readers = req.body.readers;

  if (!operation) return res.status(400).send("Missing Operation");
  if (!operations.includes(operation))
    return res.status(400).send("Invalid Operation");
  if (!(readers && readers.length))
    return res.status(400).send("Missing Readers");

  return res.sendStatus(200);
});

//404 catch-all handler
app.use(function(req, res) {
  res.type("text/plain");
  res.status(404);
  res.send("404 - Not Found");
});

//500 error handler
app.use(function(err, req, res, next) {
  res.status(500).render("500");
});

const port = app.get("port");

app.listen(port, () => {
  console.log(
    `Express started on http://localhost:${port}; press Ctrl-C to terminate.`
  );
});
