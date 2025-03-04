//Global variables
const searchBtn = document.getElementById('search-button');
const todayEl = document.getElementById('today');
const forecastDiv = document.getElementById('forecast');
const historyDiv = document.getElementById('history');
const buttonsDiv = document.getElementById('buttons');
const clearBtn = document.createElement('button');
clearBtn.setAttribute('id', 'clear-button');
const errorDisplay = document.getElementById('error-display');
const errorDiv = document.createElement('div');
errorDiv.setAttribute('id', 'error-message');
const apiKey = '65460f2d682dbe6e454f0b9ada6fd285';
let cityName;
let queryURL;
let cityArray = [];
let dateArray = [];
let tempArray = [];
let maxTempArray = [];
let minTempArray = [];
let iconArray = [];
let humidArray = [];
let sortedMax;
let sortedMin;
let allIcons;
let sortedHumidity;
let history = [];
let exists = false;
let localString;
let clearBtnExists = false;
const notFound = 'This city is not recognised. Please try again';
const errorMsg = `There is an error with your search. <br/>Please check your Internet connection`;

//Geocode city
function queryInfo (input) {
    const query = input;
    const geocode = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
    
    //Fetch request
    fetch(geocode)
    .then((response) => {
        return response.json();
    })
    .then((data) => {  
        const city = data[0];
        const lat = city?.lat;
        const lon = city?.lon;
        cityName = city?.name;
        let newCity = {name: cityName, lat: lat, lon: lon, date: '', icon: '', temp: '', humidity: '', windSpeed: '', forecast: []}
        cityArray.push(newCity);
        
        
        lat ? weatherData(newCity) : errorMessage (notFound); 
           
    })
    .catch((err)=>{
        errorMessage (errorMsg);
    });
};

