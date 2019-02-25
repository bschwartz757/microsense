// Wrapper around fetch - allows for more flexibility
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
    return await fetch(`http://localhost:3000/${route}`, config)
      .then(res => res.json())
      .then(result => result);
  } catch (err) {
    console.log(`Error fetching data for route: ${route}, err: ${err}`);
  }
};

export default apiCall;
