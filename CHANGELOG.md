# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### feat: real-time bill request event propagation

- **Socket Layer** (`src/sockets/index.ts`):
  - Added socket handler for incoming customer `bill:request` events, forwarding table bill signals to the authenticated `staff` room.
  - Exported `emitBillRequest` utility for server-side bill notifications.


### feat: expose dual root and api health check endpoints

- **Server Index** (`src/index.ts`):
  - Mounted unversioned health handler on both `GET /health` and `GET /api/health` so frontend pingers, external up-time monitors, and reverse proxies can probe server vitality without rate limits.


### feat: permit KITCHEN role to transition PLACED orders to ACCEPTED

- **Orders Service** (`src/modules/orders/orders.service.ts`):
  - Added `OrderStatus.ACCEPTED` to `KITCHEN_ALLOWED` (`[ACCEPTED, PREPARING, READY]`).
  - Ensures KDS auto-accept and kitchen staff "Accept Ticket" actions do not get blocked by role transition guards when logged in as kitchen station accounts.


### test: unit test suites for core utilities, token cryptography & validation

- Added native Node 22 test runner script to `package.json` (`npm test` via `node --import tsx --test 'src/**/*.test.ts'`).
- `src/utils/duration.test.ts`: 7 unit tests covering seconds, minutes, hours, days parsing, and `fromNow` date calculations.
- `src/utils/password.test.ts`: bcrypt password hashing, matching, and wrong password rejection.
- `src/common/AppError.test.ts`: operational HTTP error factory tests (400, 401, 403, 404, 409, 500).
- `src/modules/qr/qr.token.test.ts`: cryptographic HMAC-SHA256 signature generation, constant-time verification, and tampered token rejection.
- `src/modules/tables/tables.validation.test.ts`: MongoDB ObjectId schema, table creation/update payload validation, and numeric coercion.
- All 25 backend tests passing with 0 errors.

### fix: order placement rejected `null` optional fields (400)

- **Orders validation** (`orders.validation.ts`): optional item fields
  (`variantId`, `addOnIds`, `notes`) and top-level `notes` changed from
  `.optional()` to `.nullish()` so clients may send explicit `null` for
  unselected options. Previously a `variantId: null` payload failed Zod
  validation with `VALIDATION_ERROR` (400). Service logic already treated
  `null`/`undefined` identically, so no service change was needed.

### chore: realtime (Socket.IO) audit + diagnostics

- Audited the sockets layer end-to-end against the frontend contract
  (`staff` room ← `order:new`/`order:updated`; `session:<id>` room ←
  `order:updated`; handshake `auth.token`/`auth.sessionId`). Event names,
  room names, payload shape (the order object itself), and CORS
  (`http://localhost:3001`, `credentials: true`) all verified correct — no
  wiring mismatch found.
