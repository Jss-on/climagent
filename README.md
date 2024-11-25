# Weather API Documentation

This document provides instructions on how to access and use the Weather API.

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your system
- Git (optional, for cloning the repository)

### Running the Application
1. Start the application using Docker Compose:

```bash
docker-compose up
```

2. The API will be available at: `http://localhost:8000`

## API Endpoints

### Get Weather Data
Retrieve weather information for a specific location.

**Endpoint:** `/weather`

**Method:** GET

**Query Parameters:**
- `city` (required): Name of the city
- `country` (optional): Country code (2 letters, ISO 3166-1 alpha-2)

**Example Request:**
```bash
curl "http://localhost:8000/weather?city=London&country=GB"
```

**Example Response:**
```json
{
    "city": "London",
    "country": "GB",
    "temperature": 18.5,
    "humidity": 65,
    "description": "Partly cloudy"
}
```

### Get Current Weather Data
Retrieve current weather information for a specific location using latitude and longitude.

**Endpoint:** `/api/v1/weather/current`

**Method:** GET

**Query Parameters:**
- `lat` (required): Latitude in decimal format
- `lon` (required): Longitude in decimal format

**Example Request:**
For coordinates 8°35'52.3"N 125°05'50.8"E (converted to decimal: 8.597861, 125.097444)
```bash
curl "http://localhost:8000/api/v1/weather/current?lat=8.597861&lon=125.097444"
```

**Example Response:**
```json
{
  "location": {
    "latitude": 8.625,
    "longitude": 125.125,
    "elevation": 2393,
    "timezone": "Asia/Singapore"
  },
  "current": {
    "temperature": 13.1999998092651,
    "humidity": 89,
    "rain": 0,
    "wind_speed": 8.47339344024658,
    "wind_direction": 77.7352447509766,
    "wind_gusts": 42.4799995422363,
    "time": "2024-11-20T09:45:00"
  }
}
```

### Get Current Weather Data (DMS Coordinates)
Retrieve current weather information using coordinates in Degrees, Minutes, Seconds format.

**Endpoint:** `/api/v1/weather/current/dms`

**Method:** GET

**Query Parameters:**
- `coordinates` (required): Coordinates in DMS format

**Example Requests:**

Using URL-encoded coordinates:
```bash
curl "http://localhost:8000/api/v1/weather/current/dms?coordinates=35%C2%B052'59.9%22N%2076%C2%B030'48.4%22E"
```

Alternative methods:
```bash
# Using single quotes to wrap the URL
curl 'http://localhost:8000/api/v1/weather/current/dms?coordinates=35°52'\''59.9"N 76°30'\''48.4"E'

# Using --data-urlencode (recommended)
curl -G "http://localhost:8000/api/v1/weather/current/dms" --data-urlencode "coordinates=35°52'59.9\"N 76°30'48.4\"E"
```

Here's what each special character becomes when URL-encoded:
- `°` becomes `%C2%B0`
- `'` becomes `'`
- `"` becomes `%22`
- Space becomes `%20`

**Example Response:**
```json
{
  "location": {
    "latitude": 35.883306,
    "longitude": 76.513444,
    "elevation": 1523,
    "timezone": "Asia/Karachi"
  },
  "current": {
    "temperature": 12.3,
    "humidity": 65,
    "rain": 0,
    "wind_speed": 5.2,
    "wind_direction": 180.5,
    "wind_gusts": 8.7,
    "time": "2024-11-20T09:45:00"
  }
}
```

### Error Responses

**Invalid Request (400 Bad Request):**
```json
{
    "detail": "City parameter is required"
}
```

**City Not Found (404 Not Found):**
```json
{
    "detail": "City not found"
}
```

## Frontend Application

The web frontend is available at: `http://localhost:3000`

## Development

To run the application in development mode:

1. Start the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. Start the frontend:
```bash
cd web-frontend
npm install
npm start
```

## Environment Variables

The application uses the following environment variables:

- `WEATHER_API_KEY`: Your weather service API key
- `PORT`: Backend server port (default: 8000)
- `REACT_APP_API_URL`: Frontend API URL (default: http://localhost:8000)

These can be configured in the `.env` file or through Docker Compose.