// Initialize OpenLayers map
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: 'red'
            }),
            stroke: new ol.style.Stroke({
                color: 'white',
                width: 2
            })
        })
    })
});

const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2
    })
});

// Add click event handler
map.on('click', async function(evt) {
    const coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
    const lat = coords[1];
    const lon = coords[0];
    
    // Clear previous points
    vectorSource.clear();
    
    // Add new point at clicked location
    const point = new ol.Feature({
        geometry: new ol.geom.Point(evt.coordinate)
    });
    vectorSource.addFeature(point);
    
    try {
        const response = await fetch(`/api/v1/weather/current?lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        const weatherData = await response.json();
        
        // Update weather information panel
        const weatherInfo = document.getElementById('weather-data');
        weatherInfo.innerHTML = `
            <p><strong>Location:</strong> ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</p>
            <p><strong>Elevation:</strong> ${weatherData.location.elevation} meters</p>
            <p><strong>Temperature:</strong> ${weatherData.current.temperature}°C</p>
            <p><strong>Humidity:</strong> ${weatherData.current.humidity}%</p>
            <p><strong>Wind Speed:</strong> ${weatherData.current.wind_speed} m/s</p>
            <p><strong>Wind Direction:</strong> ${weatherData.current.wind_direction}°</p>
            <p><strong>Wind Gusts:</strong> ${weatherData.current.wind_gusts} m/s</p>
            <p><strong>Rain:</strong> ${weatherData.current.rain} mm</p>
            <p><strong>Last Updated:</strong> ${new Date(weatherData.current.time).toLocaleString()}</p>
        `;
    } catch (error) {
        document.getElementById('weather-data').innerHTML = 'Error fetching weather data. Please try again.';
        console.error('Error:', error);
    }
});
