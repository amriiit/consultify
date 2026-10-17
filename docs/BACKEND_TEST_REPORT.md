# Consultify backend testing and hardening report

## A. Executive summary

**READY WITH NONBLOCKING ISSUES for the existing V1 backend scope.** This is a recommendation for owner review, not a declaration that the backend is frozen or deployed.

Final executed regression: **284 tests, 284 passed, 0 failed, 0 skipped**, zero cancelled. Test-body duration 8.875 seconds; the TAP duration includes Node runner overhead. Real Express HTTP requests and real PostgreSQL were used throughout. Both product workflows pass. All **24 registered endpoints** received HTTP coverage. No confirmed critical or high-severity authorization/integrity defect remains in the exercised scope.

Corrected pre-fix baseline: **278 tests, 233 passed, 45 failed**, zero skipped. The 45 failures are reproduced validation/error-boundary defects grouped as B01–B10 below. Four compatibility/boundary cases were then added. Two final-review probes (invalid calendar date and malformed percent encoding) reproduced two further failures before targeted corrections; [edge reproduction evidence](../tests/results/edge-reproduction.json) records 284 tests, 282 passed and 2 failed. The final expanded run passes all 284. An earlier 274-case draft had 15 additional harness failures because concurrent expected conflicts were caught by matching an assertion-message suffix. Those were test defects, corrected by explicitly accepting each legal competing response and asserting the complete response-status multiset. The corrected baseline already passed all 15 concurrency cases. No production concurrency fix was needed.

Evidence: [final machine-readable results](../tests/results/latest.json), [final TAP](../tests/results/final.tap), [pre-fix baseline](../tests/results/baseline.json), and [suite](../tests/backend.test.js). Counts describe test cases, not line/branch coverage or production load certification.

## B. Testing environment and safety

- Date: 17 October 2026, Asia/Kolkata. Final evidence timestamp: `2026-10-17T14:18:54.035Z` (UTC).
- Node.js `v24.18.1`; Express 5.2.1; pg 8.23.0; PostgreSQL **18.6 Homebrew** (real server).
- Framework: built-in `node:test`, `node:assert/strict`, native fetch; existing bcrypt/jsonwebtoken/pg. No new dependencies or package changes.
- Final database: **`consultify_test_d06c4a4e46a74e3a`**. Generated name differs from development `consultify` and is verified through `current_database()` before migrations and again before suite setup.
- Docker daemon was unavailable; `docker ps --format ...` returned no socket. `pg_isready` found no server on the default local socket. The installed PostgreSQL binaries provided a safe fallback. Compose targets PostgreSQL 17.4; that exact version has **not** been tested.
- The sandbox prevented `initdb` shared-memory allocation; the isolated runner was executed with approved sandbox escalation. No unsafe development-database fallback was used.
- Each run creates a new temporary cluster with `initdb`, a generated test database, an ephemeral loopback port and test-only database role. No environment file is loaded by the runner. It overrides DATABASE_URL/JWT_SECRET in the child process; JWT secret is random and never recorded. Trust authentication applies only to this disposable local cluster.
- `CREATE DATABASE` has no reuse fallback. A nonempty public schema or wrong database identity aborts migration application. Migrations 001–005 are applied in filename order only after these checks.
- The runner stops its own cluster in `finally`; it does not drop/truncate any database, delete volumes, or connect to the development database. Temporary cluster files are retained for inspection. Final cluster directory: `/var/folders/l4/ww5_dwtn3d932jlxj7xxg4240000gn/T/consultify-test-ShxUyP`; cluster stopped successfully.
- `.env`, all five migrations, the master specification, and the pre-existing review report were verified byte-for-byte unchanged using local SHA-256 comparisons; secret contents/digests are not in this report. Existing auth/appointment controller and route edits were retained.
- Unique generated emails, fresh ordinary/advisor registrations, dynamic future appointment dates, and four initial identities USER_A/USER_B/ADVISOR_A/ADVISOR_B. No direct SQL role changes simulate onboarding. Enum constraint checks change roles only inside a guaranteed-rollback SQL transaction.

Commands executed (no credentials required):

```sh
node --version
initdb --version
pg_isready
docker ps --format '{{.Names}} {{.Image}} {{.Status}}'
node --check tests/backend.test.js
node --check tests/run-backend.js
node tests/run-backend.js
git diff --check
git status --short
```

The runner invokes `initdb`, `pg_ctl start`, migrations through pg, `node --test --test-reporter=tap tests/backend.test.js`, and `pg_ctl stop`. It requires PostgreSQL server binaries on PATH and permission for loopback sockets/shared memory. **Rerun all tests from repository root: `node tests/run-backend.js`.** Do not run the test file directly against a manually supplied development URL. The harness rejects missing isolation markers and database names outside the generated test-name format.

## C. Endpoint coverage matrix

Every row passed. Cases may touch several endpoints, so the case column is deliberately non-additive. HTTP calls include fixture setup and bounded parallel requests. Statuses include rejected inputs; a 400/401/403/404/409 is a PASS when expected. Error-only non-UUID path probes are normalized to the same endpoint template. No endpoint was silently skipped.

