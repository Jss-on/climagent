# Climate Agent

A comprehensive weather and climate data platform that provides accurate weather information and forecasting capabilities.

![CI Pipeline](https://github.com/Jss-on/climagent/workflows/CI%20Pipeline/badge.svg)
![CD Pipeline](https://github.com/Jss-on/climagent/workflows/CD%20Pipeline/badge.svg)

## Project Overview

Climate Agent is a modern weather data platform that combines:
- Real-time weather data access
- Historical weather analysis
- Weather forecasting capabilities
- User-friendly web interface
- RESTful API services

## Architecture

The project consists of two main components:

### Backend (Python)
- RESTful API built with FastAPI
- Weather data processing and analysis
- Integration with external weather services
- Data caching and optimization

### Frontend (JavaScript)
- React-based web interface
- Interactive weather maps
- Real-time weather updates
- Responsive design

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.10+ (for local development)
- Git

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/Jss-on/climagent.git
   cd climate
   ```

2. Start with Docker:
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Web Interface: http://localhost:80
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

See our [Contributing Guide](CONTRIBUTING.md) for detailed setup instructions.

## API Documentation

### Weather Endpoints

#### Current Weather
```http
GET /api/v1/weather/current
```

Query Parameters:
- `lat`: Latitude (decimal)
- `lon`: Longitude (decimal)

#### DMS Format Weather
```http
GET /api/v1/weather/current/dms
```

Query Parameters:
- `coordinates`: Location in DMS format

For complete API documentation, visit `/docs` when running the application.

## Project Structure

```
climate/
├── backend/           # Python backend service
├── web-frontend/      # React frontend application
├── docs/             # Project documentation
│   ├── BRANCHING_STRATEGY.md
│   └── VERSIONING.md
├── scripts/          # Utility scripts
├── .github/          # GitHub configurations
│   └── workflows/    # CI/CD pipeline definitions
├── docker-compose.yml
└── README.md
```

## Development Process

We follow a structured development process:

1. **Branching Strategy**
   - `prod`: Production branch
   - `alpha`: Development branch
   - `feature/*`: Feature branches
   - `hotfix/*`: Emergency fixes
   - See [Branching Strategy](docs/BRANCHING_STRATEGY.md)

2. **Versioning**
   - Semantic Versioning (SemVer)
   - Automated version management
   - See [Versioning Guide](docs/VERSIONING.md)

3. **CI/CD Pipeline**
   - Automated testing
   - Code quality checks
   - Containerized deployments
   - Staging and production environments

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Pull request process
- Release procedures

## License

[Add your license information here]

## Contact

[Add your contact information here]