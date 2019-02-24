// Fetch api key for openweathermap.com at app start time
const fetchKey = () => {
  return fetch("/get-key")
    .then(res => res.json())
    .then(result => {
      window.apiKey = result.key;
    })
    .catch(err => {
      console.error(`Error fetching key: ${err}`);
    });
};

export default fetchKey;