| Method | Path | Associated cases passed / failed / skipped | HTTP calls | Observed statuses |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | 1 / 0 / 0 | 1 | 200 |
| POST | `/api/auth/register` | 21 / 0 / 0 | 28 | 201,400,409 |
| POST | `/api/auth/register/advisor` | 20 / 0 / 0 | 22 | 201,400,409 |
| POST | `/api/auth/login` | 16 / 0 / 0 | 23 | 200,400,401 |
| GET | `/api/auth/me` | 9 / 0 / 0 | 9 | 200,401 |
| POST | `/api/advisors/profile` | 18 / 0 / 0 | 20 | 201,400,401,403,409 |
| PATCH | `/api/advisors/profile` | 11 / 0 / 0 | 11 | 200,400,401,403,404 |
| GET | `/api/advisors` | 12 / 0 / 0 | 13 | 200,400 |
| GET | `/api/advisors/:id` | 5 / 0 / 0 | 5 | 200,400,404 |
| GET | `/api/advisors/:id/reviews` | 4 / 0 / 0 | 6 | 200,400,404 |
| POST | `/api/appointments` | 53 / 0 / 0 | 58 | 201,400,401,403,404 |
| GET | `/api/appointments/user` | 4 / 0 / 0 | 5 | 200,401,403 |
| GET | `/api/appointments/advisor` | 4 / 0 / 0 | 5 | 200,401,403 |
| PATCH | `/api/appointments/:id/status` | 33 / 0 / 0 | 64 | 200,400,401,403,404 |
| PATCH | `/api/appointments/:id/cancel` | 18 / 0 / 0 | 19 | 200,400,401,403,404 |
| POST | `/api/community/posts` | 30 / 0 / 0 | 30 | 201,400,401,413 |
| GET | `/api/community/posts` | 12 / 0 / 0 | 14 | 200,400 |
| GET | `/api/community/posts/:id` | 7 / 0 / 0 | 10 | 200,400,404 |
| POST | `/api/community/posts/:id/comments` | 13 / 0 / 0 | 15 | 201,400,401,404 |
| GET | `/api/community/posts/:id/comments` | 4 / 0 / 0 | 5 | 200,400,404 |
| POST | `/api/community/posts/:id/helpful` | 9 / 0 / 0 | 15 | 201,400,401,404,409 |
| DELETE | `/api/community/comments/:id` | 3 / 0 / 0 | 5 | 200,400,401,404 |
| DELETE | `/api/community/posts/:id` | 3 / 0 / 0 | 6 | 200,400,401,404 |
| POST | `/api/reviews` | 27 / 0 / 0 | 37 | 201,400,401,403,404,409 |

Middleware ordering was inspected: global JSON parser, six route mounts, then error middleware. Protected handlers run authenticate before role authorization and controllers. Route imports/exports load successfully in the real app. Auth/appointment wiring repairs were already present in the user's uncommitted work; this campaign does not claim authorship of those repairs. `server.js` was inspected; tests bind `app.js` directly to a random local HTTP port rather than start the development listener.

## D. Module results

| Module | Cases | Passed | Failed | Skipped |
| --- | --- | --- | --- | --- |
| Health | 1 | 1 | 0 | 0 |
| Authentication | 34 | 34 | 0 | 0 |
| Security | 34 | 34 | 0 | 0 |
| Advisors | 27 | 27 | 0 | 0 |
| Appointments | 17 | 17 | 0 | 0 |
| Lifecycle | 21 | 21 | 0 | 0 |
| Community | 11 | 11 | 0 | 0 |
| Comments | 8 | 8 | 0 | 0 |
| Helpful | 2 | 2 | 0 | 0 |
| Reviews | 18 | 18 | 0 | 0 |
| Ratings | 2 | 2 | 0 | 0 |
| Search | 20 | 20 | 0 | 0 |
| Database | 72 | 72 | 0 | 0 |
| Concurrency | 15 | 15 | 0 | 0 |
| E2E | 2 | 2 | 0 | 0 |

- Authentication: normal/advisor registration, role assignment despite ADMIN payload, normalization, cross-type duplicates, bcrypt cost/hash comparison, password character/byte limits and accepted boundaries, safe projections, login failures and JWT claims, current user.
- Advisors: public list/detail joins, distinct account/profile IDs, own-profile creation/update, partial persistence, missing/duplicate profile, type/domain/bounds validation, cross-advisor spoof protection.
- Appointments: real persisted bookings; missing, unknown and malformed inputs; user/advisor list isolation and joins; forged owner/status ignored.
- Lifecycle: all requested allowed and rejected transitions, cancellation terminal states, role/ownership failures, missing/invalid authentication. Rejections compare the full database row before/after.
- Community: FINANCE posts, public author/count joins, ownership, invalid types/lengths, empty results, comments and helpful votes. Comment authors/order and own-comment deletion verified; separate cascade fixtures prove deletion of both dependent tables.
- Reviews: owned COMPLETED appointment only; all other lifecycle statuses rejected; wrong owner/role/auth rejected; 1 and 5 accepted; bounds, decimal, missing/type cases rejected; numeric string rating remains compatible with the existing contract; duplicates protected.
- Ratings: empty list/zero summary; two reviews 5+4 → average 4.5/count 2; a third rating 3 → average 4/count 3; reviewer names and advisor association checked.
- Search: both list routes, optional FINANCE domain, title/content or advisor-name/specialization search, case-insensitive combined filters, no-match/injection strings, repeated parameter arrays.
- Security: missing/invalid/expired/tampered/unsigned JWTs; RBAC and ownership; IDs/role spoofing; malformed/missing JSON, UUIDs and SQL injection strings; safe response checks. Wrong inputs continue to permit legitimate subsequent requests.

