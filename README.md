# TrackUrCodeLife

Student coding tracker for ABES batches. The React client shows LeetCode and CodeChef leaderboards. The Express API stores profiles and syncs platform stats.

## Local setup

1. Copy environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

2. Fill `server/.env` with MongoDB, JWT secret, Gmail app password, admin credentials, and `CLIENT_URL`.

3. Install and run:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:5000`.

## Deployment

Deploy the API and the client as two services.

### API (Render, Railway, or similar)

- Root directory: `server`
- Build: `npm install`
- Start: `npm start`
- Health check: `/api/health`
- Set every variable from `server/.env.example`
- Set `CLIENT_URL` to the live frontend origin, for example `https://your-app.vercel.app`
- Set `SYNC_ON_START=true` if the host sleeps between requests and you want a sync after boot
- Use a MongoDB Atlas cluster that allows the host IP (or `0.0.0.0/0` if you accept that tradeoff)

Gmail SMTP needs an [App Password](https://support.google.com/accounts/answer/185833), not the account password.

### Client (Vercel or Netlify)

- Root directory: `client`
- Build: `npm run build`
- Output: `dist`
- Set `VITE_API_BASE_URL` to `https://your-api-host/api`

`client/vercel.json` already rewrites unknown routes to `index.html` so React Router works.

## Sync

- Cron runs every 6 hours (`Asia/Kolkata` by default)
- Register and profile updates queue a background sync for that student
- Admins can click **Sync Stats** to start a full run
- `SYNC_DELAY_MS` pauses between students so CodeChef is less likely to rate-limit
