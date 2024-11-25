use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation: f64,
    pub timezone: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurrentWeather {
    pub temperature: f64,
    pub humidity: f64,
    pub rain: f64,
    pub wind_speed: f64,
    pub wind_direction: f64,
    pub wind_gusts: f64,
    pub time: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeatherResponse {
    pub location: Location,
    pub current: CurrentWeather,
}

#[derive(Debug, Deserialize)]
pub struct OpenMeteoResponse {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation: f64,
    pub timezone: String,
    pub current: OpenMeteoCurrent,
}

#[derive(Debug, Deserialize)]
pub struct OpenMeteoCurrent {
    pub time: String,
    pub temperature_2m: f64,
    pub relative_humidity_2m: f64,
    pub rain: f64,
    pub wind_speed_10m: f64,
    pub wind_direction_10m: f64,
    pub wind_gusts_10m: f64,
}
