// Un-comment if you want to use Bootstrap js
// import "./utils/bootstrap-libs";

// Fetch api key for openweathermap.com at app start time - only
// use this if running Express app with a valid api key in `key.txt`
import fetchKey from "./utils/fetchKey";
fetchKey();
// import "babel-polyfill";

import "./app.scss";

import App from "./App.html";

const app = new App({
  target: document.querySelector("#weather-app")
});

export default app;
