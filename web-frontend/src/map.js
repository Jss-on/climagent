import { createApp } from 'vue';

let map;
let vectorSource;
let vectorLayer;
let markerSource;
let markerLayer;
let gpsActive = false;
let watchId = null;

const HOURLY_PARAMETERS = {
    temperature_2m: { label: 'Temperature', unit: '°C', color: '#5627FF' },
    relative_humidity_2m: { label: 'Relative Humidity', unit: '%', color: '#36A2EB' },
    dew_point_2m: { label: 'Dew Point', unit: '°C', color: '#4BC0C0' },
    apparent_temperature: { label: 'Feels Like', unit: '°C', color: '#FF9F40' },
    precipitation: { label: 'Precipitation', unit: 'mm', color: '#FF3D9A' },
    rain: { label: 'Rain', unit: 'mm', color: '#36A2EB' },
    snowfall: { label: 'Snowfall', unit: 'cm', color: '#FFFFFF' },
    snow_depth: { label: 'Snow Depth', unit: 'm', color: '#C9CBCF' },
    cloud_cover: { label: 'Cloud Cover', unit: '%', color: '#937AFF' },
    cloud_cover_low: { label: 'Low Clouds', unit: '%', color: '#FF9F40' },
    cloud_cover_mid: { label: 'Mid Clouds', unit: '%', color: '#FF6384' },
    cloud_cover_high: { label: 'High Clouds', unit: '%', color: '#9966FF' },
    wind_speed_10m: { label: 'Wind Speed', unit: 'km/h', color: '#F8DB46' },
    wind_direction_10m: { label: 'Wind Direction', unit: '°', color: '#4BC0C0' },
    wind_gusts_10m: { label: 'Wind Gusts', unit: 'km/h', color: '#FF9F40' },
    soil_temperature_0cm: { label: 'Soil Temp (Surface)', unit: '°C', color: '#FF6384' },
    soil_temperature_6cm: { label: 'Soil Temp (6cm)', unit: '°C', color: '#36A2EB' },
    soil_moisture_0_to_1cm: { label: 'Soil Moisture (0-1cm)', unit: 'm³/m³', color: '#4BC0C0' },
    visibility: { label: 'Visibility', unit: 'm', color: '#FF9F40' }
};

function createBaseLayers() {
    const osmLayer = new ol.layer.Tile({
        title: 'Street Map',
        type: 'base',
        visible: true,
        source: new ol.source.OSM()
    });

    const satelliteLayer = new ol.layer.Tile({
        title: 'Satellite',
        type: 'base',
        visible: false,
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19
        })
    });

    const terrainLayer = new ol.layer.Tile({
        title: 'Terrain',
        type: 'base',
        visible: false,
        source: new ol.source.XYZ({
            url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        })
    });

    return new ol.layer.Group({
        title: 'Base Maps',
        layers: [osmLayer, satelliteLayer, terrainLayer]
    });
}

function initMap() {
    // Create vector source and layer for the dot marker
    vectorSource = new ol.source.Vector();
    vectorLayer = new ol.layer.Vector({
        title: 'Markers',
        source: vectorSource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({
                    color: '#FF4444'
                }),
                stroke: new ol.style.Stroke({
                    color: '#FFFFFF',
                    width: 2
                })
            })
        })
    });

    // Create vector source and layer for markers
    markerSource = new ol.source.Vector();
    markerLayer = new ol.layer.Vector({
        source: markerSource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({
                    color: '#c7040e'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 2
                })
            })
        })
    });

    const baseLayers = createBaseLayers();

    map = new ol.Map({
        target: 'map',
        layers: [baseLayers, vectorLayer, markerLayer],
        view: new ol.View({
            center: ol.proj.fromLonLat([0, 0]),
            zoom: 2
        }),
        controls: [
            new ol.control.Zoom(),
            new ol.control.ScaleLine(),
            new ol.control.FullScreen(),
            new ol.control.ZoomSlider(),
            new ol.control.LayerSwitcher({
                tipLabel: 'Legend', // Optional label for button
                groupSelectStyle: 'group' // Optional, use 'group' or 'none'
            })
        ]
    });

    // Add GPS button functionality
    const gpsButton = document.getElementById('gps-button');
    gpsButton.addEventListener('click', () => {
        if (!gpsActive) {
            startGPSTracking();
        } else {
            stopGPSTracking();
        }
    });

    // Add layer switcher control
    const layerSwitcher = document.createElement('div');
    layerSwitcher.className = 'layer-switcher ol-unselectable ol-control';
    const mapTypes = ['Streets', 'Sat', 'Terrain'];
    
    mapTypes.forEach((type, index) => {
        const button = document.createElement('button');
        button.textContent = type;
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            layerSwitcher.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update map layer visibility
            const layers = baseLayers.getLayers().getArray();
            layers.forEach((layer, i) => {
                layer.setVisible(i === index);
            });
        });
        
        // Set initial active state
        if (type === 'Streets') {
            button.classList.add('active');
        }
        layerSwitcher.appendChild(button);
    });

    const mapElement = document.getElementById('map');
    mapElement.appendChild(layerSwitcher);

    map.on('click', handleMapClick);
}

