// bootstrap the client application
import "./app.scss";
import App from "./App.html";

import store from "./store";

const app = new App({
  target: document.querySelector("#microsense-ui__wrapper"),
  store
});

export default app;
