/* =========================================================
   1. CONFIGURATION
========================================================= */

const API_KEY = "a611fa5fbe5627cb254035aa4dc274ee";

const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

const API_UNITS = "metric";

const API_LANGUAGE = "fr";

const MAX_HISTORY = 5;

const STORAGE_KEY = "datadash_recent_searches";


/* =========================================================
   2. SÉLECTION DES ÉLÉMENTS DU DOM
========================================================= */

const searchForm = document.querySelector("#search-form");

const searchInput = document.querySelector("#city-search");

const cityName = document.querySelector("#city-name");

const countryName = document.querySelector("#country-name");

const currentTemperature = document.querySelector("#current-temperature");

const weatherText = document.querySelector("#weather-text");

const weatherIcon = document.querySelector("#weather-icon");

const temperatureMin = document.querySelector("#temperature-min");

const temperatureMax = document.querySelector("#temperature-max");

const humidity = document.querySelector("#humidity");

const humidityProgress = document.querySelector("#humidity-progress");

const windSpeed = document.querySelector("#wind-speed");

const windDirection = document.querySelector("#wind-direction");

const cloudCover = document.querySelector("#cloud-cover");

const cloudProgress = document.querySelector("#cloud-progress");

const sunrise = document.querySelector("#sunrise");

const sunset = document.querySelector("#sunset");

const currentDate = document.querySelector("#current-date");

const currentTime = document.querySelector("#current-time");

const forecastList = document.querySelector("#forecast-list");

const recentSearchesList = document.querySelector("#recent-searches-list");

const clearHistoryButton = document.querySelector("#clear-history");

const locationButton = document.querySelector("#location-button");

const currentLocationButton = document.querySelector("#current-location");


/* =========================================================
   3. FONCTIONS UTILITAIRES
========================================================= */

/**
 * Arrondit un nombre à l'entier le plus proche.
 *
 * @param {number} value - Nombre à arrondir.
 * @returns {number} Nombre arrondi.
 */
function roundNumber(value) {
    return Math.round(value);
}


/**
 * Convertit un timestamp UNIX en heure lisible.
 *
 * @param {number} timestamp - Timestamp UNIX en secondes.
 * @param {number} timezone - Décalage horaire fourni par l'API.
 * @returns {string} Heure au format HH:MM.
 */
function formatTime(timestamp, timezone = 0) {

    const date = new Date(
        (timestamp + timezone) * 1000
    );

    return date.toISOString().slice(11, 16);
}


/**
 * Formate une date UNIX en date française.
 *
 * @param {number} timestamp - Timestamp UNIX.
 * @param {number} timezone - Décalage horaire en secondes.
 * @returns {string} Date formatée.
 */
function formatDate(timestamp, timezone = 0) {

    const date = new Date(
        (timestamp + timezone) * 1000
    );

    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(date);
}


/**
 * Convertit une direction en degrés vers une direction
 * cardinale lisible.
 *
 * @param {number} degrees - Direction du vent en degrés.
 * @returns {string} Direction cardinale.
 */
function getWindDirection(degrees) {

    const directions = [
        "Nord",
        "Nord-Est",
        "Est",
        "Sud-Est",
        "Sud",
        "Sud-Ouest",
        "Ouest",
        "Nord-Ouest"
    ];

    const index =
        Math.round(degrees / 45) % 8;

    return directions[index];
}


/**
 * Retourne l'emoji correspondant au code météo OpenWeather.
 *
 * @param {string} iconCode - Code de l'icône OpenWeather.
 * @returns {string} Emoji météo.
 */
function getWeatherEmoji(iconCode) {

    const weatherIcons = {
        "01d": "☀️",
        "01n": "🌙",
        "02d": "🌤️",
        "02n": "☁️",
        "03d": "☁️",
        "03n": "☁️",
        "04d": "☁️",
        "04n": "☁️",
        "09d": "🌧️",
        "09n": "🌧️",
        "10d": "🌦️",
        "10n": "🌧️",
        "11d": "⛈️",
        "11n": "⛈️",
        "13d": "❄️",
        "13n": "❄️",
        "50d": "🌫️",
        "50n": "🌫️"
    };

    return weatherIcons[iconCode] || "🌤️";
}


/**
 * Retourne l'URL de l'icône officielle OpenWeather.
 *
 * @param {string} iconCode - Code de l'icône.
 * @returns {string} URL de l'image.
 */
function getWeatherIconUrl(iconCode) {

    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}


/* =========================================================
   4. API — MÉTÉO ACTUELLE
========================================================= */

