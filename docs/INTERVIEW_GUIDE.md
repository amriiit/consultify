# Consultify interview preparation

Use these answers as starting points. Open the linked implementation and be ready to explain its limitations as well as its behavior.

1. **What problem does Consultify solve?**

   It connects members with financial advisors through searchable profiles and consultation requests, with community discussions and completed-appointment reviews. V1 is finance-only; it does not deliver video consultations or process payments.

2. **Walk through a production API request.**

   React calls a relative `/api` URL through the [shared client](../frontend/src/api/client.js). Vercel forwards it to Railway using [rewrites](../frontend/vercel.json). Express routes to middleware/controllers; controllers use the shared `pg` pool to access Railway PostgreSQL. The response returns through the same proxy.

3. **Why use a relative `/api` path?**

   It keeps browser calls on the frontend origin. Vite proxies locally; Vercel rewrites in production. API rewrites precede the SPA fallback so an API error is not replaced with React HTML. This setup does not require adding cross-origin browser API calls.

4. **Where does backend startup configuration come from?**

   [server.js](../src/server.js) loads dotenv for local development, reads `PORT` (default 8000), checks the pool with `SELECT 1`, then starts Express. [db.js](../src/config/db.js) uses `DATABASE_URL`. Railway supplies cloud runtime values; frontend code never receives database credentials.

5. **How does registration protect passwords?**

   The [auth controller](../src/controllers/auth.controller.js) validates input, normalizes email, enforces at least 12 characters and at most 72 UTF-8 bytes, then hashes with bcrypt cost 12. SQL stores `password_hash`; registration/login/current-user responses exclude it. Byte limits matter for multibyte passwords.

6. **What is inside a JWT, and what verifies it?**

   Login signs `userID` and `role` with `JWT_SECRET`, using `JWT_EXPIRES_IN` or a one-hour default. [Authentication middleware](../src/middlewares/auth.middleware.js) verifies the bearer token. Its decoded claims are trusted only after signature/expiry validation; decoding on the frontend is not authentication.

7. **Where is the token stored, and what are the tradeoffs?**

   `sessionStorage` holds the token for the current tab. [AuthContext](../frontend/src/context/AuthContext.jsx) restores the user through `/api/auth/me` and checks expiry for UI behavior. JavaScript can read that storage, so XSS remains a risk. There are no refresh tokens or server-side revocation; logout clears local state.

8. **How do role checks differ from ownership checks?**

   `authorize("ADVISOR")` permits a class of operation. The controller's SQL must also limit it to the advisor's own appointment/profile. A valid advisor JWT is not permission to edit another advisor's appointment. Frontend protected routes improve navigation but are not the security boundary.

9. **Explain the appointment lifecycle.**

   A member creates a `PENDING` request. The assigned advisor can move `PENDING → CONFIRMED → COMPLETED`; the [update query](../src/controllers/appointment.controller.js) includes both owner and previous-state predicates. A customer can cancel their own pending/confirmed request. Terminal or unauthorized updates match no row.

10. **Does the system prevent double booking or past bookings?**

    It has no availability or unique-time-slot constraint. The UI rejects past times; the API validates date parsing without a future-time rule. Two same-slot requests can exist. I would define the scheduling policy before adding a database/application constraint; I would not claim it already exists.

11. **Why reference `advisor_profiles.id` from appointments instead of just an advisor user ID?**

    A bookable advisor has a profile containing specialization, fee and experience. `appointments.advisor_id` references that entity; the profile's unique `user_id` links it to an account. The [migration](../database/migrations/003_create_appointments.sql) and joins make that distinction explicit.

12. **How are reviews restricted?**

    The [review controller](../src/controllers/review.controller.js) loads the appointment, checks the requesting member owns it and its state is `COMPLETED`, and validates an integer rating 1–5. A unique `reviews.appointment_id` constraint limits reviews to one per appointment. It is not a one-review-per-advisor rule.

13. **How is duplicate helpful voting handled?**

    [post_helpful](../database/migrations/004_create_community.sql) has a composite primary key `(post_id, user_id)`. The insert uses `ON CONFLICT DO NOTHING RETURNING`; no returned row produces409. Both roles may vote; removing a helpful vote is not implemented.

14. **Which responsibilities belong in SQL constraints versus controllers?**

    Foreign keys preserve references; unique constraints enforce email/profile-owner/review uniqueness; checks bound ratings, statuses and numeric values. Controllers add role, ownership, lifecycle and finance-only rules. A valid foreign key alone does not authorize a request. There is no ORM or separate model/service layer.

15. **How is SQL injection risk addressed?**

    Controllers pass request values as `$1`, `$2`, etc. parameters to `pg`, rather than concatenating them into SQL. Directory search uses bound values with `ILIKE`. This does not mean every broader input/security concern is solved; input validation and authorization are still necessary.

16. **What was the production JSON404 bug?**

    Normal unmatched routes fell through to Express's default HTML final handler; the four-argument error middleware never received an error. The [fix](../src/app.js) adds a normal `/api` fallback after valid routers. It returns safe JSON404 while parser errors skip it and reach the unchanged error handler. Thirteen regressions check scope, routing and error precedence.

17. **How does the frontend avoid stale-response/session races?**

    [useResource](../frontend/src/hooks/useResource.js) uses a generation counter to reject results from superseded loads. The client clears a token on401 only if that token is still current, so a late response from an old session cannot erase a newer login. AuthContext has its own revision guard for restoration.

18. **What testing can you defend, and what remains unverified?**

    The isolated backend run passed 297 checks; six frontend client tests passed. A real production browser audit executed 105 checks with 104 passes and one HTML404 failure; after the fix, 23 live smoke checks passed. These are different runs. Natural production JWT expiry, direct production SQL inspection, Firefox/Safari and the original mobile review capture were not verified. There is no measured coverage percentage or performance benchmark.

19. **How do the test runners avoid existing database data?**

    [The backend runner](../tests/run-backend.js) creates a new native cluster and a randomly named database, checks identity/empty schema, applies migrations and runs tests with ephemeral secrets. The browser runner similarly owns isolated infrastructure. Neither should run against production; raw generated evidence stays private.

20. **What would you improve before accepting real users?**

    Define scheduling and currency rules; add account recovery/verification and an explicit session policy; review throttling/security headers, moderation, monitoring and backups; add CI test gates and broader accessibility/browser tests. The current architecture does not justify claiming these as completed. Cleanup also needs care: accounts/profiles/appointments/reviews have no application deletion endpoints, so deleting test records requires separate authorization and foreign-key/dependency review.
