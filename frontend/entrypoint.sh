#!/bin/sh

# Generate config.js from environment variable
cat > /usr/share/nginx/html/config.js <<EOF
// Configuration - generated at container startup
window.OPPONENT_SELECTOR_URL = '${OPPONENT_SELECTOR_URL:-}';
EOF

# Start nginx
exec nginx -g "daemon off;"