/**
 * Récupère la météo actuelle d'une ville.
 *
 * @param {string} city - Nom de la ville recherchée.
 * @returns {Promise<Object>} Données météo retournées par l'API.
 * @throws {Error} Si la requête échoue.
 */
async function getCurrentWeather(city) {

    const url =
        `${API_BASE_URL}/weather` +
        `?q=${encodeURIComponent(city)}` +
        `&appid=${API_KEY}` +
        `&units=${API_UNITS}` +
        `&lang=${API_LANGUAGE}`;

    const response = await fetch(url);

    if (!response.ok) {

        if (response.status === 404) {
            throw new Error("Ville introuvable.");
        }

        if (response.status === 401) {
            throw new Error("Clé API invalide.");
        }

        throw new Error(
            "Impossible de récupérer les données météo."
        );
    }

    return await response.json();
}


/* =========================================================
   5. API — PRÉVISIONS
========================================================= */

/**
 * Récupère les prévisions météorologiques.
 *
 * @param {string} city - Nom de la ville.
 * @returns {Promise<Object>} Données de prévisions.
 * @throws {Error} Si la requête échoue.
 */
async function getForecast(city) {

    const url =
        `${API_BASE_URL}/forecast` +
        `?q=${encodeURIComponent(city)}` +
        `&appid=${API_KEY}` +
        `&units=${API_UNITS}` +
        `&lang=${API_LANGUAGE}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Impossible de récupérer les prévisions."
        );
    }

    return await response.json();
}


/* =========================================================
   6. AFFICHAGE — MÉTÉO ACTUELLE
========================================================= */

/**
 * Met à jour le dashboard avec les données météo actuelles.
 *
 * @param {Object} data - Données retournées par OpenWeather.
 * @returns {void}
 */
function displayCurrentWeather(data) {

    const {
        name,
        sys,
        main,
        weather,
        wind,
        clouds,
        timezone
    } = data;


    /* Ville */

    cityName.innerHTML = `
        ${name}
        <i class="ph ph-map-pin"></i>
    `;


    /* Pays */

    countryName.textContent = getCountryName(sys.country);


    /* Température */

    currentTemperature.textContent = roundNumber(main.temp);


    /* Températures min / max */

    temperatureMin.textContent = `${roundNumber(main.temp_min)}°C`;

    temperatureMax.textContent = `${roundNumber(main.temp_max)}°C`;


    /* Description */

    weatherText.textContent = capitalize(weather[0].description);


    /* Icône */

    weatherIcon.textContent = getWeatherEmoji(weather[0].icon);


    /* Humidité */

    humidity.textContent = `${main.humidity}%`;

    humidityProgress.style.setProperty(
        "--progress",
        `${main.humidity}%`
    );


    /* Vent */

    windSpeed.innerHTML = `
        ${Math.round(wind.speed * 10) / 10}
        <small>m/s</small>
    `;

    windDirection.textContent = getWindDirection(wind.deg);


    /* Nuages */

    cloudCover.textContent = `${clouds.all}%`;

    cloudProgress.style.setProperty(
        "--progress",
        `${clouds.all}%`
    );


    /* Lever / coucher du soleil */

    sunrise.textContent = formatTime(sys.sunrise, timezone);

    sunset.textContent = formatTime(sys.sunset, timezone);


    /* Date / heure */

    currentDate.textContent =
        formatDate(
            Math.floor(Date.now() / 1000),
            timezone
        );

    currentTime.textContent =
        getCurrentLocalTime(timezone);
}


/* =========================================================
   7. AFFICHAGE — PRÉVISIONS
========================================================= */

/**
 * Sélectionne une prévision représentative par jour.
 *
 * L'API fournit une prévision toutes les 3 heures.
 * On sélectionne celle qui se rapproche le plus de midi.
 *
 * @param {Array<Object>} list - Liste des prévisions.
 * @returns {Array<Object>} Prévisions sélectionnées.
 */
function getDailyForecasts(list) {

    const forecastsByDay = {};


    list.forEach(item => {

        const date =
            item.dt_txt.split(" ")[0];

        if (!forecastsByDay[date]) {
            forecastsByDay[date] = [];
        }

        forecastsByDay[date].push(item);

    });


    return Object.values(forecastsByDay)
        .slice(0, 5)
        .map(dayForecasts => {

            return dayForecasts.reduce(
                (closest, current) => {

                    const closestHour =
                        Math.abs(
                            new Date(
                                closest.dt_txt
                            ).getHours() - 12
                        );

                    const currentHour =
                        Math.abs(
                            new Date(
                                current.dt_txt
                            ).getHours() - 12
                        );

                    return currentHour < closestHour
                        ? current
                        : closest;

                }
            );

        });
}


/**
 * Affiche les prévisions météorologiques dans le DOM.
 *
 * @param {Object} data - Données Forecast de l'API.
 * @returns {void}
 */
function displayForecast(data) {

    const forecasts =
        getDailyForecasts(data.list);


    forecastList.innerHTML = "";


    forecasts.forEach((forecast, index) => {

        const date =
            new Date(forecast.dt_txt);


        const dayName =
            index === 0
                ? "Aujourd'hui"
                : new Intl.DateTimeFormat("fr-FR", {
                    weekday: "long"
                }).format(date);


        const card =
            document.createElement("article");


        card.className =
            "forecast-card";


        card.innerHTML = `

            <span>
                ${capitalize(dayName)}
            </span>

            <img
                src="${getWeatherIconUrl(
            forecast.weather[0].icon
        )}"
                alt="${forecast.weather[0].description}"
            >

            <strong>
                ${roundNumber(forecast.main.temp)}°C
            </strong>

            <small>
                ${roundNumber(forecast.main.temp_min)}°C
            </small>

        `;


        forecastList.appendChild(card);

    });
}


/* =========================================================
   8. HISTORIQUE
========================================================= */

/**
 * Récupère l'historique des recherches depuis le localStorage.
 *
 * @returns {string[]} Liste des villes.
 */
function getSearchHistory() {

    const history =
        localStorage.getItem(STORAGE_KEY);

    return history
        ? JSON.parse(history)
        : [];
}


/**
 * Sauvegarde une ville dans l'historique.
 *
 * Les doublons sont supprimés et seules les cinq dernières
 * recherches sont conservées.
 *
 * @param {string} city - Ville recherchée.
 * @returns {void}
 */
function saveToSearchHistory(city) {

    let history =
        getSearchHistory();


    history = history.filter(
        item =>
            item.toLowerCase() !==
            city.toLowerCase()
    );


    history.unshift(city);


    history =
        history.slice(0, MAX_HISTORY);


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
    );


    displaySearchHistory();
}


/**
 * Affiche l'historique des recherches.
 *
 * @returns {void}
 */
function displaySearchHistory() {

    const history =
        getSearchHistory();


    recentSearchesList.innerHTML = "";


    history.forEach(city => {

        const button =
            document.createElement("button");


        button.className =
            "search-tag";


        button.type = "button";


        button.dataset.city =
            city;


        button.innerHTML = `
            ${city}
            <i class="ph ph-clock"></i>
        `;


        button.addEventListener(
            "click",
            () => searchCity(city)
        );


        recentSearchesList.appendChild(button);

    });

}


/**
 * Supprime toutes les recherches enregistrées.
 *
 * @returns {void}
 */
function clearSearchHistory() {

    localStorage.removeItem(
        STORAGE_KEY
    );

    displaySearchHistory();
}


/* =========================================================
   9. RECHERCHE PRINCIPALE
========================================================= */

/**
 * Recherche une ville et met à jour tout le dashboard.
 *
 * @param {string} city - Ville à rechercher.
 * @returns {Promise<void>}
 */
async function searchCity(city) {

    const cleanCity =
        city.trim();


    if (!cleanCity) {
        return;
    }


    try {

        setLoading(true);


        const [
            currentWeather,
            forecast
        ] = await Promise.all([

            getCurrentWeather(cleanCity),

            getForecast(cleanCity)

        ]);


        displayCurrentWeather(
            currentWeather
        );


        displayForecast(
            forecast
        );


        saveToSearchHistory(
            currentWeather.name
        );


    } catch (error) {

        showError(
            error.message
        );

    } finally {

        setLoading(false);

    }

}


/* =========================================================
   10. GÉOLOCALISATION
========================================================= */

/**
 * Récupère la météo à partir de la position GPS.
 *
 * @returns {void}
 */
function getCurrentLocation() {

    if (!navigator.geolocation) {

        showError(
            "La géolocalisation n'est pas disponible."
        );

        return;
    }


    setLoading(true);


    navigator.geolocation.getCurrentPosition(

        async position => {

            const {
                latitude,
                longitude
            } = position.coords;


            try {

                const data =
                    await getWeatherByCoordinates(
                        latitude,
                        longitude
                    );


                const forecast =
                    await getForecastByCoordinates(
                        latitude,
                        longitude
                    );


                displayCurrentWeather(data);

                displayForecast(forecast);


                saveToSearchHistory(
                    data.name
                );


            } catch (error) {

                showError(
                    error.message
                );

            } finally {

                setLoading(false);

            }

        },


        () => {

            setLoading(false);

            showError(
                "Impossible d'obtenir votre position."
            );

        }

    );

}


/**
 * Récupère la météo actuelle à partir de coordonnées GPS.
 *
 * @param {number} latitude - Latitude.
 * @param {number} longitude - Longitude.
 * @returns {Promise<Object>} Données météo.
 */
async function getWeatherByCoordinates(
    latitude,
    longitude
) {

    const url =
        `${API_BASE_URL}/weather` +
        `?lat=${latitude}` +
        `&lon=${longitude}` +
        `&appid=${API_KEY}` +
        `&units=${API_UNITS}` +
        `&lang=${API_LANGUAGE}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Impossible de récupérer la météo."
        );

    }


    return await response.json();

}


