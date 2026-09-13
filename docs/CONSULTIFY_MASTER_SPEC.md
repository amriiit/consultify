# Consultify — Master Engineering Specification

> This file is the authoritative design and implementation reference for Consultify. When code, AI-generated suggestions, or future documentation conflict with this document, the conflict must be explicitly reviewed rather than silently resolved.

**Full title:** Community-Driven Multi-Domain Consultation Platform.

| Audit metadata | Value |
| --- | --- |
| Last audited against repository | 2026-09-14, Asia/Kolkata |
| Repository | `CONSULTIFY`, local directory `consultify/` |
| Git branch | `main` |
| Audited commit | `74aeec62c37863c8c72ded88c836121766113923`, plus the scoped working-tree changes described below |
| Commit subject | Improve repository security and ignore macOS files |
| Master document revision | Day 3 registration maintenance and current-state correction |
| Package version | `1.0.0` in `package.json`; this does **not** mean product V1 is complete |
| Product readiness | [PARTIALLY IMPLEMENTED] Backend/database foundation and registration; approximately **15–20% toward V1**, midpoint estimate 18%; see section 31 |
| Audit scope | Registration controller/router, app wiring, users migration, relevant startup/health/pool code, dependency metadata/installation, Compose, environment example, ignore rules, and Git history/status required for this update |
| Source preservation | This maintenance task changes only `src/controllers/auth.controller.js`, `src/app.js`, and this document. Dependencies, configuration, migrations, routes, and database data are unchanged |
| Verification limits | Syntax checks on the two modified JavaScript files and Git diff/status review; no application tests added or run, no server/database started, and no live database data modified |
| Compose configuration | [IMPLEMENTED] Previously reported C-12 ports syntax issue is resolved in the inspected repository; `docker compose config --no-interpolate --quiet` passes. This verifies configuration structure, not live infrastructure |
| Live infrastructure | [TBD] Container state, server PostgreSQL version, applied migrations, and persisted data were not inspected during this maintenance task |
| Secret handling | `.env` was not opened. Private credentials, tokens, and production connection strings are not included here |

## Table of contents