function startGPSTracking() {
    const gpsButton = document.getElementById('gps-button');
    if ('geolocation' in navigator) {
        gpsButton.classList.add('active');
        gpsActive = true;

        // First get a quick position fix
        navigator.geolocation.getCurrentPosition(
            (position) => {
                updatePosition(position);
                // Then start watching with higher accuracy
                startWatchingPosition();
            },
            (error) => {
                handleLocationError(error);
            },
            {
                enableHighAccuracy: false, // Start with lower accuracy for faster first fix
                timeout: 10000,
                maximumAge: 30000 // Allow cached positions up to 30 seconds old
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

function startWatchingPosition() {
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            updatePosition(position);
        },
        (error) => {
            handleLocationError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 20000, // Increased timeout
            maximumAge: 0
        }
    );
}

function updatePosition(position) {
    const coords = [position.coords.longitude, position.coords.latitude];
    
    // Clear existing location marker
    vectorSource.clear();
    
    // Add new marker at current position
    const locationFeature = new ol.Feature({
        geometry: new ol.geom.Point(
            ol.proj.fromLonLat(coords)
        )
    });

    // Style for the location marker
    locationFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
                color: '#4285F4'
            }),
            stroke: new ol.style.Stroke({
                color: 'white',
                width: 2
            })
        })
    }));

    vectorSource.addFeature(locationFeature);
    
    // Center map on location
    map.getView().animate({
        center: ol.proj.fromLonLat(coords),
        duration: 500,
        zoom: 15
    });
}

function handleLocationError(error) {
    console.error('Error getting location:', error);
    let errorMessage = 'Unable to get your location. ';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage += 'The request to get your location timed out. Please try again.';
            break;
        default:
            errorMessage += 'Please check your GPS settings and try again.';
    }
    
    stopGPSTracking();
    alert(errorMessage);
}

function stopGPSTracking() {
    const gpsButton = document.getElementById('gps-button');
    gpsButton.classList.remove('active');
    gpsActive = false;
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    vectorSource.clear();
}

async function fetchWeatherData(latitude, longitude) {
    try {
        if (!isValidCoordinate(latitude, longitude)) {
            throw new Error('Invalid coordinates');
        }

        const hourlyParams = Object.keys(HOURLY_PARAMETERS).join(',');
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,apparent_temperature,is_day,weather_code,cloud_cover,wind_gusts_10m&hourly=${hourlyParams}&timezone=auto&forecast_days=16`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Weather data request failed: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

async function fetchElevationData(latitude, longitude) {
    try {
        if (!isValidCoordinate(latitude, longitude)) {
            throw new Error('Invalid coordinates');
        }

        const apiUrl = `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Elevation data request failed: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        return data.elevation[0];
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        throw error;
    }
}

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
}

async function handleMapClick(event) {
    try {
        const coordinates = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
        const [longitude, latitude] = coordinates;

        const weatherInfo = document.getElementById('weather-data');
        weatherInfo.innerHTML = 'Loading weather data...';

        // Clear previous markers
        markerSource.clear();

        // Add new marker
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(event.coordinate)
        });

        // Add marker with animation
        let start = null;
        const duration = 300;

        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;

            if (progress < 1) {
                const scale = Math.min(1, progress * 2);
                const bounceScale = 1 + Math.sin(progress * Math.PI) * 0.2;
                
                marker.setStyle(new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6 * bounceScale,
                        fill: new ol.style.Fill({
                            color: '#c7040e'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffffff',
                            width: 2
                        })
                    })
                }));
                
                requestAnimationFrame(animate);
            }
        }

        markerSource.addFeature(marker);
        requestAnimationFrame(animate);

        const [weatherData, elevation] = await Promise.all([
            fetchWeatherData(latitude, longitude),
            fetchElevationData(latitude, longitude)
        ]);

        displayWeatherData(weatherData, elevation, latitude, longitude);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherInfo.innerHTML = 'Error loading weather data. Please try again.';
    }
}