## E. Confirmed defects and fixes

All findings below are **MEDIUM**: demonstrated validation, error-status, malformed stored text or internal-path disclosure defects. No demonstrated cross-user data access, privilege escalation, secret exposure, or destructive corruption was found. Severity is based on observed impact, not merely a 500 response. Original failures are preserved in baseline.json or edge-reproduction.json and have passing final regression tests. Error status changes apply to confirmed invalid requests; successful response envelopes remain intact.

| ID | File / function | Reproduction and original behavior | Expected / root cause | Minimal fix / retest |
| --- | --- | --- | --- | --- |
| B01 | auth login; advisor create; appointment booking/status; community post/comment creation; review creation | POST/PATCH without JSON body → 500 | 400; destructuring undefined req.body outside try | Default absent body to empty object in affected controllers; all missing-body regressions PASS |
| B02 | advisor create/update | bio object or whitespace → 500/409 on create, 200 with invalid stored text on update; fresh advisor with whitespace bio creates an empty profile | Reject invalid/blank text before SQL; unchecked trim/coercion | Explicit text type/nonblank checks on create/update; fresh no-persistence and update regressions PASS |
| B03 | advisor create/update | specialization length 151 → 500 | 400; missing VARCHAR(150) bound | Validate specialization bound; create trims as before, update preserves valid supplied text; PASS |
| B04 | advisor create/update | experienceYears=2147483648 or consultationFee=10000000000 → 500 | 400; missing INTEGER/NUMERIC(10,2) bounds | Validate finite nonnegative fee ≤99999999.99 and integer experience ≤2147483647; PASS |
| B05 | appointment bookAppointment | scheduledAt="bad" or object → 500; notes object → 201 with coerced text; February 30 reaches PostgreSQL and returns 500 | 400; timestamp/type checks absent | Require parseable timestamp string and string/null optional notes; map actual PostgreSQL 22007/22008 date errors to 400 (JS Date.parse normalizes some invalid calendar dates); PASS |
| B06 | community createPost/addComment | numeric domain, object title, array content or object/array/number comment → unhandled 500 | 400; trim invoked on unchecked types | String checks before trim; PASS |
| B07 | community createPost | title length 201 → PostgreSQL error/500 | 400; missing VARCHAR(200) bound | Check trimmed title length; PASS |
| B08 | review createReview | comment object/array/number → unhandled 500; rating true/[5] coerces into a valid integer and reaches lookup (404 for unknown appointment) | 400 before lookup; unchecked trim and Number coercion | Allow only number/string rating inputs and string/null comments, then preserve existing numeric conversion; PASS |
| B09 | advisor detail/reviews; appointment status/cancel/book; community post detail/comment add/list; review create | malformed UUID "bad" → 500 | 400; unhandled PostgreSQL 22P02 | Map 22P02 in affected catches only; existing helpful/delete handling retained; PASS |
| B10 | advisor/community lists; app error boundary | repeated search keys → 500 because array.trim; oversized JSON → HTML 413; unchecked exceptions could return Express HTML with internal paths; malformed percent encoding produced 500 during hardening | Safe JSON and valid input errors; query types and fallback error handler absent | Reject non-string domain/search; JSON 413 and generic JSON 500 fallback; explicit URIError → safe JSON 400 restores the invalid-path status; malformed/oversized/path input tests PASS |

B02–B04 initially shared some invalid-profile fixtures with an existing profile, so uniqueness could return 409 for whitespace. A separate pre-fix fresh-advisor regression reproduced actual whitespace persistence before the fix. No expectation was weakened to hide that behavior.

No migration, schema, ORM, API expansion, professional approval, dependency, or frontend change was introduced. The appointment transition SQL itself needed no change during this campaign: owner and previous status are already predicates of one UPDATE. Cancellation likewise constrains owner and allowed source statuses in one UPDATE.

## F. PostgreSQL verification

**72 database cases PASS**, including **69 actual rejected INSERT operations**: 7 primary-key duplicates (23505), 3 extra unique constraints (23505), 9 foreign keys (23503), 7 CHECK rejection values across 6 constraints (23514), and 43 NOT NULL violations (23502). Each operation is a VALUES INSERT, not a possibly empty INSERT…SELECT. A dedicated client starts a transaction/savepoint, captures the actual SQLSTATE, rolls back the failed statement, verifies the connection still executes a query, and guarantees full rollback/release. A successful invalid insert fails the test.

Additional database cases inspect the exact seven-table/constraint catalogs, accept schema enum values within rollback, and check all nine relationships for orphans after negative/concurrent tests. HTTP cascade tests delete disposable posts with live comments/helpful children and confirm both child tables contain zero remaining rows. The user, advisor, appointment and review associations are checked against actual SQL joins.

Live catalog captured in latest.json:

