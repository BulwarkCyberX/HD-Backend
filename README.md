# `@hackersdeal/api` Backend

NestJS API service for HackersDeal backend foundation.

## Backend Architecture

Feature modules (current):

- `auth`: JWT auth, register/login
- `users`: profile endpoints
- `entities`: entity creation and user linking
- `projects`: project skeleton endpoints
- `bids`: provider proposal workflow and client bid management
- `messages`: participant-only workspace chat
- `reports`: workspace report submission and retrieval
- `payments`: escrow deposit/release orchestrated with `UserWallet` + immutable `WalletLedgerEntry`
- `wallets`, `milestones`, `withdrawals`: financial UX and admin payout approval
- `realtime`: Socket.IO `/workspace` gateway + `DomainEventsService` (Nest EventEmitter)
- `disputes`, `search`, `analytics`, `organizations`, `trust`: marketplace expansion surfaces
- `queues`: BullMQ queue registration against Redis (extend with processors/workers as needed)
- `health`: `GET /health`, `GET /health/ready` (Terminus + Prisma)
- **OpenAPI**: Swagger UI at **`GET /docs`** (non-production friendly; tighten for public deployments)
- **Throttling**: global `@nestjs/throttler` guard (tune exemptions for health if required)
- `reviews`: client feedback and provider reputation updates
- `notifications`: user notifications for key platform events
- `bounty`: private bug bounty programs and researcher submissions
- `vdp`: vulnerability disclosure programs and public reporting
- `files`: multipart uploads, authorized binary download, optional **S3-compatible presign** (`POST /files/presign-upload`, `POST /files/:id/complete-presign`) when `STORAGE_DRIVER` is not `local`
- `ai`: advisory helpers — uses **OpenAI** when `OPENAI_API_KEY` is set (JSON-mode calls), with **Redis-backed daily usage** and `AiUsageLog` persistence; deterministic fallbacks when the key is absent
- `prisma`: DB client lifecycle
- `redis`: `ioredis` client (`REDIS_CLIENT`) for Socket.IO typing/presence keys, AI rate limits, and BullMQ

## Auth System Overview

- JWT-based auth using `@nestjs/jwt` and Passport strategy
- Password hashing with `bcryptjs`
- Register flow supports role assignment (`CLIENT`, `PROVIDER`, `ADMIN`)
- Login and register responses return:
  - `accessToken`
  - user payload including `id` and `role`
- Guards:
  - `JwtAuthGuard`
  - `RolesGuard`
- CORS configured in `main.ts` using `WEB_ORIGIN`

## Database (Prisma)

- Provider: PostgreSQL
- Schema path: `prisma/schema.prisma`
- Migration path: `prisma/migrations/*` (includes enterprise tables: wallets, ledger, milestones, withdrawals, disputes, skills/search helpers, orgs, AI usage, etc.)
- Prisma service initialized in `PrismaModule`
- **Seed:** `npm run db:seed --workspace @hackersdeal/api` (if configured) ensures a **platform wallet** and default fee config where applicable — see `prisma/seed.js`

Useful commands:

```bash
npm run db:generate --workspace @hackersdeal/api
npm run db:migrate --workspace @hackersdeal/api -- --name <name>
```

## API Structure

