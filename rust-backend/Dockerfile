FROM rust:1.72 as builder

WORKDIR /usr/src/app
COPY . .

RUN cargo build --release

FROM debian:bullseye-slim

WORKDIR /usr/local/bin

COPY --from=builder /usr/src/app/target/release/weather-service .

EXPOSE 8000

CMD ["./weather-service"]
