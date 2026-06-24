#!/bin/sh

# Find and replace the VITE_BACKEND_URL placeholder (or the default value) with the actual BACKEND_URL
if [ -n "$BACKEND_URL" ]; then
    echo "Setting VITE_BACKEND_URL to $BACKEND_URL"
    # Replace both the placeholder pattern and the default localhost:8080 value
    sed -i "s|http://localhost:8080|$BACKEND_URL|g" /usr/share/nginx/html/assets/*.js
fi

# Start nginx
nginx -g "daemon off;"