//Make a request with the city's latitde and longitude
function weatherData (city) {
    
    queryURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${apiKey}`; 
          
    fetch(queryURL)
        .then((query) => {
            return query.json();
          })
          .then((result) => {  
            const current = result?.list[0];
            
            //Current day
            city = {name: city.name, lat: city.lat, lon: city.lon, date: '', icon: '', temp: '', humidity: '', windSpeed: '', forecast: []}

            city.date = dayjs().format('ddd DD MMM YYYY');
            city.icon = `<img src="https://openweathermap.org/img/wn/${current?.weather[0].icon}@4x.png" />`;
            city.temp = `${current?.main.temp}°C`;
            city.humidity = `<span>Humidity</span> ${current?.main.humidity}%`;
            city.windSpeed = `<span>Wind Speed</span> ${(current?.wind.speed*3.6).toFixed(1)} km/h`;

            //Five-day forecast
            const future = result.list;       

            for (i=0; i<5; i++){
                const forecastData = {date: '', icon:'', maxTemp: '', minTemp:'', humidity:''};
                
                dateArray = [];
                let date = dayjs().add([i+1], 'day').format('YYYY-MM-DD');
                
                //getting five-day foreast dates from api and making an array of all matching dates
                future.map((object)=>{
                    let item = object.dt_txt.slice(0,10);
                    if (item===date){
                        dateArray.push(object); 
                    };
                });

                maxTempArray=[];
                minTempArray=[];
                iconArray = [];
                humidArray = [];
                let count=0;

                dateArray.map((index)=>{
                    maxTempArray.push(dateArray[count].main.temp_max);
                    minTempArray.push(dateArray[count].main.temp_min);
                    iconArray.push(dateArray[count].weather[0].icon);
                    humidArray.push(dateArray[count].main.humidity);
                    count++;
                });

                sortData();

                //Set the forecast values
                forecastData.date = dayjs().add([i+1], 'day').format('ddd DD MMM');
                forecastData.maxTemp = `${sortedMax[0]} ° C`;
                forecastData.minTemp = `${sortedMin[0]} ° C`;
                forecastData.icon =`<img src="https://openweathermap.org/img/wn/${iconArray[0]||allIcons[0]}@2x.png" />`;
                forecastData.humidity = `${sortedHumidity[0]}%`;
                city.forecast.push(forecastData);
            };

            const previous = {name: city.name, lat: city.lat, lon: city.lon};

            //Check whether city is already in the search history array and add it if it isn't
            exists = false;

            for (i=0; i<history.length; i++){
                if (history[i].name === previous.name){
                    exists = true;
                } else {
                    history;
                };
            };

            exists ? history: history.push(previous);
            
            //Save to local storage, add clear history button and forecast data to the page
            localise();
            clearHistory();
            renderData(city);
        })
        .catch((err)=>{
            errorMessage (errorMsg);
        });
};

//Sort forecast data by ascending or descending order and filter the icons to prioritise daytime icons
function sortData () {
    //Temperature
    sortedMax = maxTempArray.sort((a,b)=>{return b-a})
    sortedMin = minTempArray.sort((a,b)=>{return a-b})

    //Icons
    allIcons = iconArray;
    iconArray = iconArray.filter((icon)=> icon.includes('d'));

    //Humidity
    sortedHumidity = humidArray.sort((a,b)=>{return b-a});
};

//Display weather data on the page
function renderData (data) {
    //Current day data
    todayEl.innerHTML = '';
    let displayArray = Object.keys(data);
    let keys = displayArray.filter((key)=> !key.includes('forecast') && !key.includes('lat') && !key.includes('lon'));
    let todayContainer = document.createElement('div');
    todayContainer.setAttribute('id', 'today-container');
    let todayTextBox = document.createElement('div');
    todayTextBox.setAttribute('id', 'today-textbox');
    
    for (i=0; i<keys.length; i++) {
        let infoDiv = document.createElement('div')
        infoDiv.setAttribute('id', `today-${keys[i]}`);
        infoDiv.setAttribute('class', 'today-info');
        infoDiv.innerHTML = data[keys[i]];
        todayTextBox.append(infoDiv);
    };

    todayContainer.append(todayTextBox);
    todayEl.append(todayContainer);
    
    //Five-day forecast data
    forecastDiv.innerHTML = '';
    for(i=0; i<5; i++){
        displayArray = Object.keys(data.forecast[i]);
        keys = displayArray;
        let forecastContainer = document.createElement('div');
        forecastContainer.setAttribute('id', `forecast-container-${[i+1]}`);
        forecastContainer.setAttribute('class', 'forecast-container');
        let forecastTextBox = document.createElement('div');
        forecastTextBox.setAttribute('id', `forecast-textbox-${[i+1]}`);
        forecastTextBox.setAttribute('class', 'forecast-textbox');
    
        for (j=0; j<keys.length; j++) {
            let infoDiv = document.createElement('div');
            infoDiv.setAttribute('id', `forecast${[i+1]}-${keys[j]}`);
            infoDiv.setAttribute('class', 'forecast-info');
            infoDiv.innerHTML = data.forecast[i][keys[j]];
            forecastTextBox.append(infoDiv);
        };
        
        forecastContainer.append(forecastTextBox);
        forecastDiv.append(forecastContainer);
        
    };
        savedSearch(history);
};

//Create and display previous search buttons
function savedSearch (array){
    historyDiv.innerHTML = '';

    const ulEl = document.createElement('ul');
    for (i=0; i<array.length; i++){
        let liEl = document.createElement('li');
        liEl.setAttribute('class', 'history-list');
        let button = document.createElement('button');
        button.setAttribute('class', 'history-button');
        button.innerText = array[i].name;
        let cityBtn = array[i];

        button.addEventListener('click', (e)=>{
            e.preventDefault();
            weatherData(cityBtn);
        });

        liEl.appendChild(button);
        ulEl.appendChild(liEl);
    };

    historyDiv.appendChild(ulEl);
};

//Set history array to local storage or retrieve it if it already exists
function initialise (){
    let localHistory = localStorage.getItem('localHistory');
    if (localHistory){
        history = JSON.parse(localHistory);
        savedSearch(history);
    } else {
        localString = JSON.stringify(history);
        localStorage.setItem('localHistory', localString);
    };
};

//Save search history array to local storage
function localise (){
    localString = JSON.stringify(history);
    localStorage.setItem('localHistory', localString);
};

//Clear the search history
function clear (){
    history = [];
    clearBtnExists = false;
    
    localise();
    initialise();
};

//Create and append the clear history button
function clearHistory () {
    if (!clearBtnExists && history.length>0) {
            clearBtn.style.display = 'inline-block';
            clearBtn.innerText = 'Clear History';
            buttonsDiv.append(clearBtn);
            clearBtnExists = true;
            
            clearBtn.addEventListener('click', (e)=> {
            e.preventDefault();
            clearBtn.style.display = 'none';
            clear()});
    } else {
        clearBtn;
    };
};

//Display error message
function errorMessage (message) {
    errorDiv.innerHTML = message;
    errorDisplay.appendChild(errorDiv);
    errorDiv.style.display = 'block';
    let timeout = setTimeout(()=>{errorDiv.style.display = 'none'}, 5000);
};

//Submission button to handle the user's input
searchBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const searchInput = document.getElementById('search-input').value.toLowerCase().trim();
    const userQuery = searchInput;
    queryInfo(userQuery);
});

initialise();
clearHistory();