1. [Authority, status labels, and evidence rules](#1-authority-status-labels-and-evidence-rules)
2. [Product, domains, and version boundaries](#2-product-domains-and-version-boundaries)
3. [Architectural principles](#3-architectural-principles)
4. [Repository inventory and current project progress](#4-repository-inventory-and-current-project-progress)
5. [Current and target file structures](#5-current-and-target-file-structures)
6. [Technology stack and dependency inventory](#6-technology-stack-and-dependency-inventory)
7. [Current backend and request lifecycle](#7-current-backend-and-request-lifecycle)
8. [Local network, Docker, and environment model](#8-local-network-docker-and-environment-model)
9. [SQL, connection pooling, and migrations](#9-sql-connection-pooling-and-migrations)
10. [Current users schema](#10-current-users-schema)
11. [Target relational model and integrity rules](#11-target-relational-model-and-integrity-rules)
12. [Authentication, password security, and authorization](#12-authentication-password-security-and-authorization)
13. [API contract conventions and endpoint inventory](#13-api-contract-conventions-and-endpoint-inventory)
14. [Detailed API contracts and V1 request flows](#14-detailed-api-contracts-and-v1-request-flows)
15. [Appointments and state transitions](#15-appointments-and-state-transitions)
16. [Community, reviews, dashboards, and administration](#16-community-reviews-dashboards-and-administration)
17. [Validation, HTTP status codes, and error handling](#17-validation-http-status-codes-and-error-handling)
18. [Non-negotiable security invariants](#18-non-negotiable-security-invariants)
19. [Time, deletion, pagination, search, and indexes](#19-time-deletion-pagination-search-and-indexes)
20. [Frontend architecture](#20-frontend-architecture)
21. [Testing strategy and feature acceptance cases](#21-testing-strategy-and-feature-acceptance-cases)
22. [Logging, performance, and scalability](#22-logging-performance-and-scalability)
23. [Local development and debugging commands](#23-local-development-and-debugging-commands)
24. [Deployment and Git workflow](#24-deployment-and-git-workflow)
25. [14-day V1 implementation roadmap](#25-14-day-v1-implementation-roadmap)
26. [Implementation checklist](#26-implementation-checklist)
27. [Feature dependency graph](#27-feature-dependency-graph)
28. [Bug audit checklist](#28-bug-audit-checklist)
29. [Architecture audit checklist](#29-architecture-audit-checklist)
30. [Current implementation conflicts and recommended resolutions](#30-current-implementation-conflicts-and-recommended-resolutions)
31. [Current state → V1 target gap analysis](#31-current-state--v1-target-gap-analysis)
32. [Architecture decision log](#32-architecture-decision-log)
33. [TBD decisions](#33-tbd-decisions)
34. [Interview preparation](#34-interview-preparation)
35. [Version 1 definition of done](#35-version-1-definition-of-done)
36. [Documentation maintenance and README relationship](#36-documentation-maintenance-and-readme-relationship)
37. [How to use this document](#37-how-to-use-this-document)

## 1. Authority, status labels, and evidence rules

[IMPLEMENTED] describes repository artifacts or behavior directly supported by inspected code. It does not certify production readiness, successful runtime execution, or deployment. A migration file existing and a migration being applied are different facts.

| Required label | Meaning |
| --- | --- |
| [IMPLEMENTED] | Present in the audited repository; cite the responsible file and state any verification limit |
| [PARTIALLY IMPLEMENTED] | Some required pieces exist; specify the pieces that are missing |
| [PLANNED V1] | Required or proposed work for Finance-first V1; not currently implemented |
| [PLANNED V2] | Product expansion after V1; candidates remain candidates until selected |
| [PLANNED V3] | Intelligent-platform possibilities; not an implementation commitment |
| [DEFERRED] | Outside current scope, without an approved delivery date |
| [TBD] | Unresolved; use **TBD — DECISION REQUIRED** and distinguish a recommendation from an accepted decision |

[TBD] **Status and decision maturity are separate.** For example, `[PLANNED V1] / [TBD]` means the capability belongs in V1 but a specific schema, endpoint, or policy still needs selection. Labels at the beginning of a subsection apply to its explanatory text and examples unless a more specific label overrides them. Code blocks labeled conceptual, proposed, or educational are documentation examples, not generated implementation files.

[IMPLEMENTED] Evidence is based on these layers:

1. First-party source and configuration establish current code behavior.
2. SQL migration contents establish versioned schema intent, not live database state.
3. `package.json`, `package-lock.json`, and inspected installed manifests distinguish declared, locked, and locally installed dependencies.
4. Git history explains committed milestones; a commit message alone does not prove a complete feature.
5. The original product brief and accepted maintenance instructions establish accepted product intent and architecture choices. They cannot establish implementation that the repository does not contain.
6. Official technical references linked next to explanations clarify technology behavior. They do not expand product scope or override project decisions.

[PLANNED V1] Every future audit must re-check the repository. Do not update an implementation checkbox based only on a plan, generated code suggestion, installed package, empty folder, or route stub. Never assume authentication, tests, migrations, hosting, AI, or middleware exist because they are customary in other applications.

[TBD] When evidence and intent disagree, record **CURRENT IMPLEMENTATION**, **INTENDED IMPLEMENTATION**, **CONFLICT**, and **RECOMMENDED RESOLUTION**. A recommendation in this document is not permission to change the architecture. This maintenance task updates only the explicitly authorized registration behavior and corresponding reference.

## 2. Product, domains, and version boundaries

### 2.1 Core purpose and differentiator

[PLANNED V1] Consultify combines professional consultation, community-based advice, and consultation management/tracking. A Finance user should discover an advisor, view a profile, book and track a consultation, and review a completed consultation. The same user should be able to ask public questions, create posts, comment, share experiences, and mark helpful content.

[PLANNED V1] The differentiator is **professional expertise plus community experience** in one product. Advisor discovery without a community, or a discussion board without a booking workflow, does not fulfill this product definition.

[IMPLEMENTED] Registration and infrastructure diagnostics exist. Advisor discovery, bookings, community, and the complete Finance journey remain unimplemented.

### 2.2 Versions

| Version | Status | Scope | Boundary |
| --- | --- | --- | --- |
| V1 — Core product | [PARTIALLY IMPLEMENTED] | Finance end-to-end; clean backend, relational schema, registration/login, JWT, RBAC/ownership, advisors, bookings, community/comments/helpfulness, reviews, basic frontend, tests, deployment | Correctness and security over feature count; foundation and registration artifacts currently exist |
| V2 — Product expansion | [PLANNED V2] | Health, Astrology, advanced filters/search, availability, notifications, stronger admin tools, community reputation, advisor verification, improved dashboards, favorites, reporting | Reuse generic entities and custom backend; exact feature order and schemas pending |
| V3 — Intelligent platform | [PLANNED V3] | Possible advisor recommendations, question categorization, duplicate detection, consultation summaries, smart FAQs, sentiment analysis, intelligent answer ranking, analytics, recommendation systems | Assistance rather than replacement for professional judgment; no AI package, provider, data pipeline, or model selected |
| Later real-time capabilities | [DEFERRED] | Chat, voice/video calls, WebSockets, real-time notifications | Delivery mechanism, provider, security model, and version assignment are unresolved |
| Additional advisory domains | [DEFERRED] | Legal, Career, Fitness, and other future categories | Examples of extensibility, not approved V1/V2 workflows |

[PLANNED V1] Generic design is mandatory even though Finance is the only launch domain. `USER`, `ADVISOR`, and `ADMIN` are authorization roles. `FINANCE`, `HEALTH`, and `ASTROLOGY` are advisory categories. Do not create `financeUsers`, `healthUsers`, `financeAppointments`, or separate authentication systems per domain.

[PLANNED V2] Community reputation may later consider helpful answers, votes, accepted answers, quality, and activity. These are possible signals; no reputation formula or accepted-answer feature is approved for V1 merely by appearing here.

### 2.3 OUT-OF-SCOPE V1

[DEFERRED] The following must not appear as accidental V1 requirements:

- Health and Astrology workflows, additional domain applications, or specialized duplicated schemas.
- Real-time chat, voice/video infrastructure, and WebSockets.
- Advanced payments, earnings settlement, payment providers, and transaction processing. A profile fee field is not a payment system.
- Microservices, Kubernetes, Redis without measured need, and Elasticsearch.
- AI recommendation engines, other AI/ML workflows, and production-scale analytics.
- A complex reputation engine, full advisor verification operations, and advanced admin workflows.
- Native mobile applications.

[TBD] Email verification, password recovery, refresh tokens, rate limiting, cancellation rules, and minimal advisor onboarding need explicit decisions in section 33. Listing them as decisions does not silently add complete new subsystems to V1.

## 3. Architectural principles

[PLANNED V1] These are accepted project principles, including where implementation has not yet caught up:

1. Build working functionality before adding abstractions.
2. Keep modules clean and responsibilities understandable.
3. Keep a modular monolithic Express backend; avoid premature microservices.
4. Keep SQL explicit through `pg` and parameterized raw PostgreSQL queries.
5. Keep domain architecture generic and represent differences through data/relationships.
6. Enforce security on the backend.
7. Put critical integrity constraints in the database as well as application checks.
8. Treat the frontend as untrusted input.
9. Measure before optimizing.
10. Prioritize V1 correctness over number of features.
11. Make every feature explainable in an interview.
12. Review and understand AI-generated code before accepting it.
13. Avoid dependencies when standard functionality is sufficient.
14. Do not add layers merely to look enterprise-oriented.
15. Refactor when actual complexity demands it.

[IMPLEMENTED] Backend JavaScript uses CommonJS. [PLANNED V1] Keep this backend module style unless an explicit architectural decision changes it. The planned Vite frontend may use its normal browser module conventions; this does not authorize converting the backend.

[PLANNED V1] Keep `server.js` for startup, `app.js` for Express configuration, routes for endpoint mapping, controllers for request/application logic, config for shared configuration, middleware for cross-cutting request checks, and SQL migrations for schema history. Introduce a services layer only when controller complexity justifies shared business operations. Do not pre-create models/services/repositories without a concrete need.

## 4. Repository inventory and current project progress

### 4.1 Audited files and history

[IMPLEMENTED] The repository has 14 tracked files. The scoped inspection covered the artifacts needed to verify registration and correct related stale claims; source links are relative to this document.

| File | Evidence and responsibility |
| --- | --- |
| [package.json](../package.json) | CommonJS, start/dev scripts, five direct dependencies across runtime/development, including bcrypt |
| [package-lock.json](../package-lock.json) | Lockfile version 3; 113 package entries excluding root; bcrypt declared and installed at 6.0.0 |
| [.gitignore](../.gitignore) | Ignores `node_modules/`, `.env`, and `.DS_Store` |
| [.env.example](../.env.example) | Contains `PORT`, a placeholder `DATABASE_URL`, and placeholder `POSTGRES_PASSWORD` |
| [docker-compose.yml](../docker-compose.yml) | PostgreSQL 17.4, valid loopback ports list, `${POSTGRES_PASSWORD}`, and named volume; configuration validation passes |
| [src/app.js](../src/app.js) | JSON parser, health/auth mounts, malformed-JSON error handler after routes, app export |
| [src/server.js](../src/server.js) | dotenv first, startup DB check, HTTP listener, failure exit |
| [src/config/db.js](../src/config/db.js) | Shared `pg.Pool` configured from `DATABASE_URL` |
| [src/routes/health.routes.js](../src/routes/health.routes.js) | `GET /` mapped to `getHealth`; mounted as `/api/health` |
| [src/controllers/health.controller.js](../src/controllers/health.controller.js) | DB probe; 200 connected / 500 disconnected JSON |
| [src/routes/auth.routes.js](../src/routes/auth.routes.js) | `POST /register` mapped to `registerUser`; mounted as `/api/auth` |
| [src/controllers/auth.controller.js](../src/controllers/auth.controller.js) | Manual registration validation, normalization, bcrypt hashing, parameterized SQL, safe response, and duplicate/error handling |
| [database/migrations/001_create_users.sql](../database/migrations/001_create_users.sql) | Users schema, email UNIQUE, and default USER role |
| [CONSULTIFY_MASTER_SPEC.md](CONSULTIFY_MASTER_SPEC.md) | Current implementation evidence and planned V1 reference |

[IMPLEMENTED] Local history contains four commits:

| Commit | Local date | Subject |
| --- | --- | --- |
| `75b37fe24e940ccb7ab372da069d0285368f1fab` | 2026-09-12 | Initialize Express backend with MVC structure |
| `59553f5fe6f73c5424d26be76f520aa451b72537` | 2026-09-13 | Add PostgreSQL database foundation and users schema |
| `c8992c05cd4517f570da9b21c7c1a4647ecfad72` | 2026-09-14 | Add secure user registration |
| `74aeec62c37863c8c72ded88c836121766113923` | 2026-09-14 | Improve repository security and ignore macOS files |

[IMPLEMENTED] The working tree was clean before this maintenance task. `git ls-files '*DS_Store*'` returns no tracked artifacts and ignore checks confirm `.DS_Store` is ignored at root and nested paths. `.env` remains unread. No `AGENTS.md` was found in the repository or inspected ancestor locations.

[IMPLEMENTED] The prior Compose ports discrepancy (C-12) is resolved: the inspected file contains a valid list item and `docker compose config --no-interpolate --quiet` succeeds. No Compose configuration or Docker runtime state was changed by this task.

[TBD] The owner reports Drizzle was briefly installed and removed during development. Current dependency metadata contains no ORM; the intermediate install/removal remains owner-provided history.

### 4.2 CURRENT PROJECT PROGRESS

| Area | Status | Evidence/File | Notes |
| --- | --- | --- | --- |
| Node project and CommonJS | [IMPLEMENTED] | `package.json` | Scripts launch `src/server.js`; package `main` is stale |
| Express app and JSON parser | [IMPLEMENTED] | `src/app.js` | JSON parsing and specific malformed-JSON HTTP 400 handling after routes |
| Server entry and dotenv ordering | [IMPLEMENTED] | `src/server.js:1–23` | Environment loads before pool-dependent imports |
| Startup DB gate | [IMPLEMENTED] | `src/server.js:10–19` | Query success precedes listen; query failure exits 1 |
| Health route/controller | [IMPLEMENTED] | `src/routes/health.routes.js`, `src/controllers/health.controller.js` | Infrastructure API alongside registration |
| Shared database pool | [IMPLEMENTED] | `src/config/db.js` | No custom sizing, TLS, timeouts, idle-error listener, or shutdown hooks |
| PostgreSQL Docker definition | [IMPLEMENTED] | `docker-compose.yml`; C-12 | `postgres:17.4`; configuration validation passes; runtime state unverified |
| DB host mapping and persistence configuration | [IMPLEMENTED] | `docker-compose.yml`; C-12 | Valid `127.0.0.1:5433:5432` ports list and named volume `postgres_data` |
| Running database / applied schema | [TBD] | Not inspected in this maintenance task | No live connectivity, catalog, or volume contents verified |
| Users migration | [IMPLEMENTED] | `database/migrations/001_create_users.sql` | Matches requested schema semantically; no runner or applied-migration ledger |
| UUID/default roles/timestamps | [IMPLEMENTED] | Users migration and registration controller | Registration omits these columns and uses database defaults, including USER |
| Migration workflow | [PARTIALLY IMPLEMENTED] | One SQL migration; no migration npm script | Ordering convention begun; repeatable apply/deployment workflow pending |
| SQL injection defenses for business queries | [IMPLEMENTED] registration | `src/controllers/auth.controller.js` | Duplicate SELECT and INSERT use placeholders and separate value arrays |
| Secret/dependency ignore rules | [IMPLEMENTED] | `.gitignore` | Working rules verified; remote secret scanning not verified |
| Environment documentation | [IMPLEMENTED] example | `.env.example` | PORT, DATABASE_URL, and POSTGRES_PASSWORD placeholders exist; required-variable validation remains planned |
| Registration and password hashing | [IMPLEMENTED] | Auth route/controller, `bcrypt` dependency | POST /api/auth/register; manual validation, bcrypt cost 12, safe USER-only creation; no automatic login |
| Login and JWT | [PLANNED V1] | No login handler or JWT code/package | Day 4; bcrypt.compare login flow remains planned |
| Authenticate/RBAC/ownership | [PLANNED V1] | No `src/middleware/` directory | Database role CHECK does not enforce request access |
| Current-user endpoint | [PLANNED V1] | No user route/controller | Not mounted |
| Domains and Finance seed data | [PLANNED V1] | No domains migration or seed file | Finance-first product requirement only |
| Advisor profiles and discovery | [PLANNED V1] | No advisor files/schema | All API contracts below are proposed |
| Appointments and lifecycle | [PLANNED V1] | No appointment files/schema | State and scheduling policies pending |
| Community posts/comments/helpfulness | [PLANNED V1] | No community files/schema | Helpful interaction required; persistence choice pending |
| Reviews/ratings | [PLANNED V1] | No review files/schema | Completed-appointment integrity not implemented |
| Minimal dashboards | [PLANNED V1] | No frontend or dashboard APIs | Minimal composition of core resources proposed |
| Advanced admin/verification | [PLANNED V2] | No admin code | V1 provisioning policy still needs decision |
| Input validation and safe global errors | [PARTIALLY IMPLEMENTED] | Auth controller and `src/app.js` | Registration validation, 409/500 JSON, malformed-JSON 400 exist; unrelated errors pass to next(error); general error/not-found policy remains planned |
| Frontend React/Vite | [PLANNED V1] | No frontend directory/package/components | No UI, static app hosting, or frontend build script |
| Automated tests and CI | [PLANNED V1] | No tests, test script, test dependencies, or workflow files | Syntax checks during audit are not a maintained test suite |
| CORS/rate limits/JWT secret management | [TBD] | No configuration or middleware | Must be resolved before relevant integration/deployment |
| Logging/monitoring | [PARTIALLY IMPLEMENTED] | Server and auth controller console messages | Registration catch logs error.message server-side; no structured logging or monitoring |
| Deployment | [PLANNED V1] | Local DB Compose only; no deployment config | No backend Dockerfile, hosting provider, live URL, or managed DB evidence |
| README | [PLANNED V1] | Absent | Master spec does not replace a future concise README |
| Master engineering reference | [IMPLEMENTED] | `docs/CONSULTIFY_MASTER_SPEC.md` | Updated for scoped Day 3 maintenance; must be re-audited as code changes |
| Health/Astrology and V2 expansion | [PLANNED V2] | No implementation | Do not expose unfinished domains as supported |
| AI/ML features | [PLANNED V3] | No implementation or selected AI technology | Possibilities only |

## 5. Current and target file structures

### 5.1 CURRENT FILE STRUCTURE

[IMPLEMENTED] Snapshot includes the existing master document and registration files. `.git/` internals and generated `node_modules/` contents are intentionally collapsed; these are not uninspected first-party application modules.

```text
consultify/
├── .git/                         # existing version-control metadata
├── .DS_Store                     # ignored local OS artifact; not tracked
├── .env                          # local, ignored; contents not inspected
├── .env.example                  # tracked, safe environment placeholders
├── .gitignore
├── docker-compose.yml            # valid configuration; C-12 resolved
├── package.json
├── package-lock.json
├── node_modules/                 # ignored generated dependency installation
├── database/
│   ├── .DS_Store                 # ignored local OS artifact; not tracked
│   └── migrations/
│       └── 001_create_users.sql
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── health.controller.js
│   └── routes/
│       ├── auth.routes.js
│       └── health.routes.js
└── docs/
    └── CONSULTIFY_MASTER_SPEC.md # updated for current Day 3 implementation
```

### 5.2 TARGET V1 FILE STRUCTURE

[PLANNED V1] Direction only. `[existing]` identifies an inspected artifact; `[planned]` means a path that does **not** exist. Names and assignments for new files are recommendations, not evidence or instructions to generate empty files. Exact later migration numbering is pending.

```text
consultify/
├── src/
│   ├── app.js                               [existing]
│   ├── server.js                            [existing]
│   ├── config/
│   │   └── db.js                            [existing]
│   ├── controllers/
│   │   ├── health.controller.js             [existing]
│   │   ├── auth.controller.js               [existing; registration only]
│   │   ├── user.controller.js               [planned]
│   │   ├── advisor.controller.js            [planned]
│   │   ├── appointment.controller.js        [planned]
│   │   ├── post.controller.js               [planned; comments/helpful initially here]
│   │   └── review.controller.js             [planned]
│   ├── routes/
│   │   ├── health.routes.js                 [existing]
│   │   ├── auth.routes.js                   [existing; registration only]
│   │   ├── user.routes.js                   [planned]
│   │   ├── advisor.routes.js                [planned]
│   │   ├── appointment.routes.js            [planned]
│   │   ├── post.routes.js                   [planned]
│   │   └── review.routes.js                 [planned]
│   └── middleware/
│       ├── auth.middleware.js               [planned]
│       ├── role.middleware.js               [planned]
│       └── error.middleware.js              [planned]
├── database/
│   └── migrations/
│       ├── 001_create_users.sql             [existing]
│       ├── 002_create_domains.sql           [planned naming example]
│       ├── 003_create_advisor_profiles.sql  [planned naming example]
│       ├── 004_create_appointments.sql      [planned naming example]
│       └── ...                              [planned community/comment/review/helpful SQL]
├── frontend/                                [planned; proposed location]
│   ├── package.json                         [planned]
│   └── src/
│       ├── components/                      [planned reusable UI]
│       ├── pages/                           [planned screen composition]
│       ├── services/                        [planned shared REST client functions]
│       ├── hooks/                           [planned reusable React behavior when needed]
│       ├── context/                         [planned minimal shared auth state if needed]
│       ├── utils/                           [planned formatting/validation helpers as needed]
│       ├── App.jsx                          [planned]
│       └── main.jsx                         [planned]
├── tests/                                   [planned; location/framework TBD]
├── docs/
│   └── CONSULTIFY_MASTER_SPEC.md             [existing]
├── docker-compose.yml                       [existing; local DB only; configuration validated]
├── .env                                     [local ignored file only]
├── .env.example                             [existing; safe placeholders]
├── .gitignore                               [existing]
├── package.json                             [existing]
├── package-lock.json                        [existing]
└── README.md                                [planned]
```

## 6. Technology stack and dependency inventory

[IMPLEMENTED] The audited backend is Node.js + Express 5 + JavaScript/CommonJS + PostgreSQL through `pg` and raw SQL, with `bcrypt` for registration hashing. Docker Compose configures the local database; configuration validation passes (C-12 resolved). No containerized backend exists.

| Package | package.json requirement | Locked version | Locally installed version | Kind and purpose |
| --- | --- | --- | --- | --- |
| `bcrypt` | `^6.0.0` | `6.0.0` | `6.0.0` | Runtime; asynchronous registration password hashing at cost 12 |
| `dotenv` | `^17.4.2` | `17.4.2` | `17.4.2` | Runtime; environment loading at startup |
| `express` | `^5.2.1` | `5.2.1` | `5.2.1` | Runtime; HTTP app, router, JSON responses/parser |
| `pg` | `^8.23.0` | `8.23.0` | `8.23.0` | Runtime; PostgreSQL driver and connection pool |
| `nodemon` | `^3.1.14` | `3.1.14` | `3.1.14` | Development; restart server during editing |

[IMPLEMENTED] Lockfile format is 3. `package.json` specifies `type: "commonjs"`, `license: "ISC"`, empty description/author/keywords, and `main: "index.js"`. There is no root `index.js`. The actual scripts are:

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```

| Tool/runtime | Observed/configured version | Status and limits |
| --- | --- | --- |
| Node.js CLI | `v24.18.1` | [IMPLEMENTED] Local audit environment; no `engines`, `.nvmrc`, or other project Node pin |
| npm CLI | `11.16.0` | [IMPLEMENTED] Local environment; no `packageManager` pin |
| Express minimum Node declaration | `>= 18` in locked package metadata | [IMPLEMENTED] Dependency requirement, not the project's deployment-version decision |
| Docker CLI | `29.7.2`, build `a7dcaa6` | [IMPLEMENTED] CLI available; daemon version/running state unverified |
| Docker Compose CLI | `v5.4.0` | [IMPLEMENTED] CLI available; separate from PostgreSQL version |
| PostgreSQL image | `postgres:17.4` | [IMPLEMENTED] Configured tag; actual running server/version unverified |
| PostgreSQL application schema | Users migration only | [PARTIALLY IMPLEMENTED] No other tables or live schema confirmed |
| React, Vite, frontend JavaScript | No dependencies/files | [PLANNED V1] Chosen frontend direction; versions not selected |
| bcrypt hashing package | `bcrypt` 6.0.0 | [IMPLEMENTED] Installed and used by registration at cost 12; D-05 accepted |
| JWT implementation package | Absent | [PLANNED V1] / [TBD] JWT mechanism chosen, library/algorithm/lifetime pending |
| Validation/test/logging libraries | No selected packages | [IMPLEMENTED] Explicit manual registration validation (D-08); test/logging library selection remains [TBD] |

[IMPLEMENTED] Drizzle, Prisma, Sequelize, TypeORM, bcryptjs, JWT libraries, React, and Vite are absent from current dependency/lockfile inventory. [PLANNED V1] The deliberate database strategy is:

```text
Node.js → one shared pg pool per process → parameterized raw SQL → PostgreSQL
```

[PLANNED V1] No ORM may be introduced without an explicit architecture change. Raw SQL is selected for direct understanding, SQL familiarity, DBMS interview preparation, visibility into queries, and avoiding an additional abstraction. ORMs can offer convenience, schema abstractions, migration tooling, and sometimes type safety; these tradeoffs do not override the selected approach.

## 7. Current backend and request lifecycle

### 7.1 Startup, exactly as implemented

[IMPLEMENTED] `src/server.js` executes these steps:

1. Runs `require("dotenv").config()` before importing modules that read environment variables.
2. Imports `./app`. That app imports health and auth routers, whose controllers use the shared pool; the auth controller also imports bcrypt.
3. Imports the same cached pool module directly.
4. Selects `process.env.PORT || 8000`.
5. Calls asynchronous `startServer()` and awaits `pool.query("SELECT 1")`.
6. On success, logs `Database connected successfully`, then calls `app.listen(PORT, ...)` and logs the chosen port.
7. On a rejected startup query, logs `Database connection failed:` plus `error.message`, then calls `process.exit(1)`.

[IMPLEMENTED] `SELECT 1` asks PostgreSQL to return a constant. It checks that a query can be executed over the connection without requiring an application table. It does **not** verify that `users` exists, all migrations ran, writes are permitted, or business functionality is healthy.

[PARTIALLY IMPLEMENTED] This is a startup connectivity gate, not complete operational readiness. There is no explicit required-variable validation, application-configured connection timeout, retry/backoff, listener `error` handling, idle-pool error handler, or graceful shutdown. A database that becomes unavailable after startup is reported by the health controller; the initial gate does not continuously restart or stop the server. A bind error such as port-in-use is not reliably handled by the DB `try/catch` because listener errors occur asynchronously.

### 7.2 Express configuration

[IMPLEMENTED] `src/app.js` creates an Express instance, enables `express.json()`, mounts `/api/health` and `/api/auth`, adds malformed-JSON error handling after routes, and exports the app without listening. Health maps `GET /` to `getHealth`; auth maps `POST /register` to `registerUser`, yielding `POST /api/auth/register`.

[IMPLEMENTED] Registration performs manual validation in its controller. The app error handler recognizes `SyntaxError` with `status === 400` and a `body` property and returns HTTP 400 with `{"message":"Invalid JSON body"}`; unrelated errors go to `next(error)`. Authentication, authorization, CORS, request logging, general safe error handling, and a custom not-found handler remain absent; other framework errors are not a uniform project JSON contract.

### 7.3 Existing health contract

[IMPLEMENTED] `src/controllers/health.controller.js` calls `await pool.query("SELECT 1")` on **each** health request. It returns exactly these bodies for its own success/failure paths:

```json
{
  "status": "ok",
  "database": "connected"
}
```

[IMPLEMENTED] Success is HTTP `200`. Query rejection is HTTP `500`:

```json
{
  "status": "error",
  "database": "disconnected"
}
```

[IMPLEMENTED] The controller does not return or log the caught exception. The API is public infrastructure diagnostics and touches no application table. It is not a Finance/Health domain feature. See API-01 for all contract fields.

### 7.4 Layer responsibilities and communications

[PARTIALLY IMPLEMENTED] Health and registration use the backend layers below. The configured Compose mapping passes validation; live operation was not verified. [PLANNED V1] A React client and protected business middleware will extend this path; the frontend does not exist today.

```mermaid
sequenceDiagram
    participant C as HTTP client (React planned V1)
    participant A as Express app :8000
    participant R as Router and middleware
    participant H as Controller
    participant P as Shared pg Pool
    participant D as PostgreSQL :5432 in Docker
    C->>A: HTTP request
    A->>R: Match mounted route; parse JSON when applicable
    R->>H: Invoke controller after applicable checks
    H->>P: Separate SQL query request
    P->>D: PostgreSQL protocol via host :5433 mapping
    D-->>P: Query result or error
    P-->>H: Promise resolves/rejects
    H-->>C: HTTP JSON response through Express
```

| Layer | Status | Plain explanation | Engineering responsibility |
| --- | --- | --- | --- |
| Frontend | [PLANNED V1] | Collects input and displays responses | React REST client; never direct DB access |
| `server.js` | [IMPLEMENTED] | Starts the process listening | Bootstrap, environment order, initial connectivity gate |
| `app.js` | [IMPLEMENTED] | Configures how HTTP is handled | Middleware ordering and router mounting |
| Router | [IMPLEMENTED] health and registration; [PLANNED V1] other business | Connects URL/method to handler | Transport-level endpoint mapping |
| Middleware | [IMPLEMENTED] JSON parser and malformed-JSON error handler; [PLANNED V1] custom security | Checks/augments requests before handlers | Authentication, role policy, validation, error handling |
| Controller | [IMPLEMENTED] health and registration; [PLANNED V1] other business | Decides what work the request requires | Application flow, ownership checks, query orchestration, safe response |
| Pool/driver | [IMPLEMENTED] | Sends database requests using reusable connections | Resource management and PostgreSQL wire protocol |
| PostgreSQL | [IMPLEMENTED] configured; runtime [TBD] | Stores data and enforces schema rules | Relational integrity, transactions, query execution |

## 8. Local network, Docker, and environment model

### 8.1 Port boundaries

[IMPLEMENTED] The backend's default port is `8000`, overridable with `PORT`. It is normally reached locally at `http://localhost:8000`. `app.listen(PORT)` does not explicitly bind the HTTP server to loopback; do not confuse that with the configured Compose database loopback restriction.

[IMPLEMENTED] Current `docker-compose.yml` declares a valid PostgreSQL ports list with `127.0.0.1:5433:5432`; C-12 is resolved. The diagram shows this configured communication model, conditional on running services; live port publication is unverified:

```text
HTTP client / planned frontend
    │ HTTP to localhost:8000
    ▼
Express app → router → controller
                         │ separate PostgreSQL database request from pg
                         ▼
                 host localhost:5433
                         │ Docker port publication: 127.0.0.1:5433:5432
                         ▼
                 PostgreSQL container :5432
```

[PLANNED V1] In the configured local model, Docker itself is not “running on port 5432.” PostgreSQL listens on port 5432 inside the container; Docker publishes that service through host port 5433. An HTTP request is not redirected from 8000 to 5433. The controller uses `pg` to make a separate database communication, and later returns an HTTP response. Configuration validation passed; live services remain unverified.

[TBD] If `localhost` resolves to IPv6 while only `127.0.0.1` is published, verify host resolution and use the explicit loopback address when appropriate. If the backend is containerized later, `localhost` inside it would mean that backend container. On a shared Compose network, a backend would normally reach the `postgres` service on port `5432`; no such backend container exists now.

### 8.2 DATABASE_URL and environment variables

[IMPLEMENTED] `src/config/db.js` reads `process.env.DATABASE_URL`; `src/server.js` loads dotenv and reads `PORT`. The actual local `.env` value is uninspected. This structural illustration is **not** a copied secret:

```text
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

| Part | Meaning | Intended local setting / status |
| --- | --- | --- |
| `postgresql://` | Connection URI scheme for PostgreSQL | [PLANNED V1] Use PostgreSQL connection URI |
| `USERNAME` | PostgreSQL login role | [IMPLEMENTED] Compose defines `postgres` locally |
| `PASSWORD` | Password for that database role | [TBD] Supply private value via environment; never reproduce production credentials |
| `HOST` | Database network address as seen by backend process | [PLANNED V1] `localhost` for host-running backend |
| `PORT` | PostgreSQL service's host-facing port | [IMPLEMENTED] Validated mapping specifies `5433`; live publication unverified |
| `DATABASE` | Named database, separate from login role | [IMPLEMENTED] Compose configures `consultify` |

[PLANNED V1] Safe local onboarding illustration; placeholders are not working credentials:

```bash
# Safe placeholders from the current .env.example; replace locally.
PORT=8000
DATABASE_URL=postgresql://postgres:<LOCAL_PASSWORD>@localhost:5433/consultify
POSTGRES_PASSWORD=<LOCAL_PASSWORD>
```

[IMPLEMENTED] Compose reads `${POSTGRES_PASSWORD}` from the environment; `.env.example` contains only a placeholder. [PLANNED V1] Production credentials must be distinct, strong, environment-managed, and supplied to the backend only. Encode reserved URI characters properly and never log the full connection URI. Frontend variables must not contain database credentials or JWT signing material.

[IMPLEMENTED] `.env.example` documents PORT, DATABASE_URL, and POSTGRES_PASSWORD with placeholders. [PARTIALLY IMPLEMENTED] Required-variable validation is still absent; `pg` can use other defaults/environment settings without a connection string. A successful `SELECT 1` alone does not prove the intended database was selected. Future startup validation and separate database-identity verification remain planned.

### 8.3 Docker and Compose concepts

| Concept | Status | Consultify meaning |
| --- | --- | --- |
| Docker | [IMPLEMENTED] configured usage | Container runtime tooling used for local PostgreSQL |
| Image | [IMPLEMENTED] | `postgres:17.4`, a packaged PostgreSQL runtime; image tag is configuration evidence |
| Container | [IMPLEMENTED] declared; running state [TBD] | An instance named `consultify-postgres` of the image |
| Compose service | [IMPLEMENTED] | YAML service key `postgres`; identifies the service in Compose commands |
| Compose | [IMPLEMENTED] | Configuration/orchestration tool describing services, mappings, environment, volumes |
| Named volume | [IMPLEMENTED] declared | `postgres_data` mounted at `/var/lib/postgresql/data`; actual Docker volume name may include the Compose project prefix |
| Dockerfile | [TBD] absent | Builds a custom image; none is required to refer to the prebuilt PostgreSQL image, and none exists for the backend |
| Container environment | [IMPLEMENTED] | `POSTGRES_DB`, `POSTGRES_USER`, and a local `POSTGRES_PASSWORD` configure database initialization |

[IMPLEMENTED] Compose declares only the database. No explicit Compose healthcheck, restart policy, custom network, resource limits, migration mount, or initialization SQL mount exists. Starting Compose therefore does not automatically run `database/migrations/001_create_users.sql`.

[PLANNED V1] Normal `docker compose down` removes service containers/networks while the named volume persists. **`docker compose down -v` is destructive: it removes named volumes declared by this Compose project and can delete local database data.** It is not a routine restart command. See [Docker Compose down reference](https://docs.docker.com/reference/cli/docker/compose/down/).

[PLANNED V1] Dockerized PostgreSQL is selected for isolation, reproducibility, controlled version, simpler setup/reset, and practice with professional workflows. Native PostgreSQL on macOS could work; it is not the selected local setup. Supabase/hosted PostgreSQL could also work, but starting locally supports understanding ports, connections, SQL, Docker, schema ownership, and environment variables before outsourcing hosting.

## 9. SQL, connection pooling, and migrations

### 9.1 Shared Pool

[IMPLEMENTED] The following is the existing code from `src/config/db.js`, reformatted only for readability:

```javascript
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
module.exports = pool;
```

[IMPLEMENTED] `Pool` manages reusable PostgreSQL client connections. Reuse avoids reconnecting for every query and bounds connection consumption. This exported instance is shared through CommonJS module caching within the process; it is not one global pool across multiple server processes. `pool.query()` obtains an available client, runs a query, and returns the client to the pool. See [node-postgres pooling](https://node-postgres.com/features/pooling).

[PLANNED V1] Controllers must import this pool rather than construct independent pools. Per-controller/per-request pools undermine connection limits. Do not call `pool.end()` inside normal controllers: that shuts down shared database access for later requests. Use it during intentional application shutdown or standalone script cleanup. There is currently no shutdown hook.

[TBD] Pool size, connection/query timeouts, production TLS, idle errors, and process shutdown policy need explicit configuration decisions. Do not document assumed defaults as settings this project selected.

### 9.2 Parameterized SQL — mandatory invariant

[IMPLEMENTED] Registration passes normalized email to `SELECT id FROM users WHERE email=$1` and clean name, normalized email, and password hash to a parameterized INSERT. Health/startup use constant `SELECT 1`. [PLANNED V1] All future user-controlled SQL values must likewise use placeholders and separate parameters.

```javascript
// [PLANNED V1] Educational safe pattern, not an implemented controller.
const result = await pool.query(
  "SELECT id, name, email, role, created_at FROM users WHERE email = $1",
  [email]
);
```

[PLANNED V1] `$1`, `$2`, `$3` correspond to positions 1, 2, and 3 in the parameter array (JavaScript indexes 0, 1, and 2). They keep data separate from SQL syntax and protect against value-based SQL injection. Parameters cannot stand in for table/column identifiers or SQL keywords; future sort fields must map to a fixed backend allowlist rather than interpolating arbitrary input. See [node-postgres parameterized queries](https://node-postgres.com/features/queries).

```javascript
// [PLANNED V1] PROHIBITED example; never use this pattern.
pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

[PLANNED V1] Do not use `SELECT *` on authentication queries that might be returned to the frontend. Select `password_hash` only for internal credential verification and explicitly construct a safe response without it. Parameterization does not replace validation, authorization, or safe output selection.

### 9.3 Understanding pg results

[IMPLEMENTED] Registration checks `existingUser.rows.length` and returns `result.rows[0]` from an explicit safe INSERT projection. Health/startup ignore query rows. The following example explains the result shape:

```javascript
// Educational shape: illustrative values, not a query executed by this audit.
const result = {
  rows: [{ id: "example-uuid", name: "Amrit" }],
  rowCount: 1,
  command: "SELECT",
  fields: [] // real results contain returned-column metadata
};

const firstUser = result.rows[0];
const name = firstUser ? firstUser.name : null;
```

[PLANNED V1] `rows` is the returned-row array, `rows[0]` is its first row, and `rows[0].name` reads one selected column. If no row was returned, `rows[0]` is `undefined`; check before dereferencing. `rowCount` describes processed rows from PostgreSQL's command result and is not universally the same as `rows.length`. For example, an `UPDATE` without `RETURNING` can affect a row while returning no rows. `fields` describes selected columns and `command` identifies the SQL command. See [pg.Result reference](https://node-postgres.com/apis/result).

### 9.4 Transactions and concurrent requests

[PLANNED V1] A transaction makes several database operations succeed or fail together. When a future workflow requires one, acquire one client with `pool.connect()`, run `BEGIN`, all statements, and `COMMIT` on that same client; roll back on failure and release in `finally`. Independent `pool.query()` calls must not be used to assemble a transaction because they may use different connections. See [node-postgres transactions](https://node-postgres.com/features/transactions).

[IMPLEMENTED] Registration keeps its preliminary duplicate SELECT and relies on `users.email UNIQUE` as final protection; PostgreSQL `23505` becomes HTTP 409. [PLANNED V1] Appointment transitions and review eligibility will also require concurrency-aware handling with appropriate constraints, conditional writes, and transactions. Exact booking overlap rules remain undecided.

### 9.5 Migration approach

[PARTIALLY IMPLEMENTED] `database/migrations/001_create_users.sql` begins an ordered raw-SQL migration history. No runner, tracking table, automatic startup execution, rollback script, or migration npm command exists. The SQL is a plain `CREATE TABLE`; rerunning it after the table exists will fail rather than act as an idempotent migration runner.

[PLANNED V1] Migrations make schema reproducible, preserve history, help onboarding/deployment, explain changes during debugging, and support auditability. Save structural changes as ordered SQL files; ad hoc manual table creation is not the long-term source of truth. Once a migration has been shared/applied, prefer a new corrective migration over silently changing its historical meaning.

| Migration | Status | Intended role |
| --- | --- | --- |
| `001_create_users.sql` | [IMPLEMENTED] file; applied state [TBD] | Existing users definition |
| `002_create_domains.sql` | [PLANNED V1] proposed path | Generic domains; Finance seed strategy still pending |
| `003_create_advisor_profiles.sql` | [PLANNED V1] proposed path | Profile-to-user/domain relationships |
| `004_create_appointments.sql` | [PLANNED V1] proposed path | Booking ownership/status/time relationships |
| Later ordered SQL | [PLANNED V1] exact names/numbers [TBD] | Posts, comments, reviews, helpful persistence, necessary indexes/constraints |

[TBD] **TBD — DECISION REQUIRED:** select a small raw-SQL apply/tracking process, how migrations are ordered and recorded, transaction behavior, deployment ownership, and restore/rollback practices. Keep it compatible with `pg`; this is not permission to introduce an ORM. Local one-time execution guidance appears in section 23 and is explicitly not a migration system.

## 10. Current users schema

[IMPLEMENTED] Exact SQL text from `database/migrations/001_create_users.sql` is shown below with trailing whitespace removed. It matches the requested target fields and constraints. It is the only application table defined in this repository; its presence in a running database is [TBD].

```sql
CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CHECK(role IN('USER','ADVISOR','ADMIN')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Field/constraint | Status | Simple explanation | Implementation implication |
| --- | --- | --- | --- |
| `id UUID` | [IMPLEMENTED] migration | Row identifier using a 128-bit UUID | Clients should treat it as an opaque identifier, not an authorization secret |
| `PRIMARY KEY` | [IMPLEMENTED] migration | Identifies each user uniquely and forbids null | Database enforces identity; later FKs can reference it |
| `DEFAULT gen_random_uuid()` | [IMPLEMENTED] migration | PostgreSQL creates an ID when insert omits it | Controllers generally omit `id`; an explicit null does not invoke the default |
| `name VARCHAR(100) NOT NULL` | [IMPLEMENTED] migration | Required name, at most 100 characters | Does not itself reject an empty/whitespace-only name |
| `email VARCHAR(255) UNIQUE NOT NULL` | [IMPLEMENTED] migration | Required distinct stored email value | Does not validate email format or establish case-insensitive normalization |
| `password_hash TEXT NOT NULL` | [IMPLEMENTED] migration | Required text column intended for password hash | Column naming/type does not prove hashing or reject plaintext; backend must hash |
| `role VARCHAR(20)` | [IMPLEMENTED] migration | Authorization category, max 20 characters | Separate concept from Finance/Health/Astrology |
| `role NOT NULL DEFAULT 'USER'` | [IMPLEMENTED] migration | Missing role defaults to ordinary user | API must not allow public callers to override it with `ADMIN`/`ADVISOR` |
| `CHECK(role IN(...))` | [IMPLEMENTED] migration | Only `USER`, `ADVISOR`, `ADMIN` are valid stored roles | Does not grant/check HTTP permissions or ownership |
| `created_at TIMESTAMPTZ NOT NULL` | [IMPLEMENTED] migration | Required timestamp representing an instant | Not a record of the user's named timezone |
| `DEFAULT CURRENT_TIMESTAMP` | [IMPLEMENTED] migration | Database supplies transaction-start timestamp when omitted | No `updated_at`, soft-delete flag, or automatic update trigger exists |

[IMPLEMENTED] A primary key supplies uniqueness and non-null enforcement; a `UNIQUE` constraint also creates a supporting unique index. Applying this migration therefore creates indexes for `users.id` and `users.email`; no separate explicit `CREATE INDEX` appears. A foreign key enforces that a related row exists. No foreign keys exist in this sole migration. See [PostgreSQL constraints](https://www.postgresql.org/docs/17/ddl-constraints.html).

[IMPLEMENTED] PostgreSQL 17 provides `gen_random_uuid()` for random version-4 UUIDs. No extension installation is present or required by this migration for that built-in function. IDs are still subject to primary-key enforcement; UUIDs do not substitute for ownership checks. See [PostgreSQL UUID functions](https://www.postgresql.org/docs/17/functions-uuid.html).

[IMPLEMENTED] Registration trims/lowercases email, validates password and field limits, hashes passwords, and inserts only name/email/password_hash, relying on the USER default. Normalization and password policy are backend rules, not additional schema constraints; email UNIQUE protects stored values without independently lowercasing direct SQL writes. [TBD] User deletion, future update timestamps, advisor provisioning, and any broader database canonicalization remain unresolved. Domains, seeded advisor/admin accounts, and authenticated sessions are not implemented.

## 11. Target relational model and integrity rules

### 11.1 Entity inventory by version

[PLANNED V1] The entity names below express the generic product model. Only the `users` migration exists. Candidate fields are design inputs, not a finalized schema. No SQL for planned entities is generated by this task.

| Entity | Status | Purpose and owner | Schema maturity |
| --- | --- | --- | --- |
| `users` | [IMPLEMENTED] migration | Shared authentication identity; user owns applicable profile data | Exact current SQL in section 10; live state unverified |
| `domains` | [PLANNED V1] | Advisory categories; controlled system data | Finance only seeded for V1; Health/Astrology in V2 |
| `advisor_profiles` | [PLANNED V1] | Professional profile attached to an ADVISOR user | Fields/cardinality/provisioning [TBD] |
| `appointments` | [PLANNED V1] | Consultation record joining a customer to an advisor | Customer and assigned advisor have different permitted actions |
| `community_posts` | [PLANNED V1] | Public questions/experiences in a domain | Author owns content; moderation policy [TBD] |
| `comments` | [PLANNED V1] | Contributions under a community post | Comment author is distinct from post author |
| `reviews` | [PLANNED V1] | Feedback grounded in completed consultation | Only the consultation's customer may create its review |
| `helpful_votes` | [PLANNED V1] candidate persistence / [TBD] | Store helpful interaction without unlimited duplicate voting | Brief lists table as future, but V1 behavior requires a persistence decision; see conflict C-08 |
| `favorites` | [PLANNED V2] | Saved advisors/content; target kind [TBD] | No V1 table or API |
| `advisor_availability` | [PLANNED V2] | Working times and bookable slots | Model and scheduling integration [TBD] |
| `notifications` | [PLANNED V2] | Product notifications | Delivery channels and retention [TBD]; real-time transport deferred |
| `reports` | [PLANNED V2] | User reports and moderation intake | Workflow/permissions [TBD] |
| `advisor_verification` | [PLANNED V2] | Professional verification records/workflow | Evidence, privacy, and approval process [TBD] |
| Reputation events | [PLANNED V2] candidate | Explainable history for reputation scoring | Exact table name and formula not selected |
| `consultation_notes` | [DEFERRED] | Potential consultation notes | Privacy, ownership, storage, version assignment [TBD]; not automatically AI summaries |

### 11.2 Proposed field and constraint specifications

[PLANNED V1] / [TBD] **TBD — DECISION REQUIRED:** approve the schema before writing each migration. Recommendations below are separate from current implementation. For new entities, UUID primary keys generated by PostgreSQL follow the accepted identifier direction. Field lengths, optionality, defaults, update behavior, and constraint names remain pending unless explicitly stated as product invariants.

| Proposed table | Candidate fields and recommended types | Required relationships / integrity direction | Pending decisions |
| --- | --- | --- | --- |
| `domains` | `id UUID`; `code` textual category; optional display name; timestamps if needed | Recommend unique, non-null stable `code`; V1 code `FINANCE` | Code storage length/case, display label, seed mechanism; do not freeze a CHECK to only FINANCE if it blocks future domain data |
| `advisor_profiles` | `id UUID`, `user_id UUID`, `domain_id UUID`, `specialization` text, `bio` text, `years_experience` integer, `consultation_fee` exact numeric if included, `created_at`/`updated_at TIMESTAMPTZ` | User and domain FKs; associated user must have ADVISOR role; recommend experience/fee nonnegative if present | One profile per user vs per user/domain; required fields, lengths, currency/fee meaning; verification status reserved for V2 unless explicitly scoped |
| `appointments` | `id UUID`, `user_id UUID`, `advisor_id UUID`, optional `domain_id UUID`, `scheduled_at TIMESTAMPTZ`, `status` text, optional `notes` text, timestamps | User FK and advisor-profile FK; valid lifecycle; requester identity derived from auth | Duration/end time, overlap rules, direct domain link vs derivation, notes audience, cancellation policy, update semantics |
| `community_posts` | `id UUID`, `author_id UUID`, `domain_id UUID`, `title` text, `body` text, timestamps | Author/domain FKs; nonblank bounded title/body validated by backend | SQL lengths, content format, edit/delete scope and moderation |
| `comments` | `id UUID`, `post_id UUID`, `author_id UUID`, `body` text, timestamps | Post/user FKs; nonblank bounded content | Body limit, read pagination; nested replies are not a V1 requirement |
| `reviews` | `id UUID`, `user_id UUID` and `advisor_id UUID` if retained, `appointment_id UUID`, `rating` integer, `review_text` text, `created_at TIMESTAMPTZ` | Only completed owned appointment; recommend `UNIQUE(appointment_id)`; recommend `CHECK(rating BETWEEN 1 AND 5)` | Rating scale finalization, text optionality/length, denormalization, editing/removal/retention |
| `helpful_votes` candidate | User reference plus post reference if post-target proposal is approved; timestamp; surrogate UUID optional if composite key used | Recommend unique `(user_id, post_id)` and both FKs; derive counts rather than accept client counts | Post vs comment targets, self-votes, reversible vote behavior, table name/key; polymorphic targets weaken simple FK enforcement |

[PLANNED V1] Rating should be derived from reviews (`AVG` plus count as appropriate), not blindly stored as an unrelated profile number. Any future cached aggregate needs explicit invalidation/update rules. A no-review advisor should have a distinguishable “no rating yet” representation, recommended `null` average with count 0; exact API representation remains [TBD].

[TBD] A `consultation_fee` is profile information, not proof of a transaction, currency conversion, settlement, or earnings feature. Recommended storage is exact numeric or an explicitly selected minor-unit representation, not binary floating point. If exposed, define currency and API serialization; do not infer INR solely from the developer's locale.

### 11.3 Relationship alternatives that must be resolved

| Decision | Alternatives | Recommended default, not selected | Implication |
| --- | --- | --- | --- |
| Advisor identity/profile cardinality | One profile per user with one domain; one profile per `(user, domain)`; shared profile plus domain join table | One profile per user for minimal V1, with one Finance domain FK; revisit multi-domain membership before V2 | `UNIQUE(user_id)` is recommended only if this choice is accepted; no duplicate login identity |
| What `appointments.advisor_id` references | Advisor user ID or advisor profile ID | Profile ID, consistently used by discovery/booking APIs | Resolve through profile to authenticated advisor's user ID when authorizing |
| Appointment domain | Derive from advisor profile; store `domain_id` directly | Derive for V1 unless historical domain-at-booking requirements justify storing it | If stored redundantly, enforce consistency and define behavior when profile domain changes |
| Review identity links | Store only appointment link and derive customer/advisor; store customer/advisor links too | Prefer derivation where practical; keep duplicated links only for a documented query need | Independent FKs cannot prove duplicated IDs match the linked appointment |
| Helpful interaction target | Posts, comments, or both | Start with posts and one reversible vote per user/post | Exact candidate routes below assume posts; decide before implementing day 11 |
| Historical profile/domain changes | Mutable relationships; immutable historical snapshot | Preserve interpretable consultation history; decide before allowing changes | Do not silently rewrite the meaning of older appointments/reviews |

### 11.4 Textual ER model and cardinalities

[PLANNED V1] / [TBD] The following **recommended model** assumes one advisor profile per user, appointment advisor links to profiles, appointment domain is derived, and helpful votes target posts. Those assumptions are not accepted schema decisions. `users` itself is the only entity with an existing migration.

- A user has zero or one advisor profile under this recommendation; every advisor profile belongs to exactly one user and one domain.
- A domain has zero or many advisor profiles and zero or many posts.
- A customer user has zero or many appointments; each appointment has exactly one customer and one advisor profile.
- An advisor profile has zero or many assigned appointments.
- A user authors zero or many posts/comments; each belongs to exactly one author.
- A post has zero or many comments and helpful votes; each comment/vote targets exactly one post in this proposed model.
- An appointment has zero or one review; each review belongs to exactly one completed appointment. Its customer/advisor are derivable from that appointment.
- One user can create many votes, but cannot create multiple votes on the same target under the recommended uniqueness rule.

```mermaid
erDiagram
    USERS ||--o| ADVISOR_PROFILES : "owns (proposed cardinality)"
    DOMAINS ||--o{ ADVISOR_PROFILES : categorizes
    USERS ||--o{ APPOINTMENTS : books
    ADVISOR_PROFILES ||--o{ APPOINTMENTS : receives
    USERS ||--o{ COMMUNITY_POSTS : authors
    DOMAINS ||--o{ COMMUNITY_POSTS : categorizes
    COMMUNITY_POSTS ||--o{ COMMENTS : contains
    USERS ||--o{ COMMENTS : authors
    APPOINTMENTS ||--o| REVIEWS : "eligible when completed"
    USERS ||--o{ HELPFUL_VOTES : casts
    COMMUNITY_POSTS ||--o{ HELPFUL_VOTES : receives
```

[TBD] This is a conceptual diagram, not a generated database ER export. It intentionally omits optional redundant review/domain links. Changing a pending cardinality requires updating both diagram and contract assumptions before implementation.

### 11.5 Foreign keys, ownership, and deletion

| Child reference | Status | Proposed referenced key | Ownership/access meaning | Deletion behavior |
| --- | --- | --- | --- | --- |
| `advisor_profiles.user_id` | [PLANNED V1] | `users.id` | Authenticated advisor manages own profile; role assignment is separate | [TBD] No cascade selected |
| `advisor_profiles.domain_id` | [PLANNED V1] | `domains.id` | Domain is classification, not owner | [TBD] Recommend restrict deletion of in-use domains |
| `appointments.user_id` | [PLANNED V1] | `users.id` | Customer can view/cancel subject to policy | [TBD] Preserve history pending retention decision |
| `appointments.advisor_id` | [PLANNED V1] | Recommended `advisor_profiles.id` | Assigned advisor can view/perform allowed transitions | [TBD] Do not cascade away consultation history by default |
| `community_posts.author_id`, `domain_id` | [PLANNED V1] | `users.id`, `domains.id` | Public read proposal; author-specific writes if scoped | [TBD] Account/content deletion and anonymization pending |
| `comments.author_id`, `post_id` | [PLANNED V1] | `users.id`, `community_posts.id` | Parent author does not automatically own someone else's comment | [TBD] Cascade vs retained/tombstoned discussion pending |
| `reviews.appointment_id` | [PLANNED V1] | `appointments.id` | Creation restricted to completed appointment's customer | [TBD] Preserve eligibility trace and review history |
| Helpful vote user/target | [PLANNED V1] / [TBD] | `users.id`, selected target table key | A user can change only their own vote | [TBD] Often removable with target, but policy not selected |

[PLANNED V1] Foreign keys protect references, not HTTP ownership. An advisor-profile FK does not prove the related user currently has ADVISOR role. A review FK does not prove the appointment is completed. These cross-record rules need appropriate backend/transactional enforcement, with database constraints where expressible. Do not place cross-table business rules in an ordinary row `CHECK` and assume they remain correct as other rows change.

## 12. Authentication, password security, and authorization

### 12.1 Registration and email integrity

[IMPLEMENTED] `POST /api/auth/register` is mounted through `src/routes/auth.routes.js` and handled by `registerUser` in `src/controllers/auth.controller.js`. It accepts name, email, and password:

```json
{
  "name": "Amrit",
  "email": "amrit@example.com",
  "password": "example-only-long-password"
}
```

[IMPLEMENTED] Explicit manual backend checks require nonblank string name/email and a nonempty string password. Name is trimmed and rejected above 100 characters. Email is trimmed, lowercased, rejected above 255 characters, and checked with the existing email pattern. D-07 accepts surrounding-whitespace trimming plus lowercase only: Gmail dots and +tags are preserved, with no provider-specific rewriting.

[IMPLEMENTED] Registration performs a parameterized duplicate-email SELECT before hashing/inserting. `users.email UNIQUE` remains the final database protection when concurrent requests both pass that SELECT. Both an early duplicate and PostgreSQL `error.code === "23505"` return HTTP 409 with `{"message":"Email is already registered"}`. Other errors caught during registration are logged server-side and return only HTTP 500 with `{"message":"Internal server error"}`.

[IMPLEMENTED] The parameterized INSERT writes only name, normalized email, and password_hash. It omits role, ID, and timestamp so database defaults create a USER. Extra payload fields are ignored; supplying `role: "ADMIN"` or `role: "ADVISOR"` cannot change the created role. No blanket unknown-field rejection is implemented. The response is HTTP 201 with `{"message":"User registered successfully","user":{...}}`; only id, name, email, role, and created_at are returned. Neither password nor password_hash is returned.

[IMPLEMENTED] Registration does not issue a JWT or automatically log in. Login remains [PLANNED V1] for Day 4; authentication, RBAC middleware, and the current-user endpoint remain planned.

### 12.2 Password hashing

[IMPLEMENTED] D-05 selects the installed `bcrypt` package (6.0.0), used asynchronously as `bcrypt.hash(password, 12)`. Cost factor is 12. The database receives the resulting password_hash instead of plaintext.

[IMPLEMENTED] D-06 sets a minimum password length of 12 characters, checked using JavaScript `password.length`, and a maximum input of 72 UTF-8 bytes, checked using `Buffer.byteLength(password, "utf8")`. Excess input is rejected, not silently truncated. Passwords are not trimmed, lowercased, or otherwise normalized. Name/email character limits likewise use JavaScript string `.length`.

[IMPLEMENTED] bcrypt produces salted password hashes with embedded cost parameters. Hashing supports one-way verification; encryption is reversible with a key. Higher cost increases work. [PLANNED V1] Login will use `bcrypt.compare()`; no comparison/login flow exists yet. Deployment capacity checks remain future verification, not an unresolved package/cost choice. See the [bcrypt project documentation](https://github.com/kelektiv/node.bcrypt.js).

[IMPLEMENTED] D-08 selects explicit manual backend validation for the current V1 stage. No validation library is selected or installed. Abuse prevention and account recovery remain separate planned/TBD work.

### 12.3 Login and JWT

[PLANNED V1] Target is `POST /api/auth/login`: validate email/password, use the same email normalization as registration, find the user, compare against the stored hash, reject invalid credentials, then issue a JWT and safe user response. Unknown email and wrong password should use the same public invalid-credentials message. Exact timing mitigation and rate limits remain [TBD].

[PLANNED V1] A typical signed JWT has a header describing token type/algorithm, a payload containing claims, and a signature covering the encoded content. The payload is readable; a signature protects integrity, not secrecy. Use a user identifier such as `sub` and an expiration such as `exp`; never embed password/hash/secrets. The signing secret/key must be privately configured. Verification must check the signature and expiration before trusting claims. See [JWT specification, RFC 7519](https://www.rfc-editor.org/rfc/rfc7519).

[PLANNED V1] Verification must restrict accepted algorithms/configuration rather than trust an arbitrary token header. Select and validate issuer/audience where appropriate, and define how role changes/deleted users affect already-issued tokens. Decoding a token is not verification. See [JWT best practices, RFC 8725](https://www.rfc-editor.org/rfc/rfc8725).

```text
[PLANNED V1]
Login succeeds → sign JWT → client supplies JWT on protected request
→ authenticate verifies token → populate req.user
→ role check → resource ownership check → controller operation
```

[TBD] Token transport/storage, signing library and algorithm, expiry, signing-key rotation, refresh strategy, logout/revocation, issuer/audience, and role freshness are unresolved. Recommended evaluation: secure HttpOnly cookie with an explicit CSRF policy for the deployment topology, versus an in-memory access token with an explicitly designed persistence/refresh flow. Do not silently choose browser localStorage or claim HttpOnly alone solves CSRF. A JWT is not inherently immediately revocable, and removing a client copy does not invalidate other copies.

### 12.4 Authentication, RBAC, and ownership

[PLANNED V1] Authentication answers “Who are you?” and authorization answers “What are you allowed to do?” Missing/invalid authentication yields 401. A validly authenticated caller blocked by policy yields 403; deliberate 404 resource concealment, if selected, must be documented and consistent.

[PLANNED V1] Proposed middleware names/files are `authenticate` in planned `src/middleware/auth.middleware.js` and `authorize(...allowedRoles)` in planned `src/middleware/role.middleware.js`. Neither file exists. `authenticate` should populate a minimal verified `req.user` identity; its exact shape is pending. Role checks must use trusted server/token verification context, never a role supplied in the request body.

```javascript
// [PLANNED V1] Conceptual closure explanation, not implementation.
function authorize(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    // authenticate must have run first and established trusted req.user.
    if (!req.user) return res.sendStatus(401);
    if (!allowedRoles.includes(req.user.role)) return res.sendStatus(403);
    next();
  };
}
// authorize("ADMIN") returns a function retaining allowedRoles via closure.
// Actual middleware must use the selected safe project error format.
```

[PLANNED V1] Role-based access control (RBAC) is necessary but insufficient. User A and User B may both be USER; that does not allow A to read/cancel B's appointment. Check the relationship, for example `appointment.user_id === req.user.id`. For an advisor, resolve `appointment.advisor_id` through the chosen profile reference and compare the profile's `user_id` to authenticated identity.

| Operation | Status | Proposed role policy | Required relationship |
| --- | --- | --- | --- |
| Register | [IMPLEMENTED] | Public | Creates USER only; extra role fields ignored |
| Login | [PLANNED V1] | Public | Day 4 credential verification and JWT work |
| Read current user | [PLANNED V1] | USER, ADVISOR, ADMIN | Identity from authentication only |
| Read advisor/post/review public data | [PLANNED V1] / [TBD] | Public reads recommended | Expose only public fields |
| Create/update own advisor profile | [PLANNED V1] / [TBD] | ADVISOR only | `profile.user_id` equals authenticated ID; role provisioning handled separately |
| Book/cancel customer appointment | [PLANNED V1] / [TBD] | USER initially recommended | Customer ownership; role combinations/self-booking policy pending |
| View assigned/update appointment | [PLANNED V1] | ADVISOR | Assigned profile belongs to authenticated user; allowed transition only |
| Create posts/comments | [PLANNED V1] / [TBD] | Any authenticated role recommended | `author_id` from identity, not payload |
| Mark helpful | [PLANNED V1] / [TBD] | Any authenticated role recommended | Vote belongs to authenticated user; target/self-vote policy pending |
| Create review | [PLANNED V1] | Customer eligible under booking policy | Own completed appointment; advisor derived from appointment |
| Admin override/moderation | [PLANNED V2] / [TBD] | ADMIN if explicitly scoped | No blanket bypass of ownership is granted by this document |

[TBD] A single stored role currently cannot simultaneously express USER and ADVISOR membership as a role list. Decide whether an advisor can also book consultations before assigning route permissions. Do not add a new role system by inference. Minimal V1 advisor/admin provisioning must be decided without allowing public privilege escalation; full verification is a V2 feature.

## 13. API contract conventions and endpoint inventory

### 13.1 Contract maturity and shared conventions

[IMPLEMENTED] API-01 (`GET /api/health`) and API-02 (`POST /api/auth/register`) exist with the exact contracts in section 14. [PLANNED V1] Login and other endpoints remain proposed; pending paths, payloads, response envelopes, policies, and handler names require review. Proposed conventions do not change the existing registration response.

[PLANNED V1] These conventions apply to every proposed contract below:

- JSON request/response bodies; success returns HTTP 200 for retrieval/update and 201 for creation unless stated otherwise.
- Parse JSON, validate `req.body`, `req.params`, and `req.query`; reject unexpected sensitive fields (`user_id`, `author_id`, `role`, hash, status where server-controlled). Exact general unknown-field policy is [TBD].
- ID parameters must be syntactically valid UUIDs before SQL; valid UUID does not prove the resource exists or caller can access it.
- Required strings must have the correct type and be nonblank with documented length bounds. Numeric/time/filter validation is server-side.
- Protected means the selected JWT transport plus `authenticate`, then role and relationship checks. Until transport is selected, do not imply an `Authorization` header or cookie is implemented.
- All business queries use parameters and explicit safe output columns; authenticated identity is derived server-side.
- Unless a route explicitly needs a body/query parameter, none is part of its proposed contract.
- Every proposed endpoint can return a safe 500 for unexpected server errors. Protected routes also have 401/403. Other per-route errors are listed explicitly.
- Common errors are proposed as `{"error":{"code":"VALIDATION_ERROR","message":"Invalid request"}}`. This format is not used by current health or registration and is not implemented globally. Registration uses `{ "message": "..." }` errors; malformed JSON uses the same simple message shape.
- Collection proposal: `{ "data": [...], "pagination": { "limit": 20, "offset": 0 } }`; defaults/max limits and offset vs cursor are [TBD]. A count query/`total` is not required unless approved.
- Resource proposal: `{ "data": { ...safe selected fields... } }`; exact field optionality awaits schema approval. Examples are not evidence of implemented responses.

[PLANNED V1] Safe projections proposed for these contracts:

| Projection | Candidate fields | Exclusions/decision boundaries |
| --- | --- | --- |
| `SafeUser` | `id`, `name`, `email`, `role`, `created_at` | [IMPLEMENTED] registration projection; own/auth response only; never password/hash; public content must not include author email |
| `AdvisorPublic` | Profile `id`, display name, domain, specialization, bio, experience, fee if selected, derived rating/count | No credentials, private email, verification documents, or invented verification badge |
| `AppointmentPrivate` | `id`, customer/advisor references or minimal names, `scheduled_at`, `status`, timestamps | Only parties; optional notes visibility not decided; no hashes/private account data |
| `PostPublic` | `id`, author display identity, domain, title, body, timestamps, helpful count if selected | No author email or private profile data |
| `CommentPublic` | `id`, parent post ID, author display identity, body, timestamps | No private author data |
| `ReviewPublic` | `id`, advisor reference, rating, review text, reviewer display identity, creation time | Public listing should omit private appointment details and customer email |

### 13.2 Complete current/proposed V1 API inventory

[PLANNED V1] Proposed endpoint count is an organizational aid, not a feature-completion metric. API-24 supports the requested potential user review dashboard and remains a proposed minimal read capability. Profile/post/review editing beyond listed operations and admin operations are not assumed.

| ID | Method | Endpoint | Auth / proposed roles | Purpose | Status |
| --- | --- | --- | --- | --- | --- |
| API-01 | GET | `/api/health` | No; public | Database connectivity diagnostic | [IMPLEMENTED] |
| API-02 | POST | `/api/auth/register` | No; public | Create USER account without automatic login | [IMPLEMENTED] |
| API-03 | POST | `/api/auth/login` | No; public | Verify credentials and establish JWT auth | [PLANNED V1] |
| API-04 | GET | `/api/users/me` | Yes; all three roles | Read safe current user | [PLANNED V1] / [TBD] path |
| API-05 | GET | `/api/advisors` | Public proposed | Discover Finance advisors | [PLANNED V1] / [TBD] |
| API-06 | GET | `/api/advisors/:id` | Public proposed | Advisor detail | [PLANNED V1] / [TBD] |
| API-07 | GET | `/api/advisors/me` | Yes; ADVISOR | Read own advisor profile | [PLANNED V1] / [TBD] |
| API-08 | POST | `/api/advisors/me` | Yes; ADVISOR | Create own profile after trusted role provisioning | [PLANNED V1] / [TBD] |
| API-09 | PATCH | `/api/advisors/me` | Yes; ADVISOR | Update own allowed profile fields | [PLANNED V1] / [TBD] |
| API-10 | POST | `/api/appointments` | Yes; USER proposed | Book advisor | [PLANNED V1] / [TBD] |
| API-11 | GET | `/api/appointments` | Yes; USER or ADVISOR | List own or assigned appointments | [PLANNED V1] / [TBD] |
| API-12 | GET | `/api/appointments/:id` | Yes; parties only | Private appointment detail | [PLANNED V1] / [TBD] |
| API-13 | PATCH | `/api/appointments/:id/cancel` | Yes; owning USER proposed | Customer cancellation | [PLANNED V1] / [TBD] |
| API-14 | PATCH | `/api/appointments/:id/status` | Yes; assigned ADVISOR | Advisor lifecycle update | [PLANNED V1] / [TBD] |
| API-15 | POST | `/api/community/posts` | Yes; all roles proposed | Create Finance post | [PLANNED V1] / [TBD] |
| API-16 | GET | `/api/community/posts` | Public proposed; `author=me` protected | List community posts | [PLANNED V1] / [TBD] |
| API-17 | GET | `/api/community/posts/:id` | Public proposed | Post detail | [PLANNED V1] / [TBD] |
| API-18 | POST | `/api/community/posts/:id/comments` | Yes; all roles proposed | Comment on existing post | [PLANNED V1] / [TBD] |
| API-19 | GET | `/api/community/posts/:id/comments` | Public proposed | Paginated comments | [PLANNED V1] / [TBD] |
| API-20 | PUT | `/api/community/posts/:id/helpful` | Yes; all roles proposed | Ensure own helpful vote exists | [PLANNED V1] / [TBD] target/persistence |
| API-21 | DELETE | `/api/community/posts/:id/helpful` | Yes; all roles proposed | Remove own helpful vote | [PLANNED V1] / [TBD] reversibility |
| API-22 | POST | `/api/reviews` | Yes; eligible customer | Review own completed consultation | [PLANNED V1] / [TBD] |
| API-23 | GET | `/api/advisors/:id/reviews` | Public proposed | List advisor reviews | [PLANNED V1] / [TBD] |
| API-24 | GET | `/api/reviews?scope=mine` | Yes; eligible customer role policy | Read own submitted reviews for minimal dashboard | [PLANNED V1] / [TBD] |

[PLANNED V1] Register fixed `/api/advisors/me` routes before `/api/advisors/:id` to avoid treating `me` as an ID. Route mounting, middleware order, and exact response contracts must be verified when implementation is created. Health remains a separate diagnostic contract unless an intentional change is documented.


## 14. Detailed API contracts and V1 request flows

[IMPLEMENTED] API-01 and API-02 are the current endpoint inventory. [PLANNED V1] All remaining contracts are proposed. The auth route/controller files already exist for registration; login itself is still planned. Other paths explicitly marked planned do not exist. Proposed statuses and envelopes do not imply implementation.

### API-01 — GET /api/health

| Contract field | Definition |
| --- | --- |
| Status | [IMPLEMENTED] |
| Purpose | Check current database connectivity; infrastructure only. |
| Authentication / roles | No authentication; any caller. |
| Path parameters | None. |
| Query parameters | None used by controller; no query validation. |
| Request body | None required. |
| Validation | No business validation. Express JSON parser runs globally when applicable. |
| Success / HTTP code | 200: exact {"status":"ok","database":"connected"}. |
| Possible errors / HTTP codes | 500 on rejected DB probe: exact {"status":"error","database":"disconnected"}. Malformed JSON is handled globally as 400 with {"message":"Invalid JSON body"}; other framework errors/unmatched routes retain default behavior. |
| Route file → controller file | src/routes/health.routes.js → src/controllers/health.controller.js#getHealth (existing). |
| Database tables touched | No application tables; SELECT 1 through shared pool. |
| Ownership rules | No resource ownership applies. |

[IMPLEMENTED] **Flow:** Client → app health mount → router GET / → getHealth → pool.query('SELECT 1') → exact 200 or 500 response.

### API-02 — POST /api/auth/register

| Contract field | Definition |
| --- | --- |
| Status | [IMPLEMENTED] |
| Purpose | Register an ordinary USER without automatic login. |
| Authentication / roles | Public; caller cannot assign ADVISOR/ADMIN. |
| Path parameters | None. |
| Query parameters | None used by controller. |
| Request body | {name, email, password}; only these fields are read. Extra fields, including role/ID/hash, are ignored. |
| Validation | Required string name/email, nonblank after trim; nonempty string password. Trim name; trim/lowercase email. Name ≤100, email ≤255, valid existing email pattern; password ≥12 characters and ≤72 UTF-8 bytes. String lengths use JavaScript .length. |
| Success / HTTP code | 201: {"message":"User registered successfully","user":SafeUser}. SafeUser contains only id, name, email, role, created_at. No password/hash, JWT, or automatic login. |
| Possible errors / HTTP codes | 400 validation or malformed JSON; 409 duplicate email from SELECT or PostgreSQL 23505; 500 for other caught registration errors, with no error.message sent to the client. Exact bodies below. |
| Route file → controller file | src/routes/auth.routes.js → src/controllers/auth.controller.js#registerUser (existing); app mounts /api/auth. |
| Database tables touched | users: parameterized duplicate SELECT and INSERT of name, email, password_hash; DB-generated id, default USER, and created_at. |
| Ownership rules | Database creates the new identity; payload role/ID fields are not used. Public registration creates USER only. |

[IMPLEMENTED] Registration error responses contain only a `message` field. Validation runs in the order below; malformed JSON is caught by app error middleware before a controller can process it.

| Condition | HTTP code | Exact message |
| --- | --- | --- |
| Name missing, wrong type, or blank after trimming | 400 | Name is required |
| Email missing, wrong type, or blank after trimming | 400 | Email is required |
| Password missing, wrong type, or empty | 400 | Password is required |
| Trimmed name length >100 | 400 | Name must not exceed 100 characters |
| Normalized email length >255 | 400 | Email must not exceed 255 characters |
| Email fails existing pattern | 400 | Invalid email format |
| Password length <12 | 400 | Password must be at least 12 characters long |
| Password exceeds 72 UTF-8 bytes | 400 | Password is too long |
| Duplicate SELECT finds email, or catch receives PostgreSQL 23505 | 409 | Email is already registered |
| Other error caught during registration | 500 | Internal server error |
| Malformed JSON parsing error | 400 | Invalid JSON body |

[IMPLEMENTED] **Flow:** Required-field checks → trim name and trim/lowercase email → length/email/password validation → parameterized duplicate lookup → asynchronous bcrypt hash at cost 12 → parameterized INSERT with safe RETURNING fields → 201. The catch logs `Registration error:` and error.message server-side, maps 23505 to 409, and returns a generic 500 for other caught errors.

### API-03 — POST /api/auth/login

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] |
| Purpose | Verify credentials and issue JWT authentication. |
| Authentication / roles | Public; successful account may have any valid stored role. |
| Path parameters | None. |
| Query parameters | None. |
| Request body | {email, password}. |
| Validation | Required strings; same email normalization as registration; valid format/length; accepted password input bounds; do not silently alter password. |
| Success / HTTP code | 200: safe user and authentication established. Exact body/cookie/access-token fields TBD pending transport; never return hash. |
| Possible errors / HTTP codes | 400 malformed input; 401 invalid credentials for unknown email or wrong password; 500 safe unexpected failure. |
| Route file → controller file | src/routes/auth.routes.js → src/controllers/auth.controller.js#login (planned handler/route in existing registration files). |
| Database tables touched | users: internal lookup includes password_hash for compare only. |
| Ownership rules | JWT identity derived from matched database account; no role from payload. |

[PLANNED V1] **Flow:** Validate → lookup user → bcrypt.compare → generic rejection if invalid → sign expiring JWT if valid → selected transport plus safe user.

### API-04 — GET /api/users/me

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed path |
| Purpose | Get the authenticated user's safe account view. |
| Authentication / roles | Required; USER, ADVISOR, ADMIN. |
| Path parameters | None; no user ID accepted from client. |
| Query parameters | None. |
| Request body | None. |
| Validation | Verify JWT; validate trusted subject format as appropriate; check current account according to selected token/account policy. |
| Success / HTTP code | 200: {data: SafeUser}. |
| Possible errors / HTTP codes | 401 missing/invalid/expired token or unavailable identity under recommended policy; 403 if a future explicit account policy forbids access; 500 safe failure. |
| Route file → controller file | src/routes/user.routes.js → src/controllers/user.controller.js#getMe (both planned). |
| Database tables touched | users: SELECT explicit safe columns by authenticated id. |
| Ownership rules | Only req.user identity; no cross-user lookup override. |

[PLANNED V1] / [TBD] proposed path **Flow:** authenticate → trusted req.user.id → safe user lookup → 200; never query by a caller-supplied user_id.

### API-05 — GET /api/advisors

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | List Finance advisors with basic discovery. |
| Authentication / roles | Public read recommended; all roles and unauthenticated visitors. |
| Path parameters | None. |
| Query parameters | Proposed domain=FINANCE, q, specialization, limit, offset, sort; defaults/max limits TBD. |
| Request body | None. |
| Validation | Only FINANCE accepted for V1 product filtering; bounded strings; integer nonnegative paging; sort allowlist; unknown/unsupported domain policy recommended 400. |
| Success / HTTP code | 200: collection of AdvisorPublic plus selected pagination; no matches returns an empty array. |
| Possible errors / HTTP codes | 400 invalid/unsupported filter or pagination; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/advisor.controller.js#listAdvisors (both planned). |
| Database tables touched | advisor_profiles, users (public display identity), domains; reviews for derived rating if included. |
| Ownership rules | Public fields only; do not return private identity or verification data. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate filters → map FINANCE to domain relationship → parameterized joined query with paging → derive rating without N+1 lookups → public collection.

### API-06 — GET /api/advisors/:id

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | View one Finance advisor. |
| Authentication / roles | Public read recommended. |
| Path parameters | id: advisor profile UUID under proposed schema. |
| Query parameters | None. |
| Request body | None. |
| Validation | UUID syntax; advisor profile exists, belongs to supported V1 domain, and satisfies selected publication policy. |
| Success / HTTP code | 200: {data: AdvisorPublic}. |
| Possible errors / HTTP codes | 400 malformed id; 404 absent/unavailable advisor; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/advisor.controller.js#getAdvisor (both planned). |
| Database tables touched | advisor_profiles, users public columns, domains, reviews if rating aggregate included. |
| Ownership rules | Public projection; profile owner/private fields are not automatically public. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate id → fetch supported advisor and derived summary → 404 if absent → safe profile.

### API-07 — GET /api/advisors/me

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Read current advisor's own profile for a minimal dashboard. |
| Authentication / roles | Required; ADVISOR. |
| Path parameters | None; fixed me route precedes dynamic id route. |
| Query parameters | None under proposed one-profile-per-user V1 model. |
| Request body | None. |
| Validation | Verify auth/role; resolve profile by req.user.id. |
| Success / HTTP code | 200: {data: own safe advisor profile}; private verification data not assumed. |
| Possible errors / HTTP codes | 401 invalid authentication; 403 wrong role; 404 profile not yet created; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/advisor.controller.js#getMyAdvisorProfile (both planned). |
| Database tables touched | advisor_profiles, domains; users safe fields if needed. |
| Ownership rules | profile.user_id must equal authenticated id. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → authorize ADVISOR → query own profile → safe response; absence drives profile onboarding UI.

### API-08 — POST /api/advisors/me

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed onboarding route |
| Purpose | Create own profile after trusted advisor role assignment. |
| Authentication / roles | Required; ADVISOR only; public registration cannot obtain this privilege. |
| Path parameters | None. |
| Query parameters | None. |
| Request body | Proposed {specialization, bio, years_experience, consultation_fee?}; Finance domain assigned server-side. Field requiredness/currency TBD. |
| Validation | Nonblank/bounded selected text; experience nonnegative integer; fee exact nonnegative amount if in scope; no client user_id, role, rating, or verification_status; no existing profile under selected uniqueness rule. |
| Success / HTTP code | 201: {data: own safe advisor profile}. |
| Possible errors / HTTP codes | 400 invalid fields; 401 unauthenticated; 403 wrong role; 409 profile already exists including race; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/advisor.controller.js#createMyAdvisorProfile (both planned). |
| Database tables touched | users for trusted role as policy requires, domains, advisor_profiles INSERT. |
| Ownership rules | user_id from authentication; no creation on behalf of another user. |

[PLANNED V1] / [TBD] proposed onboarding route **Flow:** authenticate/authorize → validate selected fields → resolve FINANCE → parameterized owned-profile insert → uniqueness handling → 201.

### API-09 — PATCH /api/advisors/me

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed update route |
| Purpose | Update own allowed advisor profile information. |
| Authentication / roles | Required; ADVISOR. |
| Path parameters | None. |
| Query parameters | None. |
| Request body | Nonempty subset of approved specialization/bio/years_experience/fee fields; exact allowlist TBD. |
| Validation | Validate each supplied field; reject user_id/role/id/rating/verification_status; domain changes not automatically allowed. |
| Success / HTTP code | 200: {data: updated safe advisor profile}. |
| Possible errors / HTTP codes | 400 empty/invalid/prohibited fields; 401 unauthenticated; 403 wrong role; 404 no own profile; 409 if selected historical policy conflicts; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/advisor.controller.js#updateMyAdvisorProfile (both planned). |
| Database tables touched | advisor_profiles UPDATE; domain/user lookups only if selected policy requires. |
| Ownership rules | UPDATE constrained by authenticated owner; do not accept arbitrary target id. |

[PLANNED V1] / [TBD] proposed update route **Flow:** authenticate/authorize → allowlisted field validation → owned update → safe result; updated_at behavior must be implemented deliberately.

### API-10 — POST /api/appointments

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Book a Finance advisor. |
| Authentication / roles | Required; USER recommended initially; advisor-as-customer policy TBD. |
| Path parameters | None. |
| Query parameters | None. |
| Request body | Proposed {advisor_id, scheduled_at}; optional notes only after audience/length policy is selected. |
| Validation | Valid advisor UUID; existing eligible Finance profile; unambiguous future timestamp; no caller user_id/status; self-booking, duration, time window, duplicate/overlap rules TBD. |
| Success / HTTP code | 201: {data: AppointmentPrivate} with server-assigned initial PENDING under proposed lifecycle. |
| Possible errors / HTTP codes | 400 invalid advisor/time/body; 401 unauthenticated; 403 wrong role/policy; 404 advisor absent; 409 scheduling conflict if defined/enforced; 500 safe failure. |
| Route file → controller file | src/routes/appointment.routes.js → src/controllers/appointment.controller.js#createAppointment (both planned). |
| Database tables touched | advisor_profiles, domains (direct or derived), appointments INSERT; users identity as needed. |
| Ownership rules | Customer from req.user.id; advisor from validated public profile reference. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate/authorize → validate → verify advisor/domain → enforce selected scheduling checks atomically → insert PENDING booking → safe private result.

### API-11 — GET /api/appointments

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | List own customer bookings or assigned advisor consultations. |
| Authentication / roles | Required; USER or ADVISOR; no automatic ADMIN global list. |
| Path parameters | None. |
| Query parameters | Proposed scope=mine for USER or scope=assigned for ADVISOR; optional status, from, to, limit, offset, sort. |
| Request body | None. |
| Validation | Validate scope against role; allowlisted status; parse date bounds and ordering; bounded paging/sort; reject arbitrary customer/advisor ownership overrides. |
| Success / HTTP code | 200: paginated AppointmentPrivate collection; empty collection is valid. |
| Possible errors / HTTP codes | 400 invalid query; 401 unauthenticated; 403 disallowed scope/role; 500 safe failure. |
| Route file → controller file | src/routes/appointment.routes.js → src/controllers/appointment.controller.js#listAppointments (both planned). |
| Database tables touched | appointments, advisor_profiles; minimal related user/domain fields if needed. |
| Ownership rules | Every SQL branch filters by customer id or owned assigned profile; client filters cannot broaden access. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → choose authorized scope → build ownership-constrained parameterized query → apply time/status paging → private list.

### API-12 — GET /api/appointments/:id

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | View a private appointment. |
| Authentication / roles | Required; owning USER or assigned ADVISOR under proposed role policy. |
| Path parameters | id: appointment UUID. |
| Query parameters | None. |
| Request body | None. |
| Validation | UUID; resource exists; verify correct party relationship and role; notes visibility TBD. |
| Success / HTTP code | 200: {data: AppointmentPrivate}. |
| Possible errors / HTTP codes | 400 malformed id; 401 unauthenticated; 403 non-party/wrong role; 404 absent (or concealed under a selected consistent policy); 500 safe failure. |
| Route file → controller file | src/routes/appointment.routes.js → src/controllers/appointment.controller.js#getAppointment (both planned). |
| Database tables touched | appointments, advisor_profiles; minimal identity joins if needed. |
| Ownership rules | Customer id equals req.user.id OR assigned profile.user_id equals req.user.id as allowed by role; no ADMIN bypass implied. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → validate id → load/check authorized relationship → safe party-specific detail.

### API-13 — PATCH /api/appointments/:id/cancel

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] cancellation policy pending |
| Purpose | Cancel a customer's own eligible appointment. |
| Authentication / roles | Required; owning USER recommended. |
| Path parameters | id: appointment UUID. |
| Query parameters | None. |
| Request body | None required; cancellation reason is not an approved field. |
| Validation | UUID; owner; eligible source status; selected cancellation cutoff; reject client-supplied alternate status or ownership. |
| Success / HTTP code | 200: {data: AppointmentPrivate} with CANCELLED; repeated cancellation behavior TBD. |
| Possible errors / HTTP codes | 400 malformed request; 401 unauthenticated; 403 non-owner/wrong role; 404 absent; 409 invalid state/cutoff/concurrent change; 500 safe failure. |
| Route file → controller file | src/routes/appointment.routes.js → src/controllers/appointment.controller.js#cancelAppointment (both planned). |
| Database tables touched | appointments conditional UPDATE; assigned profile lookup only if policy needs it. |
| Ownership rules | Constrain owner AND eligible source state; do not update solely by appointment id. |

[PLANNED V1] / [TBD] cancellation policy pending **Flow:** authenticate/authorize → validate → check ownership/cutoff → conditional eligible-state update → CANCELLED or controlled conflict.

### API-14 — PATCH /api/appointments/:id/status

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] transition matrix pending |
| Purpose | Let assigned advisor perform permitted lifecycle transitions. |
| Authentication / roles | Required; assigned ADVISOR. |
| Path parameters | id: appointment UUID. |
| Query parameters | None. |
| Request body | {status}; candidate values CONFIRMED or COMPLETED; advisor cancellation only if explicitly selected. |
| Validation | UUID; role/assignment; status allowlist; approved source→target transition; completion timing requirement TBD. |
| Success / HTTP code | 200: {data: updated AppointmentPrivate}. |
| Possible errors / HTTP codes | 400 invalid status/body; 401 unauthenticated; 403 wrong role/unassigned advisor; 404 absent; 409 forbidden transition or stale concurrent state; 500 safe failure. |
| Route file → controller file | src/routes/appointment.routes.js → src/controllers/appointment.controller.js#updateAppointmentStatus (both planned). |
| Database tables touched | appointments conditional UPDATE; advisor_profiles ownership lookup/join. |
| Ownership rules | Assigned profile belongs to caller; being any ADVISOR is insufficient. |

[PLANNED V1] / [TBD] transition matrix pending **Flow:** authenticate/authorize → confirm assignment → validate transition → atomic source-state update → safe result.

### API-15 — POST /api/community/posts

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Create a public Finance question/experience post. |
| Authentication / roles | Required; USER, ADVISOR, ADMIN proposed for ordinary participation. |
| Path parameters | None. |
| Query parameters | None. |
| Request body | Proposed {title, body, domain?}; omitted domain resolves to FINANCE. |
| Validation | Required nonblank bounded title/body; content format/limits TBD; domain only FINANCE; reject author_id and client counts. |
| Success / HTTP code | 201: {data: PostPublic}. |
| Possible errors / HTTP codes | 400 invalid content/domain; 401 unauthenticated; 403 if selected role/content policy blocks creation; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#createPost (both planned). |
| Database tables touched | community_posts INSERT, domains; user identity already authenticated. |
| Ownership rules | author_id comes from req.user.id. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → validate content/domain → resolve Finance → parameterized insert with author → public-safe post response.

### API-16 — GET /api/community/posts

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | List Finance community content, optionally own posts. |
| Authentication / roles | Public by default; author=me requires authentication, all roles proposed. |
| Path parameters | None. |
| Query parameters | Proposed domain=FINANCE, q, author=me, limit, offset, sort. |
| Request body | None. |
| Validation | Supported domain; bounded search; paging and sort allowlists; author selector limited to approved values; no private data expansion. |
| Success / HTTP code | 200: paginated PostPublic collection. |
| Possible errors / HTTP codes | 400 invalid filters; 401 for author=me without valid auth; 403 only if an explicit role policy applies to protected view; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#listPosts (both planned). |
| Database tables touched | community_posts, domains, users public identity; candidate helpful_votes for aggregate. |
| Ownership rules | Public projection; author=me must resolve authenticated identity, not accept another id as 'me'. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate public filters → authenticate if own filter → apply supported-domain/optional-author query → paginated posts.

### API-17 — GET /api/community/posts/:id

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | View one Finance community post. |
| Authentication / roles | Public read recommended. |
| Path parameters | id: post UUID. |
| Query parameters | None. |
| Request body | None. |
| Validation | UUID; existing post in supported domain; deleted/hidden handling TBD. |
| Success / HTTP code | 200: {data: PostPublic}; comments separately paginated via API-19. |
| Possible errors / HTTP codes | 400 malformed id; 404 absent/unavailable; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#getPost (both planned). |
| Database tables touched | community_posts, domains, users public identity; helpful aggregate if selected. |
| Ownership rules | Only public fields; reading a post does not grant edit/delete rights. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate id → fetch supported public post → safe result; avoid unbounded embedding of comments.

### API-18 — POST /api/community/posts/:id/comments

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Add a comment to an existing Finance post. |
| Authentication / roles | Required; all three roles proposed. |
| Path parameters | id: parent post UUID. |
| Query parameters | None. |
| Request body | {body}. |
| Validation | Parent UUID and existence; required nonblank bounded body; selected content format; no author_id/post_id override. |
| Success / HTTP code | 201: {data: CommentPublic}. |
| Possible errors / HTTP codes | 400 malformed/invalid content; 401 unauthenticated; 403 if selected permission policy blocks interaction; 404 absent/unavailable parent; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#createComment (both planned). |
| Database tables touched | community_posts/domain eligibility lookup; comments INSERT; users public identity as needed. |
| Ownership rules | Comment author from req.user.id; parent from validated route. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → validate parent/body → check post availability → insert with author/post FKs → safe comment.

### API-19 — GET /api/community/posts/:id/comments

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Read a bounded page of comments. |
| Authentication / roles | Public read recommended. |
| Path parameters | id: parent post UUID. |
| Query parameters | Proposed limit, offset, sort; chronological stable order recommendation. |
| Request body | None. |
| Validation | Parent UUID/existence/visibility; bounded integer paging; allowlisted ordering. |
| Success / HTTP code | 200: paginated CommentPublic collection; existing post with no comments yields empty data. |
| Possible errors / HTTP codes | 400 invalid id/query; 404 absent/unavailable parent; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#listComments (both planned). |
| Database tables touched | community_posts; comments; users public display fields. |
| Ownership rules | Public projection only; no author emails or private data. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate parent/page → confirm public post → query comments with deterministic order → collection.

### API-20 — PUT /api/community/posts/:id/helpful

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] candidate post-vote contract |
| Purpose | Ensure current user's helpful mark exists. |
| Authentication / roles | Required; all roles proposed; self-vote rule pending. |
| Path parameters | id: target post UUID under recommended target choice. |
| Query parameters | None. |
| Request body | None; user id and count never supplied by client. |
| Validation | UUID; visible supported post; selected self-vote/eligibility policy; unique user/target rule. |
| Success / HTTP code | 200 proposed: {data:{post_id, helpful:true, helpful_count}}; count/shape TBD. |
| Possible errors / HTTP codes | 400 malformed request; 401 unauthenticated; 403 selected vote restriction; 404 target absent; 500 safe failure. Repeated identical PUT should not create duplicates or use 409 under idempotent proposal. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#markHelpful (both planned). |
| Database tables touched | community_posts; helpful_votes candidate table with unique user/target; aggregate count if selected. |
| Ownership rules | Vote identity derived from req.user.id, only on validated target. |

[PLANNED V1] / [TBD] candidate post-vote contract **Flow:** authenticate → check target/policy → atomically insert if absent using uniqueness → derive count → idempotent response.

### API-21 — DELETE /api/community/posts/:id/helpful

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] candidate reversible-vote contract |
| Purpose | Remove only current user's helpful mark. |
| Authentication / roles | Required; all roles proposed. |
| Path parameters | id: target post UUID. |
| Query parameters | None. |
| Request body | None. |
| Validation | UUID; target policy; no ability to supply someone else's voter id. |
| Success / HTTP code | 200 proposed: {data:{post_id, helpful:false, helpful_count}}; repeated removal succeeds if target still exists. |
| Possible errors / HTTP codes | 400 malformed request; 401 unauthenticated; 403 if selected vote policy requires; 404 target absent; 500 safe failure. |
| Route file → controller file | src/routes/post.routes.js → src/controllers/post.controller.js#unmarkHelpful (both planned). |
| Database tables touched | community_posts; helpful_votes candidate DELETE filtered by current user and target. |
| Ownership rules | DELETE must include authenticated user key; not all votes for target. |

[PLANNED V1] / [TBD] candidate reversible-vote contract **Flow:** authenticate → validate target → delete own association if present → derive count → idempotent result.

### API-22 — POST /api/reviews

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | Review a completed consultation exactly once under recommended uniqueness policy. |
| Authentication / roles | Required; eligible customer (USER under initial booking recommendation). |
| Path parameters | None. |
| Query parameters | None. |
| Request body | {appointment_id, rating, review_text?}; text optionality TBD; no user_id/advisor_id override. |
| Validation | Appointment UUID; own completed consultation; bounded integer rating (1–5 proposed); text format/length; no existing review for appointment. |
| Success / HTTP code | 201: {data: safe review}; final response projection TBD; never include private consultation notes. |
| Possible errors / HTTP codes | 400 invalid input/rating; 401 unauthenticated; 403 non-customer/wrong role; 404 appointment absent; 409 incomplete appointment, duplicate review, or concurrent eligibility conflict; 500 safe failure. |
| Route file → controller file | src/routes/review.routes.js → src/controllers/review.controller.js#createReview (both planned). |
| Database tables touched | appointments and advisor_profiles eligibility; reviews INSERT; customer/advisor derived from appointment. |
| Ownership rules | Caller owns linked completed appointment; cannot choose another advisor independently. |

[PLANNED V1] / [TBD] proposed contract **Flow:** authenticate → validate → transactional/atomic ownership and COMPLETED check → parameterized insert with uniqueness → safe result; handle concurrent duplicate as 409.

### API-23 — GET /api/advisors/:id/reviews

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed contract |
| Purpose | View an advisor's public reviews. |
| Authentication / roles | Public read recommended. |
| Path parameters | id: advisor profile UUID under schema proposal. |
| Query parameters | Proposed limit, offset, sort; optional rating filter only if explicitly scoped. |
| Request body | None. |
| Validation | Advisor UUID/existence/supported domain; paging/sort validation; review visibility policy TBD. |
| Success / HTTP code | 200: ReviewPublic collection with pagination; optional average/count summary selected consistently with advisor projection. |
| Possible errors / HTTP codes | 400 invalid id/query; 404 advisor absent; 500 safe failure. |
| Route file → controller file | src/routes/advisor.routes.js → src/controllers/review.controller.js#listAdvisorReviews (both planned; route may use review controller). |
| Database tables touched | advisor_profiles, reviews via selected direct link or appointments, users public reviewer identity. |
| Ownership rules | Public review projection; do not expose private appointment IDs/notes or email. |

[PLANNED V1] / [TBD] proposed contract **Flow:** Validate advisor/page → confirm Finance advisor → query scoped reviews → derive approved summary → public list.

### API-24 — GET /api/reviews?scope=mine

| Contract field | Definition |
| --- | --- |
| Status | [PLANNED V1] / [TBD] proposed minimal dashboard read |
| Purpose | List reviews submitted by current customer. |
| Authentication / roles | Required; customer role according to selected booking policy; USER initially. |
| Path parameters | None. |
| Query parameters | scope=mine plus proposed limit, offset, sort; no all-users scope implied. |
| Request body | None. |
| Validation | Require supported scope; validate paging/sort; verify auth. |
| Success / HTTP code | 200: collection of current user's safe reviews with selected pagination. |
| Possible errors / HTTP codes | 400 invalid scope/query; 401 unauthenticated; 403 wrong role; 500 safe failure. |
| Route file → controller file | src/routes/review.routes.js → src/controllers/review.controller.js#listMyReviews (both planned). |
| Database tables touched | reviews, appointments if reviewer identity is derived, advisor_profiles public display. |
| Ownership rules | Filter by authenticated reviewer/appointment customer; never trust arbitrary user_id. |

[PLANNED V1] / [TBD] proposed minimal dashboard read **Flow:** authenticate → validate mine scope → ownership-constrained review query → minimal dashboard collection.

[PARTIALLY IMPLEMENTED] These contracts cover implemented registration and planned login, current user, advisors, appointments, community, and reviews. No logout, refresh, password reset, email verification, domain-administration, payment, video, or AI endpoint is implemented; those retain their explicit decisions/version boundaries.

## 15. Appointments and state transitions

[PLANNED V1] Appointments connect a customer to a professional advisor and track the consultation lifecycle. No appointment table, scheduling API, transition guard, or booking UI currently exists. Appointment tracking does not imply that consultations happen through an in-app call system; the consultation delivery arrangement itself is [TBD], and voice/video/chat infrastructure is deferred.

### 15.1 Proposed lifecycle

[PLANNED V1] / [TBD] **TBD — DECISION REQUIRED:** approve the status set, transition permissions, time rules, cancellation cutoff, and repeat-request behavior before implementing migrations/APIs. The following is a concrete recommended baseline, not current behavior:

```mermaid
stateDiagram-v2
    [*] --> PENDING: Customer creates valid booking
    PENDING --> CONFIRMED: Assigned advisor confirms
    CONFIRMED --> COMPLETED: Assigned advisor records completion
    PENDING --> CANCELLED: Owning customer within policy
    CONFIRMED --> CANCELLED: Owning customer within policy
    COMPLETED --> [*]
    CANCELLED --> [*]
```

| From | To | Proposed actor | Preconditions | Status |
| --- | --- | --- | --- | --- |
| No appointment | PENDING | Authenticated eligible customer | Valid Finance advisor, valid future time, selected scheduling rules | [PLANNED V1] / [TBD] |
| PENDING | CONFIRMED | Assigned ADVISOR | Own assigned profile; current status still PENDING | [PLANNED V1] / [TBD] |
| CONFIRMED | COMPLETED | Assigned ADVISOR | Consultation has actually occurred; exact time/completion evidence rule pending | [PLANNED V1] / [TBD] |
| PENDING | CANCELLED | Owning customer | Cancellation time/policy satisfied | [PLANNED V1] / [TBD] |
| CONFIRMED | CANCELLED | Owning customer | Cancellation time/policy satisfied; fee/refund policy not implied | [PLANNED V1] / [TBD] |
| PENDING or CONFIRMED | CANCELLED | Assigned advisor | Advisor cancellation authority not selected | [TBD] Deny until explicitly defined |
| PENDING | COMPLETED | Any actor | Skips confirmation under this proposal | [PLANNED V1] Recommended forbidden; 409 |
| COMPLETED | Any different state | Any actor | Terminal state under this proposal | [PLANNED V1] Recommended forbidden; 409 |
| CANCELLED | Any different state | Any actor | Terminal state under this proposal | [PLANNED V1] Recommended forbidden; new booking if needed |
| Any state | Same state | Same authorized actor | Idempotent response vs conflict pending | [TBD] Document per mutation route |
| Any | Any | Unrelated USER/ADVISOR | No ownership/assignment | [PLANNED V1] Forbidden regardless of valid status name |
| Any | Any | ADMIN | No override selected | [TBD] No implicit bypass |

[PLANNED V1] A status `CHECK` can restrict stored values but cannot alone enforce who changed them or whether a transition was legal. A conditional write should check authorized identity and expected current state, then inspect affected rows; do not read a state and later overwrite it without accounting for concurrent cancellation/completion.

[PLANNED V1] Create appointments with the authenticated customer ID and server-controlled initial status. Do not accept arbitrary `user_id`, `status`, `created_at`, or ownership information. Listing and detail must scope every query to the customer/assigned advisor, including count queries. Invalid UUID input is a 400 concern; an unknown valid UUID is 404; an unauthorized resource is 403 or a consistently chosen concealed 404; a stale/invalid transition is 409.

### 15.2 Scheduling and double booking

[TBD] Duration, end time, allowed scheduling window, timezone conversion, advisor confirmation meaning, consultation delivery, and cancellation rules must be decided. Without duration or explicit slots, “overlap” is not even a fully defined rule.

[PLANNED V2] Availability management and advanced time-slot locking are expansion work. [TBD] A minimal V1 conflict policy must still be explicitly decided before real bookings; do not advertise guaranteed exclusive slots while no backend/database guarantee exists. Two simultaneous requests can bypass a frontend check and a simple read-then-insert check. Depending on the final model, future protection could use a unique active slot rule or transactionally enforced time ranges/exclusion constraints. These are alternatives, not selected SQL or permission to add a scheduling service.

[PLANNED V1] Notes, if included, need an audience and length policy. Do not expose private consultation context through advisor public profiles, community posts, review responses, or logs. A separate `consultation_notes` entity is deferred, not automatically created from the optional `appointments.notes` idea.

## 16. Community, reviews, dashboards, and administration

### 16.1 Community scope

[PLANNED V1] A Finance post has an author, domain, title, and body. Users can create/list/view posts and create/read comments. Domain relationships let future Health/Astrology posts coexist without duplicated tables or applications. Public reading is a recommended policy awaiting approval; posting and helpful mutations require authentication.

[TBD] Content format is undecided. Recommended V1 default is plain text rendered safely, with server-enforced limits, rather than accepting arbitrary HTML. If richer content is later selected, define sanitization/rendering policy. React's ordinary escaped text rendering is not a license to use unsafe HTML insertion. Exact post/comment edit/delete endpoints and moderator powers are not scoped by the current API proposal.

[PLANNED V1] Helpful interaction is required. [TBD] Proposed implementation is an idempotent per-user post vote, persisted with a unique user/target association and derived count. It is not a mutable count trusted from the client. Targeting comments instead, supporting both, self-voting, and vote removal must be decided before day 11. If the proposal changes, update API-20/21, relationships, tests, and indexes together.

[PLANNED V2] Reputation can build on interaction history later. No arbitrary score formula, ranking engine, badge system, or accepted-answer workflow is a V1 commitment.

### 16.2 Review integrity

[PLANNED V1] A user can review an advisor only after that user's consultation is COMPLETED. Derive the advisor/customer from the selected appointment, rather than trusting independent submitted IDs. A customer cannot review another customer's appointment, an unrelated advisor, a cancelled appointment, or an incomplete consultation.

[PLANNED V1] Prevent unlimited duplicates per appointment. [TBD] Recommended enforcement is `UNIQUE(appointment_id)` plus controlled duplicate handling; exact rating scale is proposed as integer 1–5 with both API validation and a database CHECK. Text requirement/limits and later edit/delete policy are unresolved. Aggregate advisor ratings from eligible reviews and define behavior for no reviews.

[PLANNED V1] Review creation must handle concurrency: two requests may both observe “no review yet.” Database uniqueness is the final duplicate guard. Eligibility checks and any retained redundant customer/advisor IDs must remain consistent with the appointment. Do not count a reviews route as done without these negative tests.

### 16.3 Minimal dashboards

| Audience | Status | V1 view direction | Existing implementation / boundary |
| --- | --- | --- | --- |
| User | [PLANNED V1] / [TBD] minimal composition | Own safe account/profile display, upcoming/past appointments, own community posts, own reviews | No dashboard exists; proposed APIs 04, 11, 16, 24 cover read data; profile editing is not implicitly added |
| Advisor | [PLANNED V1] / [TBD] minimal composition | Own profile, assigned/upcoming/completed consultations, received public reviews | No dashboard exists; proposed APIs 07–09, 11, 14, 23 supply core operations |
| Advisor expansion | [PLANNED V2] | Availability management, improved analytics/performance metrics, possible earnings view | Earnings needs a separately approved fee/payment/accounting model; no payment subsystem is selected |
| Admin | [TBD] V1 minimal scope | Only essential setup/operations once explicitly defined | No admin route/UI; role label alone does not implement admin tools |
| Admin expansion | [PLANNED V2] | Approve/verify advisors, block users, moderate posts, manage reports/domains, monitor platform activity | Detailed permissions/workflows pending |

[TBD] Minimal advisor provisioning is a V1 dependency even if full approval/verification tooling is V2. Recommended default is a controlled, documented development/admin provisioning process with no public role escalation; whether this is seed data, an operator procedure, or a minimal protected flow remains a decision. Do not invent a full admin CRUD API to solve an undecided onboarding process.

## 17. Validation, HTTP status codes, and error handling

### 17.1 Validation boundary

[IMPLEMENTED] `src/controllers/auth.controller.js` performs explicit manual registration validation, and `src/app.js` parses JSON and returns a specific safe malformed-JSON response. No validation library is installed. [PLANNED V1] Future endpoints must validate body, parameters, and query data before SQL or permission decisions; broad input-shape handling and automated coverage remain pending.

| Input family | Status | Required validation direction | Pending specifics |
| --- | --- | --- | --- |
| Registration | [IMPLEMENTED] | Typed required fields; trimmed name ≤100; trimmed/lowercase email ≤255 and valid pattern; password ≥12 characters and ≤72 UTF-8 bytes; USER-only insert | See API-02; general unknown-field policy and abuse controls remain TBD |
| Login | [PLANNED V1] | Required types/fields and the accepted registration normalization/password policy | Day 4 implementation and verification |
| UUID route/body IDs | [PLANNED V1] | Syntax, existence, and separate relationship authorization | Consistent 403 vs concealed 404 policy |
| Advisor profile | [PLANNED V1] | Approved fields only, valid domain, bounded text, nonnegative experience/fee if included | Field requiredness, text lengths, currency |
| Appointments | [PLANNED V1] | Eligible advisor, unambiguous future time, valid state transition, ownership | Duration, delivery, cutoff, scheduling conflicts |
| Community/comment | [PLANNED V1] | Nonblank bounded text, existing supported-domain parent, author from auth | Lengths, content format, moderation/edit scope |
| Helpful | [PLANNED V1] | Existing target, own voter identity, selected eligibility, duplicate prevention | Target(s), self-vote, reversibility |
| Reviews | [PLANNED V1] | Own completed appointment, bounded integer rating, duplicate prevention, text policy | Exact rating range/text constraints |
| List filters/paging | [PLANNED V1] | Supported enums, bounded numeric paging, fixed sort allowlist, bounded search | Default/max values, cursor vs offset |

[IMPLEMENTED] D-08 accepts explicit manual backend validation for the current V1 stage; no validation library is selected. Database constraints remain the final protection for critical integrity. A future library change requires a separate decision.

### 17.2 HTTP status code policy

| Code | Meaning in intended project contract | Status |
| --- | --- | --- |
| 200 OK | Successful retrieval/update; current healthy diagnostic; proposed idempotent helpful mutation | [IMPLEMENTED] health / [PLANNED V1] business |
| 201 Created | Successful user/profile/appointment/post/comment/review creation | [IMPLEMENTED] registration / [PLANNED V1] others |
| 400 Bad Request | Invalid registration input and malformed JSON; future UUID/filter/body checks | [IMPLEMENTED] registration and malformed JSON / [PLANNED V1] broader validation |
| 401 Unauthorized | Missing, invalid, expired authentication; invalid login credentials | [PLANNED V1] |
| 403 Forbidden | Authenticated caller lacks role/ownership/policy permission | [PLANNED V1]; resource concealment alternative [TBD] |
| 404 Not Found | Valid request target does not exist/is unavailable under visibility policy | [PLANNED V1] safe JSON contract; current unmatched routes use framework default |
| 409 Conflict | Duplicate email; future profile/review/state/scheduling conflicts | [IMPLEMENTED] registration SELECT and 23505 handling / [PLANNED V1] others |
| 500 Internal Server Error | Unexpected failure; health disconnection or generic registration message | [IMPLEMENTED] health and registration catch / [PLANNED V1] global safe behavior |
| 429 Too Many Requests | Would apply if rate limiting is selected | [TBD] No limiter or status policy implemented |

[IMPLEMENTED] Registration maps PostgreSQL `23505` to 409 and logs other caught errors server-side while returning only `{"message":"Internal server error"}` with 500. [PLANNED V1] Future SQL integrity mappings must remain deliberate; driver messages, SQL, stack traces, or credentials must not be sent to clients.

### 17.3 Error architecture

[IMPLEMENTED] Health and the registration catch have safe failure bodies. After routes, `src/app.js` checks `error instanceof SyntaxError`, `error.status === 400`, and `"body" in error`, returning HTTP 400 with `{"message":"Invalid JSON body"}`. Unrelated errors pass to `next(error)`. [PLANNED V1] General safe error/not-found handling remains pending; `src/middleware/error.middleware.js` does not exist.

[TBD] Standard error codes/envelope and validation detail shape must be approved. Recommended response example, not a current contract:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

[PLANNED V1] Development logs may contain useful error context but must still redact secrets and sensitive consultation content. Production responses stay safe. Distinguish programmer failures from expected validation/conflict failures; avoid double responses after headers are sent. Do not claim a global error handler exists merely because Express has built-in fallback handling.

## 18. NON-NEGOTIABLE SECURITY INVARIANTS

[PARTIALLY IMPLEMENTED] These accepted requirements apply across V1. Registration already enforces manual validation, bcrypt hashing at cost 12, the 12-character minimum/72-UTF-8-byte maximum, trimmed name/email limits, parameterized queries, safe user output, USER-only creation, and duplicate-email 409 handling. Malformed JSON receives a safe JSON 400. Login/JWT, authentication, RBAC, ownership, and other business protections remain planned.

1. `.env` must never be committed; keep real secrets out of examples and documentation.
2. `node_modules/` must never be committed; commit manifest and lockfile instead.
3. Passwords must never be stored in plaintext.
4. Passwords and password hashes must never be returned to clients or public logs.
5. All user-controlled SQL values must be parameterized; dynamic SQL identifiers/sort fragments require a fixed allowlist.
6. JWT signing secrets/keys must never be hardcoded or included in frontend bundles.
7. Protected endpoints must authenticate server-side.
8. Role-sensitive endpoints must authorize the verified role server-side.
9. User-owned resources must check ownership/assignment, not only role.
10. Backend input validation is mandatory even if frontend validation exists.
11. Production database credentials must differ from simple local development credentials and be supplied securely.
12. Do not expose PostgreSQL publicly unless explicitly necessary and secured; retain restricted connectivity for deployment.
13. Never send sensitive errors, stack traces, raw SQL, credentials, or secrets to clients.
14. Keep private secrets out of source and Git history; a `.gitignore` entry cannot erase an already committed secret.
15. All authorization decisions happen server-side; client IDs/roles/flags are untrusted.
16. Hiding a frontend button/page is not a security control.
17. Public registration cannot assign ADMIN/ADVISOR; profile operations cannot elevate roles or forge verification/rating.
18. Verify JWT signatures/expiry and selected claims; decoding is insufficient, and JWT payloads are not private storage.
19. Protect critical relationships/uniqueness with database constraints and concurrency-aware writes.
20. Expose only explicit safe public/private projections appropriate to the viewer; never return an unrestricted user row.
21. Do not trust client vote counts, review advisor IDs, appointment owners, or lifecycle transitions.
22. Keep browser code away from PostgreSQL; the only application data boundary for the frontend is the backend REST API.

[IMPLEMENTED] `.gitignore` excludes `.env`, `node_modules/`, and `.DS_Store`; none is in the current tracked file list. This is not a complete historical secret scan. Compose reads POSTGRES_PASSWORD from the environment and restricts database publication to loopback; production security configuration remains planned.

### GitHub security expectations

[PLANNED V1] Review staged changes for secrets and local artifacts before committing. Use available secret scanning, push protection, and Dependabot alerts when configured on the repository. Their actual remote settings were not inspected and are **[TBD]**, not claimed enabled. A dependency lockfile is reproducibility evidence, not proof that dependencies are vulnerability-free; no dependency vulnerability scan was run during this audit.

[PLANNED V1] If a private secret is accidentally committed, revoke/rotate it promptly, assess exposure, and coordinate history cleanup as appropriate; deleting the latest file alone is insufficient. Avoid force pushes to a mature shared `main`. [PLANNED V2] or earlier when collaboration requires it: select branch protections/rulesets and review requirements. None is verified by this local audit.

[TBD] Before public deployment, decide rate-limit boundaries, allowed CORS origins, cookie/CSRF behavior if used, production TLS, database least-privilege role, and logging redaction. This list does not authorize adding unselected packages or unrelated security features.

## 19. Time, deletion, pagination, search, and indexes

### 19.1 DATE / TIME POLICY

[IMPLEMENTED] Only `users.created_at` is defined as `TIMESTAMPTZ`. [PLANNED V1] / [TBD] Recommended appointment policy is to accept ISO 8601/RFC 3339-style timestamps with an explicit UTC offset or `Z`, store instants in PostgreSQL `TIMESTAMPTZ`, and display them in the user's local timezone. Reject ambiguous local strings rather than guessing a timezone.

[PLANNED V1] PostgreSQL `TIMESTAMPTZ` represents an instant and converts output according to the session timezone; it does not preserve the originally supplied named timezone. A future recurring availability rule may need a separate named timezone and local schedule. Daylight-saving gaps/overlaps need explicit handling when such scheduling is introduced. See [PostgreSQL date/time types](https://www.postgresql.org/docs/17/datatype-datetime.html).

[TBD] Final API timestamp serialization, precision, server/database timezone configuration, appointment duration, display controls, and named-timezone storage are pending. Do not interpret a developer timezone in audit metadata as product policy.

### 19.2 DATA DELETION POLICY

[TBD] **TBD — DECISION REQUIRED** for all rows below. No delete APIs, soft-delete columns, retention jobs, or FK deletion rules are implemented.

| Decision | Why it matters | Recommended default for review | When |
| --- | --- | --- | --- |
| Hard vs soft deletion | Affects visibility, uniqueness, recovery, and query predicates | Decide per entity; avoid blanket cascades | Before adding relevant schema/delete behavior |
| User account deletion | User connects to bookings, posts, comments, reviews | Define retention/anonymization and access removal together | Before account deletion is promised |
| Post/comment deletion | Discussion continuity and child records | Decide hard removal vs tombstone; author/moderator permissions separately | Before content deletion APIs |
| Appointment history | Reviews depend on proof of completed consultation | Retain interpretable history; avoid automatic cascading loss | Before appointment FKs/deployment |
| Advisor deletion/role change | Existing bookings/reviews still reference advisor identity | Preserve history and define future discovery/booking visibility | Before profile/role mutation beyond basic fields |
| Review retention | Affects public rating and eligibility evidence | Explicit retain/anonymize/remove policy, consistent aggregates | Before account/review deletion |
| Domain removal | Affects profiles and posts across versions | Restrict removal while referenced; future deactivation only if selected | Before domain management in V2 |

[PLANNED V1] Restrictive deletion is a recommendation while policy is unresolved, not a final migration choice. Do not silently add `deleted_at`, `ON DELETE CASCADE`, retention durations, or legal claims. Relevant legal requirements, if later needed, require a separate review appropriate to launch jurisdiction and data.

### 19.3 PAGINATION

[PLANNED V1] Advisor lists, posts, comments, reviews, and appointment lists need bounded responses. [TBD] Recommended simple V1 proposal is `limit`/`offset`, default limit 20, maximum 100, offset ≥0, and deterministic ordering with a unique ID tie-breaker. These are recommendations only, not selected defaults.

[TBD] A cursor approach is an alternative for large/changing feeds and deep pages. Choose one response shape and ordering contract per collection before frontend integration. Offset paging can shift when records are inserted/deleted; cursor paging requires a stable ordering key and opaque cursor validation. Neither is implemented. Do not add expensive total-count queries unless the UI needs them.

### 19.4 SEARCH

[PLANNED V1] Basic Finance advisor search/filtering and basic community filtering are intended. Validate all filter inputs, parameterize terms, and specify which fields are searched. Recommended starting point is simple PostgreSQL filtering and bounded textual matching where appropriate. Decide whether `%`/`_` in a LIKE-family search are wildcard syntax or literal characters; parameterization alone does not decide search semantics.

[PLANNED V2] Advanced filters can include domain, specialization, derived rating, experience, fee, and availability after supporting fields/models exist. Richer PostgreSQL search can evaluate full-text search/GIN indexes or trigram-based matching if query evidence justifies them. These are alternatives, not selected extensions/migrations. Elasticsearch is deferred and unnecessary as an assumed V1 dependency.

### 19.5 INDEXING STRATEGY

[IMPLEMENTED] Users migration declares primary-key and email uniqueness constraints, so applying it creates their supporting unique indexes. No live index inspection occurred and no standalone `CREATE INDEX` statements exist. [PLANNED V1] Other entries below are prospective and need query-driven review.

| Lookup / likely index | Status | Purpose | Caveat |
| --- | --- | --- | --- |
| `users.id` primary-key index | [IMPLEMENTED] migration implication | Identity lookup | Live existence unverified |
| `users.email` unique index | [IMPLEMENTED] migration implication | Duplicate protection and exact stored-email lookup | Does not establish selected normalized/case-insensitive uniqueness |
| Advisor profile `user_id` | [PLANNED V1] / [TBD] uniqueness choice | Own-profile lookup and chosen cardinality | Unique only if one-profile-per-user is approved |
| Advisor profile `domain_id` | [PLANNED V1] | Finance domain filtering | May not help a tiny all-Finance table; measure |
| `appointments.user_id` | [PLANNED V1] | Customer's appointments | A composite `(user_id, scheduled_at)` may fit actual list queries better |
| `appointments.advisor_id` | [PLANNED V1] | Assigned advisor list | Evaluate composite time/status access patterns |
| `appointments.scheduled_at` | [PLANNED V1] | Time ranges/order | Separate index not automatically needed when composite indexes suffice |
| `community_posts.domain_id` | [PLANNED V1] | Domain feed | Consider `(domain_id, created_at, id)` based on selected pagination/order |
| `community_posts.author_id` | [PLANNED V1] | Own-post dashboard | Optional composite depends on query |
| `comments.post_id` | [PLANNED V1] | Comments for post | Consider ordering columns in composite index |
| Reviews advisor lookup | [PLANNED V1] / [TBD] schema | Advisor review listing/aggregation | `reviews.advisor_id` only if that column is selected; otherwise index the actual join path |
| `reviews.appointment_id` uniqueness | [PLANNED V1] / [TBD] exact constraint | Prevent duplicate reviews for consultation | Uniqueness invariant required; this is recommended representation |
| Helpful `(user_id, post_id)` uniqueness | [PLANNED V1] / [TBD] target | One association per user/target | Post-first index may separately help counts; don't assume one key order serves all queries |

[PLANNED V1] Indexes speed matching/order operations at the cost of storage and write overhead. PostgreSQL does not automatically add an index on every referencing FK column; choose those that serve actual queries. Use query plans and representative data before creating redundant indexes. A status-value CHECK is not an index, and an index is not an authorization policy.

## 20. Frontend architecture

[PLANNED V1] Chosen direction is React + Vite + JavaScript. There is no frontend implementation, package, build script, routing library, styling system, UI design, deployed page, or component inventory to preserve today.

| Screen/flow | Status | Required interaction | Backend dependency |
| --- | --- | --- | --- |
| Landing page | [PLANNED V1] | Explain hybrid Finance product and entry points | No direct database connection |
| Registration/login | [PLANNED V1] | Form feedback, safe auth response, selected token handling | Auth endpoints and validation |
| Advisor discovery/detail | [PLANNED V1] | Bounded listings/basic filters and public profiles | Advisor/domain data |
| Appointment booking/tracking | [PLANNED V1] | Enter selected time, view own lifecycle, cancel if allowed | Authorized appointment APIs and time policy |
| Community | [PLANNED V1] | Posts, detail, comments, helpful actions | Community endpoints/identity rules |
| User/advisor dashboards | [PLANNED V1] / [TBD] minimal scope | Compose existing resource views | Current user, appointments, profiles, posts/reviews |
| Reviews | [PLANNED V1] | Submit only for eligible completed appointment; show ratings/reviews | Review integrity and safe listing |

[PLANNED V1] Centralize REST calls in a small `frontend/src/services/` boundary rather than scattering URLs and authentication handling across components. Proposed folders in section 5 separate reusable components, screens, request functions, optional hooks/context, and small helpers. Avoid a state-management library until complexity warrants selection.

[PLANNED V1] Handle loading, empty, success, validation error, conflict, and unauthenticated states. Display server errors safely. Treat frontend permission checks as usability only: backend checks are still mandatory. Do not send DB credentials to the browser. Vite-exposed build variables are client-visible, so only public configuration such as API base URL belongs there.

[TBD] Routing library, styling/component approach, colors, fonts, exact page layout, frontend port, API-base configuration name, token persistence, and CORS topology are not frozen. No particular visual style, state package, or CSS framework is mandated by this spec. Standard form accessibility, labels, keyboard use, and understandable feedback should be considered during integration without inventing new product scope.

## 21. Testing strategy and feature acceptance cases

### 21.1 Current verification versus target suite

[IMPLEMENTED] This maintenance task ran `node --check` successfully on `src/controllers/auth.controller.js` and `src/app.js`, checked Git diff/status and whitespace, and verified relevant dependency/ignore metadata. `docker compose config --no-interpolate --quiet` passes; C-12 is resolved. These are maintenance checks, not an automated application test suite. No server/database was started, no live data was modified, and no application integration, SQL execution, frontend, end-to-end, load, vulnerability, or deployment test was performed.

[PLANNED V1] No `test` script or test dependencies currently exist; test framework and directory layout remain [TBD]. Do not claim coverage or passing application tests without executable evidence.

| Test category | Status | Purpose and critical scope | Execution boundary |
| --- | --- | --- | --- |
| Manual API testing | [PLANNED V1] | Verify requests/status/body/permissions with curl or an explicitly selected API client | Use disposable development records; confirm DB state without exposing hashes |
| Unit testing | [PLANNED V1] | Validate pure input checks, role middleware, normalization, transition decisions | Mock dependencies only where useful; avoid tests that merely repeat implementation |
| Integration testing | [PLANNED V1] | Exercise Express routes through middleware/controller into PostgreSQL | Separate test database with applied migrations; realistic errors and transactions |
| Database testing | [PLANNED V1] | PK/FK/UNIQUE/CHECK/defaults and concurrent writes | Fresh isolated schema/data; never destructive cleanup against development/production DB |
| Authorization/security testing | [PLANNED V1] | No/invalid/expired tokens, role escalation, ownership leaks, injection attempts | Include two customers and two advisors, forged IDs, and cross-account list/detail/mutations |
| Frontend testing | [PLANNED V1] | Forms, feedback, loading/empty/error views, auth state, API interaction | Tooling TBD; do not confuse component mocks with end-to-end security |
| End-to-end testing | [PLANNED V1] | Full Finance journey across actual frontend/backend/test DB | Registration → discovery → booking → advisor completion → review plus community journey |

### 21.2 Critical test cases by feature

| Feature | Status | Required cases before claiming completion |
| --- | --- | --- |
| Foundation/health | [PLANNED V1] tests | Healthy DB returns exact 200 body; rejected query returns exact safe 500; startup DB failure does not open listener and exits nonzero; invalid environment; occupied HTTP port handled according to selected policy |
| Users migration | [PLANNED V1] tests | Fresh apply creates expected schema; UUID/role/timestamp defaults; duplicate email rejected; invalid/null role rejected; missing required fields rejected; rerun behavior documented; no claim that health checks schema |
| Registration | [PLANNED V1] | Valid 201; missing fields; wrong types; blank/long name; malformed/long email; short/over-byte-limit password; duplicate normalized email; concurrent duplicates create one account; actual hash differs from plaintext and compares correctly; no password/hash in response/log; cannot set role |
| Login | [PLANNED V1] | Correct credentials; wrong password; unknown email; consistent public errors; malformed body; safe response; valid issued token with selected expiry; no secrets in claims |
| JWT/current user | [PLANNED V1] | No token; malformed/tampered token; expired token; wrong selected algorithm/claims; valid identity; removed/role-changed account per policy; no user_id override |
| RBAC/ownership | [PLANNED V1] | USER denied any explicitly scoped ADMIN/ADVISOR route; A cannot read/cancel B booking; unassigned advisor denied; lists/counts scoped correctly; guessed UUID never grants access; frontend-hidden action still denied server-side |
| Advisor profiles | [PLANNED V1] | ADVISOR creates/updates only own profile; USER denied; duplicate profile race; invalid domain/experience/fee/text; cannot set verification/rating/role; static me route not captured as dynamic ID |
| Advisor discovery | [PLANNED V1] | Finance-only output; list/detail; empty list; unknown/malformed ID; filter/paging limits; sort injection attempts rejected; no private email/hash; no-rating behavior; no N+1 pattern in representative query review |
| Appointment creation | [PLANNED V1] | Valid owned PENDING booking; absent/ineligible advisor; malformed/past/ambiguous time; forged user/status rejected; selected self-booking/time-window constraints; duplicate-request behavior decided |
| Appointment access/lifecycle | [PLANNED V1] | Own and assigned lists; cross-party rejection; each approved/forbidden transition; cancellation cutoff; completed/cancelled terminal behavior; simultaneous cancellation/completion cannot silently overwrite state |
| Scheduling overlap | [TBD] V1 minimal; [PLANNED V2] advanced | Test selected minimal V1 conflict policy before claiming it; future concurrent slot/overlap/availability tests when corresponding model is approved |
| Posts | [PLANNED V1] | Create/list/detail; required/large content; wrong domain; author spoofing; escaped content; safe public identity; own filter requires auth; paging/sort bounds |
| Comments | [PLANNED V1] | Valid parent; missing/invalid parent; blank/large body; author spoofing; public-safe listing; stable paging; any selected deletion visibility policy |
| Helpful | [PLANNED V1] / [TBD] target | Valid mark; unauthenticated denial; duplicate/concurrent mark counts once; own removal if selected; cannot delete another vote; self-vote policy; target missing; client count ignored/rejected |
| Reviews | [PLANNED V1] | Own COMPLETED consultation accepted; pending/confirmed/cancelled rejected; another user's consultation rejected; unrelated advisor cannot be supplied; duplicate/concurrent review rejected; bounds and integer rating; safe listing/accurate derived average |
| Dashboards/frontend | [PLANNED V1] | Correct user/advisor data scope; valid/invalid auth flows; loading/empty/error views; refresh behavior per storage policy; timezone display; no database secrets in bundles; full core journeys |
| Error/security boundary | [PLANNED V1] | Malformed JSON produces selected safe response; database failure never exposes SQL/credentials; allowed CORS topology; chosen cookie/CSRF behavior; limiter behavior if selected; no secrets in staged artifacts |
| Deployment | [PLANNED V1] | Reproducible clean setup, migrations applied separately, DB/TLS configuration, startup/health, critical smoke flows, persistence, backup/restore procedure verified as selected |

[PLANNED V1] Test business invariants at the level that can actually prove them. A mocked database cannot prove a UNIQUE constraint; a UI-only test cannot prove ownership enforcement; sequential requests cannot prove race handling. Keep fixtures isolated and avoid sending real consultation data into logs or test artifacts.

## 22. Logging, performance, and scalability

### 22.1 Logging and observability

[IMPLEMENTED] `src/server.js` logs DB connection success, listening port, and startup database error message. Registration catch logs `Registration error:` plus error.message server-side while sending safe messages to the client. Health sends safe JSON without logging its failure. No structured logger, request IDs, request middleware, metrics, tracing, or production log configuration exists.

[PLANNED V1] Provide enough safe operational diagnostics to distinguish startup failure, validation failure, authorization denial, unexpected exception, and database errors. [TBD] Structured logging, request IDs, health monitoring, metrics, retention, and package choices must be selected when operational needs require them. Redact tokens, passwords, hashes, connection strings, and private consultation content. Avoid logging entire request bodies by default.

### 22.2 PERFORMANCE CONSIDERATIONS

| Concern | Status | Intended practice |
| --- | --- | --- |
| Database connection pooling | [IMPLEMENTED] shared pool | Keep one bounded pool per process; size across all deployed instances when configured |
| Indexes | [PARTIALLY IMPLEMENTED] users constraints only | Add query-justified indexes in migrations; inspect actual query plans |
| Pagination | [PLANNED V1] | Bound collection responses and avoid unbounded comment/review embedding |
| N+1 queries | [PLANNED V1] | Use suitable joins/aggregates instead of one extra DB query per advisor/post/review |
| Selected fields | [IMPLEMENTED] registration / [PLANNED V1] other queries | Registration SELECT retrieves id only; INSERT returns id, name, email, role, created_at |
| Frontend API traffic | [PLANNED V1] | Centralize requests; avoid repeated requests caused by component structure; use suitable request timing for basic search |
| Password cost | [IMPLEMENTED] cost 12 | Asynchronous bcrypt.hash; deployment/concurrent login benchmarking remains planned |
| Transactions | [PLANNED V1] | Keep necessary transactions short and release clients; enforce concurrency correctly |
| Caching | [DEFERRED] | Add only for measured bottlenecks with explicit invalidation rules |
| Redis | [DEFERRED] | No dependency, server, or requirement today |

[PLANNED V1] Diagnose slow queries/API paths with representative data before optimizing. Avoid trading away correctness or ownership filters for speed. An index does not solve unbounded output, and a cache does not automatically stay synchronized with review/vote mutations.

### 22.3 Scalability direction

[PLANNED V1] The intentional architecture is a single modular Express backend. As real complexity grows, improve module boundaries, extract shared services where controllers justify them, measure DB access, and only later consider separate services when operational evidence demands it.

```text
[IMPLEMENTED] Small Express foundation
    → [PLANNED V1] Modular monolithic backend with complete Finance journey
    → [DEFERRED] Larger modules/services inside backend as complexity warrants
    → [DEFERRED] Separate deployed services only after an explicit justified decision
```

[DEFERRED] No V1 microservices, Kubernetes, message broker, Redis layer, or search cluster. Multiple backend processes would each own a pool, so aggregate database connection budgets become a deployment consideration rather than a reason to prematurely distribute the system.

## 23. Local development and debugging commands

### 23.1 Current supported scripts and intended startup

[IMPLEMENTED] `npm start` launches `node src/server.js`; `npm run dev` launches `nodemon src/server.js`. No build/test/migrate/seed script exists. [PLANNED V1] The following is an operator runbook based on current files, **not startup commands executed as part of this maintenance task**.

[IMPLEMENTED] Current Compose configuration passes `docker compose config --no-interpolate --quiet`; C-12 is resolved. [TBD] Live services and applied schema remain unverified. The following startup commands are an operator runbook, not work performed by this maintenance task.

1. Ensure Docker Desktop/Engine is running and your shell can reach the daemon.
2. Install locked dependencies for a clean checkout; use `npm install` when intentionally updating dependencies, and review lockfile changes.
3. Configure the ignored `.env` using `.env.example` and section 8. Replace password placeholders consistently in DATABASE_URL and POSTGRES_PASSWORD. Do not overwrite an existing working `.env`.
4. Start the local PostgreSQL service and confirm container readiness.
5. Verify intended database/schema separately; apply migrations with the selected workflow. Current health does not require the users table.
6. Start the backend using its existing script.
7. Call health and inspect its HTTP code/body.

```bash
# Run from repository root. These are documented operator commands.
npm ci
docker compose up -d
docker compose ps
docker ps
docker compose exec postgres pg_isready -U postgres -d consultify
npm run dev
```

[PLANNED V1] In a separate terminal, after startup:

```bash
curl -i http://localhost:8000/api/health
```

[IMPLEMENTED] Expected controller result with working DB is HTTP 200 and the exact connected JSON in section 7. If DB connectivity fails at startup, the server exits rather than serving a diagnostic response; a connection-refused HTTP error in that case differs from an already-running server returning health 500 after DB loss.

### 23.2 Read-only database checks

[PLANNED V1] These commands are diagnostic suggestions for an authorized local operator. They were not successfully executed against PostgreSQL during this audit and do not prove applied schema.

```bash
docker compose exec postgres psql -U postgres -d consultify -c 'SELECT 1;'
docker compose exec postgres psql -U postgres -d consultify -c 'SELECT current_database(), current_user;'
docker compose exec postgres psql -U postgres -d consultify -c 'SHOW server_version;'
docker compose exec postgres psql -U postgres -d consultify -c '\dt'
docker compose exec postgres psql -U postgres -d consultify -c '\d users'
```

[PLANNED V1] A `psql` query executed inside the container checks PostgreSQL itself; it does not separately prove the host `5433` publication or the backend's `DATABASE_URL`. Confirm those paths independently. Never troubleshoot by printing the full connection URI or password hashes.

### 23.3 Existing migration file: explicit one-time application

[PARTIALLY IMPLEMENTED] There is no automated runner. [PLANNED V1] For a newly initialized local database, after verifying `users` is absent and the connection points to disposable/intended local data, an operator can apply the versioned file explicitly:

```bash
# MUTATES SCHEMA. One-time local application, not a repeatable migration runner.
# Do not execute on an already-migrated database or blindly against production.
docker compose exec -T postgres psql -U postgres -d consultify -v ON_ERROR_STOP=1 -1 < database/migrations/001_create_users.sql
```

[PLANNED V1] `-T` disables a pseudo-terminal for redirected input, `ON_ERROR_STOP` stops on SQL errors, and `-1` requests a single transaction for this file. This command does not record a migration version or implement rollback history. Do not use table-existence guesses as the permanent deployment migration protocol.

### 23.4 Stop/restart and local diagnostic limits

```bash
# Normal local shutdown; declared named volume is retained.
docker compose down
```

[PLANNED V1] **Destructive reset command — not a startup/debugging prerequisite:**

```bash
# DESTRUCTIVE: removes Compose-declared named volumes and local database data.
# Run only when an intentional data reset is explicitly authorized.
docker compose down -v
```

[TBD] The initial audit reported a Docker API socket permission failure. This maintenance task validates Compose configuration only and does not inspect live Docker or database state. No container/volume reset was attempted. A configuration file or `SELECT 1` alone does not prove applied schema.

[IMPLEMENTED] The previously reported Compose syntax failure is resolved and configuration validation passes without starting containers. Runtime state cannot be inferred from that configuration-only check.

## 24. Deployment and Git workflow

### 24.1 Local versus production architecture

[IMPLEMENTED] Local configuration is a host-run Node backend plus Dockerized PostgreSQL. The frontend is planned. [PLANNED V1] Proposed production direction is:

```mermaid
flowchart LR
    F[Planned hosted React frontend] -->|HTTPS REST| A[Planned deployed Node / Express backend]
    A -->|Private / secured PostgreSQL connection| D[Planned managed PostgreSQL]
    S[Production environment secrets] --> A
```

[TBD] Frontend provider, backend provider, managed PostgreSQL provider, region, domains, deployment process, database TLS specifics, and migration execution owner are undecided. No deployed URL, CI/CD configuration, backend image, or production environment is confirmed by the repository. Local `docker-compose.yml` is not proof of deployment.

[PLANNED V1] If Supabase is selected later, its initial architectural role should be **hosted PostgreSQL**. It is not currently the application architecture. Do not silently replace Express, `pg`, raw SQL, the users schema, or custom JWT authentication with Supabase Auth or direct browser database access. Additional provider features require explicit decisions.

### 24.2 Deployment preparation checklist

[PLANNED V1] Required preparation, not completed work:

- Select and pin supported deployment runtime/package tooling deliberately; reconcile local Node version and absence of a project pin.
- Configure secure production `DATABASE_URL`, HTTP port handling, JWT signing material, and selected token/CORS topology.
- Keep the database reachable only through intended secured paths and a suitable application database role; the local `postgres` superuser setup is not the production default.
- Apply versioned SQL migrations through an explicit process; do not assume starting the app or Compose applies SQL.
- Set safe production errors/logging and select DB connection limits/TLS/timeouts/shutdown behavior.
- Build/host the frontend with only public API configuration; integrate HTTPS backend calls.
- Run critical Finance journeys and ownership/security tests against the deployed configuration.
- Decide backup/restore responsibility, retention, and recovery procedure appropriate to the selected provider; verify the chosen process.
- Record deployment URL/provider/configuration names and actual verification evidence in this document once they exist; never record secrets.

### 24.3 Git workflow

[IMPLEMENTED] Two meaningful foundation commits exist. [PLANNED V1] Continue committing understandable working milestones rather than every keystroke or one final giant dump. Review staged contents before committing; no Git commit/push is performed by this documentation task.

```bash
git status --short
git diff
# Prefer explicit reviewed paths. For this documentation change, for example:
git add docs/CONSULTIFY_MASTER_SPEC.md
git diff --cached
git status --short
git commit -m "Document Consultify architecture and V1 implementation plan"
git push
```

[PLANNED V1] Review the complete working tree and ignore rules before staging. [IMPLEMENTED] `.DS_Store` is ignored and not tracked; this maintenance task does not change ignore rules, remove artifacts, commit, or push.

| Commit to repository | Do not commit | Status |
| --- | --- | --- |
| `package.json`, `package-lock.json` | `node_modules/` | [IMPLEMENTED] current package/ignore arrangement |
| Source, migrations, Compose configuration | Private secrets or production passwords in any file | [PLANNED V1] continuous review requirement; current Compose references POSTGRES_PASSWORD from the environment |
| Safe `.env.example`, `.gitignore` | `.env` or private env variants | [IMPLEMENTED] safe placeholders exist; exact current ignore rules verified |
| Documentation and future README | Local OS artifacts, secret-bearing logs, generated private test data | [IMPLEMENTED] `.DS_Store` ignored and not tracked; broader staging review remains [PLANNED V1] |

[TBD] Remote branch protections, push protection, secret scanning, Dependabot settings, and CI requirements are not discoverable from the inspected local files and have not been checked through GitHub. Do not mark them enabled. Preserve intentional history and coordinate any exceptional history rewrite.

## 25. 14-day V1 implementation roadmap

[PLANNED V1] This is the owner's proposed sequencing, not a promise that each row requires exactly one calendar day. Testing and security should accompany features from the start; day 14 is final verification, not the first opportunity to test. Resolve a row's required decisions before implementing dependent work.

| Day | Focus and planned work | Current evidence/status | Exit evidence / dependencies |
| --- | --- | --- | --- |
| 1 | Backend foundation: Node setup, Express, app/server separation, routes/controllers, health, env, nodemon, Git | [PARTIALLY IMPLEMENTED] Core source/scripts/Git and environment placeholders exist; required-variable validation and maintained tests remain pending | Existing sources parse; reproducible startup and health demonstrated; document variables |
| 2 | Database foundation: PostgreSQL, Docker/Compose, ports, persistent volume, DATABASE_URL, pg pool, raw SQL, migrations/users, parameters, DB health | [PARTIALLY IMPLEMENTED] Compose/pool/users SQL/probes exist; live database/apply state unverified; migration runner absent | Verify correct DB and applied schema; reproducible migration process; explain separate HTTP/DB communication |
| 3 | Registration: endpoint/router/controller, backend validation, normalization, bcrypt package/hash, duplicate checks, tests | [PARTIALLY IMPLEMENTED] Registration code implemented, including field limits, bcrypt cost 12, password bounds, duplicate SELECT/23505 handling, safe USER-only output, and malformed-JSON 400; automated tests remain [PLANNED V1] | D-05–D-08 accepted; valid/invalid/duplicate/concurrent runtime verification remains pending; no automatic login |
| 4 | Login + JWT: compare password, sign token, expiry, safe response, tests | [PLANNED V1] No implementation | Registration/users; token library/algorithm/storage/expiry decisions; valid/invalid credential tests |
| 5 | Authentication + authorization: authenticate, req.user, current user, role middleware, 401/403, ownership | [PLANNED V1] No implementation | Trusted identity and role policy; cross-account tests; no public privilege escalation |
| 6 | Advisor system: generic domain model, Finance data, profile schema and profile APIs | [PLANNED V1] No implementation | Profile cardinality/provisioning decisions; domains/users FKs; own-profile permissions |
| 7 | Advisor discovery: list/detail, basic search/filters, review/refactoring | [PLANNED V1] No implementation | Advisor data; approved pagination/projections; Finance discovery tests |
| 8 | Appointment database: relationships, owner, time fields, statuses and transition rules | [PLANNED V1] No implementation | Scheduling/duration/domain-reference decisions; versioned schema and constraints |
| 9 | Appointment APIs: booking, own/assigned lists, detail, cancellation, advisor status updates, ownership | [PLANNED V1] No implementation | Auth/advisor/schema; approved transitions; concurrent state/ownership tests |
| 10 | Community posts: schema, create/list/detail, Finance domain relationship | [PLANNED V1] No implementation | Users/domains/auth; content limits/format; safe public projections |
| 11 | Community interactions: comments, helpful/upvote behavior | [PLANNED V1] No implementation | Posts/auth; decide helpful target/table/reversibility and enforce duplicate prevention |
| 12 | Reviews + search improvement: schema, completed consultation requirement, ratings, public advisor review list, derived average | [PLANNED V1] No implementation | Completed appointment lifecycle; uniqueness/rating decisions; concurrent duplicate and eligibility tests |
| 13 | React/Vite frontend integration: auth, advisors, appointments, community, reviews, minimal dashboards | [PLANNED V1] No implementation | Stable APIs, selected token/CORS topology; loading/empty/error states and full Finance journeys |
| 14 | Finalization: tests, debugging, security audit, justified refactoring, README, deployment, GitHub cleanup, master-spec audit | [PLANNED V1] Master reference created only | Definition of done in section 35; deploy and verify; update actual evidence/status rather than marking routes alone complete |

[PLANNED V1] If decisions or correctness work exceed a day, extend the schedule rather than remove security/ownership checks. No roadmap item expands this maintenance task beyond the explicitly authorized Day 3 fixes.

## 26. Implementation checklist

[IMPLEMENTED] A checked item below means the named artifact exists in the audited repository. It does not assert runtime validation where that was unavailable. [PLANNED V1] Unchecked entries describe missing implementation or required verification; a decision-specific item remains [TBD] until selected.

### Backend foundation

- [x] [IMPLEMENTED] Node manifest and lockfile with explicit CommonJS.
- [x] [IMPLEMENTED] Express app in `src/app.js` and JSON parser.
- [x] [IMPLEMENTED] Server entry in `src/server.js`.
- [x] [IMPLEMENTED] Health router and controller.
- [x] [IMPLEMENTED] dotenv loads before environment-dependent imports.
- [x] [IMPLEMENTED] Start/dev scripts and nodemon.
- [x] [IMPLEMENTED] Startup queries DB before HTTP listen and exits on query failure.
- [x] [IMPLEMENTED] Usable `.env.example` with PORT, DATABASE_URL, and POSTGRES_PASSWORD placeholders.
- [ ] [PLANNED V1] Required environment validation.
- [ ] [TBD] Listener errors, graceful shutdown, pool idle errors and timeout policy.
- [ ] [PLANNED V1] Correct stale package entry metadata after an authorized code/config task.
- [ ] [PLANNED V1] Consistent safe error/not-found handling.

### Database

- [x] [IMPLEMENTED] PostgreSQL 17.4 image declared in Compose.
- [x] [IMPLEMENTED] Named volume and valid loopback `127.0.0.1:5433:5432` mapping declared.
- [x] [IMPLEMENTED] Compose ports list syntax is valid; configuration validation passes (C-12 resolved).
- [x] [IMPLEMENTED] Shared `pg.Pool` module.
- [x] [IMPLEMENTED] Users migration with UUID/defaults/constraints.
- [x] [IMPLEMENTED] Table-independent health/startup DB probes.
- [ ] [TBD] Verify running DB server/version/identity and applied users schema.
- [ ] [PLANNED V1] Reproducible migration application/tracking workflow.
- [ ] [PLANNED V1] Domains migration and controlled Finance seed data.
- [ ] [PLANNED V1] Advisor/appointment/post/comment/review migrations.
- [ ] [TBD] Helpful interaction persistence decision and selected migration.
- [ ] [PLANNED V1] Foreign keys, critical uniqueness/CHECK constraints and query-driven indexes.
- [x] [IMPLEMENTED] Parameterized registration SELECT/INSERT and email UNIQUE/23505 race handling.
- [ ] [PLANNED V1] Parameterized queries and concurrent integrity handling for future business workflows.
- [ ] [TBD] Time/deletion/retention policies reflected consistently in schema.

### Authentication and authorization

- [x] [IMPLEMENTED] D-05: bcrypt package, cost 12.
- [x] [IMPLEMENTED] D-06: password minimum 12 characters, maximum 72 UTF-8 bytes.
- [x] [IMPLEMENTED] D-07: trim/lowercase email only; preserve dots and +tags.
- [x] [IMPLEMENTED] D-08: explicit manual backend validation; no validation library.
- [x] [IMPLEMENTED] POST /api/auth/register route/controller with USER-only creation; supplied role fields ignored.
- [x] [IMPLEMENTED] Required-field/email-pattern checks; trimmed name ≤100 and normalized email ≤255.
- [x] [IMPLEMENTED] Exact success message/user response with id, name, email, role, created_at only; no password/hash, JWT, or automatic login.
- [x] [IMPLEMENTED] Malformed-JSON HTTP 400 with only {"message":"Invalid JSON body"}; unrelated errors passed onward.
- [x] [IMPLEMENTED] bcrypt hash storage, early duplicate SELECT, database UNIQUE protection, and 23505 → 409.
- [x] [IMPLEMENTED] Other caught registration failures log server-side and return generic 500 only.
- [ ] [PLANNED V1] Automated registration validation/hash/concurrency tests.
- [ ] [PLANNED V1] Login and password comparison.
- [ ] [TBD] JWT library/algorithm/expiry/storage/key strategy.
- [ ] [PLANNED V1] JWT signing/verification with no secret payload fields.
- [ ] [PLANNED V1] `authenticate` and trusted `req.user`.
- [ ] [PLANNED V1] Current-user safe endpoint.
- [ ] [PLANNED V1] Role middleware and 401/403 consistency.
- [ ] [PLANNED V1] Ownership/assignment checks for every private resource operation.
- [ ] [TBD] Advisor/admin provisioning, advisor-as-customer policy, role freshness.

### Advisors and appointments

- [ ] [PLANNED V1] Generic user/domain/profile relationships.
- [ ] [PLANNED V1] Finance advisor profile create/read/update with ownership.
- [ ] [PLANNED V1] Public-safe advisor list/detail and basic search/filtering.
- [ ] [TBD] Fee/currency/profile-field/cardinality decisions.
- [ ] [TBD] Appointment lifecycle, duration, cancellation, delivery/timezone rules.
- [ ] [PLANNED V1] Booking creation, own/assigned listing and private detail.
- [ ] [PLANNED V1] Customer cancellation and assigned-advisor transitions.
- [ ] [PLANNED V1] Concurrent transition guards and invalid-state errors.
- [ ] [TBD] Minimal V1 booking conflict policy, accurately advertised/tested.

### Community and reviews

- [ ] [PLANNED V1] Finance posts create/list/detail with author/domain FKs.
- [ ] [PLANNED V1] Comments create/list and safe public content.
- [ ] [TBD] Helpful target, self-vote and reversibility rules.
- [ ] [PLANNED V1] Selected helpful behavior with duplicate/concurrent protection.
- [ ] [PLANNED V1] Review creation restricted to own completed appointment.
- [ ] [PLANNED V1] One-review-per-appointment integrity representation selected and enforced.
- [ ] [TBD] Rating/text policy and aggregate no-review representation.
- [ ] [PLANNED V1] Advisor reviews, derived average/count, and minimal own-review view if retained in scope.

### Frontend, testing, security, delivery, documentation

- [ ] [PLANNED V1] React/Vite frontend and centralized REST requests.
- [ ] [PLANNED V1] Auth/discovery/booking/community/reviews/minimal dashboards integrated.
- [ ] [TBD] Token persistence/CORS/cookie-CSRF topology.
- [ ] [PLANNED V1] Manual API evidence and selected automated test tooling.
- [ ] [PLANNED V1] Integration/database/auth/ownership/concurrency tests.
- [ ] [PLANNED V1] Frontend and end-to-end Finance acceptance evidence.
- [x] [IMPLEMENTED] `.gitignore` excludes `.env`, `node_modules/`, and `.DS_Store`; OS artifacts are not tracked.
- [ ] [PLANNED V1] Full secret/dependency/security review with findings recorded.
- [ ] [TBD] Public deployment rate limits, TLS, connection budgets, safe logging.
- [ ] [TBD] Select frontend/backend/managed DB providers and recovery process.
- [ ] [PLANNED V1] Apply production migrations, deploy, smoke-test, and record URLs safely.
- [ ] [PLANNED V1] Concise README with reproducible setup and current limitations.
- [x] [IMPLEMENTED] Initial master engineering specification created from repository inspection.
- [ ] [PLANNED V1] Re-audit spec against completed V1 implementation and test/deployment evidence.
- [ ] [PLANNED V1] Developer can explain each architecture area and core request flow.

### Explicit later-version boundary

- [ ] [PLANNED V2] Health/Astrology, advanced availability/search, notifications, favorites, reporting, verification, stronger admin, reputation, improved dashboards.
- [ ] [PLANNED V3] Only explicitly selected AI/ML assistance after data/privacy/evaluation decisions.
- [ ] [DEFERRED] Chat/voice/video/WebSockets, payment systems, native mobile, distributed infrastructure, unmeasured caching/search services.

## 27. Feature dependency graph

[PARTIALLY IMPLEMENTED] Foundation, the users migration, registration, and hashing exist. [PLANNED V1] Arrows describe prerequisites for the remaining modules. Accepted password decisions are recorded; JWT and future schema decisions remain pending.

```mermaid
flowchart TD
    F[Existing backend and pg foundation] --> M[Existing users migration; application unverified]
    M --> R[Existing registration and hashing]
    R --> L[Planned login and JWT]
    L --> A[Planned authentication and current user]
    A --> Z[Planned RBAC and ownership]
    M --> D[Planned generic domains and Finance data]
    D --> P[Planned advisor profile]
    Z --> P
    P --> Q[Planned advisor discovery]
    P --> B[Planned appointment schema and booking]
    Z --> B
    B --> C[Planned authorized completion lifecycle]
    C --> V[Planned eligible review and rating]
    D --> S[Planned community posts]
    Z --> S
    S --> T[Planned comments]
    S --> H[Planned helpful persistence and interaction]
    T -. Roadmap order; target choice pending .-> H
    Q --> UI[Planned React frontend integration]
    B --> UI
    V --> UI
    T --> UI
    H --> UI
    UI --> DONE[Planned tested and deployed Finance V1]
```

[PLANNED V1] User + advisor → appointment; COMPLETED appointment → eligible review. Domain + user → community post; post → comment. Helpful behavior depends on identity and its selected target/persistence. Comments precede helpful work in the proposed roadmap, but a post-only vote does not technically depend on comments. Avoid turning a sequencing suggestion into a false schema dependency.

## 28. BUG AUDIT CHECKLIST

[PLANNED V1] Reusable investigation procedure, not evidence that future features exist. First identify audited commit, failing request, expected version behavior, safe reproduction, and whether the endpoint/table is actually implemented. Check the smallest relevant boundary before changing code.

### Network and process

- [ ] Is the backend process running, and did startup log successful DB connection before listening?
- [ ] Is the caller using the actual configured Express `PORT` (default 8000), correct method, and `/api` path?
- [ ] Is a port-in-use error preventing the HTTP listener from starting?
- [ ] Is Docker Engine reachable? Distinguish a daemon/socket permission problem from a stopped database.
- [x] Does Compose configuration validation pass? `docker compose config --no-interpolate --quiet` passes; C-12 resolved, live state unverified.
- [ ] Does valid Compose configuration publish `127.0.0.1:5433:5432`, and is another service using host 5433?
- [ ] Is the backend running on the host or inside a container? Interpret `localhost` from that process's network context.
- [ ] Does `localhost` resolve to an address compatible with the IPv4 loopback publication?
- [ ] Is the frontend making HTTP requests to Express rather than trying to speak to the database port?
- [ ] If a future frontend works in curl but fails in browser, inspect the selected CORS/cookie policy and browser request details; CORS is not database routing.

### Database

- [ ] Is the declared PostgreSQL container ready, not merely created?
- [ ] Does `SELECT 1` succeed through the relevant connection path?
- [ ] Are `current_database()` and `current_user` the intended database/role? Never print full credentials.
- [ ] Was the needed migration applied? Does the table/column/constraint actually exist in that database/schema?
- [ ] Is an old named volume preserving an older schema or initialization credential? Do not delete it reflexively.
- [ ] Is SQL syntax valid, and do selected column names match the migration rather than a planned schema?
- [ ] Do `$1`, `$2`, etc. align in count/order/type with the values array?
- [ ] Is a constraint violation expected (duplicate email/review) or evidence of a programming/schema mismatch?
- [ ] Are empty query rows checked before `rows[0].field` access?
- [ ] Is `rowCount` being confused with the number of returned rows or a missing `RETURNING` clause?
- [ ] Does a transaction use the same checked-out client for all statements, with rollback/release on failures?
- [ ] Did a controller create extra pools, fail to release a client, or call `pool.end()` during normal traffic?
- [ ] Could a concurrent request invalidate an earlier duplicate/status/eligibility check?
- [ ] Are filters/indexes appropriate to the actual query plan and data volume?

### Express and application layering

- [ ] Is the route file mounted in `src/app.js`? Health and auth are mounted; auth currently exposes registration only.
- [ ] Is the method correct, and do mount path plus router-local path produce the intended URL?
- [ ] Does middleware run in the required order: parsing, relevant auth/validation/role checks, controller, error handling?
- [ ] Are imports/exports compatible with CommonJS and exact filenames/case?
- [ ] Is a static path such as `/me` placed before a dynamic `/:id` matcher?
- [ ] Is an error caught/forwarded once, with no second response after headers are sent?
- [ ] Is a framework default HTML/parser error being mistaken for a custom JSON API contract?
- [ ] Does the controller implement a feature, or does only a proposed contract/stub exist?

### Authentication and authorization

- [ ] Has the auth feature actually been implemented, including selected token transport?
- [ ] Is a token present on the request, validly signed, unexpired, and valid for selected claims/algorithm?
- [ ] Was `req.user` populated by verification rather than client data or token decoding alone?
- [ ] Does the caller have the required current role under the chosen freshness policy?
- [ ] Are ownership and assigned-advisor checks correct for the selected advisor ID reference?
- [ ] Are list queries and aggregate/count queries restricted as well as detail/mutation queries?
- [ ] Does public registration/profile mutation reject role/verification/owner overrides?
- [ ] Does the code distinguish 401 authentication failure, 403 access denial, 404 absence/concealment, and 409 state conflict?
- [ ] Are same-role cross-account tests included in the reproduction?

### Input, time, and frontend

- [ ] Is `Content-Type` correct and `req.body` populated by `express.json()`?
- [ ] Are body/query/parameter types valid before string/numeric operations?
- [ ] Did backend validation pass, not just the browser form?
- [ ] Are optional, null, blank, too-long, and unexpected fields handled deliberately?
- [ ] Do registration and login normalize email identically, consistent with DB uniqueness?
- [ ] Is password input treated unchanged and within the chosen byte-length policy?
- [ ] Does the appointment timestamp contain an explicit offset, and does display conversion preserve the instant?
- [ ] Are UI loading/error/empty states masking a failed API response or making duplicate requests?
- [ ] Are pagination/sort/search parameters bounded and mapped to safe SQL fragments?

### Environment and deployment

- [ ] Does dotenv load before importing `src/config/db.js` through any path? Tests importing `app.js` directly need deliberate environment setup.
- [ ] Are variable names spelled exactly `DATABASE_URL` and `PORT` where currently read?
- [ ] Is missing configuration causing `pg` defaults to reach an unintended database?
- [ ] Is `.env` ignored and absent from tracked/staged files? Is a new env filename covered by deliberate ignore rules?
- [ ] Are production secrets private and distinct from local examples?
- [ ] Do deployed migration version, backend version, and frontend API contract agree?
- [ ] Is DB TLS/pool/allowed-origin configuration correct for the chosen provider rather than copied blindly from local Compose?
- [ ] Has an error response/log accidentally exposed credentials, SQL, or private consultation content?

[PLANNED V1] After finding a discrepancy, record the evidence, smallest authorized fix, meaningful regression case, and specification update if the intended decision changes. Do not “fix” a missing planned feature by claiming it already exists, and do not reset databases as a substitute for diagnosis.

## 29. ARCHITECTURE AUDIT CHECKLIST

[PLANNED V1] Use for reviews of human/AI-generated changes. The checklist itself is a review tool, not a completed certification.

- [ ] Is every changed feature mapped to V1, V2, V3, deferred, or an explicit TBD decision?
- [ ] Did the reviewer inspect the current repository rather than rely on this snapshot alone?
- [ ] Does new code use Node/Express/JavaScript/CommonJS for backend and `pg` with raw SQL?
- [ ] Has anyone introduced Drizzle, Prisma, Sequelize, TypeORM, or another abstraction without a recorded architecture decision?
- [ ] Are new dependencies necessary, selected explicitly where pending, locked, and understood?
- [ ] Are all user-controlled SQL values parameterized and dynamic identifiers/sort keywords allowlisted?
- [ ] Does every protected operation authenticate and every role-sensitive operation authorize?
- [ ] Does every private read/list/update/delete verify ownership/assignment, including aggregates?
- [ ] Are roles distinct from advisory domains, with one generic user/appointment/community architecture?
- [ ] Are duplicated `finance*`/`health*` authentication or booking tables/modules appearing?
- [ ] Are passwords hashed through the selected safe package, never stored/returned/logged plaintext or as exposed hashes?
- [ ] Are JWT claims safe, signatures/expiry verified, and secrets outside code/client bundles?
- [ ] Are backend validation and safe error semantics explicit?
- [ ] Are public responses built from approved safe fields rather than unrestricted DB rows?
- [ ] Does each schema change have a versioned SQL migration, with the selected apply/track process?
- [ ] Do database constraints enforce identities, references, uniqueness, and selected ranges?
- [ ] Are cross-record rules and concurrent writes protected beyond frontend checks/preliminary reads?
- [ ] Are appointment transition/cancellation and review eligibility rules consistent across code/tests/documentation?
- [ ] Are domain/profile/review relationship decisions and deletion/time semantics explicit rather than silently selected?
- [ ] Is business logic in a reasonable controller/module, with new service layers justified by actual complexity?
- [ ] Is one shared pool reused correctly, with transaction clients released and no controller shutdown of the pool?
- [ ] Are queries bounded and appropriate, with no avoidable N+1 or unmeasured infrastructure additions?
- [ ] Are core negative/security/database/concurrency tests meaningful and passing where implemented?
- [ ] Are local configuration, deployed state, and future proposals clearly distinguished?
- [ ] Are secrets absent from staged files/history review and remote security settings described only when verified?
- [ ] Does the master spec cite current files and mark all planned files as planned?
- [ ] Are conflicts documented in the four-field format instead of silently treating either code or spec as infallible?
- [ ] Can the developer explain the behavior and tradeoffs without relying on unexplained AI-generated abstractions?

## 30. Current implementation conflicts and recommended resolutions

[PARTIALLY IMPLEMENTED] This register distinguishes actual mismatches, missing target work, and unverified facts. C-02 environment placeholders, C-11 OS ignore rules, and C-12 Compose syntax are updated from the inspected repository; those configuration files were not modified by this task.

### C-01 — Package entry points disagree

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] `package.json:5` says `main: "index.js"`; no such file exists. Start/dev scripts correctly run `src/server.js`.

**INTENDED IMPLEMENTATION:** [PLANNED V1] `src/server.js` is the application bootstrap; package metadata should accurately describe the app.

**CONFLICT:** [TBD] Stale package metadata can mislead tooling/developers, although it does not prevent the existing npm start/dev commands from selecting the correct entry.

**RECOMMENDED RESOLUTION:** [TBD] In an authorized configuration task, align or remove the unused `main` field appropriately for an application package. Do not create a redundant `index.js` simply to satisfy stale metadata.

### C-02 — Environment example populated; startup validation pending

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] `.env.example` contains PORT, DATABASE_URL, and POSTGRES_PASSWORD placeholders. Compose reads POSTGRES_PASSWORD from the environment.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Reproducible setup with safe variable documentation and clear configuration failures.

**CONFLICT:** [IMPLEMENTED] The empty-example issue is resolved. [PARTIALLY IMPLEMENTED] Required-variable validation is still absent.

**RECOMMENDED RESOLUTION:** [PLANNED V1] Address required configuration validation in a separately authorized task. No environment file was modified or private `.env` read during this maintenance.

### C-03 — SQL migration file is not an applied/tracked schema

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Users SQL exists and matches the requested schema; no runner/ledger/automatic apply path exists. [TBD] Live database inspection was unavailable.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Reproducible raw-SQL migration history with verified applied state during setup/deployment.

**CONFLICT:** [PARTIALLY IMPLEMENTED] “Users migration exists,” “users table exists,” and “migration applied in this environment” cannot be treated as interchangeable.

**RECOMMENDED RESOLUTION:** [TBD] Select a small ordered apply/tracking process, inspect live schema with safe catalog commands, and record evidence. Preserve raw SQL; no ORM is needed to resolve this.

### C-04 — Connectivity probe versus full readiness

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Startup and health both query `SELECT 1`; startup exits on query rejection. No schema check, required-variable validation, listener-error handling, or shutdown policy exists.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Preserve the table-independent connectivity check and provide reliable setup/deployment diagnostics and safe operation.

**CONFLICT:** [PARTIALLY IMPLEMENTED] Probe success is narrower than “application ready for V1” or “correct schema applied.” The initial DB gate also does not handle every later network/listener error.

**RECOMMENDED RESOLUTION:** [PLANNED V1] Keep health's purpose clear; verify schema/migration state separately and add only the operational handling selected for V1. Do not silently redefine the current health response.

### C-05 — Finance/domain business architecture is entirely pending

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Seven backend source files and one users migration; registration exists, but domains, advisors, bookings, community, reviews, frontend, login, and JWT do not.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Complete Finance journey with generic entities, security, tests, and deployment.

**CONFLICT:** [PARTIALLY IMPLEMENTED] Product vision and package version `1.0.0` can be mistaken for delivered functionality. Registration is the only implemented business API; complete Finance journeys remain planned.

**RECOMMENDED RESOLUTION:** [PLANNED V1] Follow dependencies/roadmap, preserve labels, and change status only after code plus appropriate tests/integration evidence exist.

### C-06 — README and verification suite are absent

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] No README, test directories/scripts/dependencies, CI, or deployment files beyond local DB Compose. Only syntax checks were performed during this audit.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Onboarding README, critical tests, reviewed security, and deployed/integrated frontend/backend.

**CONFLICT:** [PARTIALLY IMPLEMENTED] The master spec cannot substitute for those deliverables; syntax checks cannot prove application correctness.

**RECOMMENDED RESOLUTION:** [PLANNED V1] Implement tests alongside features and write a concise README using verified setup. Complete actual deployment evidence before V1 completion.

### C-07 — Local database credentials versus production security

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Compose uses `${POSTGRES_PASSWORD}` and local `postgres` role, with a valid loopback ports mapping. Configuration validation passes (C-12 resolved). Actual `.env` was not read.

**INTENDED IMPLEMENTATION:** [PLANNED V1] These credentials are local-only; production uses separate secure environment credentials and restricted database access.

**CONFLICT:** [TBD] No current production configuration is present. The risk is copying local configuration into production, not evidence that production secrets were exposed in this audit.

**RECOMMENDED RESOLUTION:** [PLANNED V1] Select production secret/TLS/role/connectivity settings before deployment; never repeat private values in this reference.

### C-08 — Helpful interaction is V1 but table is described as future

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Neither interaction nor persistence exists.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Community helpful/upvote behavior appears in V1 and day 11; the brief also lists `helpful_votes` among potential future entities.

**CONFLICT:** [TBD] V1 needs a persistence/integrity design, but the exact table/target/version wording is not settled.

**RECOMMENDED RESOLUTION:** [TBD] Keep the V1 behavior requirement and decide its schema explicitly. Proposed baseline: one reversible post vote per user with a unique association; reserve reputation scoring for V2. Do not silently defer helpfulness or mark the proposed table accepted.

### C-09 — Role schema exists, role provisioning and combined abilities do not

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] `users.role` stores one of USER/ADVISOR/ADMIN. Public registration creates USER using the database default and ignores supplied role fields. Role middleware, advisor/admin provisioning, and profile workflows remain absent.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Advisors are users with ADVISOR role plus profiles; public registration must remain safe; V2 contains stronger verification/admin tools.

**CONFLICT:** [TBD] How V1 advisors become ADVISOR and whether an advisor can also book as a customer are unspecified; a single role label does not answer those workflow questions.

**RECOMMENDED RESOLUTION:** [TBD] Choose minimal trusted provisioning and an explicit role-operation matrix before profile/booking APIs. Do not allow self-elevation or invent a multi-role identity system without a decision.

### C-10 — Drizzle history is owner-provided, current absence is verified

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] Current manifest/lockfile contain no ORM. `pg` is used directly.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Owner explicitly chose raw SQL after briefly trying/removing Drizzle during development.

**CONFLICT:** [TBD] The intermediate install/removal is not visible in the inspected committed history. This is an evidence distinction, not disagreement with the owner's account.

**RECOMMENDED RESOLUTION:** [IMPLEMENTED] Record both sources accurately; do not claim a removal commit exists or treat absent ORM metadata as permission to reintroduce one.

### C-11 — OS artifact ignore resolved; runtime reproducibility pending

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] `.gitignore` includes `.DS_Store`; ignore checks succeed and no matching file is tracked. Node/npm remain unpinned in project metadata.

**INTENDED IMPLEMENTATION:** [PLANNED V1] Clean meaningful commits and reproducible onboarding/deployment.

**CONFLICT:** [IMPLEMENTED] The `.DS_Store` issue is resolved. [PARTIALLY IMPLEMENTED] Runtime guidance/pinning is still pending.

**RECOMMENDED RESOLUTION:** [TBD] Decide runtime guidance in an authorized task. Continue reviewing explicit staging; no ignore rules or OS artifacts were modified here.

### C-12 — Compose ports syntax resolved

**CURRENT IMPLEMENTATION:** [IMPLEMENTED] The inspected file has a space after the list dash:

```yaml
    ports:
     - "127.0.0.1:5433:5432"
```

**INTENDED IMPLEMENTATION:** [IMPLEMENTED] PostgreSQL remains published on host IPv4 loopback port 5433 to container port 5432, with the existing named volume.

**CONFLICT:** [IMPLEMENTED] Resolved. `docker compose config --no-interpolate --quiet` passes against the current repository. This is configuration validation only; live services, volume contents, and schema remain [TBD].

**RECOMMENDED RESOLUTION:** No configuration correction is needed for the previous syntax finding. This maintenance task leaves Compose and Docker runtime state unchanged.

## 31. CURRENT STATE → V1 TARGET GAP ANALYSIS

[PARTIALLY IMPLEMENTED] Priorities describe dependency/launch importance, not authorization to implement during this audit. P0 = prerequisite or critical security/integrity; P1 = core product completion; P2 = final integration/operational polish, which may still be required for release.

| System | Current state | V1 target state | Missing work | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| Foundation | [IMPLEMENTED] Express/app/server/router/controller, dotenv, health, start/dev | [PLANNED V1] Reliable, understandable modular backend | Required environment validation, metadata correction, selected operational error/shutdown handling | Configuration decisions | P0 |
| Database | [PARTIALLY IMPLEMENTED] Pool/users SQL and validated Compose configuration; no verified live schema | [PLANNED V1] Reproducible generic relational schema and constraints | Apply/tracking process, live verification, future business migrations/indexes | Raw SQL decisions, per-entity schema approval | P0 |
| Authentication | [PARTIALLY IMPLEMENTED] Registration, normalization, bcrypt cost 12, validation, safe response, duplicate handling | [PLANNED V1] Safe registration/login/JWT/current user | Day 4 login/bcrypt.compare/JWT; authentication middleware/current user; tests and runtime verification | Users schema, env/secrets, token decisions | P0 |
| Authorization | [PLANNED V1] Role CHECK only; no request checks | [PLANNED V1] Auth middleware, RBAC, ownership/assignment | Middleware, role freshness/provisioning rules, scoped queries, negative tests | Authentication, relationship design | P0 |
| Advisors | [PLANNED V1] Absent | [PLANNED V1] Finance profiles/discovery/detail/basic filters | Domain seed, profile schema/APIs, safe projections, query/paging tests | Users/domains/auth/provisioning | P1 |
| Appointments | [PLANNED V1] Absent | [PLANNED V1] Booking/tracking/cancellation/assigned-advisor lifecycle | Schema/time rules, transition matrix, ownership, atomic changes, delivery/conflict decisions | Advisors/auth, scheduling decisions | P0 integrity / P1 feature |
| Community | [PLANNED V1] Absent | [PLANNED V1] Finance posts/comments/helpfulness | Schemas/APIs/content validation, helpful persistence/uniqueness, paging | Users/domains/auth, helpful scope decision | P1 |
| Reviews | [PLANNED V1] Absent | [PLANNED V1] Eligible completed-consultation reviews and ratings | Schema/uniqueness/range, ownership/eligibility, list/aggregate queries/tests | Completed appointment lifecycle | P0 integrity / P1 feature |
| Frontend | [PLANNED V1] Absent | [PLANNED V1] React/Vite Finance journey and minimal dashboards | Frontend setup/pages/API client/auth UI/loading/error/time display | Stable APIs, auth transport/CORS | P1 |
| Testing | [PLANNED V1] No suite; audit syntax checks only | [PLANNED V1] Critical automated and manual acceptance evidence | Select tools; unit/integration/DB/security/frontend/E2E tests and fixtures | Implement incrementally with each feature; isolated test DB | P0 |
| Security | [PARTIALLY IMPLEMENTED] Ignore rules, validated DB loopback mapping, safe health/registration errors, registration validation/hash/parameters/USER-only output, malformed-JSON 400 | [PLANNED V1] Enforced invariants and safe public deployment | Auth/ownership, broader safe errors, secret review, selected abuse/CORS/TLS policies | Protected features and deployment topology | P0 |
| Deployment | [PLANNED V1] Local DB config only | [PLANNED V1] Hosted frontend/backend/managed DB, verified setup | Provider/runtime/secrets decisions, migration apply, HTTPS, smoke tests/recovery | Integrated tested app | P1 release gate |
| Documentation | [PARTIALLY IMPLEMENTED] This master spec; README absent | [PLANNED V1] Accurate spec, concise setup README, explainable architecture | README, decision closure, actual test/deployment evidence, re-audits | Every implementation milestone | P2 ongoing / release gate |

### 31.1 Completion estimate and reasoning

[PARTIALLY IMPLEMENTED] **Estimated V1 progress: about 18%, with a reasonable planning range of 15–20%.** This is a subjective scope-weighted engineering estimate, not measured hours, test coverage, route-count completion, or a guarantee about work remaining. Product journeys implemented end-to-end: **zero confirmed**.

| V1 work group | Estimated share of full V1 | Approximate completion within group | Contribution |
| --- | --- | --- | --- |
| Backend/database foundation | 15% | 70%: code/users SQL/validated config and env placeholders; reproducibility/live verification/hardening incomplete | 10.5 percentage points |
| Authentication/authorization | 15% | 40%: registration implemented; login/JWT/middleware/ownership and tests pending | 6 percentage points |
| Advisor system/discovery | 10% | 0% | 0 |
| Appointments | 15% | 0% | 0 |
| Community/comments/helpfulness | 10% | 0% | 0 |
| Reviews | 5% | 0% | 0 |
| Frontend integration | 10% | 0% | 0 |
| Maintained tests/security hardening | 10% | 0% beyond foundation practices counted above | 0 |
| Deployment | 5% | 0% | 0 |
| Documentation/explainability | 5% | 30%: master reference exists, README/final evidence/understanding checks pending | 1.5 percentage points |
| Total | 100% | Approximate weighted estimate | **18%** |

[PARTIALLY IMPLEMENTED] Days 1–3 have repository artifacts, but roadmap day counts are not an effort model. Most remaining risk lies in authentication, ownership, relational business workflows, integration, and deployment. New document length does not materially substitute for implemented product scope. Re-estimate after meaningful tested milestones, keeping the weighting rationale visible.

[PARTIALLY IMPLEMENTED] The estimate now includes implemented registration and accepted Day 3 policies. Resolved Compose syntax is recorded separately; no live or automated verification is implied by this subjective estimate.

## 32. ARCHITECTURE DECISION LOG

[PARTIALLY IMPLEMENTED] “Accepted” means selected by the owner's brief or directly established as the current architecture, not fully implemented in every subsystem. Implementation status remains separate. Alternatives below are non-selected comparisons; unless stated otherwise, this audit does not claim a historical evaluation of them took place. Pending API/schema proposals are intentionally excluded from accepted decisions.

[IMPLEMENTED] ADR-002/ADR-013 match the current validated Docker configuration. C-12 is resolved; live infrastructure remains [TBD].

| ADR | Decision | Reason | Alternatives / tradeoffs | Decision and implementation status | Evidence |
| --- | --- | --- | --- | --- | --- |
| ADR-001 — PostgreSQL selected | Use PostgreSQL as relational system of record | Users/advisors/bookings/posts/comments/reviews have strong relationships and integrity needs; SQL supports learning/interviews | MongoDB is a conceptual alternative, not selected; relational design requires deliberate schema/migrations | Accepted; [IMPLEMENTED] local configuration/users SQL, broader schema [PLANNED V1] | Owner brief; `docker-compose.yml`; users migration; `pg` dependency |
| ADR-002 — Dockerized local PostgreSQL | Run local PostgreSQL through Docker Compose using configured image | Isolation, repeatability, controlled version, simpler setup/reset, professional workflow practice | Native macOS PostgreSQL would work; hosted DB initially would reduce local infrastructure learning; Docker daemon adds a local prerequisite | Accepted; [IMPLEMENTED] configuration, live runtime [TBD] | `docker-compose.yml`, owner rationale |
| ADR-003 — Raw SQL + pg instead of Drizzle | Use shared `pg` pool and parameterized PostgreSQL SQL; no ORM without explicit change | SQL familiarity, query visibility, direct DB control, no second abstraction, DBMS interview preparation | Drizzle was briefly tried/removed per owner; Prisma/Sequelize/TypeORM not chosen; ORM convenience/type/schema/migration support is a tradeoff | Accepted; [IMPLEMENTED] `pg`/pool/SQL and parameterized registration; other business queries [PLANNED V1] | `package.json`, lockfile, `src/config/db.js`, migrations; intermediate Drizzle history owner-provided |
| ADR-004 — Finance-first generic architecture | Deliver Finance end-to-end in V1 with generic users/domains/profiles/appointments/community | Manage scope while retaining multi-domain extension without duplicate architectures | Separate per-domain apps/tables are explicitly rejected; launching every domain immediately expands correctness/security workload | Accepted; [PLANNED V1] business implementation | Owner product/version requirements |
| ADR-005 — UUID identifiers | Prefer PostgreSQL-generated UUID primary keys | Consistent opaque identity across generic entities; controller avoids manual ID generation | Sequential integers are a conceptual alternative; UUID storage/index cost and random ordering are tradeoffs; UUID is not access control | Accepted; [IMPLEMENTED] users migration, future entities [PLANNED V1] | `001_create_users.sql` and owner identifier requirement |
| ADR-006 — JWT authentication for V1 | Use custom backend login and JWT verification | Chosen API authentication direction with middleware-populated identity | Session-based alternatives not selected; transport/expiry/revocation still need design; Supabase Auth is not chosen | Accepted mechanism; [PLANNED V1], details [TBD] | Owner auth requirements; no current JWT implementation |
| ADR-007 — Node/Express/CommonJS backend | Keep backend JavaScript with Express and CommonJS modules | Small explicit HTTP backend fitting current skills and repository | Other runtimes/frameworks/TypeScript/ESM conversion are not selected; async I/O does not remove CPU/memory limits | Accepted; [IMPLEMENTED] foundation | `package.json`, all existing `src/` files |
| ADR-008 — SQL migrations as schema history | Store ordered structural changes under `database/migrations/` | Reproducibility, onboarding, debugging, deployment, auditability | Unrecorded manual SQL is rejected as long-term approach; runner/ledger design remains pending | Accepted direction; [PARTIALLY IMPLEMENTED] first migration | Existing migration and owner requirements |
| ADR-009 — app/server and routes/controllers separation | Separate HTTP app composition from startup; route mapping from request/application logic | Clear responsibilities, easier explanation and future testing without automatic listener startup | One large entry file or unnecessary layers not preferred; services only when complexity warrants | Accepted; [IMPLEMENTED] foundation separation | `src/app.js`, `src/server.js`, routes/controller files |
| ADR-010 — DB check before listen | Query `SELECT 1`, then start HTTP only after connectivity succeeds; exit on startup DB query failure | Avoid presenting a DB-dependent server as started when initial DB communication fails; no table dependency for probe | Listen regardless of DB state is contrary to intended startup; comprehensive readiness remains additional work | Accepted; [IMPLEMENTED] | `src/server.js:8–20`; health controller uses same probe |
| ADR-011 — React/Vite JavaScript frontend | Build a basic REST-consuming React frontend using Vite | Selected frontend direction for V1 integration | No styling/routing/state package selected; frontend never gets direct PostgreSQL access | Accepted stack direction; [PLANNED V1] | Owner brief; current frontend absent |
| ADR-012 — Modular monolith and minimal abstraction | Grow one modular Express service; add layers/services only when real complexity requires | Correctness, learning, maintainability, and explainability over infrastructure/abstraction count | Premature microservices/Kubernetes/Redis/search clusters explicitly outside V1 | Accepted; [IMPLEMENTED] small foundation; growth [PLANNED V1] | Owner architecture principles, current tree |
| ADR-013 — Separate local HTTP and DB communication | Backend defaults to 8000; host DB publication 127.0.0.1:5433 to container PostgreSQL 5432 | Explicit service boundaries and loopback-restricted local DB access | Native default host 5432 or containerized backend networking would be different configurations; no HTTP-to-DB redirect | Accepted current configuration; [IMPLEMENTED], actual runtime values [TBD] | `src/server.js:6`, `docker-compose.yml:6–7` |
| ADR-014 — Backend and DB enforce security/integrity | Use backend validation/auth/roles/ownership plus DB constraints; frontend never trusted | APIs are directly callable; concurrent requests can bypass frontend/precheck assumptions | Client-only validation/permission checks are explicitly rejected | Accepted requirement; [PARTIALLY IMPLEMENTED] users constraints and registration validation/hash/parameters/safe output | Users migration, auth controller, app; protected middleware/business flows remain planned |

[IMPLEMENTED] Accepted Day 3 decisions, confirmed by the owner and current registration code:

| Decision | Accepted choice | Implementation evidence / boundary |
| --- | --- | --- |
| D-05 — Password package and cost | bcrypt; cost factor 12 | Installed dependency and asynchronous bcrypt.hash(password, 12) |
| D-06 — Password limits | Minimum 12 characters; maximum 72 UTF-8 bytes; reject excess | password.length and Buffer.byteLength checks; no password normalization |
| D-07 — Email normalization | Trim surrounding whitespace and lowercase | Preserve Gmail dots and +tags; no provider-specific rewriting; UNIQUE protects stored values |
| D-08 — Validation style | Explicit manual backend validation for current V1; no library selected | Registration checks in controller; current errors use message only; broader error schema remains TBD |
| Registration behavior | Create USER only; no JWT or automatic login | INSERT omits role; safe message/user response; login remains planned for Day 4 |

[PLANNED V1] To change an accepted decision: identify the problem and affected files/contracts, document current versus intended behavior, review alternatives/tradeoffs, record the intentional decision, then update implementation/migrations/tests/spec together in an authorized task. An AI suggestion is not an accepted ADR. Do not backdate or invent approvals/history.

## 33. TBD DECISIONS

[TBD] **Every open row below is TBD — DECISION REQUIRED.** D-05–D-08 are accepted and recorded in section 32; they are no longer open decisions. The broader shared API error schema remains TBD in section 17. Recommended defaults are proposals, not selected technologies, finalized schemas, approved features, or permission to implement. Resolve only the decisions needed for the active version/milestone; deferred topics do not block foundation work. The project owner decides intentional architecture changes; the implementing developer records concrete evidence and consequences.

| ID / decision | Why it matters | Recommended default for review, not accepted | When decision is needed |
| --- | --- | --- | --- |
| D-01 — JWT transport and client storage | XSS/CSRF exposure, persistence, browser/API integration | Evaluate secure HttpOnly cookie with explicit CSRF policy against an in-memory bearer-token design; avoid silently persisting tokens in localStorage | Before day 4 auth contract; final topology before frontend integration |
| D-02 — JWT package, algorithm, claims, expiry | Verification correctness and compatibility | Select a maintained compatible package; restrict algorithms; minimal identity claims and finite expiry; validate issuer/audience as selected | Before login/JWT implementation |
| D-03 — Refresh tokens, logout, revocation, role freshness | Stolen/copied JWTs and role/deletion changes outlive client UI state | Start with the smallest explicit lifetime/reauthentication model that meets V1; do not add refresh storage without a selected need; define role-change behavior | Before auth is declared complete/publicly deployed |
| D-04 — JWT signing material and rotation | Token integrity depends on private key/secret handling | Secure backend environment secret/key, explicit rotation plan; exact variable/key management approach pending | Before JWT implementation/deployment |
| D-09 — Migration apply/tracking process | Reproducibility, repeated deploys, failure recovery | Small ordered raw-SQL process with recorded applied versions and documented failure behavior; no ORM | Before applying additional shared migrations/deployment |
| D-10 — Advisor profile cardinality | Determines uniqueness, self-profile APIs, future multi-domain participation | One profile per user for minimal V1; compare per-user/domain or join-table design before V2; keep one auth identity | Before advisor migration/API approval |
| D-11 — Advisor/admin provisioning and customer abilities | Need Finance advisors without public role escalation; single role affects who can book | Controlled trusted provisioning; explicitly decide whether ADVISOR can also perform customer actions | Before day 6 profile system and day 9 booking |
| D-12 — Advisor profile fields, fee/currency | Prevents arbitrary lengths, floating-point money errors, false payment assumptions | Small approved field set; nonnegative experience; exact fee representation and explicit currency if fee retained | Before profile schema/contracts |
| D-13 — Advisor verification workflow/status | Sensitive evidence, trust indicators, admin scope | Keep full verification V2; no fabricated verified status in V1; decide trusted V1 onboarding separately | Before V2 verification features or any public verification claim |
| D-14 — Domain schema and seed lifecycle | Finance-only launch with generic future categories | Stable unique code plus chosen label if needed; controlled FINANCE seed represented in reproducible workflow | Before advisor/community migrations |
| D-15 — Advisor FK and appointment domain reference | Ownership joins and historical consistency | Appointments reference profile ID; derive domain unless snapshot requirements justify stored domain with consistency enforcement | Before appointment schema |
| D-16 — Appointment duration/end time and booking window | Determines actual overlap and completion timing rules | Select one simple explicit V1 duration/window compatible with real consultation practice; do not guess minutes | Before appointment migration/API behavior |
| D-17 — Availability and double-booking policy | Frontend checks do not guarantee exclusive bookings | Explicit minimal V1 conflict rule; fuller availability/time-slot locking in V2; enforce any advertised guarantee server/DB-side | Before real V1 bookings; advanced model before V2 |
| D-18 — Cancellation and transition matrix | Determines legal operations, customer/advisor permissions, racing updates | Review section 15 baseline; owning customer cancels eligible nonterminal states; assigned advisor confirms/completes; decide cutoff/retries/advisor cancellation | Before appointment APIs/tests |
| D-19 — Consultation delivery and notes | Booking alone does not explain where consultation happens; notes may be private | Document a minimal delivery arrangement explicitly without building deferred call infrastructure; omit notes until audience/storage rules are clear | Before end-to-end booking UX and launch |
| D-20 — Date/time serialization and timezone policy | Prevents ambiguous appointment instants | Offset-bearing input, TIMESTAMPTZ storage, canonical API output, local display; separate named zone only if scheduling needs it | Before appointment schema/frontend |
| D-21 — Deletion/retention/anonymization | Users/advisors/posts/reviews/history are linked | Decide per entity; preserve consultation/review history pending explicit retention decision; no blanket cascades/soft-delete fields | Before deletion behavior or shared FK design/launch review |
| D-22 — Pagination and sorting | API/UI stability, memory/DB load | Start with limit/offset, proposed default 20/max 100, stable sort plus ID tie-breaker; cursor only if justified | Before list API contracts |
| D-23 — Search fields and index choices | Query behavior and performance depend on real scope | Bounded basic SQL filters in V1; advanced PostgreSQL search/index alternatives only after measurement | Before discovery/community list implementation; deeper search V2 |
| D-24 — Helpful target, persistence, self-votes, reversibility | V1 needs integrity and a clear interaction contract | One reversible post vote per authenticated user/post with uniqueness and derived counts; self-vote default proposed deny | Before day 11 migration/API/UI |
| D-25 — Community content and mutation scope | Input safety, discussion integrity, moderation workload | Plain text with explicit lengths; create/read/comments/helpful first; edit/delete/moderation only when scoped | Before community schema/API contracts |
| D-26 — Review schema, rating, text, aggregate shape | Completed-consultation integrity, no duplicate reviews, predictable ratings | One review per appointment; integer 1–5 proposal; derive advisor/customer where practical; null average/count 0 with no reviews | Before day 12 reviews |
| D-27 — Public reads, role matrix, 403 versus concealed 404 | Consistent privacy/access behavior | Public-safe advisor/community/review reads; private appointment access; explicit role scopes; select one concealment approach | Before authorization/API contract approval |
| D-28 — Email verification | Account trust and scope | Explicitly decide launch need; no email service/provider/verification API assumed | Before public launch commitment; earlier if selected prerequisite |
| D-29 — Forgot-password/recovery flow | Account recovery needs identity proof and token handling | Decide whether required for launch; if selected, separately design expiry/single-use recovery and delivery rather than improvise | Before public launch scope is finalized |
| D-30 — Rate limiting/abuse controls | Public auth and posting can consume resources or be abused | Evaluate bounded limits on authentication and relevant writes; thresholds/storage/library selected from deployment needs | Before public deployment |
| D-31 — CORS and cookie/CSRF configuration | Browser deployment origins affect authentication and requests | Explicit allowed frontend origins; credential/CSRF choices consistent with D-01; no blanket credentialed wildcard | Before frontend integration/deployment |
| D-32 — Frontend layout/libraries/host | Current frontend is absent; avoid invented design requirements | React/Vite/JavaScript, centralized API calls, minimal state; choose routing/styling and host only when needed | Before day 13 integration/deployment |
| D-33 — Backend host and runtime pin | Repeatable builds, port model, process lifecycle | Choose supported Node/Express hosting compatible with pg and selected secrets/TLS; pin tested Node/npm guidance | Before shared onboarding/deployment |
| D-34 — Managed PostgreSQL provider | TLS, connectivity, backups, migration permissions, cost | Choose hosted PostgreSQL on requirements; Supabase is an option as DB hosting only, not an auth replacement | Before production deployment |
| D-35 — DB pool/TLS/timeouts/shutdown/listener errors | Avoid exhausted connections, hangs, unsafe production connectivity | Bounded per-process pool and timeouts sized to provider; clean shutdown; explicit server/pool error policy | Before backend operational readiness |
| D-36 — Test tooling/fixtures/CI | Need repeatable proof without relying only on manual calls | Choose minimal suitable test tools; isolated PostgreSQL test DB; prioritize real auth/constraint/ownership integration cases | At first business implementation, not only day 14 |
| D-37 — Logging/monitoring/recovery operations | Operators need safe failure diagnosis and recovery | Safe structured context/request IDs if needed; select monitoring/backup/restore responsibility for chosen hosting | Before public deployment |
| D-38 — Minimal dashboard and admin boundaries | Potential dashboard features should not create broad unrequested CRUD | Compose existing core resource views; limit V1 admin to specifically required operations/provisioning | Before profile/frontend integration; stronger admin V2 |
| D-39 — Payment system | Fee display is not billing; payments expand scope | Defer payment processing; provider/currency/refunds/settlement only after explicit product decision | After separate scope approval; no V1 payment implementation assumed |
| D-40 — Video/voice/chat provider and real-time transport | Delivery infrastructure, privacy, cost, availability | Defer in-app real-time features; no provider/WebSocket stack selected | Later explicit version approval |
| D-41 — GitHub protections and repository hygiene | Collaboration/security settings are not visible from local code | Review available scanning/alerts/protections and staged artifacts; select runtime/ignore/ruleset changes explicitly | Before public collaboration/deployment as appropriate |
| D-42 — AI/ML feature, provider, data use, and evaluation | Sensitive-domain assistance must have a defined purpose and quality/privacy controls | Choose one justified V3 assistance use case only after V1/V2 data and product needs are understood; no professional replacement claims | Before any V3 implementation |

[TBD] Resolve decisions in their dependency order. For example, rating limits can be decided before review schema, but payment/video providers need not be selected to implement registration. Record the chosen decision, rationale, affected contracts/migrations/tests, and implementation status when a row closes; never silently turn the recommended-default column into an accepted decision.

## 34. INTERVIEW PREPARATION

[PARTIALLY IMPLEMENTED] These answers distinguish architecture understanding from implementation claims. Say “we plan” for unbuilt features and “the repository contains” for inspected code. Technical explanations describe why the chosen architecture is suitable; they do not imply undocumented historical benchmarks or production experience.

[IMPLEMENTED] Docker/network answers describe the current validated configuration; C-12 is resolved. Live services and applied schema remain unverified.

### 34.1 Runtime, architecture, and networking

| Question | Concise answer | Status / project anchor |
| --- | --- | --- |
| What is Consultify? | A planned hybrid platform combining professional consultation, community advice, and consultation tracking. V1 delivers Finance through generic entities, with Health/Astrology expansion later. | [PLANNED V1] Business journeys; current code includes foundation and registration |
| Why Node.js? | It provides the JavaScript server runtime and asynchronous I/O model suitable for an HTTP backend waiting on database/network requests. CPU-heavy work still requires attention. | [IMPLEMENTED] `package.json`/server |
| Why Express? | It provides a small HTTP routing/middleware layer, letting the project keep request flow explicit without a large application framework. | [IMPLEMENTED] `src/app.js`, health router |
| Why PostgreSQL? | The product has related identities, advisors, consultations, content, and reviews. SQL joins, transactions, and integrity constraints fit those relationships. | [IMPLEMENTED] configured DB/users SQL; business schema [PLANNED V1] |
| Why a relational database? | Relationships such as review→appointment→customer/advisor need consistent references and constraints. The model should prevent invalid data, not only store isolated documents. | [PLANNED V1] relational business design |
| Why Docker? | It isolates local PostgreSQL and makes version/setup/persistence explicit and reproducible across development machines. | [IMPLEMENTED] Compose configuration; runtime unverified |
| Why Docker Compose? | It records service image, ports, environment, and volume in YAML so developers can manage the declared local setup consistently. | [IMPLEMENTED] `docker-compose.yml` |
| Dockerfile versus Compose? | A Dockerfile builds an image; Compose declares how services run. This project references the prebuilt PostgreSQL image and has no backend Dockerfile. | [IMPLEMENTED] configuration evidence |
| Why not native PostgreSQL on macOS? | It would work, but local Docker was selected for isolation, controlled version, reproducibility, and learning the operational boundaries. | [IMPLEMENTED] chosen setup; owner rationale |
| Why not Supabase from day one? | The owner wants to understand PostgreSQL, ports, pg, SQL, env, Docker, and schema ownership locally first. Hosted PostgreSQL may be chosen at deployment. | [PLANNED V1] deployment; no Supabase architecture today |
| Is port 8000 redirected to port 5433? | No. Client→Express is HTTP. The controller asks pg to perform a separate PostgreSQL request through host 5433 to container 5432, then sends an HTTP response. | [IMPLEMENTED] source/configuration flow |
| What does 127.0.0.1:5433:5432 mean? | Bind the database publication to IPv4 loopback on the host at 5433 and forward that database traffic to PostgreSQL's container port 5432. Docker itself is not the database listener. | [IMPLEMENTED] Compose ports |
| Why app.js versus server.js? | app.js composes Express behavior and exports the app; server.js loads environment, checks DB, and listens. This keeps startup separate from request configuration and helps future testing. | [IMPLEMENTED] both files |
| Why routes/controllers? | Routes map method/path to handler. Controllers coordinate request validation/application work/queries/responses. This keeps URL wiring distinct from implementation logic. | [IMPLEMENTED] health; business [PLANNED V1] |
| Why no services layer yet? | Current code is tiny. Add a service only when real complexity or reuse warrants separating business operations; empty layers add indirection without solving a problem. | [IMPLEMENTED] current tree; [PLANNED V1] principle |
| Why not microservices? | V1 needs correct integrated workflows and understandable code. A modular monolith avoids distributed operational complexity while the product is small. | [PLANNED V1] accepted direction |
| Why generic domain architecture? | A user identity and booking workflow are reusable across Finance, Health, and Astrology. Domain relationships avoid duplicated security/business implementations. | [PLANNED V1] generic entities; Finance-only launch |

### 34.2 Database and SQL

| Question | Concise answer | Status / project anchor |
| --- | --- | --- |
| Why pg? | It is the selected Node PostgreSQL driver. It sends explicit SQL and provides the Pool used by the backend without an ORM query abstraction. | [IMPLEMENTED] dependency and `src/config/db.js` |
| Why raw SQL instead of ORM? | The owner is comfortable with SQL and prioritizes direct query control, first-principles learning, and DBMS interview understanding. ORM convenience is a known tradeoff, not a missing dependency. | [IMPLEMENTED] strategy and registration queries; other queries [PLANNED V1] |
| What is connection pooling? | Reusing a bounded set of DB connections across queries instead of creating a fresh connection for each request. Each server process owns its configured pool. | [IMPLEMENTED] shared pool |
| Why one shared pool? | It centralizes resource use and configuration. Many per-request/controller pools can create far more connections than intended. | [IMPLEMENTED] one exported module |
| Why not pool.end() in a controller? | It closes the shared pool, preventing later request use. Close it during intentional process/script shutdown, not after a normal query. | [PLANNED V1] invariant; no controller does this today |
| What does pool.query() return? | A promise resolving to a pg result with returned rows and command metadata. Current health ignores rows because success alone is enough for connectivity. | [IMPLEMENTED] current call sites |
| What is result.rows[0].name? | `rows` is the result array, index zero is the first row, and `name` is a selected column. Check for an empty array before dereferencing. | [IMPLEMENTED] registration uses result.rows[0] |
| What is a migration? | A versioned schema change saved as SQL so environments can reproduce structure and reviewers can understand its history. The first file exists; an apply/track system does not. | [PARTIALLY IMPLEMENTED] migrations directory |
| Does starting Compose apply users SQL? | No. Current Compose does not mount migration SQL or invoke a runner. A versioned file and an applied table are separate evidence. | [IMPLEMENTED] config; live schema [TBD] |
| What is a UUID? | A 128-bit identifier. The users migration asks PostgreSQL for a random UUID by default. It is an identifier, not a password or authorization check. | [IMPLEMENTED] users migration |
| PRIMARY KEY versus FOREIGN KEY? | A primary key identifies a row uniquely and non-null. A foreign key ties a reference to an existing row in another/its own table. Only the users primary key is defined currently. | [IMPLEMENTED] PK; FKs [PLANNED V1] |
| What does DEFAULT gen_random_uuid() do? | PostgreSQL supplies an ID when INSERT omits the column or requests DEFAULT. It does not override an explicitly supplied null. | [IMPLEMENTED] users SQL |
| What is SQL injection? | Untrusted input changes SQL syntax when code mixes data directly into a query string. It can change what the database executes. | [PLANNED V1] prevention invariant |
| Why parameterized queries? | They pass values separately from the SQL structure. `$1` corresponds to the first supplied value; this avoids interpreting that value as query syntax. Identifier/sort fragments still need allowlists. | [IMPLEMENTED] registration; [PLANNED V1] all future user-value queries |
| Why DB constraints if backend validates? | Clients can call APIs directly, code can contain mistakes, and concurrent requests can pass the same preliminary check. Constraints are the final data-integrity boundary. | [IMPLEMENTED] users constraints; broader [PLANNED V1] |
| Why SELECT 1? | It checks whether a database query can execute without depending on a business table. It cannot prove migrations or business permissions are correct. | [IMPLEMENTED] server/health |
| Why check DB before HTTP startup? | The intended server depends on PostgreSQL, so startup fails explicitly if the initial query fails rather than logging successful HTTP startup first. | [IMPLEMENTED] `src/server.js` |
| How should transactions use pg? | Use one acquired client for BEGIN, statements, COMMIT/ROLLBACK, and release. A transaction cannot be spread across unrelated pool.query calls that may select different clients. | [PLANNED V1] complex writes |
| Why can a duplicate email check race? | Two requests may both read no user before either inserts. Keep the DB UNIQUE constraint and handle the resulting duplicate violation as a controlled conflict. | [IMPLEMENTED] UNIQUE schema plus registration 23505 → 409 |
| Why use indexes? | Appropriate indexes reduce work for filtered/joined/ordered reads, at a storage/write cost. Users PK/email uniqueness imply indexes; other indexes must follow actual queries. | [PARTIALLY IMPLEMENTED] users migration only |
| Why TIMESTAMPTZ? | Appointments should represent unambiguous instants and display in local time. The database type does not preserve a named timezone; recurring schedules may need additional zone information later. | [IMPLEMENTED] users timestamp; appointment policy [TBD] |

### 34.3 Authentication, product integrity, testing, and delivery

| Question | Concise answer | Status / project anchor |
| --- | --- | --- |
| What is bcrypt? | Password hashing with salts and configurable computational cost. Consultify uses installed bcrypt 6.0.0 and asynchronous hashing at cost 12. | [IMPLEMENTED] registration; D-05 |
| Hashing versus encryption? | Encryption is reversible with a key. Password hashing is used for one-way verification; login compares against the hash instead of decrypting stored passwords. | [PLANNED V1] security direction |
| What is a salt? | Per-password randomness incorporated in hashing so identical passwords can yield different hashes and precomputed guesses are less reusable. | [IMPLEMENTED] bcrypt registration hashing |
| Why deliberately expensive hashing? | It raises the computational cost of password guessing. Cost must also fit the application's legitimate login workload. | [IMPLEMENTED] cost 12 selected; deployment benchmarking [PLANNED V1] |
| How can bcrypt.compare work without decrypting? | The stored representation includes parameters needed to hash the candidate and verify a match; it does not contain recoverable plaintext. | [PLANNED V1] login |
| Authentication versus authorization? | Authentication establishes identity. Authorization checks whether that identity may perform the specific action on the specific resource. | [PLANNED V1] middleware absent |
| What is JWT? | A token format for claims; the planned signed token carries identity with verifiable integrity and expiry. The payload is readable, so it must not contain passwords, hashes, or secrets. | [PLANNED V1] no implementation |
| 401 versus 403? | 401 means valid authentication is missing. 403 means the authenticated caller is forbidden by role/relationship/policy. | [PLANNED V1] intended semantics |
| What is RBAC? | Role-based access control restricts operations to allowed roles such as ADVISOR/ADMIN. It does not automatically restrict which user's record a caller may access. | [PLANNED V1] role middleware |
| How does authorize('ADMIN') work conceptually? | It is a higher-order function returning middleware. A closure retains allowed roles for that returned function to check after authentication. | [PLANNED V1] conceptual pattern only |
| What is ownership authorization? | Checking the caller's relationship to a resource, such as appointment.user_id matching the verified user ID or the assigned advisor profile belonging to the caller. | [PLANNED V1] required on private operations |
| Role versus domain? | USER/ADVISOR/ADMIN describes authorization identity. FINANCE/HEALTH/ASTROLOGY describes advisory category. They should not share a field or duplicate account architecture. | [IMPLEMENTED] role field; domain [PLANNED V1] |
| Why backend validation? | Browser checks can be bypassed. The backend must validate all request data before it influences SQL, ownership, or business state. | [IMPLEMENTED] manual registration validation; other business validation [PLANNED V1] |
| How do reviews avoid abuse? | Require the current customer to own a completed appointment, derive its advisor, validate rating, and prevent duplicate reviews with DB-backed integrity. None is implemented yet. | [PLANNED V1] |
| How do appointment transitions stay correct? | Define allowed source/target states and actors, then make writes conditional/transactional so concurrent operations cannot blindly overwrite newer state. | [PLANNED V1] / [TBD] final policy |
| Why can't the frontend prevent double booking? | Another client or simultaneous request can bypass or race the UI. Any exclusive-slot guarantee needs a defined schedule model plus backend/database enforcement. | [TBD] minimal V1; availability [PLANNED V2] |
| What persists when a Docker container is removed? | Declared named-volume data can survive ordinary Compose down/recreation. Removing volumes with down -v destroys that persistence and can delete local database data. | [IMPLEMENTED] volume declaration; live data unverified |
| Do passing syntax checks prove the app works? | No. They catch parsing errors but not database connectivity, schema, routing correctness, security, or complete user journeys. | [IMPLEMENTED] syntax checks only during audit |
| Why integration/database tests? | They verify middleware-to-controller-to-SQL behavior and actual constraints. Mocked unit tests cannot establish PostgreSQL uniqueness or real concurrent-write behavior. | [PLANNED V1] suite absent |
| What does V1 done mean? | The integrated Finance journeys, security/ownership, constraints, critical tests, frontend, deployment, and current documentation all work. Route existence alone is insufficient. | [PLANNED V1] section 35 |
| What is implemented right now? | Backend/DB foundation, validated local Compose, users migration, registration with manual validation/bcrypt/parameterized SQL/safe USER-only response/duplicate handling, malformed-JSON 400, environment placeholders, ignore rules, and this reference. Complete Finance journeys remain planned. | [IMPLEMENTED] evidence in section 4; live operation unverified |

## 35. VERSION 1 DEFINITION OF DONE

[PLANNED V1] V1 is not finished merely because endpoint files exist, the package says `1.0.0`, or a health check succeeds. Completion requires demonstrable behavior and evidence for every applicable gate below. This audit does not satisfy the V1 completion standard.

### Product and integration gates

- [ ] A Finance user can register, log in, discover an advisor, view a profile, book, see status, and cancel according to the approved policy.
- [ ] An authorized advisor can manage their permitted profile fields, see assigned appointments, and perform only approved lifecycle transitions.
- [ ] The consultation delivery arrangement and scheduling/cancellation rules are explicit and accurately presented to users.
- [ ] A customer can review only their own completed consultation; duplicate reviews and invalid ratings are prevented.
- [ ] Users can create/list/view Finance posts, comment, and use the selected helpful interaction with consistent counts/integrity.
- [ ] Advisor/profile/domain/community architecture remains generic while V1 exposes only completed Finance workflows.
- [ ] The React/Vite frontend integrates the APIs and minimal approved dashboards, including loading/empty/error/unauthenticated states and correct time display.

### Data and security gates

- [ ] Registration/login hashing and selected JWT handling work, with no plaintext/hash leakage or client-controlled privilege assignment.
- [ ] Authentication, role checks, and ownership/assignment are enforced for every protected detail/list/mutation path.
- [ ] User A cannot read/change User B's private appointment; an unassigned advisor cannot access or transition it.
- [ ] User-controlled SQL values are parameterized and dynamic identifiers/sort clauses are allowlisted.
- [ ] All required database tables/relationships/constraints exist in versioned migrations and have been applied through the documented process.
- [ ] Duplicate email, duplicate review, selected helpful uniqueness, invalid role/rating/status, and concurrent lifecycle cases are protected.
- [ ] Backend validation exists for all relevant bodies/parameters/queries and returns consistent safe errors.
- [ ] Appointment time/duration/conflict policy is decided; no unimplemented exclusivity/availability guarantee is advertised.
- [ ] Production secret/TLS/role/CORS/token/abuse-control decisions are implemented where selected; private secrets are absent from committed/staged code/docs and reviewed history.
- [ ] Error responses and logs do not expose SQL, credentials, passwords/hashes, tokens, or private consultation content.

### Verification, delivery, and understanding gates

- [ ] Critical manual, integration, database, authorization/security, and frontend/end-to-end tests pass with recorded commands/results appropriate to the selected tools.
- [ ] Tests include invalid inputs, no/invalid/expired tokens, role escalation, cross-user access, invalid state transitions, and relevant concurrent writes.
- [ ] A fresh authorized developer can configure the environment, start the database, apply migrations, start the backend/frontend, and reproduce the core journey using documented commands.
- [ ] Frontend/backend/database deployment is complete, configured securely, and verified with deployed smoke tests; URLs/providers are recorded without secrets.
- [ ] Database persistence and selected backup/restore/recovery practices are verified and documented.
- [ ] README provides a concise truthful introduction, stack, setup, commands, scope, and link to this master spec.
- [ ] This master specification is re-audited against the release commit; implemented/planned statuses, API contracts, decisions, gaps, and versions reflect reality.
- [ ] Required V1 TBD decisions are closed; any intentional limitation is explicit and consistent with product promises. V2/V3/deferred ideas are not misrepresented as shipped.
- [ ] The developer can explain the request/DB flow, schema, security, concurrency choices, architecture tradeoffs, and core feature implementation in an interview.

## 36. Documentation maintenance and README relationship

[IMPLEMENTED] This file is the detailed internal engineering source of truth, updated for current Day 3 registration maintenance. [PLANNED V1] `README.md` should be the concise public repository introduction and onboarding entry point; it is currently absent. Do not replace the README with this entire document or claim an existing README was updated.

| Document/artifact | Status | Responsibility |
| --- | --- | --- |
| `README.md` | [PLANNED V1] | Short product description, actual stack, safe setup/run commands, current scope/limitations, link to master reference |
| `docs/CONSULTIFY_MASTER_SPEC.md` | [IMPLEMENTED] updated this task | Implementation evidence, target contracts, architecture/decision history, audit/debug/testing/deployment guidance, version boundaries |
| SQL migrations | [PARTIALLY IMPLEMENTED] users file only | Executable schema history; master spec explains it but cannot substitute for actual migration files |
| Tests | [PLANNED V1] | Executable evidence for behavior; prose acceptance cases do not count as passing tests |
| Package metadata | [IMPLEMENTED] | Dependency/scripts/package version; `1.0.0` does not certify product V1 readiness |

[PLANNED V1] Update audit metadata to the actual inspected branch/commit/date and record working-tree context. When code changes, update exact responsible paths, schemas, APIs, tests, operational notes, checklist statuses, gap analysis, and completion estimate. When a planned decision becomes accepted, record why, the alternatives considered, and the effect on existing data/contracts. Do not erase a conflict merely because code was generated.

[PLANNED V1] Maintain a small revision history tied to verifiable work:

| Revision | Audited code | Change | Status |
| --- | --- | --- | --- |
| Initial audit, 2026-09-13 | `main` at `59553f5fe6f73c5424d26be76f520aa451b72537`, plus final working-tree C-12 discrepancy | Added this reference; inspected all current first-party files; documented missing business systems, conflicts, decisions, roadmap, and ~12% estimate; preserved independently changed Compose file | [IMPLEMENTED] historical documentation-only audit; no application/configuration edits by that audit |
| Day 3 maintenance, 2026-09-14 | `main` at `74aeec62c37863c8c72ded88c836121766113923` plus scoped working-tree changes | Added name/email bounds, PostgreSQL 23505 → 409, and malformed-JSON 400; synchronized registration contract, accepted D-05–D-08, progress, and resolved config/ignore findings | [IMPLEMENTED] two JS files and this spec; login and automated tests remain planned |
| Next feature milestone | [TBD] actual future commit | Record only work actually implemented/verified and intentionally revised decisions | [PLANNED V1] |

[PLANNED V1] Official references linked throughout this document explain PostgreSQL, pg, JWT, bcrypt, and Docker behavior. They are not substitutes for local implementation evidence. Re-check version-specific technical behavior when changing dependency/runtime versions; never infer that current upstream documentation means Consultify has adopted a new version.

## 37. HOW TO USE THIS DOCUMENT

[PLANNED V1] Future developers and AI agents should follow this workflow:

1. Read this document before major changes, especially version boundaries, invariants, actual progress, conflict register, and unresolved decisions.
2. Inspect the current repository, Git status/history, dependency versions, and relevant files. This audit snapshot may be older than the code.
3. Identify whether the requested feature belongs to V1, V2, V3, deferred scope, or a decision that must first be resolved.
4. Check architectural invariants: selected stack, raw parameterized SQL, generic domains, backend security, ownership, database integrity, and minimal justified abstraction.
5. Implement only authorized scope with explicit current/target distinctions. Do not generate speculative features or treat proposed APIs/schemas as already accepted.
6. Update migrations for intentional schema changes and apply them through the documented process; distinguish migration files from applied database state.
7. Run meaningful tests and relevant security/ownership/concurrency checks, then record actual results and limitations.
8. Update this master specification when implementation changes or an intentional architectural decision changes. Keep API contracts, diagrams, statuses, decision rationale, version boundaries, and audit metadata synchronized.
9. Never silently diverge from the specification. Record and resolve discrepancies rather than assuming code, an AI suggestion, or old prose is automatically authoritative in isolation.

> If implementation and this document disagree, do not assume either is automatically correct. Identify the discrepancy, inspect Git/history/repository context, and explicitly resolve the architectural decision.
