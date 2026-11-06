# Consultify

Find a financial advisor, request a consultation, and keep the conversation going through community discussions.

**[Live demo](https://consultify-olive.vercel.app/)** · [Repository](https://github.com/amriiit/consultify) · [Architecture](#architecture) · [Product walkthrough](#product-walkthrough)

![Consultify homepage: advisor discovery and financial community](docs/screenshots/homepage.webp)

## Overview

Consultify brings advisor discovery, consultation requests, and financial discussions into one full-stack application. Members can browse profiles, request appointments, track their progress, and review completed consultations. Advisors maintain their public profiles and manage incoming requests.

The project explores the engineering behind a workflow that crosses user roles: keeping a booking attached to the right customer and advisor, enforcing status changes on the server, and allowing reviews only after completion. The deployed V1 focuses on **finance**. It manages consultation requests; it does not process payments or host the consultation itself.

## Core features

| Area | Implemented behavior |
|---|---|
| Accounts and roles | Member (`USER`) and advisor (`ADVISOR`) registration, login, JWT authentication, session restoration and protected pages. Server middleware enforces role permissions. |
| Advisor discovery | Public profiles, name/specialization search, and a finance-domain filter. Advisors create and edit their own specialization, bio, experience and fee. |
| Appointments | Members request a date/time. The owning advisor confirms and completes the request; the customer can cancel pending or confirmed appointments. Both roles have dashboards and status filters. |
| Community | Public discussions and comments, authenticated posting, one helpful vote per user/post, and owner-only deletion of posts and comments. |
| Reviews | A customer can submit a 1–5 rating and optional comment for their own completed appointment. One review per appointment; profiles display reviews and an aggregate rating. |

## Product walkthrough

These are real screenshots of the deployed application, captured on **6 November 2026**. Accounts and consultation content shown in authenticated views are explicitly synthetic. Public pages were captured for this README; authenticated views are documentation copies from the earlier live audit. No additional production records were created for this showcase. [Screenshot provenance](docs/screenshots/README.md)

### Discover an advisor

Search by name or specialization, then open a public profile to read the advisor's background and reviews. The domain selector currently offers finance only.

![Advisor directory with search and finance filter](docs/screenshots/advisor-discovery.webp)

<details>
<summary>View a public advisor profile</summary>

![Public synthetic advisor profile and consultation entry point](docs/screenshots/advisor-profile.webp)

</details>

### Book a consultation

A signed-in member chooses a local date/time and can add notes. A successful request starts as `PENDING`; it is not a reserved availability slot.

<table>
<tr>
<td width="50%"><img src="docs/screenshots/appointment-booking.webp" alt="Authenticated booking form with date, time and notes" /></td>
<td width="50%"><img src="docs/screenshots/booking-confirmation.webp" alt="Successful consultation request with pending confirmation" /></td>
</tr>
<tr><td>Choose a date, time and discussion notes.</td><td>The API accepted the request; the UI shows its pending state.</td></tr>
</table>

### Manage appointments

The advisor moves a request from `PENDING` to `CONFIRMED`, then to `COMPLETED`. Customers see the persisted status on their own appointment list.

<table>
<tr>
<td width="50%"><img src="docs/screenshots/appointment-confirmed.webp" alt="Customer appointment with confirmed status" /></td>
<td width="50%"><img src="docs/screenshots/appointment-management.webp" alt="Advisor appointment after completion" /></td>
</tr>
<tr><td>Customer view after advisor confirmation.</td><td>Advisor view after completion.</td></tr>
</table>

<details>
<summary>See the member and advisor dashboards</summary>

**Member overview** — appointment counts and personal navigation.

![Authenticated member dashboard](docs/screenshots/customer-dashboard.webp)

**Advisor overview** — profile controls and appointment counts.

![Authenticated advisor dashboard](docs/screenshots/advisor-dashboard.webp)

</details>

### Participate in community discussions

Members and advisors can contribute comments and recognize helpful posts. Duplicate helpful votes return a conflict response; only the content's owner can delete it.

![Synthetic discussion with a comment and helpful interaction](docs/screenshots/community.webp)

### Review a completed consultation

Review eligibility is checked against the appointment's owner and `COMPLETED` status. The rating below is a synthetic workflow test, not a service endorsement.

![Persisted synthetic review on the public advisor profile](docs/screenshots/reviews.webp)

### Mobile experience and account access

Responsive navigation and forms are available on smaller screens. The mobile screenshot uses a 390 × 844 viewport; desktop captures use 1440 × 900 before documentation crops.

<table>
<tr>
<td width="30%"><img src="docs/screenshots/mobile-view.webp" alt="Consultify homepage on a 390-pixel-wide mobile viewport" width="260" /></td>
<td width="70%"><img src="docs/screenshots/authentication.webp" alt="Live Consultify login page with empty credential fields" /></td>
</tr>
</table>

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, JavaScript, CSS |
| Backend | Node.js, Express 5, CommonJS modules |
| Database | PostgreSQL, `pg` connection pooling, parameterized SQL; five SQL migration files |
| Authentication | `jsonwebtoken`, bcrypt password hashing |
| Deployment | Vercel frontend, Railway Express service and Railway PostgreSQL |
| Testing | Node.js test runner, Playwright/Chrome, isolated PostgreSQL fixtures |
| Development tooling | npm lockfiles, nodemon, dotenv, Git |

There is no ORM or separate service/model layer: route handlers call controllers, which issue SQL through the shared pool.

## Architecture

```mermaid
flowchart LR
    B[Browser] -->|HTML, JavaScript, CSS| V[Vercel: React frontend]
    B -->|Relative /api requests| W[Vercel API rewrite]
    W -->|HTTPS /api/*| E[Railway: Express API]
    E -->|Parameterized SQL through pg| P[(Railway PostgreSQL)]
```

The browser loads the React build from Vercel. Its shared API client uses relative `/api` paths and adds a bearer token for authenticated requests. In production, [frontend/vercel.json](frontend/vercel.json) forwards those requests to Railway **before** applying the SPA fallback to `index.html`. Locally, Vite supplies the equivalent API proxy to port 8000.

Express verifies JWTs, checks roles and ownership, validates inputs, and executes SQL. The Railway service reads `DATABASE_URL`, `JWT_SECRET`, optional `JWT_EXPIRES_IN`, and its assigned `PORT` from runtime configuration. Startup checks database connectivity before listening. Secrets stay on the server; the frontend has no database credentials.

The deployed API is available at [Railway](https://consultify-production-ab90.up.railway.app/api/health), and through [Vercel's API proxy](https://consultify-olive.vercel.app/api/health). The application itself is not deployed through the former local Docker lab; the retained Compose file is for optional local PostgreSQL only.

## Database design

```mermaid
erDiagram
    users ||--o| advisor_profiles : owns
    users ||--o{ appointments : requests
    advisor_profiles ||--o{ appointments : receives
    users ||--o{ community_posts : writes
    community_posts ||--o{ comments : contains
    users ||--o{ comments : writes
    community_posts ||--o{ post_helpful : receives
    users ||--o{ post_helpful : gives
    appointments ||--o| reviews : has

    users {
        uuid id PK
        varchar name
        varchar email UK
        text password_hash
        varchar role
    }
    advisor_profiles {
        uuid id PK
        uuid user_id FK,UK
        varchar domain
        varchar specialization
        integer experience_years
        numeric consultation_fee
    }
    appointments {
        uuid id PK
        uuid user_id FK
        uuid advisor_id FK
        timestamptz scheduled_at
        varchar status
    }
    community_posts {
        uuid id PK
        uuid user_id FK
        varchar title
        text content
    }
    comments {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text content
    }
    post_helpful {
        uuid post_id PK,FK
        uuid user_id PK,FK
    }
    reviews {
        uuid id PK
        uuid appointment_id FK,UK
        smallint rating
        text comment
    }
```

The diagram shows key columns from the [actual migrations](database/migrations), rather than every timestamp or text field. Seven tables encode nine foreign-key relationships. Unique email and advisor-owner constraints prevent duplicate identities/profiles. `post_helpful` has a composite primary key, and `reviews.appointment_id` is unique. Check constraints restrict roles, appointment statuses, nonnegative experience/fees, and ratings from 1 to 5.

Reviews obtain their advisor and reviewer through the appointment, so those identities are not duplicated in the review row. The schema allows three advisor domains, but V1 controllers accept only `FINANCE`.

## Engineering highlights

- **Authorization lives on the server.** JWT middleware verifies signatures; role middleware distinguishes member/advisor operations. SQL predicates also constrain appointment updates and content deletion to their owners. React route guards provide navigation behavior, not the security boundary.
- **Appointment transitions are explicit.** The status update SQL permits only `PENDING → CONFIRMED → COMPLETED` for the assigned advisor. Cancellation is limited to the owning member and a pending/confirmed state. Unsupported transitions do not update a row.
- **Review rules span API and database.** The controller checks ownership, completion and integer rating; a unique appointment reference provides a database constraint against duplicate reviews.
- **Passwords are hashed with bcrypt cost 12.** Registration normalizes email, validates required fields, requires at least 12 password characters and limits input to 72 UTF-8 bytes. User responses omit the password hash.
- **The frontend shares one request boundary.** The API client centralizes JSON parsing, bearer headers, timeout/error messages and 401 session clearing. Resource loaders use a generation counter to prevent stale responses overwriting newer state.
- **Error behavior has regression coverage.** Unknown `/api` routes return JSON404 after valid routers, while parser errors retain their existing JSON handling. This fix is [deployed](https://github.com/amriiit/consultify/commit/5adc5d88a3074efe329735d4ffcdf5b330a1a983) and was rechecked through both public domains for this README.

## Testing and quality assurance

Verification recorded on **6 November 2026**; the rows below describe distinct runs, not a combined coverage percentage.

| Scope | Recorded result | What it establishes |
|---|---|---|
| Initial live production audit | 105 executed: 104 passed, 1 failed; 4 blocked, 2 skipped | Real Chrome registration, advisor profiles, booking/confirmation/completion/review, community interactions, ownership checks and persistence. The failure was an HTML response for unknown API routes. |
| Backend after the fix | 297 passed, 0 failed | 284 existing checks plus 13 API-routing regressions, run against a fresh isolated native PostgreSQL 18.6 cluster. |
| Frontend client tests | 6 passed, 0 failed | Controlled-response tests for JSON requests, bearer handling, stale401 protection, and response/transport errors. |
| Deployment smoke checks | 23 passed, 0 failed | Live Railway/Vercel health, JSON404, public lists, protected endpoint rejection, browser routes and refresh after deployment. |
| Frontend production build | Passed | Vite generated the production bundle; this is not a substitute for browser workflow testing. |

The existing [Playwright suite](frontend/tests/e2e.mjs) exercises browser workflows with isolated Express/Vite/PostgreSQL infrastructure. The backend suite also checks validation, permissions, data constraints and lifecycle behavior. Test runners generate their own credentials and databases rather than reusing development or production data.

Including blocked and skipped scenarios, the audit ledger contains 111 planned checks; 105 were executed. The mobile-review visual check remained blocked. The review journey passed after correcting an audit-only selector; the earlier attempt was retained in private evidence. The subsequent JSON404 fix passed the separate local and deployment checks above; the full data-creating audit was not rerun.

Natural production JWT expiration, direct production SQL verification, Firefox/Safari coverage and clean visual confirmation of the original mobile review capture remained unverified. Actual Railway-outage testing and deletion of records without application deletion functions were skipped. Raw traces, credentials and production record manifests stay private and Git-ignored. [Sanitized verification summary](docs/VERIFICATION.md)

### Run the tests locally

With native PostgreSQL tools (`initdb`, `pg_ctl`) on `PATH`:

```sh
# Project root: creates and stops a new disposable cluster
node tests/run-backend.js

# Frontend client tests and isolated browser workflows
cd frontend
npm test
npm run test:e2e
npm run build
```

The browser suite needs Google Chrome installed. `npm run test:e2e:pg17` is an alternative that starts its own temporary PostgreSQL 17.4 container; Docker is only needed for that option. Neither runner should be pointed at an existing or production database.

## Local development

**Prerequisites:** Node.js 22.12+ (Node 24 was used for verification), npm, PostgreSQL and `psql`. Backend and frontend run directly with Node/Vite. Docker Desktop is optional if using the supplied database-only Compose service.

### 1. Install dependencies

```sh
git clone https://github.com/amriiit/consultify.git
cd consultify
npm ci
npm --prefix frontend ci
cp .env.example .env
```

### 2. Configure a local database

Edit the root `.env` with your own local values. The placeholders below are not usable credentials; URL-encode the password inside `DATABASE_URL`.

```dotenv
PORT=8000
DATABASE_URL=postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5433/consultify
POSTGRES_PASSWORD=YOUR_LOCAL_PASSWORD
JWT_SECRET=YOUR_RANDOM_SECRET
JWT_EXPIRES_IN=1h
```

Generate a local JWT secret with `openssl rand -hex 32` and keep it in `.env`. `POSTGRES_PASSWORD` configures the optional Compose service; Express connects using `DATABASE_URL`.

For a **new local database**, either create `consultify` in your native PostgreSQL installation and adjust the URL/port, or start the existing database-only service:

```sh
docker compose up -d postgres
```

Compose uses PostgreSQL 17.4 on `127.0.0.1:5433` and the persistent `postgres_data` volume. It does not containerize Express or React. For an existing development database, keep its existing credentials/data; editing `.env` does not reset a persisted PostgreSQL password.

### 3. Initialize only a new, empty database

Apply the five migrations in order to your local database. These are initial schema files, not an idempotent upgrade command. Skip this step if they have already been applied; never run it against the live Railway database.

```sh
psql -h 127.0.0.1 -p 5433 -U postgres -d consultify \
  -v ON_ERROR_STOP=1 --single-transaction \
  -f database/migrations/001_create_users.sql \
  -f database/migrations/002_create_advisor_profiles.sql \
  -f database/migrations/003_create_appointments.sql \
  -f database/migrations/004_create_community.sql \
  -f database/migrations/005_create_reviews.sql
```

For native PostgreSQL, create a new database first, for example `createdb -h 127.0.0.1 -p 5432 -U postgres consultify`, then adjust the migration connection arguments and `DATABASE_URL` to that port/user. `psql` prompts for your local password when authentication requires one.

### 4. Start the application

In the project root:

```sh
npm run dev
# Or: npm start
```

In a second terminal:

```sh
cd frontend
npm run dev
```

Open **http://127.0.0.1:5174**. Express defaults to **http://127.0.0.1:8000**; check `/api/health` for database connectivity. Vite forwards `/api` to that backend. If changing the API port, set `API_PROXY_TARGET=http://127.0.0.1:YOUR_PORT` when launching Vite. `npm run preview` serves build output but does not provide the development API proxy.

## Deployment

Vercel builds the `frontend/` application with `npm run build` and serves `dist/`. Railway runs the root `npm start` against Railway PostgreSQL. Runtime secrets belong in the hosting environment, not in frontend code or Git.

The repository's `main` branch is connected to both platforms, so pushes can trigger automatic deployment. The API rewrite and SPA fallback are defined in [frontend/vercel.json](frontend/vercel.json). No Railway configuration file is committed; service/environment settings are managed on the platform. Do not mistake this deployment automation for an automated test gate: a hosted test-check workflow is a future improvement.

## Project structure

```text
consultify/
├── src/
│   ├── app.js                  # Router registration and JSON errors
│   ├── server.js               # Database check and HTTP startup
│   ├── config/db.js            # Shared pg pool
│   ├── controllers/            # SQL-backed request handlers
│   ├── middlewares/            # JWT and role checks
│   └── routes/                 # REST API route definitions
├── database/migrations/        # Five SQL files, seven tables
├── frontend/
│   ├── src/
│   │   ├── api/                # Shared client and feature API modules
│   │   ├── context/            # Authentication state
│   │   ├── components/         # Layout, forms and feature cards
│   │   ├── pages/              # Public and role-specific screens
│   │   └── routes/             # Protected navigation
│   ├── tests/                  # Client tests and Playwright workflows
│   ├── scripts/                # Isolated browser-test runner
│   └── vercel.json             # API rewrite before SPA fallback
├── tests/                      # Backend checks and disposable DB harness
├── docs/                       # Screenshots, verification and design notes
├── docker-compose.yml          # Optional local PostgreSQL only
└── .env.example                # Local configuration template
```

## Known limitations and next steps

V1 is finance-only and profiles are self-declared. Consultation times are requests rather than availability-checked slots: the UI requires a future time, but the backend currently validates parsing without enforcing a future-time or booking-conflict rule. Fees have no currency field. There are no payments, video calls or chat.

Account editing, password recovery, email verification, refresh tokens, token revocation, moderation tools, pagination and account/profile/appointment/review deletion are not implemented. JWTs are stored in `sessionStorage`, which is accessible to JavaScript; logout clears the browser token without revoking an issued token on the server. The database has an `ADMIN` role value, but there is no implemented admin interface.

Useful next steps are server-side scheduling policy, account recovery and verification, rate-limit/security-header review, monitoring and alerting, a verified backup/restore procedure, CI test gates, and broader browser/accessibility testing. These are future work, not claims about current production capabilities.

## Author

[Amrit Kumar · @amriiit](https://github.com/amriiit)
