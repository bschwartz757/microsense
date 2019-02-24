const express = require("express"),
  app = express();

app.set("port", process.env.PORT || 8080);
app.use(express.static(`${__dirname}/public`));

//Public Routes
app.get("/get-key", function(req, res) {
  // makes the api key available in client code
  res.json({ key: apiKey });
});

//404 catch-all handler (middleware)
app.use(function(req, res) {
  res.type("text/plain");
  res.status(404);
  res.send("404 - Not Found");
});

//500 error handler (middleware)
app.use(function(err, req, res, next) {
  res.status(500).render("500");
});

app.listen(app.get("port"), function() {
  console.log(
    `Express started on http://localhost:${app.get(
      "port"
    )}; press Ctrl-C to terminate.`
  );
});