/**
 * Récupère les prévisions à partir de coordonnées GPS.
 *
 * @param {number} latitude - Latitude.
 * @param {number} longitude - Longitude.
 * @returns {Promise<Object>} Données Forecast.
 */
async function getForecastByCoordinates(
    latitude,
    longitude
) {

    const url =
        `${API_BASE_URL}/forecast` +
        `?lat=${latitude}` +
        `&lon=${longitude}` +
        `&appid=${API_KEY}` +
        `&units=${API_UNITS}` +
        `&lang=${API_LANGUAGE}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Impossible de récupérer les prévisions."
        );

    }


    return await response.json();

}


/* =========================================================
   11. DATE / HEURE
========================================================= */

/**
 * Retourne l'heure locale correspondant au timezone
 * fourni par OpenWeatherMap.
 *
 * @param {number} timezone - Décalage en secondes.
 * @returns {string} Heure HH:MM.
 */
function getCurrentLocalTime(timezone) {

    const now =
        new Date();


    const utc =
        now.getTime()
        + now.getTimezoneOffset() * 60000;


    const localDate =
        new Date(
            utc + timezone * 1000
        );


    return localDate.toLocaleTimeString(
        "fr-FR",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

}


/* =========================================================
   12. PAYS
========================================================= */

/**
 * Convertit un code pays ISO en nom français.
 *
 * @param {string} countryCode - Code ISO du pays.
 * @returns {string} Nom du pays.
 */
function getCountryName(countryCode) {

    try {

        return new Intl.DisplayNames(
            ["fr"],
            {
                type: "region"
            }
        ).of(countryCode);

    } catch {

        return countryCode;

    }

}


/* =========================================================
   13. TEXTE
========================================================= */

/**
 * Met la première lettre d'une chaîne en majuscule.
 *
 * @param {string} text - Texte.
 * @returns {string} Texte capitalisé.
 */
function capitalize(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase()
        + text.slice(1)
    );

}


/* =========================================================
   14. LOADING
========================================================= */

/**
 * Indique visuellement que les données sont en cours
 * de chargement.
 *
 * @param {boolean} loading - État de chargement.
 * @returns {void}
 */
function setLoading(loading) {

    if (loading) {

        document.body.classList.add(
            "is-loading"
        );

    } else {

        document.body.classList.remove(
            "is-loading"
        );

    }

}


/* =========================================================
   15. ERREURS
========================================================= */

/**
 * Affiche une erreur à l'utilisateur.
 *
 * @param {string} message - Message d'erreur.
 * @returns {void}
 */
function showError(message) {

    console.error(message);

    alert(message);

}


/* =========================================================
   16. ÉVÉNEMENTS
========================================================= */

/**
 * Gère la soumission du formulaire de recherche.
 */
searchForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        console.log("search")
        const city =
            searchInput.value;


        searchCity(city);


        searchInput.value = "";

    }
);


/**
 * Gère le clic sur le bouton de géolocalisation.
 */
locationButton.addEventListener(
    "click",
    getCurrentLocation
);


/**
 * Gère le clic sur le bouton secondaire de géolocalisation.
 */
currentLocationButton.addEventListener(
    "click",
    getCurrentLocation
);


/**
 * Gère la suppression de l'historique.
 */
clearHistoryButton.addEventListener(
    "click",
    clearSearchHistory
);


/* =========================================================
   17. INITIALISATION
========================================================= */

/**
 * Initialise l'application.
 *
 * La ville chargée par défaut est Brazzaville.
 *
 * @returns {Promise<void>}
 */
async function init() {

    displaySearchHistory();

    await searchCity("Brazzaville");

}

init();