import openmeteo_requests
import requests_cache
from retry_requests import retry
from fastapi import HTTPException
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class WeatherService:
    def __init__(self):
        self.logger = logging.getLogger('WeatherService')
        self.logger.info("Initializing WeatherService")
        
        try:
            cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
            retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
            self.client = openmeteo_requests.Client(session=retry_session)
            self.url = "https://api.open-meteo.com/v1/forecast"
            self.logger.info("WeatherService initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize WeatherService: {str(e)}")
            raise
        
    async def get_current_weather(self, lat: float, lon: float, elevation: float | None = None):
        request_id = datetime.now().strftime('%Y%m%d%H%M%S')
        self.logger.info(f"Request {request_id}: Getting current weather for coordinates: lat={lat}, lon={lon}")
        
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "rain",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "wind_gusts_10m"
                ],
                "timezone": "Asia/Singapore"
            }
            
            # Handle elevation parameter
            if elevation is not None:
                if math.isnan(elevation):
                    params["elevation"] = "nan"
                else:
                    params["elevation"] = elevation

            responses = self.client.weather_api(self.url, params=params)
            response = responses[0]
            
            current = response.Current()
            current_data = {
                "location": {
                    "latitude": response.Latitude(),
                    "longitude": response.Longitude(),
                    "elevation": response.Elevation(),
                    "timezone": response.Timezone()
                },
                "current": {
                    "temperature": current.Variables(0).Value(),
                    "humidity": current.Variables(1).Value(),
                    "rain": current.Variables(2).Value(),
                    "wind_speed": current.Variables(3).Value(),
                    "wind_direction": current.Variables(4).Value(),
                    "wind_gusts": current.Variables(5).Value(),
                    "time": datetime.fromtimestamp(current.Time()).isoformat()
                }
            }
            
            return current_data
            
        except Exception as e:
            self.logger.error(f"Request {request_id}: Error getting current weather: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    async def get_hourly_weather(self, lat: float, lon: float, elevation: float | None = None):
        request_id = datetime.now().strftime('%Y%m%d%H%M%S')
        self.logger.info(f"Request {request_id}: Getting hourly weather for coordinates: lat={lat}, lon={lon}")
        
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "rain",
                    "showers",
                    "weather_code",
                    "cloud_cover",
                    "wind_speed_10m",
                    "wind_speed_80m",
                    "wind_speed_120m",
                    "wind_direction_180m",
                    "wind_gusts_10m",
                    "uv_index",
                    "uv_index_clear_sky",
                    "is_day"
                ],
                "timezone": "Asia/Singapore",
                "past_days": 5,
                "forecast_days": 3
            }
            
            # Handle elevation parameter
            if elevation is not None:
                if math.isnan(elevation):
                    params["elevation"] = "nan"
                else:
                    params["elevation"] = elevation

            responses = self.client.weather_api(self.url, params=params)
            response = responses[0]
            
            hourly = response.Hourly()
            hourly_time = pd.date_range(
                start=pd.to_datetime(hourly.Time(), unit="s"),
                end=pd.to_datetime(hourly.TimeEnd(), unit="s"),
                freq=pd.Timedelta(seconds=hourly.Interval()),
                inclusive="left"
            )

            hourly_data = {
                "location": {
                    "latitude": response.Latitude(),
                    "longitude": response.Longitude(),
                    "elevation": response.Elevation(),
                    "timezone": response.Timezone()
                },
                "hourly": {
                    "time": hourly_time.strftime('%Y-%m-%d %H:%M:%S').tolist(),
                    "temperature": hourly.Variables(0).ValuesAsNumpy().tolist(),
                    "humidity": hourly.Variables(1).ValuesAsNumpy().tolist(),
                    "apparent_temperature": hourly.Variables(2).ValuesAsNumpy().tolist(),
                    "precipitation": hourly.Variables(3).ValuesAsNumpy().tolist(),
                    "rain": hourly.Variables(4).ValuesAsNumpy().tolist(),
                    "showers": hourly.Variables(5).ValuesAsNumpy().tolist(),
                    "weather_code": hourly.Variables(6).ValuesAsNumpy().tolist(),
                    "cloud_cover": hourly.Variables(7).ValuesAsNumpy().tolist(),
                    "wind_speed_10m": hourly.Variables(8).ValuesAsNumpy().tolist(),
                    "wind_speed_80m": hourly.Variables(9).ValuesAsNumpy().tolist(),
                    "wind_speed_120m": hourly.Variables(10).ValuesAsNumpy().tolist(),
                    "wind_direction_180m": hourly.Variables(11).ValuesAsNumpy().tolist(),
                    "wind_gusts_10m": hourly.Variables(12).ValuesAsNumpy().tolist(),
                    "uv_index": hourly.Variables(13).ValuesAsNumpy().tolist(),
                    "uv_index_clear_sky": hourly.Variables(14).ValuesAsNumpy().tolist(),
                    "is_day": hourly.Variables(15).ValuesAsNumpy().tolist()
                }
            }
            
            return hourly_data
            
        except Exception as e:
            self.logger.error(f"Request {request_id}: Error getting hourly weather: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    async def get_daily_weather(self, lat: float, lon: float, elevation: float | None = None):
        request_id = datetime.now().strftime('%Y%m%d%H%M%S')
        self.logger.info(f"Request {request_id}: Getting daily weather for coordinates: lat={lat}, lon={lon}")
        
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "daily": ["sunrise", "sunset"],
                "timezone": "Asia/Singapore",
                "past_days": 5,
                "forecast_days": 3
            }
            
            # Handle elevation parameter
            if elevation is not None:
                if math.isnan(elevation):
                    params["elevation"] = "nan"
                else:
                    params["elevation"] = elevation

            responses = self.client.weather_api(self.url, params=params)
            response = responses[0]
            
            daily = response.Daily()
            daily_time = pd.date_range(
                start=pd.to_datetime(daily.Time(), unit="s"),
                end=pd.to_datetime(daily.TimeEnd(), unit="s"),
                freq=pd.Timedelta(seconds=daily.Interval()),
                inclusive="left"
            )

            daily_data = {
                "location": {
                    "latitude": response.Latitude(),
                    "longitude": response.Longitude(),
                    "elevation": response.Elevation(),
                    "timezone": response.Timezone()
                },
                "daily": {
                    "time": daily_time.strftime('%Y-%m-%d').tolist(),
                    "sunrise": [datetime.fromtimestamp(ts).strftime('%H:%M') for ts in daily.Variables(0).ValuesAsNumpy()],
                    "sunset": [datetime.fromtimestamp(ts).strftime('%H:%M') for ts in daily.Variables(1).ValuesAsNumpy()]
                }
            }
            
            return daily_data
            
        except Exception as e:
            self.logger.error(f"Request {request_id}: Error getting daily weather: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

    async def get_weather_by_city(self, city: str):
        request_id = datetime.now().strftime('%Y%m%d%H%M%S')
        self.logger.info(f"Request {request_id}: Attempted to get weather for city: {city}")
        self.logger.warning(f"Request {request_id}: City search not supported")
        
        raise HTTPException(
            status_code=400,
            detail="City search is not supported. Please use coordinates instead."
        )
    
    def _get_weather_description(self, code: int) -> str:
        weather_codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Foggy",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow fall",
            73: "Moderate snow fall",
            75: "Heavy snow fall",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        description = weather_codes.get(code, "Unknown")
        if description == "Unknown":
            self.logger.warning(f"Unknown weather code received: {code}")
        return description
