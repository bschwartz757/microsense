const express = require("express");
const app = express();

app.set("port", process.env.PORT || 8080);
app.use(express.static(`${__dirname}/public`));

//Public Routes

//404 catch-all handler (middleware)
app.use(function(req, res) {
  res.type("text/plain");
  res.status(404);
  res.send("404 - Not Found");
});

//500 error handler (middleware)
app.use(function(err, req, res) {
  res.status(500).render("500");
});

const port = app.get("port");

app.listen(port, function() {
  console.log(
    `Express started on http://localhost:${port}; press Ctrl-C to terminate.`
  );
});
