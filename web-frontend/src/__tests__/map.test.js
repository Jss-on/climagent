import { fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Import the functions to test
import { isValidCoordinate, getWeatherDescription } from '../map';

describe('Map Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="map" class="map"></div>
      <div id="weather-data"></div>
      <button id="gps-button"></button>
    `;
  });

  describe('isValidCoordinate', () => {
    test('should return true for valid coordinates', () => {
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(45.5, -122.6)).toBe(true);
    });

    test('should return false for invalid coordinates', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
    });
  });

  describe('getWeatherDescription', () => {
    test('should return correct weather descriptions', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky');
      expect(getWeatherDescription(1)).toBe('Mainly clear');
      expect(getWeatherDescription(2)).toBe('Partly cloudy');
      expect(getWeatherDescription(3)).toBe('Overcast');
      expect(getWeatherDescription(45)).toBe('Foggy');
      expect(getWeatherDescription(51)).toBe('Light drizzle');
      expect(getWeatherDescription(95)).toBe('Thunderstorm');
      expect(getWeatherDescription(999)).toBe('Unknown');
    });
  });

  describe('Weather Info Display', () => {
    test('weather info container should be present', () => {
      const weatherData = document.getElementById('weather-data');
      expect(weatherData).toBeInTheDocument();
    });
  });

  describe('GPS Button', () => {
    test('GPS button should be present', () => {
      const gpsButton = document.getElementById('gps-button');
      expect(gpsButton).toBeInTheDocument();
    });
  });
});