- **`sockets/index.ts`**: made transports explicit (`['websocket','polling']`)
  and added **temporary** `[socket-debug]` logging (marked "remove after
  diagnosing realtime") — CORS allow-list at startup, rooms each socket joins
  on connect, and event name + target rooms + per-room client counts inside
  `emitOrderNew`/`emitOrderUpdated`.

## [0.1.0] - 2026-07-12

### feat: foundation — scaffold, models, auth + RBAC

Initial backend foundation for the single-cafe **Cafe Dhara** app
(Express + MongoDB/Mongoose + TypeScript). Feature modules are added later.

- **Scaffold**: TypeScript (strict) project with `dev`/`build`/`start`/`seed`/`lint`
  scripts, zod-validated env loader, Mongoose connection, Helmet + CORS +
  rate-limit + cookie-parser, `GET /api/health`, global error handler, and
  Socket.IO attached to the HTTP server (placeholder bootstrap).
- **Models**: `User`, `RefreshToken`, `Table`, `QRCode`, `Category`,
  `MenuItem` (embeds `Variant[]` + `AddOn[]`), `Order` (embeds `OrderItem[]` /
  `OrderItemAddOn[]`), `Session`, `Offer`, `Feedback`, `Notification`,
  `AuditLog`. Enums, indexes, soft-deletes, and timestamps carried over from the
  reference Prisma schema. Multi-tenant/billing models (Restaurant,
  RestaurantMember, Plan, Subscription, Invoice) dropped; no `restaurantId`.
- **Auth + RBAC**: `POST /api/auth/login`, `/refresh`, `/logout`, `GET /me`.
  bcryptjs password hashing, JWT access tokens, opaque hashed refresh tokens with
  rotation + revoke. `authenticate`, `authorize(...roles)`, and `requireOwner`
  middleware. Account lockout after repeated failed logins.
- **Module convention**: central `src/modules/index.ts` router with a documented
  one-line registration pattern for new feature modules.
- **Docs**: README (setup, env, run, seed, module convention), CLAUDE.md
  (security + single-cafe rules), this changelog.
- **Seed**: `npm run seed` creates an OWNER user and sample tables, categories,
  and menu items.

### feat: feature modules

All single-cafe feature modules, each following the module convention and wired
into the central router. Full project compiles under `tsc` (strict).

- **Staff/Users** (`/api/users`): owner-managed staff CRUD with soft-delete,
  password reset, role/active filtering, and last-owner / self-action safeguards.
- **Menu** (`/api/categories`, `/api/menu`, `/api/uploads`): categories CRUD
  (auto-slug, reorder, soft-delete), menu items CRUD with embedded variants /
  add-ons and availability toggle, public customer menu read, and image uploads
  (multer, `POST /api/uploads/image`, served from root `/uploads`).
- **Tables / QR / Sessions** (`/api/tables`, `/api/qr`, `/api/sessions`): table
  CRUD, signed-QR generation/rotation (HMAC-SHA256 with `QR_SECRET`,
  `crypto.timingSafeEqual` verify), and anonymous ~3h customer table sessions
  started from a scanned QR.
- **Orders + real-time** (`/api/orders`, Socket.IO): public order placement with
  server-side price snapshotting, staff status state-machine
  (PLACED→ACCEPTED→PREPARING→READY→SERVED→COMPLETED, CANCELLED from any
  non-terminal) + payment, and live `order:new` / `order:updated` events to a
  `staff` room and per-session rooms.
- **Offers / Feedback / Notifications** (`/api/offers`, `/api/feedback`,
  `/api/notifications`): offer CRUD + coupon validate, customer feedback submit +
  staff review, and staff notifications (list / read / read-all).
- **Analytics / Audit** (`/api/analytics`, `/api/audit`): sales metrics
  (summary, revenue-by-day, top-items, orders-by-status, peak-hours via Order
  aggregation) and a filterable, paginated audit log with a reusable `logAudit()`
  writer.
- **Integration**: all 13 module routers registered in `src/modules/index.ts`;
  `/uploads` static serving and `CLIENT_URL` env added.

### feat: billing, cafe settings & session hardening

- **Session hardening**: a new QR scan now closes any existing active session for
  that table (one active session per table), and a session auto-closes once all
  its non-cancelled orders are paid — so a settled/left table cannot keep ordering.
- **Cafe settings** (`/api/settings`, singleton): cafe/legal name, address, phone,
  email, `gstEnabled`, `gstin`, `gstRate`, invoice prefix + counter, footer note.
  GET (staff) / PATCH (OWNER).
- **Bills / invoices** (`/api/bills`): generate a final bill for a table session —
  aggregates its non-cancelled orders, snapshots line items + cafe/GST details,
  computes GST (split evenly into CGST + SGST), assigns a sequential invoice number
  (atomic counter), marks the orders paid, and closes the session. Plus GET by id
  (print) and list. New `CafeSettings` + `Invoice` models; `PaymentMode` enum.
- **Serialization**: documents now serialize with a string `id` alongside `_id`
  (global Mongoose `toJSON`/`toObject` virtuals).
- Verified live (real MongoDB): 15/15 billing-flow checks — GST math, sequential
  invoice number, GSTIN on bill, session auto-close, and re-order-after-bill
  rejected (`SESSION_INACTIVE`).