| Table | Constraint | Actual definition |
| --- | --- | --- |
| `advisor_profiles` | `advisor_profiles_bio_not_null` | `NOT NULL bio` |
| `advisor_profiles` | `advisor_profiles_consultation_fee_check` | `CHECK ((consultation_fee >= (0)::numeric))` |
| `advisor_profiles` | `advisor_profiles_consultation_fee_not_null` | `NOT NULL consultation_fee` |
| `advisor_profiles` | `advisor_profiles_created_at_not_null` | `NOT NULL created_at` |
| `advisor_profiles` | `advisor_profiles_domain_check` | `CHECK (((domain)::text = ANY ((ARRAY['FINANCE'::character varying, 'HEALTH'::character varying, 'ASTROLOGY'::character varying])::text[])))` |
| `advisor_profiles` | `advisor_profiles_domain_not_null` | `NOT NULL domain` |
| `advisor_profiles` | `advisor_profiles_experience_years_check` | `CHECK ((experience_years >= 0))` |
| `advisor_profiles` | `advisor_profiles_experience_years_not_null` | `NOT NULL experience_years` |
| `advisor_profiles` | `advisor_profiles_id_not_null` | `NOT NULL id` |
| `advisor_profiles` | `advisor_profiles_pkey` | `PRIMARY KEY (id)` |
| `advisor_profiles` | `advisor_profiles_specialization_not_null` | `NOT NULL specialization` |
| `advisor_profiles` | `advisor_profiles_updated_at_not_null` | `NOT NULL updated_at` |
| `advisor_profiles` | `advisor_profiles_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| `advisor_profiles` | `advisor_profiles_user_id_key` | `UNIQUE (user_id)` |
| `advisor_profiles` | `advisor_profiles_user_id_not_null` | `NOT NULL user_id` |
| `appointments` | `appointments_advisor_id_fkey` | `FOREIGN KEY (advisor_id) REFERENCES advisor_profiles(id)` |
| `appointments` | `appointments_advisor_id_not_null` | `NOT NULL advisor_id` |
| `appointments` | `appointments_created_at_not_null` | `NOT NULL created_at` |
| `appointments` | `appointments_id_not_null` | `NOT NULL id` |
| `appointments` | `appointments_pkey` | `PRIMARY KEY (id)` |
| `appointments` | `appointments_scheduled_at_not_null` | `NOT NULL scheduled_at` |
| `appointments` | `appointments_status_check` | `CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))` |
| `appointments` | `appointments_status_not_null` | `NOT NULL status` |
| `appointments` | `appointments_updated_at_not_null` | `NOT NULL updated_at` |
| `appointments` | `appointments_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id)` |
| `appointments` | `appointments_user_id_not_null` | `NOT NULL user_id` |
| `comments` | `comments_content_not_null` | `NOT NULL content` |
| `comments` | `comments_created_at_not_null` | `NOT NULL created_at` |
| `comments` | `comments_id_not_null` | `NOT NULL id` |
| `comments` | `comments_pkey` | `PRIMARY KEY (id)` |
| `comments` | `comments_post_id_fkey` | `FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE` |
| `comments` | `comments_post_id_not_null` | `NOT NULL post_id` |
| `comments` | `comments_updated_at_not_null` | `NOT NULL updated_at` |
| `comments` | `comments_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id)` |
| `comments` | `comments_user_id_not_null` | `NOT NULL user_id` |
| `community_posts` | `community_posts_content_not_null` | `NOT NULL content` |
| `community_posts` | `community_posts_created_at_not_null` | `NOT NULL created_at` |
| `community_posts` | `community_posts_domain_not_null` | `NOT NULL domain` |
| `community_posts` | `community_posts_id_not_null` | `NOT NULL id` |
| `community_posts` | `community_posts_pkey` | `PRIMARY KEY (id)` |
| `community_posts` | `community_posts_title_not_null` | `NOT NULL title` |
| `community_posts` | `community_posts_updated_at_not_null` | `NOT NULL updated_at` |
| `community_posts` | `community_posts_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id)` |
| `community_posts` | `community_posts_user_id_not_null` | `NOT NULL user_id` |
| `post_helpful` | `post_helpful_created_at_not_null` | `NOT NULL created_at` |
| `post_helpful` | `post_helpful_pkey` | `PRIMARY KEY (post_id, user_id)` |
| `post_helpful` | `post_helpful_post_id_fkey` | `FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE` |
| `post_helpful` | `post_helpful_post_id_not_null` | `NOT NULL post_id` |
| `post_helpful` | `post_helpful_user_id_fkey` | `FOREIGN KEY (user_id) REFERENCES users(id)` |
| `post_helpful` | `post_helpful_user_id_not_null` | `NOT NULL user_id` |
| `reviews` | `reviews_appointment_id_fkey` | `FOREIGN KEY (appointment_id) REFERENCES appointments(id)` |
| `reviews` | `reviews_appointment_id_key` | `UNIQUE (appointment_id)` |
| `reviews` | `reviews_appointment_id_not_null` | `NOT NULL appointment_id` |
| `reviews` | `reviews_created_at_not_null` | `NOT NULL created_at` |
| `reviews` | `reviews_id_not_null` | `NOT NULL id` |
| `reviews` | `reviews_pkey` | `PRIMARY KEY (id)` |
| `reviews` | `reviews_rating_check` | `CHECK (((rating >= 1) AND (rating <= 5)))` |
| `reviews` | `reviews_rating_not_null` | `NOT NULL rating` |
| `reviews` | `reviews_updated_at_not_null` | `NOT NULL updated_at` |
| `users` | `users_created_at_not_null` | `NOT NULL created_at` |
| `users` | `users_email_key` | `UNIQUE (email)` |
| `users` | `users_email_not_null` | `NOT NULL email` |
| `users` | `users_id_not_null` | `NOT NULL id` |
| `users` | `users_name_not_null` | `NOT NULL name` |
| `users` | `users_password_hash_not_null` | `NOT NULL password_hash` |
| `users` | `users_pkey` | `PRIMARY KEY (id)` |
| `users` | `users_role_check` | `CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADVISOR'::character varying, 'ADMIN'::character varying])::text[])))` |
| `users` | `users_role_not_null` | `NOT NULL role` |

