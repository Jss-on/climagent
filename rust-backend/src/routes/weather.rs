use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;
use crate::weather_service::WeatherService;

#[derive(Deserialize)]
pub struct WeatherQuery {
    lat: f64,
    lon: f64,
}

#[get("/weather/current")]
pub async fn get_current_weather(query: web::Query<WeatherQuery>) -> impl Responder {
    let weather_service = WeatherService::new();
    
    match weather_service.get_current_weather(query.lat, query.lon).await {
        Ok(weather_data) => HttpResponse::Ok().json(weather_data),
        Err(e) => {
            log::error!("Error getting weather data: {}", e);
            HttpResponse::InternalServerError().json(format!("Failed to get weather data: {}", e))
        }
    }
}
