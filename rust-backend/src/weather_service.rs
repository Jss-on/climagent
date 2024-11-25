use crate::models::{OpenMeteoResponse, WeatherResponse, Location, CurrentWeather};
use chrono::{DateTime, Utc};
use log::{error, info};
use reqwest::Client;
use std::error::Error;

pub struct WeatherService {
    client: Client,
    base_url: String,
}

impl WeatherService {
    pub fn new() -> Self {
        WeatherService {
            client: Client::new(),
            base_url: "https://api.open-meteo.com/v1/forecast".to_string(),
        }
    }

    pub async fn get_current_weather(&self, lat: f64, lon: f64) -> Result<WeatherResponse, Box<dyn Error>> {
        info!("Getting current weather for coordinates: lat={}, lon={}", lat, lon);

        let url = format!(
            "{}?latitude={}&longitude={}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia/Singapore",
            self.base_url, lat, lon
        );

        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<OpenMeteoResponse>()
            .await?;

        let current_time = DateTime::parse_from_rfc3339(&response.current.time)
            .map_err(|e| {
                error!("Error parsing time: {}", e);
                e
            })?
            .with_timezone(&Utc);

        Ok(WeatherResponse {
            location: Location {
                latitude: response.latitude,
                longitude: response.longitude,
                elevation: response.elevation,
                timezone: response.timezone,
            },
            current: CurrentWeather {
                temperature: response.current.temperature_2m,
                humidity: response.current.relative_humidity_2m,
                rain: response.current.rain,
                wind_speed: response.current.wind_speed_10m,
                wind_direction: response.current.wind_direction_10m,
                wind_gusts: response.current.wind_gusts_10m,
                time: current_time,
            },
        })
    }
}
