use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};
use dotenv::dotenv;
use std::env;

mod weather_service;
mod models;
mod routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let address = format!("{}:{}", host, port);

    println!("Server running at http://{}", address);

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api/v1")
                    .service(routes::weather::get_current_weather)
            )
    })
    .bind(address)?
    .run()
    .await
}
