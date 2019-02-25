// bootstrap the client application
import { Store } from "svelte/store";

import "./app.scss";
import App from "./App.html";

import apiCall from "./utils/api";
import { getEndpoints } from "./config";

const store = new Store();

(async function getInitialState() {
  try {
    const [readers, health, operations] = await Promise.all(
      Object.keys(getEndpoints).map(endpoint => apiCall(getEndpoints[endpoint]))
    );
    store.set({
      readers,
      health,
      operations
    });
    // console.log('store: ', store)
  } catch (err) {
    console.error(`Error getting initial data: ${err}`);
  }
})();

const app = new App({
  target: document.querySelector("#microsense-ui__wrapper"),
  store
});

export default app;
