# CLAUDE.md — Rules for AI Assistants (Cafe Dhara backend)

This is the backend for **Cafe Dhara**, a SINGLE-cafe ordering app.
Stack: Node.js + Express + MongoDB (Mongoose) + TypeScript.

## Single-cafe model (READ FIRST)
- There is exactly ONE cafe. **No multi-tenancy, no super-admin, no billing/subscriptions.**
- **Never add a `restaurantId` (or tenant id) to any model.** It does not exist here.
- `OWNER` is the top-level admin role. Roles: OWNER, MANAGER, WAITER, CASHIER, KITCHEN, STAFF.
- Dropped vs the reference Prisma backend: Restaurant, RestaurantMember, Plan, Subscription, Invoice.

## NEVER DO
- Never read, grep, cat, or access `.env` or any environment file. Never read/expose secrets.
- Never hardcode credentials, secrets, JWT secrets, or DB URLs in source. Use `process.env` (via `src/config/env.ts`).
- Never expose stack traces or internal error details in API responses (the global error handler enforces this).
- Never skip input validation on an endpoint.
- Never hard-delete user data where a `deletedAt` soft-delete field exists.
- Never commit `.env` or `node_modules`/`dist`.
- Never force-push; never run destructive DB commands without explicit confirmation.

## ALWAYS DO
- Always validate request input with Zod (`<feature>.validation.ts`) before using it.
- Always hash passwords (`src/utils/password.ts`, bcryptjs) — never store plaintext.
- Always sign JWTs with secrets from env (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`); QR tokens with `QR_SECRET`.
- Always return the standard envelope: `{ success, data, error, meta }` (use `src/common/response.ts`).
- Always apply RBAC (`authenticate` + `authorize(...)` / `requireOwner`) where roles matter.
- Always index frequently-queried fields (status, createdAt, etc.).
- Always use soft deletes (`deletedAt`) where the model has that field.
- Always wrap async route handlers in `asyncHandler` so errors reach the global handler.

## Architecture
- `src/config` — env loader (zod-validated) + Mongoose connection.
- `src/models` — Mongoose schemas (see `src/models/index.ts`).
- `src/modules/<feature>` — `<feature>.routes.ts`, `.controller.ts`, `.service.ts`, `.validation.ts`.
- `src/middleware` — auth, rbac, error handler, notFound, rate limit.
- `src/common` — response helper, `AppError`, `asyncHandler`.
- `src/sockets` — Socket.IO bootstrap (gateways added later).
- `src/utils` — password, jwt, token hashing, duration helpers.

## Adding a feature module (convention)
See the header comment in `src/modules/index.ts` and the README. In short:
1. Create `src/modules/<name>/<name>.routes.ts` exporting a default `Router`.
2. Add one import line + one `apiRouter.use('/<name>', <name>Routes)` line in `src/modules/index.ts`.

## Naming
- Files: `camelCase.ts` for modules/utils; models as `<Name>.model.ts`.
- Enums: `SCREAMING_SNAKE_CASE` values.
- API routes: kebab-case, plural where it reads naturally.
