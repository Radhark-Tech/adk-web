#!/bin/sh

# Set default backend URL
DEFAULT_BACKEND_URL="https://prd-url-agent"

# Determine backend URL based on SETUP environment variable
case "$SETUP" in
  "local")
    BACKEND_URL="http://localhost:8081"
    ;;
  "development"|"dev")
    BACKEND_URL="https://dev-url-agent"
    ;;
  "staging"|"hmg")
    BACKEND_URL="https://hml-url-agent"
    ;;
  "production"|"prd")
    BACKEND_URL="https://prd-url-agent"
    ;;
  *)
    BACKEND_URL="$DEFAULT_BACKEND_URL"
    ;;
esac

echo "Setting up runtime config for SETUP=$SETUP with backendUrl=$BACKEND_URL"

# Create the config directory if it doesn't exist
mkdir -p /usr/share/nginx/html/assets/config

# Update the runtime-config.json file
cat > /usr/share/nginx/html/assets/config/runtime-config.json << EOF
{
  "backendUrl": "$BACKEND_URL"
}
EOF

echo "Runtime config updated successfully"
echo "Config content:"
cat /usr/share/nginx/html/assets/config/runtime-config.json

# Start nginx
exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
