#!/usr/bin/env bash
# Start ngrok tunnels for backend (5000) and frontend (3000), then write .env.ngrok
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NGROK_AUTHTOKEN="${NGROK_AUTHTOKEN:-}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok CLI not found. Install it from https://ngrok.com/download and try again."
  exit 1
fi

if [ -z "$NGROK_AUTHTOKEN" ]; then
  read -s -p "Enter your ngrok authtoken (input hidden): " NGROK_AUTHTOKEN
  echo
fi

if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "No authtoken provided. Exiting."
  exit 1
fi

echo "Configuring ngrok with provided authtoken..."
ngrok authtoken "$NGROK_AUTHTOKEN" >/dev/null 2>&1 || true

echo "Starting ngrok tunnel for backend (port 5000)..."
nohup ngrok http 5000 --log=stdout > "$ROOT_DIR/.ngrok-backend.log" 2>&1 &

echo "Starting ngrok tunnel for frontend (port 3000)..."
nohup ngrok http 3000 --log=stdout > "$ROOT_DIR/.ngrok-frontend.log" 2>&1 &

echo "Waiting for ngrok to establish tunnels..."
sleep 3

node "$ROOT_DIR/scripts/fetch-ngrok-urls.js" "$ROOT_DIR"

echo "Wrote $ROOT_DIR/.env.ngrok with SERVER_URL and CLIENT_URL."
echo "To use it, run (in server folder):"
echo "  export \\$(cat $ROOT_DIR/.env.ngrok | xargs)"
echo "Then start your backend and frontend as usual."
