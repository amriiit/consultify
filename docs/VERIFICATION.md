# Verification record

This is a sanitized, point-in-time summary of executed checks on **6 November 2026**. It contains no account credentials, JWTs, record-ID manifest or raw traces.

| Run | Result | Environment |
|---|---|---|
| Initial production browser/API audit | 105 executed: 104 passed, 1 failed; 4 blocked, 2 skipped | Real deployed Vercel/Railway application, Chrome, synthetic accounts |
| Reconciled audit ledger | 111 planned: 104 passed, 1 failed, 4 blocked, 2 skipped | Same105 executed checks; an additional visual screenshot judgment was blocked |
| Backend fix regression run | 297 passed, 0 failed | Disposable native PostgreSQL 18.6, existing Node.js test runner |
| Frontend client tests | 6 passed, 0 failed | Node.js tests with controlled API responses |
| Frontend build | Passed | Vite production build |
| Deployment smoke verification | 23 passed, 0 failed | Both production domains and real Chrome navigation/refresh |

The final ledger contains 111 planned checks when blocked and skipped scenarios are included; 105 were executed.

## What the production audit exercised

Member/advisor registration and login; advisor profile creation/editing; discovery/search; customer booking; advisor confirmation/completion; review publication and public persistence; cancellation; community post/comment/helpful interactions and owner deletion. Reloads and fresh API reads checked persistence. Authorization probes targeted only synthetic records.

The review test's first attempt stopped at an overly strict test locator. After correcting only the audit selector, a minimal additional synthetic fixture completed publication, persistence and duplicate-review checks. Final check outcomes reflect that executed retry, with the original failure retained privately. It was not an application-code fix.

## Confirmed issue and deployed fix

The audit found HTTP404 with HTML for unmatched API routes. [Commit5adc5d8](https://github.com/amriiit/consultify/commit/5adc5d88a3074efe329735d4ffcdf5b330a1a983) adds a JSON fallback after the real routers and13 regression checks. Railway and Vercel reported successful deployment for that commit. The later 23-check smoke run verified JSON404 through both domains, health200 with a connected database, valid public lists, protected endpoint rejection and browser routes/refresh.

The public endpoints were checked again while capturing this README: both `/api/nonexistent-route` responses returned404 with `{"message":"API endpoint not found"}`. Screenshot capture used read-only navigation and created no records.

## Limits

Natural expiry of a correctly signed production JWT, direct production SQL inspection, Firefox/Safari behavior and reliable visual confirmation of the original mobile review screenshot remain unverified. Real production-outage testing and deletion of records without supported application deletion functions were skipped. No penetration/load test, coverage percentage, benchmark or security certification is claimed.

The isolated suite already tests expired-token rejection, but that does not close the natural-production-expiration gap. The post-fix smoke checks did not repeat authenticated production mutations. The full data-creating audit was not rerun after deployment.

## Reproduction and evidence handling

From the project root, `node tests/run-backend.js` creates its own native PostgreSQL cluster. In `frontend/`, `npm test` runs client tests and `npm run test:e2e` launches isolated browser infrastructure. The latter needs native PostgreSQL tools and Google Chrome. Existing runners generate their own test secrets and retain local outputs for inspection.

Raw production-audit evidence remains Git-ignored. The [documentation screenshots](screenshots/README.md) are selected UI-only copies with synthetic data; they are not raw HAR files, traces, session dumps or proof of every possible workflow. Detailed internal evidence was reviewed for secrets before selecting these assets. The screenshot from the unreliable mobile review capture is excluded.
