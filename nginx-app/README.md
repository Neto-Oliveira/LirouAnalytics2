# Nginx App

This project is a web application served using Nginx. It includes HTML, CSS, and JavaScript files to create a dynamic user interface.

## Project Structure

- `nginx/nginx.conf`: Main configuration for the Nginx server.
- `nginx/default.conf`: Default server configurations.
- `src/css/styles.css`: CSS styles for the application.
- `src/js/app.js`: JavaScript code for client-side logic.
- `src/index.html`: Main HTML file for the application.
- `Dockerfile`: Instructions to build the Docker image.

## Getting Started

To build and run the application using Docker, follow these steps:

1. Build the Docker image:
   ```bash
   docker build -t nginx-app .
   ```

2. Run the Docker container:
   ```bash
   docker run -d -p 80:80 nginx-app
   ```

3. Access the application in your web browser at `http://localhost`.

## License

This project is licensed under the MIT License.