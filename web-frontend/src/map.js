let map;
let vectorSource;
let vectorLayer;
let markerSource;
let markerLayer;
let gpsActive = false;
let watchId = null;

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
    const mapTypes = ['Streets', 'Satellite', 'Terrain'];
    
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
        // Validate latitude and longitude
        if (!isValidCoordinate(latitude, longitude)) {
            throw new Error('Invalid coordinates');
        }

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,apparent_temperature,is_day,weather_code,cloud_cover,wind_gusts_10m&timezone=auto`;
        
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

    weatherInfo.innerHTML = `
        <div class="weather-card">
            <div class="weather-header" style="display: flex; justify-content: center; align-items: center;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <strong>📍 Coordinates</strong>
                    <div class="weather-value" style="text-align: center;">
                        ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
                    </div>
                    <strong>🏔️ Elevation</strong>
                    <div class="weather-value" style="text-align: center;">
                        ${elevation !== undefined ? elevation.toFixed(0) : 'N/A'} meters
                    </div>
                </div>
            </div>
            <div class="weather-body">
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
        </div>
    `;
    
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

function isValidCoordinate(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// Export functions for testing
export { isValidCoordinate, getWeatherDescription };

// Initialize the map when the page loads
window.onload = initMap;
