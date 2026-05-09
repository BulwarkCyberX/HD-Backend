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
- `payments`: mock escrow deposit and release flow
- `reviews`: client feedback and provider reputation updates
- `notifications`: user notifications for key platform events
- `bounty`: private bug bounty programs and researcher submissions
- `vdp`: vulnerability disclosure programs and public reporting
- `files`: multipart uploads and authorized binary download
- `ai`: advisory helpers (mock; swap for OpenAI later)
- `prisma`: DB client lifecycle
- `redis`: placeholder module for future caching/queue

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
- Migration path: `prisma/migrations/*`
- Prisma service initialized in `PrismaModule`

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
- `GET /notifications`, `PATCH /notifications/:id/read` (JWT)
- `POST /ai/scope`, `POST /ai/proposal`, `POST /ai/report-review` (JWT)

Environment:

- `FILE_UPLOAD_DIR` — optional directory for local uploads (defaults to `./uploads`)
- `PUBLIC_API_URL` — optional absolute API origin used in generated file URLs (defaults to first `WEB_ORIGIN` or `http://localhost:4000`)
- SendGrid (optional, email for notification events):
  - `SENDGRID_ENABLED` — set to `"true"` to enable email sending (or provide `SENDGRID_API_KEY`)
  - `SENDGRID_API_KEY` — SendGrid API key
  - `SENDGRID_FROM_EMAIL` — sender email address (required when sending)
  - `SENDGRID_FROM_NAME` — optional sender name

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

## Run Commands

From repo root:

```bash
npm run dev --workspace @hackersdeal/api
npm run build --workspace @hackersdeal/api
npm run lint --workspace @hackersdeal/api
```
