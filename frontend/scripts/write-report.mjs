// Produce the handoff matrix from observed browser responses, not helper existence.
import { readFileSync, writeFileSync } from "node:fs";
import { endpoints } from "../tests/endpoint-contract.js";
const evidence = JSON.parse(
  readFileSync(new URL("../test-results/e2e.json", import.meta.url)),
);
const environment = JSON.parse(
  readFileSync(new URL("../test-results/environment.json", import.meta.url)),
);
const matrix = endpoints
  .map(([method, path, fn, action, auth, expected]) => {
    const calls = evidence.calls.filter(
      (c) => c.method === method && c.path === path,
    );
    const actual = [...new Set(calls.map((c) => c.status))].sort(
      (a, b) => a - b,
    );
    const status = !calls.length
      ? "NOT TESTED"
      : actual.every((s) => expected.includes(s)) &&
          evidence.results.every((r) => r.status === "PASS")
        ? "PASS"
        : "FAIL";
    return `| ${method} \`${path}\` | \`${fn}\` — ${action} | ${auth} | ${expected.join(", ")} | ${actual.join(", ") || "—"} (${calls.length} requests) | ${calls.length ? "Yes" : "No"} / ${status} |`;
  })
  .join("\n");
const workflows = evidence.results
  .map((r) => `| ${r.name} | ${r.status} |`)
  .join("\n");
