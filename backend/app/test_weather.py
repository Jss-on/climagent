import asyncio
from weather_service import WeatherService

async def test_current_weather():
    # Initialize the weather service
    weather_service = WeatherService()
    
    # Example coordinates (Manila, Philippines)
    lat = 14.5995
    lon = 120.9842
    
    try:
        # Get current weather
        current_weather = await weather_service.get_current_weather(lat, lon)
        
        # Print the results in a readable format
        print("\nCurrent Weather in Manila:")
        print("=" * 30)
        print(f"Temperature: {current_weather['current']['temperature']}°C")
        print(f"Humidity: {current_weather['current']['humidity']}%")
        print(f"Rain: {current_weather['current']['rain']} mm")
        print(f"Wind Speed: {current_weather['current']['wind_speed']} km/h")
        print(f"Wind Direction: {current_weather['current']['wind_direction']}°")
        print(f"Wind Gusts: {current_weather['current']['wind_gusts']} km/h")
        print(f"Time: {current_weather['current']['time']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(test_current_weather())