function displayWeatherData(data, elevation, latitude, longitude) {
    const weatherInfo = document.getElementById('weather-data');
    const current = data.current;
    const weatherDescription = getWeatherDescription(current.weather_code);
    const forecastToggle = document.getElementById('forecast-toggle');
    const showForecast = forecastToggle?.getAttribute('data-active') === 'true';
    const selectedDays = document.getElementById('forecast-days')?.value || 7;
    const selectedParams = document.getElementById('forecast-params')?.value?.split(',') || ['temperature_2m', 'precipitation'];

    // Create forecast chart data
    const hoursToShow = selectedDays * 24;
    const forecastData = {
        labels: data.hourly.time.slice(0, hoursToShow).map(time => {
            const date = new Date(time);
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
        }),
        datasets: selectedParams.map(param => ({
            label: `${HOURLY_PARAMETERS[param].label} (${HOURLY_PARAMETERS[param].unit})`,
            data: data.hourly[param].slice(0, hoursToShow),
            borderColor: HOURLY_PARAMETERS[param].color,
            yAxisID: param,
            tension: 0.4
        }))
    };

    weatherInfo.innerHTML = `
        <div class="weather-card">
            <div class="weather-header" style="display: ${showForecast ? 'none' : 'block'}">
                <div class="header-content">
                    <div class="location-info">
                        <strong>📍 Coordinates</strong>
                        <div class="weather-value">
                            ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
                        </div>
                        <strong>🏔️ Elevation</strong>
                        <div class="weather-value">
                            ${elevation !== undefined ? elevation.toFixed(0) : 'N/A'} meters
                        </div>
                    </div>
                </div>
            </div>
            <div class="forecast-controls" style="display: ${showForecast ? 'flex' : 'none'}">
                <select id="forecast-days" class="forecast-days">
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7" selected>7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="16">16 Days</option>
                </select>
                <select id="forecast-params" class="forecast-params" multiple>
                    ${Object.entries(HOURLY_PARAMETERS).map(([value, { label }]) => `
                        <option value="${value}" ${selectedParams.includes(value) ? 'selected' : ''}>
                            ${label}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="weather-body" style="display: ${showForecast ? 'none' : 'block'}">
                <div class="weather-item">
                    <strong>🌡️ Temperature</strong>
                    <div class="weather-value">${current.temperature_2m}°C</div>
                    <strong>🌡️ Feels Like</strong>
                    <div class="weather-value">${current.apparent_temperature}°C</div>
                </div>
                <div class="weather-item">
                    <strong>☁️ Weather</strong>
                    <div class="weather-value">${weatherDescription}</div>
                    <strong>☁️ Cloud Cover</strong>
                    <div class="weather-value">${current.cloud_cover}%</div>
                </div>
                <div class="weather-item">
                    <strong>💧 Humidity</strong>
                    <div class="weather-value">${current.relative_humidity_2m}%</div>
                    <strong>🌧️ Precipitation</strong>
                    <div class="weather-value">${current.precipitation} mm</div>
                </div>
                <div class="weather-item">
                    <strong>💨 Wind Speed</strong>
                    <div class="weather-value">${current.wind_speed_10m} km/h</div>
                    <strong>🌪️ Wind Gusts</strong>
                    <div class="weather-value">${current.wind_gusts_10m} km/h</div>
                    <strong>🧭 Wind Direction</strong>
                    <div class="weather-value">${current.wind_direction_10m}°</div>
                </div>
            </div>
            <div id="forecast-container" class="forecast-container" style="display: ${showForecast ? 'block' : 'none'}">
                <canvas id="forecast-chart"></canvas>
            </div>
        </div>
    `;

    // Initialize controls
    const forecastDays = document.getElementById('forecast-days');
    const forecastParams = document.getElementById('forecast-params');
    const forecastContainer = document.getElementById('forecast-container');
    const forecastControls = document.querySelector('.forecast-controls');
    const weatherHeader = document.querySelector('.weather-header');
    const weatherBody = document.querySelector('.weather-body');

    // Re-add event listener for forecast toggle
    if (forecastToggle) {
        // Remove any existing listeners
        const newForecastToggle = forecastToggle.cloneNode(true);
        forecastToggle.parentNode.replaceChild(newForecastToggle, forecastToggle);
        
        newForecastToggle.addEventListener('click', () => {
            const isActive = newForecastToggle.getAttribute('data-active') === 'true';
            const newState = !isActive;
            newForecastToggle.setAttribute('data-active', newState);
            
            // Get the weather info container
            const weatherInfoContainer = document.querySelector('.weather-info');
            
            if (weatherHeader) weatherHeader.style.display = newState ? 'none' : 'block';
            if (weatherBody) weatherBody.style.display = newState ? 'none' : 'block';
            if (forecastContainer) forecastContainer.style.display = newState ? 'block' : 'none';
            if (forecastControls) forecastControls.style.display = newState ? 'flex' : 'none';
            
            // Toggle the forecast mode class for enlarged display
            if (weatherInfoContainer) {
                if (newState) {
                    weatherInfoContainer.classList.add('forecast-mode');
                    initForecastChart(forecastData);
                } else {
                    weatherInfoContainer.classList.remove('forecast-mode');
                }
            }
        });
    }
    forecastDays.addEventListener('change', updateChart);
    forecastParams.addEventListener('change', updateChart);

    function updateChart() {
        const newDays = parseInt(forecastDays.value);
        const newParams = Array.from(forecastParams.selectedOptions).map(option => option.value);
        const newHours = newDays * 24;
        
        const newForecastData = {
            labels: data.hourly.time.slice(0, newHours).map(time => {
                const date = new Date(time);
                return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
            }),
            datasets: newParams.map(param => ({
                label: `${HOURLY_PARAMETERS[param].label} (${HOURLY_PARAMETERS[param].unit})`,
                data: data.hourly[param].slice(0, newHours),
                borderColor: HOURLY_PARAMETERS[param].color,
                yAxisID: param,
                tension: 0.4
            }))
        };
        
        initForecastChart(newForecastData);
    }

    if (showForecast) {
        initForecastChart(forecastData);
    }

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    function dragStart(e) {
        const weatherInfo = document.querySelector('.weather-info');
        
        // Get the current position from the transform
        const transform = window.getComputedStyle(weatherInfo).getPropertyValue('transform');
        const matrix = new DOMMatrix(transform);
        currentX = matrix.m41;
        currentY = matrix.m42;
        
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        
        if (e.target.closest('.weather-info')) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            const weatherInfo = document.querySelector('.weather-info');
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            weatherInfo.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd(e) {
        isDragging = false;
    }

    function initDraggable() {
        const weatherInfo = document.querySelector('.weather-info');
        if (!weatherInfo) return;
        
        weatherInfo.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    // Initialize draggable functionality
    setTimeout(initDraggable, 100); // Small delay to ensure DOM is ready
}

function initForecastChart(data) {
    const ctx = document.getElementById('forecast-chart').getContext('2d');
    
    if (window.forecastChart) {
        window.forecastChart.destroy();
    }

    const scales = {};
    data.datasets.forEach((dataset, index) => {
        scales[dataset.yAxisID] = {
            type: 'linear',
            display: true,
            position: index % 2 === 0 ? 'left' : 'right',
            title: {
                display: true,
                text: dataset.label,
                font: {
                    size: 14,
                    weight: 'bold'
                }
            },
            grid: {
                drawOnChartArea: index === 0,
                color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
                font: {
                    size: 12
                }
            }
        };
    });

    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 13
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#5627FF',
                    bodyColor: '#937AFF',
                    borderColor: '#F8DB46',
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: scales
        }
    });
}

function updateForecastChart(data, days, params) {
    const hoursToShow = days * 24;
    const forecastData = {
        labels: data.hourly.time.slice(0, hoursToShow).map(time => {
            const date = new Date(time);
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
        }),
        datasets: params.map(param => ({
            label: `${HOURLY_PARAMETERS[param].label} (${HOURLY_PARAMETERS[param].unit})`,
            data: data.hourly[param].slice(0, hoursToShow),
            borderColor: HOURLY_PARAMETERS[param].color,
            yAxisID: param,
            tension: 0.4
        }))
    };

    initForecastChart(forecastData);
}

function isValidCoordinate(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// Weather panel minimize/maximize functionality
document.addEventListener('DOMContentLoaded', function() {
    const weatherPanel = document.querySelector('.weather-info');
    const toggleButton = document.getElementById('toggle-weather-panel');
    const minimizeIcon = document.getElementById('minimize-icon');
    const maximizeIcon = document.getElementById('maximize-icon');
    const weatherData = document.getElementById('weather-data');
    const forecastToggle = document.querySelector('.weather-data-item');

    toggleButton.addEventListener('click', function() {
        if (weatherData.style.display === 'none') {
            // Maximize
            weatherData.style.display = 'block';
            forecastToggle.style.display = 'block';
            minimizeIcon.classList.remove('hidden');
            maximizeIcon.classList.add('hidden');
            weatherPanel.classList.remove('h-[60px]');
            weatherPanel.classList.add('max-h-[60vh]');
        } else {
            // Minimize
            weatherData.style.display = 'none';
            forecastToggle.style.display = 'none';
            minimizeIcon.classList.add('hidden');
            maximizeIcon.classList.remove('hidden');
            weatherPanel.classList.remove('max-h-[60vh]');
            weatherPanel.classList.add('h-[60px]');
        }
    });
});

// Initialize the map when the page loads
window.onload = initMap;
