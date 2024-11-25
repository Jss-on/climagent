FROM rust:1.75-slim as builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

COPY . .

# Build with optimizations
RUN cargo build --release --locked

FROM debian:bookworm-slim

# Install only the necessary SSL certificates and libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

WORKDIR /usr/local/bin

# Copy only the binary
COPY --from=builder /usr/src/app/target/release/weather-service .

# Create a non-root user
RUN useradd -r -s /bin/false weather-user && \
    chown weather-user:weather-user /usr/local/bin/weather-service

USER weather-user

EXPOSE 8000

CMD ["./weather-service"]
