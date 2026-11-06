# Consultify V1 frontend

A React application connected to the existing Express/PostgreSQL backend. All application source added by this implementation lives in `frontend/`. The backend, migrations, root packages, `.env`, existing tests and existing records are unchanged.

## Run locally

Use Node 22.12+ (Node 24 was tested). Run commands from the repository root unless a step says otherwise.

1. Start Docker Desktop. If this project's PostgreSQL service is not already running:

   ```sh
   docker compose up -d postgres
   ```

   This uses the existing root `.env` for the password and the existing Compose volume. Do not remove volumes or reset your database. The existing development database must already have migrations 001–005 applied; the frontend never runs migrations against it.

2. Start Express in one terminal:

   ```sh
   npm ci
   npm start
   ```

   Root `npm ci` installs the existing frozen dependencies; it does not change the package files. Express uses the existing `.env` and normally listens on port 8000.

3. Start React in another terminal:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

4. Open `http://127.0.0.1:5174` in Chrome. `http://localhost:5174` also works, but use one hostname consistently: session storage belongs to an origin, so changing hostnames does not carry the login with you.

Register a member at `/register` or a financial advisor at `/register/advisor`. Registration creates an account, then sends you to Login. Advisors create their professional profile from the dashboard. Member and advisor sessions can be tested in separate browser profiles. A normal pair of tabs shares session state only according to browser sessionStorage rules; logging into another role in the same tab replaces its session.

## How it works

```text
React Page
    ↓
API Module
    ↓
Shared fetch() Client
    ↓
Vite /api Proxy (development)
    ↓
Express Backend
    ↓
PostgreSQL
    ↓
JSON Response
    ↓
Updated React UI
```

Vite runs the development web server and builds the browser JavaScript/CSS. `vite.config.js` forwards every `/api` request to `http://127.0.0.1:8000`, preserving `/api`. Pages use relative URLs, so you don't need to add CORS or change Express. If Express uses another port, launch Vite with `API_PROXY_TARGET=http://127.0.0.1:YOUR_PORT npm run dev`.

Each feature has an API module under `src/api/`. For example, `appointments.api.js` calls `client.js`, which adds JSON headers and the Bearer token, runs `fetch`, and rejects failed HTTP requests. The page catches the error and displays it. After successful changes, affected server data is loaded again. Search parameters use the backend's `search` and `domain` names.

`src/context/AuthContext.jsx` owns the current user. Only the JWT is stored in `sessionStorage`; saved user details are never trusted. Refresh calls `GET /api/auth/me` before protected routes decide whether to redirect. A temporary server failure keeps the token and offers a session retry. A rejected/expired token clears the session. JWT expiry is also checked with a timer for the UI; Express still verifies signatures and permissions. There are no refresh tokens. Logout removes this tab's token. Closing the tab normally ends its session.

**Security limitation:** JavaScript can read sessionStorage. An XSS vulnerability or an untrusted script could steal the JWT. Never paste tokens into logs, load untrusted scripts, or treat frontend route guards as authorization. Production needs HTTPS, an appropriate Content Security Policy, and a separate security/deployment review. Server authorization remains authoritative; logout does not revoke an already issued token on the backend.

## Where to look

| File/directory                  | Responsibility                                              |
| ------------------------------- | ----------------------------------------------------------- |
| `src/App.jsx`                   | Routes and page titles                                      |
| `src/pages/`                    | Forms, pages, user actions                                  |
| `src/components/`               | Layout, cards, statuses, fields, feedback                   |
| `src/api/client.js`             | Fetch, HTTP errors, token headers, expiry events            |
| `src/api/*.api.js`              | Actual endpoint paths and payloads                          |
| `src/context/AuthContext.jsx`   | Login, logout, restoration and expiration                   |
| `src/routes/ProtectedRoute.jsx` | Waits for restoration, then checks user/role                |
| `src/hooks/useResource.js`      | Data loading, retry, stale-response protection              |
| `src/styles/global.css`         | Palette, typography, layout, responsive rules               |
| `tests/client.test.js`          | Request-client unit tests; these use controlled responses   |
| `tests/e2e.mjs`                 | Real Chromium UI workflows and response evidence            |
| `scripts/run-isolated.cjs`      | Disposable PostgreSQL, frozen Express and Vite test servers |

## Inspect a request

Open Chrome DevTools → Network → Fetch/XHR, then submit a form. Select its `/api/...` request. Look at the method, status, Payload, and Response. A booking sends `advisorId` (profile UUID), `scheduledAt` (ISO timestamp), and optional notes. A successful response creates a pending appointment; the UI then reads the updated list. A 409 on a second review or helpful vote is expected and shown as useful feedback. Never share screenshots containing Authorization headers.

## Verification commands

From `frontend/`:

```sh
npm ci
npm run build
npm test
npm run test:e2e:pg17
```

The final command requires Docker Desktop, the `postgres:17.4` image (`docker pull postgres:17.4` if needed), and installed Google Chrome. It launches a **new**, randomly named container with data in tmpfs, creates a generated test database, verifies it is empty, applies migrations 001–005, and tests the actual app. It stops/removes only its own container. It never connects to the existing development container, uses development credentials, or loads `.env`. Test identities are generated. Temporary JWT/database secrets are never written into results.

An alternative for machines with `initdb` and `pg_ctl` on PATH:

```sh
npm run test:e2e
```

This starts/stops a new native PostgreSQL cluster in the OS temporary directory. It retains the stopped cluster directory for inspection. No development data is used. `PLAYWRIGHT_EXECUTABLE_PATH=/absolute/path/to/chrome` can override the default installed Google Chrome executable. Browser tests require local sockets and permission to start the browser.

Results and screenshots are under `test-results/` (Git ignored). `TEST_REPORT.md` contains the handoff results and the full 24-endpoint matrix. Unit tests are separate from real integration evidence; mocked unit responses are not counted as API coverage. The original backend suite can be run separately with `node tests/run-backend.js` from the repository root; it was not rerun here to preserve its existing result artifacts.

## Build and deployment boundary

`npm run build` generates `dist/`. `npm run preview` serves the compiled files for local inspection, but **does not provide the development API proxy**. A real deployment must serve the build with SPA fallback to `index.html` and forward `/api` to Express on the same origin. No hosting, TLS, payment, video, chat, advisor verification, or availability engine is included.

V1 is finance only. Fees have no currency field in the backend, so the UI displays the stored amount and asks advisors to clarify currency in their bio. Appointment times are entered/displayed locally and sent as ISO timestamps; no validated free slot is promised. Completed consultations allow a review form, but the API does not expose per-appointment review status: repeat submissions receive clear 409 feedback. Helpful voting is add-only. Account editing is unsupported by the API. Lists are unpaginated, matching the frozen contract.