The schema allows USER/ADVISOR/ADMIN; only USER and ADVISOR have public registration endpoints. Advisor domain CHECK accepts FINANCE/HEALTH/ASTROLOGY, while current API creation/filter validation accepts FINANCE. Community domain has no DB CHECK. Review eligibility, roles, and lifecycle transitions are enforced by application logic; the database constrains status/rating values, relationships and uniqueness. These are documented enforcement boundaries, not claims of additional database guarantees. No schema change was required for the exercised V1 workflows.

## G. Workflows and concurrency

**Professional consultation: PASS, steps 1–23.** Fresh advisor registration/login → verified ADVISOR JWT → owned profile → public discovery → fresh USER registration/login/JWT → name search → advisor details → booking by profile ID/PENDING → user and advisor lists → CONFIRMED → COMPLETED → owned 5-star review → public average 5/count 1 → database join verifies customer, advisor account/profile, final status and review. Workflow helper assertions group registration/login/JWT checks; any failure reports the named workflow stage.

**Community consultation: PASS, steps 1–17.** Two fresh users register/login → USER_A creates FINANCE post → public listing/detail → USER_B comment → correct author/count → helpful/count → duplicate 409 → search → cross-owner delete 404 → USER_B deletes own comment → additional disposable cascade child → USER_A deletes post → post/comments/helpful SQL rows absent. Accounts are provisioned at workflow start; identity associations and counts are asserted along the route sequence.

**Concurrency: 15/15 PASS.** Five scenarios × **3 iterations** each, bounded at 2–3 simultaneous HTTP requests. Concurrent same-email registration, same-user helpful vote and same-appointment review each yield one 201 plus one 409 and exactly one stored row. Two confirmations competing with cancellation allow at most one confirmation, end CANCELLED, and reject later completion. Completion versus cancellation from CONFIRMED yields exactly one 200/one 404 with a valid terminal state. No load/stress claim is made.

## H. Remaining issues and limits

- Critical blockers: none confirmed in the exercised V1 backend scope. No failed/skipped final cases.
- Important nonblocking verification limit: real PostgreSQL 18.6 was tested; Compose PostgreSQL 17.4/Docker runtime was unavailable. Repeat this suite or equivalent deployment checks on the intended database version before deployment. The runner currently uses local PostgreSQL binaries, not Docker.
- No browser or React code was created/tested. The app has no CORS middleware; a same-origin deployment or React development proxy can consume these APIs. If separate origins are chosen, approve and configure an origin policy during integration.
- Timestamp validation rejects unparseable input; future-only, strict timezone/ISO policy, overlap rules, availability and booking duration remain unselected policies. Tests use dynamic future ISO instants; this report does not claim past/ambiguous times are rejected.
- Existing API collections are unpaginated. Very large datasets/load, dependency vulnerability scanning, production deployment/TLS, rate limits, production secret management, backup/restore, startup port failure and graceful shutdown are outside the completed API regression. Health success is covered; real database-outage and server bootstrap failure paths are not exercised here.
- Advisor signup is self-service. It does not establish identity, licensing, professional verification or admin approval. ADMIN is a schema value with no public registration/admin workflow. No payment, notification, voice/video or future-domain feature was added.
- Existing empty advisor PATCH is a no-op success and unsupported extra identity fields are ignored. Existing string rating inputs remain accepted if converted to integers 1–5. Helpful interaction remains add-only and does not prohibit self-helpful votes. Unknown route handling remains Express's default; this report's JSON guarantees cover tested implemented routes.
- The master spec contains historical contradictions (trusted advisor provisioning, old broken route wiring, comments about absent community search). Current code and this user's explicit self-service V1 instructions were the source of truth. The master spec was preserved.
- No broad implementation rewrite or migration was needed. Concurrency tests sample bounded interleavings; they are evidence, not a proof against all possible schedules.

## I. Frontend API contract audit

All API capabilities requested for existing V1 workflows are available. No missing HTTP endpoint blocks those workflows. Requests use `Content-Type: application/json` for JSON and `Authorization: Bearer <token>` for protected routes. Paths below omit trailing slashes; Express accepts the mounted routes as exercised. All routes can return safe 400 malformed JSON, 413 oversized JSON or 500 unexpected failures; the per-route errors list is additional functional behavior. Resource-not-found/unowned/ineligible lifecycle updates deliberately share 404; review ownership uses 403.

