// bootstrap the client application
import "./app.scss";
import App from "./App.html";

import store from "./store";
console.log("store get: ", store);

const app = new App({
  target: document.querySelector("#microsense-ui__wrapper"),
  store
});

export default app;