const contents = `# Consultify V1 — implementation and test report

**COMPLETE for the requested local V1 implementation and feasible verification.** No deployment, commit, or push was performed. Final verification date: 3 November 2026 (Asia/Kolkata); evidence timestamp: ${environment.date}.

## A. Implementation summary

All required routes are implemented: landing; login; member/advisor registration; advisor directory/detail/reviews; role-aware dashboard; advisor profile creation/editing; member/advisor appointments; community feed/new/detail/comments/helpful/owner deletion; account; and 404.

Features use actual Express APIs and persisted PostgreSQL data. Role guards wait for session restoration. Registration uses separate member/advisor endpoints and does not expect a token. Profile inputs map camelCase to snake_case responses. Profile/account UUIDs remain distinct. Public profile lookup matches user_id to the authenticated account. Search/filter queries use search/domain. Numeric strings are converted for display. Local booking times are serialized with toISOString(). Appointment transitions and cancellation follow the frozen contract. Reviews and helpful votes surface duplicate 409s without claiming success. Forms show pending/error states, prevent double submission, and reload relevant server data after mutation.

## B. Visual design

Both supplied images were inspected in the conversation after the owner attached them. The Mark Dowson reference informed charcoal/slate fields, orange geometric bands, negative space and confident typography. The Solene reference informed midnight navy, warm ivory, muted rust, restrained lettering and editorial hierarchy. Company names, logos, stationery, monograms and watermarks were not reused. Consultify has an original open-C/directional SVG mark, wordmark and favicon; geometric CSS artwork avoids unnecessary bitmap assets.

Palette: navy #202B3B; slate #30414B; ivory #F3EEE5; paper #FCFAF7; orange #E77D47; rust #A34A30; brown #92675D. Arial/Helvetica/system sans-serif avoids external font dependencies. Shared fields, buttons, alerts, statuses, empty/loading states, cards and workspace layouts provide consistency. Mobile forms use 16px controls; menus and controls are keyboard accessible with visible focus, labels and a skip link. No fake advisors, statistics, testimonials, verification, payments or call functionality was added.

Manual screenshot inspection covered the desktop/mobile landing page, desktop advisor dashboard, mobile profile editor and mobile appointment page. Hero decorative lettering was moved inside its rounded frame after inspection. A mobile spacing gap was reduced. Screenshots are local, Git-ignored test artifacts.

## C. API coverage matrix

**24/24 templates PASS.** Every row records real requests to the frozen Express app and isolated PostgreSQL through Vite. Each user-facing operation was exercised using the rendered UI. Health is an internal check invoking the actual client health() helper in the browser. Additional terminal-state probes use browser fetch and are separate from the button workflows. The browser suite asserts that every template is reached and every observed status belongs to its expected set.

“Handled / Result” means the associated UI/data assertions passed, including expected error feedback. Expected statuses list this suite's scenarios, not every possible backend response. A 500 in auth rows is the deliberate stopped-Express outage, followed by successful recovery. Failed offline transport has no HTTP status and is listed separately. Missing/malformed resource IDs and repeated mutations are deliberate negative checks.

| Method / path | Frontend function and page/action | Authentication | Expected HTTP | Actual HTTP / requests | Handled / Result |
| --- | --- | --- | --- | --- | --- |
${matrix}

Raw evidence: [browser responses and assertions](test-results/e2e.json), [environment](test-results/environment.json). These are local Git-ignored files, generated on rerun. The full mapping is maintained in tests/endpoint-contract.js. No helper-only row is counted as integrated.

## D. Browser E2E results

${evidence.results.length} workflow/check groups passed, zero failed, zero skipped. All run in installed Google Chrome ${evidence.browser} using Playwright, real Express and real PostgreSQL. The integration suite does not mock API responses. The separate client unit tests deliberately use controlled responses and do not count as endpoint coverage.

| Workflow/check group | Result |
| --- | --- |
${workflows}

The acceptance lifecycle was performed through forms/buttons: register both roles → create/edit advisor profile → member booking → pending → advisor confirmation → completion → member review → public rating 5.0/count 1. A second review returns 409 and clear feedback. Separate cancellation ends in CANCELLED, removes invalid actions, and rejects repeat cancellation/advisor transition with 404. Community publishes a post, finds it by search/filter, opens it, adds a comment, marks helpful, receives duplicate 409 feedback, deletes the comment and deletes the discussion. Counts and resulting UI were asserted.

## E. Responsive testing

**${evidence.layouts.length}/${evidence.layouts.length} route/state/viewport checks PASS** at 375, 390, 768, 1280 and 1440px, each 900px high. Public routes, both role dashboards, profile editing, appointment lists, account, advisor details, community feed/detail/composer and not-found states were checked. Every check measured document scrollWidth against viewport width; no horizontal overflow. A 390×844 mobile menu navigation was also clicked. The suite captured desktop/mobile screenshots of representative screens; no clipping of important controls was observed in the inspected screenshots.

Automated width checks do not prove every possible content length or device layout. Screenshots of current data and empty states are evidence, not a cross-browser certification. Safari, Firefox, real touch hardware, screen readers and a complete automated accessibility audit are **NOT TESTED**.

Representative artifacts: [desktop landing](test-results/public-_-1440.png), [mobile landing](test-results/public-_-390.png), [advisor dashboard](test-results/advisor-_dashboard-1440.png), [mobile profile](test-results/advisor-_advisor_profile-390.png), [mobile bookings](test-results/member-_user_appointments-390.png).

## F. Error handling and runtime quality

- Invalid login returns 401 with backend feedback; duplicate member registration returns 409. Password mismatch and blank discussion input are blocked with clear validation.
- Session refresh waits for /auth/me. Invalid and genuinely signed expired JWTs return 401 and lead to Login. User/advisor wrong-role screens redirect to their dashboard; advisor booking controls are absent.
- A stopped Express server produces a proxy error shown as temporary unavailability. Restoration retains the token on temporary failure, offers Retry session, and succeeds after Express restarts. Browser offline login shows a connection error. Neither failure claims success.
- Missing advisor/post IDs return 404. Malformed advisor IDs return 400. Retry UI appears for failed resource reads.
- Duplicate review/helpful actions return 409 and retain genuine server counts. Terminal appointment changes return 404. Deletion requires an inline confirmation and uses author_id ownership controls.
- ${evidence.runtime.length} JavaScript runtime errors. No unexpected failed transport requests. Expected browser resource diagnostics for deliberately rejected 400/401/404/409/500 requests are not treated as JavaScript exceptions; one offline request failure is intentional.
- Shared-client unit tests: **6/6 PASS**, including JSON/Bearer handling, public-login headers, 401 expiry, late-401 protection for newer sessions, malformed/empty bodies and network/HTTP errors.
- Build: **PASS** after npm ci, using Vite 7.3.7; 69 modules. Output JS approximately 306.75 kB (95.54 kB gzip), CSS approximately 28.24 kB (6.61 kB gzip). React Router's package-level “use client” directives generate nonfatal Vite warnings. npm emitted allow-scripts notices for esbuild/fsevents; installation, build and browser execution all succeeded.
- The initial browser campaign found a logout navigation race; logout and the protected-route guard now consistently lead to Login, and the final suite passes. An initial health test accidentally used the Playwright response status() method on a browser Fetch Response; the test was corrected to invoke the actual shared client health() helper. Earlier failed runs are not counted as passing final evidence.

## G. Testing environment and isolation

Node ${environment.node}; npm 11.16.0; React 19.3.1; React Router 7.18.5; Vite 7.3.7; Playwright 1.64.1; Google Chrome ${evidence.browser}.

Final PostgreSQL: **${environment.postgres.split(" on ")[0]}**, matching the Compose 17.4 version. Final generated database: ${environment.database}. A new randomly named Docker container uses a loopback ephemeral port and tmpfs data, generated password and test-only JWT secret. The runner verifies the generated database name, current_database() and empty public schema before applying migrations 001–005. It starts the existing Express app and Vite on owned ephemeral ports. It never reads .env, connects to an existing database or touches the existing development container. Finally it stops/removes its own container and servers. No Docker volume is removed. Secrets are not included in evidence.

An earlier core workflow suite also passed with a separate temporary native PostgreSQL 18.6 cluster. Final expanded evidence and all claims above refer to the final 17.4 run. The old backend 284-case suite was not rerun because doing so would overwrite the owner's pre-existing tests/results files; those files are preserved byte-for-byte. Browser/UI checks here independently cover every frozen endpoint template.

Commands executed successfully from frontend/:

~~~sh
npm ci --no-audit --no-fund --cache /tmp/consultify-npm-cache
npm run build
npm test
npm run test:e2e:pg17
~~~

Native alternative tested earlier: npm run test:e2e. Normal user commands do not require the custom npm cache. The sandbox required approved escalation for dependency network downloads, local sockets, Docker and browser startup. Final owned servers/container were stopped.

## H. Known limitations and boundaries

No known blocking frontend defect remains in the exercised scope. This is a tested local V1, not a production deployment certification. Static deployment needs a same-origin /api reverse proxy plus SPA fallback; Vite's dev proxy is not production infrastructure, and vite preview does not proxy the API. There is no deployment in this task.

The frozen backend does not store fee currency, expose appointment availability or per-appointment review status, support unlike, account edits, refresh tokens, or pagination. The UI communicates these constraints and handles server conflicts. Advisor credentials are self-declared. SessionStorage is JavaScript accessible and vulnerable to token theft if XSS occurs; logout does not revoke a token on the server. Fees are amounts as listed; no currency/payment claim is invented. Consultation execution itself (calls/messages) occurs outside the platform. Finance is the only domain.

An exhaustive backend security/concurrency rerun, every possible validation boundary, load testing, production hosting/TLS, mobile device/browser combinations, and comprehensive accessibility conformance are **NOT TESTED** by this frontend campaign. They are not represented as completed.

## I. Backend and Git integrity

A SHA-256 baseline captured before implementation verifies **35/35 existing files unchanged**, including backend production source, migrations, root package/lockfile, .env, Docker configuration, existing test sources/results and docs. No old reverted frontend code was restored or reused. No existing database records were accessed by integration testing. No backend packages or endpoints were added.

Git checkpoint remains 7ba50e9. No tracked files modified. New implementation is entirely under frontend/. Existing untracked docs/COMPREHENSIVE_CODE_REVIEW_REPORT.md and tests/results/ remain preserved. Git status:

~~~text
?? docs/COMPREHENSIVE_CODE_REVIEW_REPORT.md
?? frontend/
?? tests/results/
~~~

No files staged, committed or pushed. frontend/.gitignore excludes node_modules, dist, test-results, playwright-report and local environment overrides. New source/config/tests/docs can be reviewed with the frontend directory; generated artifacts are not commit candidates. See README.md for exact local application startup commands.
`;
writeFileSync(new URL("../TEST_REPORT.md", import.meta.url), contents);
console.log(
  `Wrote TEST_REPORT.md with ${endpoints.length} observed endpoint rows.`,
);