| Method | Exact path | Authentication / roles | Inputs | Success shape | Expected errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | Public | — | 200 `{status:"ok",database:"connected"}` | 500 disconnected |
| POST | `/api/auth/register` | Public | JSON: name, email, password; role ignored | 201 `{message,user}` | 400,409 |
| POST | `/api/auth/register/advisor` | Public | JSON: name, email, password; role ignored | 201 `{message,user}`; role ADVISOR | 400,409 |
| POST | `/api/auth/login` | Public | JSON: email, password | 200 `{message,token,user}` | 400,401 |
| GET | `/api/auth/me` | Bearer; any role | —; identity from JWT | 200 `{user}` | 401,404 |
| POST | `/api/advisors/profile` | Bearer; ADVISOR | JSON: domain, bio, specialization, experienceYears, consultationFee | 201 `{message,advisorProfile}` | 400,401,403,409 |
| PATCH | `/api/advisors/profile` | Bearer; ADVISOR | JSON: optional bio, specialization, experienceYears, consultationFee | 200 `{message,advisorProfile}` | 400,401,403,404 |
| GET | `/api/advisors` | Public | Query: domain?, search? | 200 `{advisors:[]}` | 400 |
| GET | `/api/advisors/:id` | Public | Path: advisor profile UUID | 200 `{advisor}` | 400,404 |
| GET | `/api/advisors/:id/reviews` | Public | Path: advisor profile UUID | 200 `{averageRating,reviewCount,reviews:[]}` | 400,404 |
| POST | `/api/appointments` | Bearer; USER | JSON: advisorId (profile UUID), scheduledAt (timestamp string), notes? | 201 `{message,appointment}`; PENDING | 400,401,403,404 |
| GET | `/api/appointments/user` | Bearer; USER | —; JWT owner only | 200 `{appointments:[]}` | 401,403 |
| GET | `/api/appointments/advisor` | Bearer; ADVISOR | —; JWT assigned advisor only | 200 `{appointments:[]}` | 401,403 |
| PATCH | `/api/appointments/:id/status` | Bearer; ADVISOR | Path: appointment UUID; JSON: status CONFIRMED or COMPLETED | 200 `{message,appointment}` | 400,401,403,404 |
| PATCH | `/api/appointments/:id/cancel` | Bearer; USER | Path: appointment UUID; body optional | 200 `{message,appointment}` | 400,401,403,404 |
| POST | `/api/community/posts` | Bearer; any role | JSON: domain FINANCE, title, content | 201 `{message,post}` | 400,401 |
| GET | `/api/community/posts` | Public | Query: domain?, search? | 200 `{posts:[]}` | 400 |
| GET | `/api/community/posts/:id` | Public | Path: post UUID | 200 `{post}` | 400,404 |
| POST | `/api/community/posts/:id/comments` | Bearer; any role | Path: post UUID; JSON: content | 201 `{message,comment}` | 400,401,404 |
| GET | `/api/community/posts/:id/comments` | Public | Path: post UUID | 200 `{comments:[]}` | 400,404 |
| POST | `/api/community/posts/:id/helpful` | Bearer; any role | Path: post UUID; body optional | 201 `{message,helpful}` | 400,401,404,409 |
| DELETE | `/api/community/comments/:id` | Bearer; owner | Path: comment UUID | 200 `{message}` | 400,401,404 |
| DELETE | `/api/community/posts/:id` | Bearer; owner | Path: post UUID | 200 `{message}` | 400,401,404 |
| POST | `/api/reviews` | Bearer; USER | JSON: appointmentId, rating, comment? | 201 `{message,review}` | 400,401,403,404,409 |

Field details needed by React:

- `SafeUser`: id, name, email, role; registration/me additionally created_at. Login issues token and safe user, registration does not log in. JWT contains userID/role plus iat/exp; frontend restores through `/api/auth/me`.
- Registration: trimmed name 1–100; normalized email ≤255 and existing format check; password ≥12 JavaScript characters and ≤72 UTF-8 bytes. No client ADMIN override. Login normalizes email and uses generic 401 for bad credentials.
- Profile fields: id (profile), user_id (account), domain, bio, specialization, experience_years, consultation_fee, timestamps. Create takes camelCase experienceYears/consultationFee. Public list adds advisor_name/user_id; detail uses name instead of advisor_name and omits user_id. Advisor lookup/booking/reviews always use profile id. Own profile can be identified in the public list by matching user_id from `/me`; no dedicated own-profile GET exists.
- Advisor create domain must be exact FINANCE; discovery filters normalize casing/whitespace. Bio/specialization must be nonblank strings; specialization ≤150; experience is a nonnegative PostgreSQL-range integer; fee is finite/nonnegative within NUMERIC(10,2).
- pg returns NUMERIC consultation_fee as a JSON string, not a number. List/detail appointment times are ISO timestamp strings. User appointment list includes advisor_id/advisor_name/domain/specialization/fee; advisor appointment list includes user_id/user_name. Mutation responses include full appointment columns (id, user_id, advisor_id, scheduled_at, status, notes, created_at, updated_at).
- Post create returns user_id; public list/detail return author_id/author_name, comment_count/helpful_count and post fields. PostgreSQL COUNT values here are **strings**; convert for display. Comments create returns user_id; listing returns author_id/author_name and ascending created_at order. Reviews are descending created_at; ties are not assigned an additional deterministic sort key.
- Helpful response contains post_id/user_id/created_at. Review creation returns id/appointment_id/rating/comment/timestamps. Public reviews return id/rating/comment/timestamps/reviewer_id/reviewer_name. averageRating and reviewCount are JSON numbers; no reviews gives 0/0/empty array. Missing/null/blank review comment becomes null.
- Appointment transition progression: PENDING → CONFIRMED → COMPLETED; user cancellation only from PENDING/CONFIRMED. No optimistic review state is supplied on appointment lists; handle duplicate-review 409. Search parameter is `search`, not `q`; advisor search covers name/specialization and community search title/content. Search wildcard characters retain existing ILIKE semantics; no advanced search was added.

## J. Backend freeze recommendation and change inventory

