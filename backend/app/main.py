from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from .weather_service import WeatherService
import re

app = FastAPI(title="Weather App API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

weather_service = WeatherService()

def parse_dms_coordinates(coord_str: str) -> float:
    """Convert DMS coordinates to decimal degrees"""
    # Regex pattern for DMS format (e.g., "35°52'59.9"N")
    pattern = r'(\d+)°(\d+)\'(\d+\.?\d*)\"([NSEW])'
    match = re.match(pattern, coord_str)
    
    if not match:
        raise ValueError("Invalid coordinate format")
        
    degrees, minutes, seconds, direction = match.groups()
    decimal = float(degrees) + float(minutes)/60 + float(seconds)/3600
    
    if direction in ['S', 'W']:
        decimal = -decimal
        
    return decimal

@app.get("/api/v1/weather/current")
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    elevation: float | None = Query(
        None, 
        description="Optional elevation in meters. If not provided, uses DEM elevation. Use 'nan' to disable downscaling."
    )
):
    return await weather_service.get_current_weather(lat, lon, elevation)

@app.get("/api/v1/weather/hourly")
async def get_hourly_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    elevation: float | None = Query(
        None, 
        description="Optional elevation in meters. If not provided, uses DEM elevation. Use 'nan' to disable downscaling."
    )
):
    return await weather_service.get_hourly_weather(lat, lon, elevation)

@app.get("/api/v1/weather/daily")
async def get_daily_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    elevation: float | None = Query(
        None, 
        description="Optional elevation in meters. If not provided, uses DEM elevation. Use 'nan' to disable downscaling."
    )
):
    return await weather_service.get_daily_weather(lat, lon, elevation)

# @app.get("/api/v1/weather/coordinates")
# async def get_all_weather(
#     lat: float = Query(..., description="Latitude"),
#     lon: float = Query(..., description="Longitude"),
#     elevation: float | None = Query(
#         None, 
#         description="Optional elevation in meters. If not provided, uses DEM elevation. Use 'nan' to disable downscaling."
#     )
# ):
#     return await weather_service.get_weather_by_coordinates(lat, lon, elevation)

@app.get("/api/v1/weather/city")
async def get_weather_by_city(
    city: str = Query(..., description="City name")
):
    return await weather_service.get_weather_by_city(city)

@app.get("/api/v1/weather/current/dms")
async def get_current_weather_dms(
    coordinates: str = Query(..., description="Coordinates in DMS format (e.g., '35°52'59.9\"N 76°30'48.4\"E')")
):
    try:
        # Split the coordinates string into latitude and longitude
        lat_str, lon_str = coordinates.strip().split()
        
        # Convert DMS to decimal
        lat = parse_dms_coordinates(lat_str)
        lon = parse_dms_coordinates(lon_str)
        
        # Use existing weather service to get data
        return await weather_service.get_current_weather(lat, lon)
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid coordinates format. Please use format like: 35°52'59.9\"N 76°30'48.4\"E"
        ) 