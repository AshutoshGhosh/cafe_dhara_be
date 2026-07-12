# Cafe Dhara — Backend

Backend for **Cafe Dhara**, a single-cafe ordering platform.
**Stack:** Node.js · Express · MongoDB (Mongoose) · TypeScript · Socket.IO · JWT auth.

It mirrors the business logic of a larger multi-tenant NestJS/Prisma reference
backend, but for ONE cafe only — **no super-admin, no multi-tenancy, no billing.**
There is no `restaurantId` anywhere.

---

## Requirements
- Node.js >= 18
- MongoDB (local or Atlas)

## Install & configure

```bash
npm install
cp .env.example .env   # then edit .env with real values
```

Environment variables (see `.env.example`):

| Var | Purpose |
| --- | --- |
| `PORT` | HTTP port (default 4000) |
| `NODE_ENV` | development / test / production |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | signs short-lived access tokens |
| `JWT_REFRESH_SECRET` | reserved for refresh-token signing (refresh tokens are opaque + hashed at rest) |
| `ACCESS_TOKEN_TTL` | access token lifetime, e.g. `15m` |
| `REFRESH_TOKEN_TTL` | refresh token lifetime, e.g. `7d` |
| `CORS_ORIGIN` | comma-separated allowed origins |
| `QR_SECRET` | signs customer table QR tokens |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` | demo owner created by the seed |

> Never commit `.env`. Secrets come only from the environment.

## Run

```bash
npm run dev     # watch mode (tsx)
npm run build   # tsc -> dist/
npm start       # run compiled dist/index.js
npm run seed    # create OWNER + sample categories/menu items/tables
npm run lint    # type-only lint (tsc --noEmit)
```

Health check: `GET /api/health` -> `{ success, data: { status: "ok" ... } }`.

## API response format

Every response uses the envelope:

```json
{ "success": true, "data": { }, "error": null, "meta": { } }
```

On error:

```json
{ "success": false, "data": null, "error": { "code": "STRING_CODE", "message": "..." } }
```

Stack traces / internal details are never exposed.

## Auth

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | email + password -> user + access + refresh |
| POST | `/api/auth/refresh` | public | rotates refresh token, returns a new pair |
| POST | `/api/auth/logout` | bearer | revokes the refresh token(s) |
| GET | `/api/auth/me` | bearer | current user |

- **Access token**: JWT signed with `JWT_ACCESS_SECRET`, contains `{ sub, email, role, type:'access' }`.
- **Refresh token**: opaque UUID, only its SHA-256 hash is stored in the `RefreshToken`
  collection. It is set as an httpOnly cookie (`path=/api/auth`) and also returned in the body.
- **Rotation**: each `/refresh` revokes the used token and issues a brand-new one. Reusing a
  revoked/expired token fails with 401. `logout` revokes the presented token (or all of the
  user's tokens if none is given).
- Send the access token as `Authorization: Bearer <token>` (or `accessToken` cookie).

### RBAC
- `authenticate` — verifies the access token, loads the user, sets `req.user`.
- `authorize(...roles)` — allows only the listed roles.
- `requireOwner` — convenience guard for OWNER-only routes.

Roles: `OWNER` (admin), `MANAGER`, `WAITER`, `CASHIER`, `KITCHEN`, `STAFF`.

---

## How to add a feature module (IMPORTANT convention)

Every feature is self-contained under `src/modules/<name>/` and plugs into the app
through **one central file**: `src/modules/index.ts`.

**1. Create the module folder** with these files:

```
src/modules/<name>/
  <name>.routes.ts       # default-exports an Express Router
  <name>.controller.ts   # thin HTTP layer, uses asyncHandler + response helpers
  <name>.service.ts      # business logic, talks to models
  <name>.validation.ts   # zod schemas
```

`<name>.routes.ts` **must default-export a Router**:

```ts
import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../models/enums';
import { tablesController } from './tables.controller';

const router = Router();

router.get('/', asyncHandler(tablesController.list));
router.post('/', authenticate, authorize(Role.OWNER, Role.MANAGER), asyncHandler(tablesController.create));

export default router;   // <-- REQUIRED: default-exported Router
```

**2. Register it** in `src/modules/index.ts` — add exactly two lines:

```ts
// in the "feature imports" block:
import tablesRoutes from './tables/tables.routes';

// in the "register feature routers here" block:
apiRouter.use('/tables', tablesRoutes);
```

That's it — routes are now live under `/api/tables`. Keeping each addition to a single
line minimizes merge conflicts when multiple modules are added in parallel.

### Conventions to follow inside a module
- Validate all input with zod in `<name>.validation.ts`.
- Controllers stay thin: parse/validate -> call service -> `sendOk(res, data)`. Wrap in `asyncHandler`.
- Throw `AppError.badRequest(...)` / `.notFound(...)` etc. for known errors — never leak internals.
- Put DB access + business rules in the service.
- Add `authenticate` + `authorize(...)` where roles matter.

## Project structure

```
src/
  config/      env.ts, db.ts
  common/      response.ts, AppError.ts, asyncHandler.ts
  models/      Mongoose schemas + enums (barrel: index.ts)
  middleware/  authenticate, authorize, errorHandler, notFound, rateLimit
  modules/     index.ts (central router) + auth/ (example module)
  sockets/     Socket.IO bootstrap (gateways added later)
  utils/       password, jwt, token, duration
  types/       express.d.ts (req.user augmentation)
  index.ts     app bootstrap
  seed.ts      demo seed
```

## Models

`User`, `RefreshToken`, `Table`, `QRCode`, `Category`, `MenuItem` (embeds `Variant[]` +
`AddOn[]`), `Order` (embeds `OrderItem[]`, each embedding `OrderItemAddOn[]`), `Session`,
`Offer`, `Feedback`, `Notification`, `AuditLog`.

Dropped from the reference schema (multi-tenant / billing only): `Restaurant`,
`RestaurantMember`, `Plan`, `Subscription`, `Invoice`.
