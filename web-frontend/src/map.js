let map;
let vectorSource;
let vectorLayer;
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

    const baseLayers = createBaseLayers();

    map = new ol.Map({
        target: 'map',
        layers: [baseLayers, vectorLayer],
        view: new ol.View({
            center: ol.proj.fromLonLat([0, 0]),
            zoom: 2
        }),
        controls: [
            new ol.control.Zoom(),
            new ol.control.ScaleLine(),
            new ol.control.FullScreen(),
            new ol.control.ZoomSlider()
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
    layerSwitcher.className = 'layer-switcher';
    const mapTypes = ['Street Map', 'Satellite', 'Terrain'];
    
    mapTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type;
        button.onclick = () => {
            const layers = baseLayers.getLayers();
            layers.forEach(layer => {
                layer.setVisible(layer.get('title') === type);
            });
            // Update active state
            layerSwitcher.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        };
        if (type === 'Street Map') {
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

async function handleMapClick(event) {
    const coords = ol.proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
    const weatherInfo = document.getElementById('weather-data');
    weatherInfo.innerHTML = 'Loading weather data...';

    // Clear previous markers
    vectorSource.clear();
    
    // Add new dot marker at exact click location
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
                        color: '#FF4444'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#FFFFFF',
                        width: 2
                    })
                })
            }));
            
            requestAnimationFrame(animate);
        }
    }

    vectorSource.addFeature(marker);
    requestAnimationFrame(animate);

    try {
        const response = await fetch(`/api/v1/weather/current?lat=${coords[1]}&lon=${coords[0]}`);
        if (!response.ok) {
            throw new Error(`Weather data request failed: ${response.status}`);
        }
        const data = await response.json();
        displayWeatherData(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherInfo.innerHTML = 'Error loading weather data. Please try again.';
    }
}

function displayWeatherData(data) {
    const weatherInfo = document.getElementById('weather-data');
    weatherInfo.innerHTML = `
        <p><strong>Location:</strong></p>
        <p>Elevation: ${data.location.elevation.toFixed(0)} meters</p>
        <p>Coordinates: ${data.location.latitude.toFixed(4)}°, ${data.location.longitude.toFixed(4)}°</p>
        <hr>
        <p><strong>Weather:</strong></p>
        <p>Temperature: ${data.current.temperature}°C</p>
        <p>Humidity: ${data.current.humidity}%</p>
        <p>Wind Speed: ${data.current.wind_speed} m/s</p>
        <p>Wind Direction: ${data.current.wind_direction}°</p>
        <p>Rain: ${data.current.rain} mm</p>
        <p>Last Updated: ${new Date(data.current.time).toLocaleString()}</p>
    `;
}

// Initialize the map when the page loads
window.onload = initMap;
