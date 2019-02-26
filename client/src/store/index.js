// Svelte includes a lightweight state management implementation
import { Store } from "svelte/store";
// Load data from the api server on app launch
import apiCall from "../utils";
import { getEndpoints } from "../config";

const store = new Store();

(async function getInitialState() {
  try {
    const [readers, health, operations] = await Promise.all(
      Object.keys(getEndpoints).map(endpoint => apiCall(getEndpoints[endpoint]))
    );
    store.set({
      readers: readers,
      health: health,
      operations: operations
    });
  } catch (err) {
    console.error(`Error getting data from server: ${err}`);
  }
})();

export default store;
