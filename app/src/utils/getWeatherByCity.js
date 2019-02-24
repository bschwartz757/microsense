const kelvinToFahrenheit = val => {
  return parseInt((val - 273.15) * 1.8 + 32);
};

const kelvinToCelsius = val => {
  return parseInt(val - 273.15);
};

const getFiveDayForecast = (input = { city: "" }) => {
  return fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${
    input.city
  }&appid=${window.apiKey}
  `)
    .then(response => response.json())
    .then(results => {
      const forecastArr = results.list.filter(idx => {
        // selects the 2 o'clock pm forecast
        return new Date(idx.dt * 1000).getHours() === 14;
      });
      const weatherArr = forecastArr.map(obj => {
        const { dt, main, weather } = obj;
        return {
          date: new Date(dt * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          }),
          temp: {
            f: kelvinToFahrenheit(main.temp),
            c: kelvinToCelsius(main.temp)
          },
          humidity: main.humidity,
          conditions: {
            description: weather[0].description,
            icon: weather[0].icon
          }
        };
      });
      return weatherArr;
    })
    .catch(err => {
      throw new Error(err);
    });
};

export default getFiveDayForecast;