| Owner review condition | Evidence |
| --- | --- |
| Core professional/community workflows pass | Both independent real HTTP + PostgreSQL E2Es PASS |
| No known critical security failure in tested scope | JWT/RBAC/ownership/injection tests PASS |
| No known high-severity integrity failure | Actual constraints, orphan checks and bounded races PASS |
| Authentication/authorization | Real registration/login/current-user and protected routes PASS |
| Appointment lifecycle | Atomic owner/status predicates inspected and real transition/race cases PASS |
| Database constraints | 69 actual SQLSTATE rejections PASS; catalog and cascades verified |
| Full automated regression | 284/284 PASS, 0 skipped/cancelled |
| Existing V1 frontend API capabilities | All 24 endpoints audited and exercised |

**Recommendation: suitable for owner consideration of backend freeze with the nonblocking limits in H.** This does not freeze the backend, certify production deployment, or substitute for review on the intended PostgreSQL/Docker/browser topology.

Production files modified by this campaign: src/app.js; src/controllers/auth.controller.js (absent-body login handling only beyond existing user changes); src/controllers/advisor.controller.js; src/controllers/appointment.controller.js (validation/UUID handling beyond existing user changes); src/controllers/community.controller.js; src/controllers/review.controller.js.

Created: tests/run-backend.js, tests/helpers/harness.js, tests/backend.test.js, tests/results/baseline.json, tests/results/edge-reproduction.json, tests/results/latest.json, tests/results/final.tap, docs/BACKEND_TEST_REPORT.md. No package, lockfile, migration, frontend, Docker, secret or master-spec change.

Git status at completion: modified app and the five listed controllers; auth/appointment routes remain modified **from before this task**; pre-existing untracked docs/COMPREHENSIVE_CODE_REVIEW_REPORT.md remains preserved; new report/tests are untracked. `git diff --check` PASS. **No commit or push was performed.**


## K. Final backend freeze readiness audit — 17 October 2026

**Verdict: READY FOR FREEZE for the existing backend scope, subject to the owner's approval.** No freeze, commit or push was performed. This is distinct from completion of the full product/deployment definition of done in master-spec section 35.

### Diff, security and scope

Reviewed the full tracked working-tree diff (8 production files, 122 insertions/30 deletions), all new test sources/infrastructure, all route definitions, package.json, migrations, the report and relevant master-spec contracts/security/acceptance gates. No accidental unrelated tracked changes, new dependencies, weakened authorization, SQL interpolation of client values, or successful-response contract break was found. Existing advisor signup and auth/appointment wiring changes are part of the reviewed diff and must be included with the controllers when committing.

Nothing is staged: `git diff --cached --name-only` is empty. Therefore no environment values, credentials, JWTs or generated artifacts are staged. `.env` is ignored/untracked. A credential-bearing URL/private-key/JWT pattern scan of the production/test/report/evidence candidates found no matches; this is a current-candidate review, not a historical secret-scanning certification. The unrelated pre-existing `docs/COMPREHENSIVE_CODE_REVIEW_REPORT.md` concerns a wireless federated-learning repository and should not be included in the backend commit.

No production or test-source edits were made during this audit. The normal runner refreshed local `tests/results/latest.json`; this report gained this audit section. Other evidence remains from its explicitly identified earlier runs. Generated `tests/results/` files are local audit artifacts, not recommended commit candidates; report links to those files refer to local evidence.

### Independent rerun and isolation

Executed **`node tests/run-backend.js`** again, with approved sandbox escalation for PostgreSQL shared memory. **284 tests, 284 PASS, 0 FAIL, 0 skipped, 0 cancelled**; Node TAP duration **8.950 seconds**. All 24 endpoint templates were reached. All 69 actual invalid INSERTs returned the expected SQLSTATE; all 15 concurrency cases and both professional/community E2Es passed again. Core implemented V1 functionality remains intact.

Rerun timestamp `2026-10-17T14:31:57.344Z`; real server PostgreSQL 18.6; database **`consultify_test_bf1fd0ae1fc59c61`**. Captured TAP: `/private/tmp/consultify-freeze-audit.tap`. Cluster stopped successfully. The current latest.json describes this audit rerun; final.tap continues to identify the preceding campaign run.

Isolation review confirms a fresh mkdtemp cluster, generated database name, local dynamic port, explicit connection parameters, no .env loading/development connection fallback, empty-schema/current_database checks before migrations, and guaranteed rollback for constraint probes. There are no DROP DATABASE, TRUNCATE, volume removal or existing-cluster startup/stop operations. The DROP TABLE injection fixture is a parameterized string stored as discussion content. Two additional fail-closed guard probes rejected development database URLs before importing the application/database pool, including a mismatched development URL paired with an otherwise valid test-name marker. These guard probes are separate audit checks, not added to the 284-case count.

### Ten-defect regression mapping

| Defect group | Executable regression coverage in tests/backend.test.js | Audit rerun |
| --- | --- | --- |
| B01 absent JSON bodies | missing JSON body route loop; status/comment missing body cases | PASS |
| B02 advisor text types/blanks | object/blank bio create and update; fresh advisor no-persistence case | PASS |
| B03 specialization length | create long specialization and update specialization length 151 | PASS |
| B04 advisor numeric bounds | create/update huge experience and fee cases | PASS |
| B05 booking time/notes | invalid/object time, object notes, invalid calendar-date cases | PASS |
| B06 community/comment types | number domain, object title, array content, comment type cases | PASS |
| B07 title bound | create rejects long title (201 characters) | PASS |
| B08 review types/coercion | boolean/array rating and object/array/number comment cases; numeric-string compatibility | PASS |
| B09 malformed UUIDs | invalidPaths loop plus malformed advisor booking case | PASS |
| B10 query/framework errors | repeated search parameter arrays, malformed JSON, oversized JSON, malformed percent encoding | PASS |

