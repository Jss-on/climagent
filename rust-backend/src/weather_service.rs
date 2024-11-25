use crate::models::weather::{OpenMeteoResponse, WeatherResponse, Location, CurrentWeather};
use chrono::Utc;
use log::{error, info};
use reqwest::Client;
use serde_json;
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
            "{}?latitude={}&longitude={}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto",
            self.base_url, lat, lon
        );

        info!("Requesting URL: {}", url);

        let response_text = self.client
            .get(&url)
            .send()
            .await?
            .text()
            .await?;

        info!("Received response: {}", response_text);

        let response: OpenMeteoResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                error!("Failed to parse response: {}", e);
                e
            })?;

        let current_time = Utc::now();

        Ok(WeatherResponse {
            location: Location {
                latitude: response.latitude,
                longitude: response.longitude,
                elevation: response.elevation.unwrap_or(0.0),
                timezone: response.timezone,
            },
            current: CurrentWeather {
                temperature: response.current.temperature_2m,
                humidity: response.current.relative_humidity_2m,
                rain: response.current.precipitation,
                wind_speed: response.current.wind_speed_10m,
                wind_direction: response.current.wind_direction_10m,
                wind_gusts: response.current.wind_gusts_10m,
                time: current_time,
            },
        })
    }
}
