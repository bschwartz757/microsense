// Wrapper around fetch - allows for more flexibility
import { apiHost } from "../config";
const apiCall = async ({ route, method, payload = undefined }) => {
  const config = {
    method: method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    redirect: "follow",
    referrer: "no-referrer"
  };

  if (method === "POST" && payload) {
    config.body = JSON.stringify(payload);
  }

  try {
    return await fetch(`${apiHost}/${route}`, config)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
      })
      .then(result => {
        return result;
      });
  } catch (err) {
    throw new Error(`Error fetching data for route: ${route}, err: ${err}`);
  }
};

export default apiCall;