Base routes:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me` (protected)
- `GET /users/provider/:id` (protected)
- `GET /users/:id` (protected, ownership/admin checks in service)
- `POST /entities` (protected)
- `POST /projects` (protected, CLIENT role only)
- `GET /projects` (protected)
- `GET /projects/:id` (protected)
- `POST /bids` (protected, PROVIDER only, consumes bid credit)
- `GET /bids/project/:projectId` (protected, CLIENT owner only)
- `GET /bids/my` (protected, PROVIDER only)
- `PATCH /bids/:id/status` (protected, CLIENT owner only)
- `POST /messages` (protected, workspace participants only)
- `GET /messages/:projectId` (protected, workspace participants only)
- `POST /reports` (protected, selected provider only)
- `GET /reports/:projectId` (protected, workspace participants only)
- `GET /reports/admin/all` (protected, ADMIN only)
- `PATCH /reports/:id/triage` (protected, ADMIN only)
- `POST /reviews` (protected, CLIENT owner only, completed project only)
- `PATCH /projects/:id/complete` (protected, CLIENT owner only)
- `POST /payments/deposit` (protected, CLIENT owner only)
- `POST /payments/release` (protected, CLIENT owner only)
- `POST|GET /bounty/*` — private programs and bounty submissions (JWT, role checks per route)
- `POST /vdp` (CLIENT), `GET /vdp/:id` (public), `POST /vdp/report` (public)
- `POST /files/upload` (JWT), `POST /files/vdp-attach` (public multipart), `GET /files/:id` (JWT stream)
- `POST /files/presign-upload`, `POST /files/:id/complete-presign` (JWT) — when using S3/R2/MinIO-style storage
- `GET /notifications`, `PATCH /notifications/:id/read` (JWT)
- `POST /ai/scope`, `POST /ai/proposal`, `POST /ai/report-review` (JWT); additional routes such as risk / duplicate hints may exist — see **`docs/api.md`**
- **Wallets:** `GET /wallets/me` (JWT)
- **Milestones:** `GET /milestones/project/:projectId`, `POST /milestones`, `PATCH /milestones/:id`, `DELETE /milestones/:id`, lifecycle `POST /milestones/:id/fund|start|submit|approve|release|reject`, comments `GET|POST /milestones/:id/comments` (JWT; participant rules enforced in service)
- **Withdrawals:** `POST /withdrawals`, `GET /withdrawals/me`; admin: `GET /withdrawals/admin/pending`, `PATCH /withdrawals/admin/:id/approve|reject` (ADMIN)
- **Realtime:** Socket.IO namespace **`/workspace`** (JWT on connection); not listed above as HTTP — see **`docs/architecture.md`**
- Disputes, search, analytics, organizations, trust, and other expansion routes are documented in **`docs/api.md`**

Environment:

- `FILE_UPLOAD_DIR` — optional directory for local uploads (defaults to `./uploads`)
- `PUBLIC_API_URL` — optional absolute API origin used in generated file URLs (defaults to first `WEB_ORIGIN` or `http://localhost:4000`)
- **`REDIS_URL`** — Redis connection string (used for Socket.IO presence/typing, AI usage counters, BullMQ). Local stack: `docker-compose.yml` at repo root exposes `redis://localhost:6379`.
- **`PLATFORM_WALLET_ID`** — optional; seed creates a platform wallet row (default id `platform_wallet_main` in `prisma/seed.js`) for ledger operations.
- **Object storage (optional):** `STORAGE_DRIVER` (`local` default), `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — same SDK works for AWS S3, Cloudflare R2, MinIO, etc.
- **OpenAI (optional):** `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g. `gpt-4o-mini`) — see `env.json` for placeholders.
- **Mail (notifications, login OTP, etc.)** — one stack, env-driven:
  - `MAIL_PROVIDER` — `auto` (default), `smtp`, or `sendgrid`. `auto` uses Gmail SMTP if `GMAIL_SMTP_USER` + `GMAIL_SMTP_APP_PASSWORD` are set, otherwise SendGrid if `SENDGRID_API_KEY` is set.
  - `MAIL_FROM_ADDRESS` — From address (e.g. `hdteam@yourdomain.com`). Falls back to `SENDGRID_FROM_EMAIL` if unset.
  - `MAIL_REPLY_TO` — Reply-To (defaults to same as From).
  - `MAIL_FROM_NAME` — Display name (e.g. `HD Team`). Falls back to `SENDGRID_FROM_NAME`.
  - **Gmail SMTP:** `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, optional `GMAIL_SMTP_HOST` (default `smtp.gmail.com`), `GMAIL_SMTP_PORT` (default `587`).
  - **SendGrid (optional):** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `SENDGRID_ENABLED`

Validation:

- global `ValidationPipe` enabled
- DTO validation via `class-validator`

## Project Module Scope Builder Fields

Project creation accepts structured fields:

- `assets` (JSON)
- `inScope` (`string[]`)
- `outOfScope` (`string[]`)
- `testingWindow`
- `budgetType` (`FIXED` | `HOURLY` | `MILESTONE`)
- `budgetAmount`
- `timeline`
- `visibility` (`PUBLIC` | `PRIVATE` | `INVITE_ONLY`)

## Bids and Bid Credits

- `ProviderProfile` includes `bidCredits` (default `5`)
- each successful `POST /bids` deducts one credit
- bid status lifecycle:
  - `PENDING`
  - `ACCEPTED`
  - `REJECTED`
- only project owner client can update bid status
- accepting a bid assigns selected provider and sets project to `IN_PROGRESS`

## Workspace Execution Rules

- workspace participants = project owner client + selected provider
- messages available only to participants
- reports viewable only by participants
- report submission limited to selected provider
- report default lifecycle starts at `SUBMITTED`

## Report Trust and Triage Rules (MVP)

- triage decisions can be made only by `ADMIN`
- triage endpoint accepts:
  - `VALID`
  - `REJECTED`
  - `NEED_MORE_INFO`
- triage notes are stored for audit and provider feedback
- client report listing excludes untriaged states (`SUBMITTED`, `UNDER_REVIEW`)
- project completion requires at least one `VALID` report unless client explicitly confirms override
- `VALID` triage updates provider `validReportCount` and reputation score

## Reputation and Review Rules (MVP)

- review submission restricted to project owner client
- review allowed only after project is `COMPLETED`
- one review per project
- provider profile metrics updated on review:
  - `rating` (average)
  - `totalReviews`
  - `completedProjects`
  - `reputationScore`
- reputation score formula:
  - `(rating * 0.5) + (validReportCount * 0.3) + (completedProjects * 0.2)`

## Payments and Escrow Rules (MVP)

- deposit creates one payment per project with `IN_ESCROW` status
- only project owner client can deposit or release
- deposit requires selected provider assignment
- release requires project status `COMPLETED`
- release moves payment status from `IN_ESCROW` to `RELEASED`
- **Ledger:** deposits and releases also post **`WalletLedgerEntry`** rows and update **`UserWallet`** / **`PlatformWallet`** aggregates inside Prisma transactions (see `modules/wallets`, `modules/payments`). Milestone fund/release flows attach ledger entries with milestone references.

## Run Commands

From repo root:

```bash
npm run dev --workspace @hackersdeal/api
npm run build --workspace @hackersdeal/api
npm run lint --workspace @hackersdeal/api
```
