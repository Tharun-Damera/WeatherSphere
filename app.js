const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const currentWeatherItemsEl = document.getElementById('current-weather');

const weatherForecastEl = document.getElementById('seven-day-container');

const error = document.getElementById('error');

let userLocation = "";

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

setInterval(() => {
    const time = new Date();
    const year = time.getFullYear();
    const month = time.getMonth();
    const date = time.getDate();
    const day = time.getDay();
    const hour = time.getHours();
    const hoursIn12Hr = hour >= 13 ? hour % 12 : hour;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const ampm = hour >= 12 ? 'PM' : 'AM';

    timeEl.innerHTML = hoursIn12Hr + ':' + minutes + ':' + seconds + ampm;

    dateEl.innerHTML = months[month] + ' ' + date + ', ' + year;

}, 1000);


const API_KEY = "b8a4689f44ae485a3c9c9143080332c4";

document.querySelector(".search-bar").addEventListener("keypress", function (event) {
    if (event.key == "Enter") {
        event.preventDefault();
        document.querySelector(".search-btn").click();
    }
});

document.querySelector('.search-btn').addEventListener("click", function () {
    const city = document.querySelector('#search-bar').value;
    cityToCoordinates(city);
});



async function getLocation() {
    try {
        navigator.geolocation.getCurrentPosition(success => {
            let { latitude, longitude } = success.coords;
            coordinatesToCity(latitude, longitude);
            getWeather(latitude, longitude);
        })
    } catch (e) {
        console.log(e);
    }
}

async function coordinatesToCity(latitude, longitude) {
    try {

        const coordURL =  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        const response = await fetch(coordURL);
        const jsonData = await response.json();

        userLocation = await jsonData.address.city;

    } catch (e) {
        console.log(e);
    }

}

async function getWeather(latitude, longitude) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&units=metric&appid=${API_KEY}`;
        fetch(url).then(response => response.json()).then(data => {
            console.log(data);
            showWeatherData(data);
        })
    } catch (e) {
        console.log(e);
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function cityToCoordinates(city) {

    try {
    
        const cityURL = `https://nominatim.openstreetmap.org/search?q=${city}&format=json`;
        const response = await fetch(cityURL);
        const jsonData = await response.json();

        userLocation = jsonData[0].name;

        latitude = jsonData[0].lat;
        longitude = jsonData[0].lon;

        getWeather(latitude, longitude);

    } catch (e) {
        error.innerHTML = "* Please enter valid input.";
        await sleep(3000)
        error.innerHTML = ""
    }

}




const severeWeatherConditions = ["Thunderstorm", "Rain", "Drizzle", "Tornado", "Snow"];

async function showWeatherData(data) {

    try {

        let { feels_like, humidity, pressure, sunrise, sunset, temp, wind_speed } = data.current;
        let { main, description, icon } = data.current.weather[0];
        let hrly = data.hourly;

        let status = false;
        for (let i = 0; i < 24; i++) {

            if (status == true) {
                break;
            }

            for (let j = 0; j < 5; j++) {

                if (hrly[i].weather[0].main == severeWeatherConditions[j]) {

                    const time = new Date(hrly[i].dt * 1000).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    let message = hrly[i].weather[0].main.toUpperCase() + " (" + hrly[i].weather[0].description.toUpperCase() + ")\nAt " + time;

                    if (Notification.permission == "granted") {
                        showNotification(message);
                    }
                    else if (Notification.permission != "denied") {
                        Notification.requestPermission().then(permission => {
                            if (permission == "granted") {
                                showNotification(message);
                            }
                        });
                    }
                    status = true;
                    break;
                }
            }
        }


        currentWeatherItemsEl.innerHTML =
            `<div id="c1">
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
            <h3 style="text-align:center;">${description.toUpperCase()}</h3>
        </div>
        <div id="c2">
            <h3>${userLocation}</h3>
            <h2>${temp}°C</h2>
            <h4>Feels like ${feels_like}°C</h4>
            <h4>Humidity: ${humidity}%</h5>
            <h4>Pressure: ${pressure / 1000} atm</h5>
            <h4>Wind Speed: ${wind_speed} m / sec</h5>
            <h4>Sunrise time: ${window.moment(sunrise * 1000).format('HH:mm a')} </h5>
            <h4>Sunset time: ${window.moment(sunset * 1000).format('HH:mm a')} </h5>
        </div>`;


        let dayForecast = ''
        data.daily.forEach((day, idx) => {
            if (idx > 0) {
                dayForecast += `
                <div class="seven-day-el">
                    <div class="day">${window.moment(day.dt * 1000).format('ddd')}</div>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="weather-icon" class="w-icon">
                    <div class="temp">Day: ${day.temp.day}°C</div>
                    <div class="temp">Night: ${day.temp.night}°C</div>
                </div>
                `
            }

        })

        weatherForecastEl.innerHTML = dayForecast;


        let hourly = getHourly(data.hourly, data.timezone);



        let chartStatus = Chart.getChart("chart");
        if (chartStatus != undefined) {
            chartStatus.destroy();
        }
        let chartEl = document.getElementById('chart').getContext('2d');

        let mixedChart = new Chart(chartEl, {
            type: "mixed",
            data: {
                datasets: hourly.datasets,
                labels: hourly.labels
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });






    } catch (e) {
        console.log(e.message);
    }


}



function showNotification(message) {
    const notification = new Notification("Weather Alert!", {
        body: message,
        icon: "snow.png"
    })

}

function updateChart() {
    let chartStatus = Chart.getChart("chart");
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
    myChart = document.getElementById('chart').getContext('2d');


}


// Hourly chart


const getHourly = (hourly, timezone) => {
    const times = [];
    const temps = [];
    const pressures = [];
    const humidities = [];
    const winds = [];
    const label = [
        "Temperature (°C)",
        "% Humidity",
        "Pressure (atm)",
        "Wind Speed (m/sec)",
    ];
    const yAxisID = "left-y-axis";
    const types = ["line", "line", "bar", "bar"];

    const backgroundColors = [
        "rgba(255, 99, 132, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
        "rgba(255, 159, 64, 0.2)",
        "rgba(155,234,54,0.2)",
    ];

    const borderColors = [
        "rgba(255, 99, 132, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(255, 159, 64, 1)",
        "rgba(155,234,54,1)",
    ];

    for (let i = 0; i < 24; i++) {
        const hour = hourly[i];
        const time = new Date(hour.dt * 1000).toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
        });
        times.push(`${time}`);

        temps.push(hour.temp);

        const pressure = hour.pressure * 0.0009869233;
        pressures.push(pressure.toFixed(2));

        humidities.push(hour.humidity);

        winds.push(hour.wind_speed);
    }
    const data = [temps, humidities, pressures, winds];
    const datasets = [];

    for (let j = 0; j < 4; j++) {
        const dataset = {
            type: types[j],
            label: label[j],
            data: data[j],
            backgroundColor: backgroundColors[j],
            borderColor: borderColors[j],
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 3,
            borderCapStyle: 'square',
            borderJoinStyle: 'round',
        };
        if (j === 2 || j === 3) {
            dataset.yAxisID = yAxisID
        }
        datasets.push(dataset);
    }

    const hourlyData = {
        labels: times,
        datasets: datasets,
    };

    return hourlyData;
};



sleep(2000)
cityToCoordinates('Hyderabad');
