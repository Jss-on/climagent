# Web Frontend

This is the web frontend component of the Climate project.

## Running Tests

There are two ways to run the tests:

### Using Docker (Recommended)

1. Make sure you have Docker installed on your system
2. Navigate to the web-frontend directory:
   ```bash
   cd web-frontend
   ```
3. Build and run the tests using Docker:
   ```bash
   sudo docker build -f Dockerfile.test -t web-frontend-test .
   sudo docker run web-frontend-test
   ```

### Using npm directly

1. Make sure you have Node.js installed on your system
2. Navigate to the web-frontend directory:
   ```bash
   cd web-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the tests:
   ```bash
   npm test
   ```

## Test Files

The tests are located in the `src/__tests__` directory. Currently, we have the following test files:
- `map.test.js`: Tests for map functionality, coordinate validation, and weather description features
