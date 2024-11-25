import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: '', lon: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:8000/api/v1/weather/coordinates?lat=${coordinates.lat}&lon=${coordinates.lon}`
      );
      setWeatherData(response.data);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          setError('Error getting location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="App">
      <h1>Weather App</h1>
      <div>
        <button onClick={handleGetLocation}>
          Use My Location
        </button>
        <div>
          <input
            type="number"
            value={coordinates.lat}
            onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
            placeholder="Latitude"
            step="any"
          />
          <input
            type="number"
            value={coordinates.lon}
            onChange={(e) => setCoordinates({ ...coordinates, lon: e.target.value })}
            placeholder="Longitude"
            step="any"
          />
          <button onClick={fetchWeatherData} disabled={loading}>
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {weatherData && (
        <div>
          <h2>{weatherData.name}</h2>
          <p>Temperature: {weatherData.main.temp}°C</p>
          <p>Humidity: {weatherData.main.humidity}%</p>
          <p>Weather: {weatherData.weather[0].description}</p>
          <p>Wind Speed: {weatherData.wind.speed} km/h</p>
        </div>
      )}
    </div>
  );
}

export default App; 