The tests assert real HTTP statuses/JSON, ownership and selected persisted relationships, not mocked database responses. Concurrency tests accept the explicitly allowed per-request results and then assert the combined outcome and row count/terminal state; they do not swallow unexpected statuses. No tests were skipped or modified to obtain this audit result.

### Nonblocking evidence and documentation caveats

- The 69 actual SQLSTATE rejections are verified. However, some tests labelled primary-key checks reuse both an existing primary key and another UNIQUE value (users.email, advisor_profiles.user_id, reviews.appointment_id). They assert `23505` rather than `error.constraint`, so those individual probes do not independently identify which unique constraint fired. The live catalog separately verifies the primary keys. Strengthening future probes with isolated conflicts and constraint-name assertions would improve specificity; no high-severity integrity failure is established.
- Custom latest.json counts wrap executed test bodies and hardcode skipped=0; TAP is the authoritative overall runner outcome, especially if setup/teardown ever fails. TAP and JSON agree on this successful audit run. Endpoint coverage means routes exercised, not exhaustive branch coverage. Generic unexpected-error, real outage, startup failure and every possible race schedule remain outside demonstrated coverage.
- The master specification still describes missing route imports, testing pending, older onboarding rules and inconsistent community search status. The actual code and the user's explicit self-service V1 decision take precedence for this audit. Section I of this report provides the current stable frontend-facing API matrix, including camelCase inputs, snake_case rows, account/profile IDs, string NUMERIC/COUNT values and error statuses. Do not use historical proposed API tables as the React implementation contract. No master-spec rewrite was performed.

### PostgreSQL compatibility

Docker still has no reachable daemon socket. Both local PostgreSQL aliases resolve to 18.6; no 17.4 server is installed. **Only PostgreSQL 18.6 was runtime-tested; 17.4 remains unverified.** Static inspection found no PostgreSQL-18-only SQL in the migrations/controllers. The needed [gen_random_uuid](https://www.postgresql.org/docs/17/functions-uuid.html), [INSERT / ON CONFLICT / RETURNING](https://www.postgresql.org/docs/17/sql-insert.html), and [UPDATE / FROM / RETURNING](https://www.postgresql.org/docs/17/sql-update.html) are supported by PostgreSQL 17. This supports expected compatibility, not a claim that the suite ran on 17.4. Recheck the target version before deployment; no installs, volumes or existing databases were changed for this audit.

### React/Vite connectivity recommendation

Use relative `/api/...` URLs and Vite's built-in [server.proxy](https://vite.dev/config/server-options#server-proxy) during development, forwarding `/api` to `http://127.0.0.1:8000` (or the actual Express PORT), with the `/api` prefix preserved. Bearer Authorization headers remain part of the requests. This requires no Express dependency or contract change. Use a same-origin reverse proxy for `/api` in production; Vite's development proxy is not production infrastructure. If separate browser/API origins are deliberately selected later, configure an explicit allowed-origin CORS policy for the actual methods/headers instead. No frontend/CORS implementation was added now.

Existing limitations remain: self-service advisor identity, unpaginated collections, unselected future-time/timezone/overlap policies, token persistence/revocation and production TLS/rate-limit/backup/deployment checks. No unresolved CRITICAL or HIGH-severity blocker was identified for freezing the tested backend scope. This is not production-launch certification.

### Exact recommended commit set (after owner approval)

```text
src/app.js
src/controllers/advisor.controller.js
src/controllers/appointment.controller.js
src/controllers/auth.controller.js
src/controllers/community.controller.js
src/controllers/review.controller.js
src/routes/appointment.routes.js
src/routes/auth.routes.js
tests/backend.test.js
tests/helpers/harness.js
tests/run-backend.js
docs/BACKEND_TEST_REPORT.md
```

Exclude `.env`, generated `tests/results/` output and the unrelated pre-existing review report. No file was staged and no commit/push/freeze was performed.


## L. Owner-approved V1 backend freeze checkpoint — 17 October 2026

The owner approved freezing the existing Consultify V1 backend API contract and creating/pushing the final Git checkpoint after the successful final audit. The contract is frozen for V1 development with this checkpoint; this is not production-deployment certification.

During frontend development, do not add backend features, rename existing endpoints, change request/response contracts unnecessarily, or change migrations without explicit approval. Only necessary security, correctness or integration fixes are permitted, each supported by regression tests.

Actual routes/controllers and section I of this report are authoritative for frontend integration where historical master-spec documentation contradicts them. PostgreSQL 17.4 runtime compatibility, browser integration and deployment remain unverified; PostgreSQL 18.6 was tested. The historical audit sections above describe their own pre-approval state.

The approved checkpoint includes only the 12 source/test/report files listed in section K. Environment files, generated test results and the unrelated pre-existing review report are excluded. The Git commit itself records the checkpoint SHA and approved commit message.

Checkpoint regression rerun (2026-10-17T16:38:40.916Z UTC): **284/284 PASS, 0 failures, 0 skipped**, including all 15 concurrency cases and both E2E workflows, against fresh isolated database `consultify_test_61e757c969485e63` on PostgreSQL 18.6. The temporary cluster was stopped; generated results remain excluded from the checkpoint.
