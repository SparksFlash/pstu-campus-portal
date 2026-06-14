Ngrok quick setup

This repository includes helper scripts to expose your local backend (port 5000) and frontend (port 3000) via ngrok and write a `.env.ngrok` file with `SERVER_URL` and `CLIENT_URL`.

Prerequisites
- Install ngrok CLI: https://ngrok.com/download
- Node.js (for the helper script)

Usage
1. From repository root, run:

```bash
# make script executable the first time
chmod +x scripts/start-ngrok.sh

# run and paste your ngrok authtoken when prompted (or set NGROK_AUTHTOKEN env var)
./scripts/start-ngrok.sh
```

2. The script will start ngrok tunnels and create `.env.ngrok` in the repo root. To use those values in your server process:

```bash
# from the repo root (example)
export $(cat .env.ngrok | xargs)
# then in server folder
cd pstu-web-app/server
npm run dev
```

Notes
- Do NOT commit `.env.ngrok` to source control (it contains public URLs). The script does not store your authtoken in the repo; it configures ngrok locally.
- ngrok free tunnels are ephemeral — the public URLs change each time you start ngrok. For a stable subdomain consider ngrok paid plan.
- If you only expose backend, you can still verify email if `CLIENT_URL` points to a public frontend. If your frontend is local too, expose it as shown so email verification redirects will work on other devices.

Security
- Treat your ngrok authtoken as a secret and do not share it in public repos or chats. If you believe it has been exposed, revoke/regenerate it in your ngrok dashboard.

If you want, I can:
- Start the tunnels here (I cannot run commands in your machine). Follow the script and paste logs here and I'll help interpret them.
- Modify server to render an HTML confirmation page on verification instead of redirecting to the client.
