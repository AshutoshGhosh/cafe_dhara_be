# Cafe Dhara — Run & Deploy Guide

Single-cafe QR ordering app. Two apps that live side by side:

```
WebVerse/
├── cafe_dhara_fe/   Next.js 14 (App Router) — customer + owner dashboard
└── cafe_dhara_be/   Node + Express + MongoDB (Mongoose) + Socket.IO
```

**Why this is cheap to host:** unlike the multi-tenant GROS backend, the single-cafe
backend has **no Redis, no BullMQ queue, and no MinIO**. It needs only Node + MongoDB.
Menu images are saved to local disk (`/uploads`).

---

## 1. Run locally

### Prerequisites
- Node 18+ and npm (or pnpm)
- A MongoDB — local `mongod` on `:27017`, or a free MongoDB Atlas cluster

### Backend (`cafe_dhara_be`) — port 4000
```bash
cd cafe_dhara_be
npm install
# Create .env (see below), then:
npm run seed      # creates the OWNER user + sample menu (first run only)
npm run dev       # http://localhost:4000  (health: GET /api/health)
```

`.env` (backend) — **never commit this file**:
```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cafe_dhara
JWT_ACCESS_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<another-long-random-string>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGIN=http://localhost:3001
QR_SECRET=<another-long-random-string>
CLIENT_URL=http://localhost:3001      # used to build QR scan links
# Seed defaults (change before real use):
SEED_OWNER_EMAIL=owner@cafedhara.local
SEED_OWNER_PASSWORD=ChangeMe123!
```

### Frontend (`cafe_dhara_fe`) — port 3001
```bash
cd cafe_dhara_fe
npm install       # (or pnpm install — there is a pnpm-lock.yaml)
npm run dev       # http://localhost:3001
```

`.env.local` (frontend):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Cafe Dhara
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### First login
- Dashboard: http://localhost:3001/login → `owner@cafedhara.local` / `ChangeMe123!`
- Add tables → generate QR → open the QR's `/scan?t=…` link to walk the customer flow.

---

## 2. Deploy — FREE (good for a demo)

| Piece | Service | Notes |
|---|---|---|
| Frontend | **Vercel** | Import `cafe_dhara_fe`, set the `NEXT_PUBLIC_*` env vars, deploy. |
| Backend | **Render** (Web Service) or **Railway** | Build `npm install && npm run build`, start `node dist/index.js`. Render free spins down when idle — hit it once before a live demo (matters for the kitchen's live socket). |
| Database | **MongoDB Atlas** (free M0) | Put the SRV connection string in `MONGODB_URI`. Whitelist the host / `0.0.0.0/0` for a demo. |

**Image uploads caveat:** local-disk `/uploads` is wiped on each deploy/restart on
ephemeral hosts (Render/Railway free). Fine for a short demo; for anything lasting,
switch uploads to **Cloudinary** or **Cloudflare R2** (S3-compatible) later.

Set on the frontend host: `NEXT_PUBLIC_API_URL=https://<backend-host>/api`,
`NEXT_PUBLIC_WS_URL=https://<backend-host>`. Set on the backend host:
`CORS_ORIGIN=https://<frontend-host>`, `CLIENT_URL=https://<frontend-host>`, and the
secrets + `MONGODB_URI`.

---

## 3. Deploy — PAID / production

**Simplest (recommended):** **Railway** — run the backend and (optionally) MongoDB in one
project; keep the frontend on **Vercel**. ~$5–20/mo at cafe scale. No idle spin-down, so the
kitchen live view stays warm.

**One small VPS (cheapest long-term for one always-on cafe):** a ~$5/mo box
(Hetzner / DigitalOcean). Run MongoDB + the Node backend (pm2 or Docker) + serve the built
Next.js app; put Nginx in front for TLS. Everything self-contained, no cold starts, and
`/uploads` persists on the disk.

**Managed split:** Render (backend Web Service) + MongoDB Atlas (M10+) + Vercel (frontend).

---

## 4. Production checklist
- [ ] Rotate all secrets; change the seeded owner password.
- [ ] `MONGODB_URI` → Atlas/managed with auth + IP allowlist.
- [ ] `CORS_ORIGIN` and `CLIENT_URL` → the real frontend origin.
- [ ] Move uploads to Cloudinary/R2 if the host has ephemeral disk.
- [ ] Set `NODE_ENV=production` and build both apps.
