FROM nginx:alpine

# Copy the static files to nginx directory
COPY src /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
