export const getEndpoints = {
  readers: {
    route: "api/readers",
    method: "GET"
  },
  health: {
    route: "api/health",
    method: "GET"
  },
  operations: {
    route: "api/operations",
    method: "GET"
  }
};

export const postEndpoints = {
  jobs: {
    route: "api/jobs",
    method: "POST"
  }
};

export const apiHost = "http://localhost:3000";
