import { chromium } from "playwright";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
export async function runBrowserChecks({
  url,
  client,
  database,
  postgres,
  expiredToken,
}) {
  const output = resolve(import.meta.dirname, "../test-results");
  mkdirSync(output, { recursive: true });
  const options = existsSync(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  )
    ? {
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      }
    : {};
  const browser = await chromium.launch({ headless: true, ...options });
  const results = [],
    runtimeErrors = [],
    endpoints = new Set();
  const started = Date.now();
  const advisorContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const userContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const visitorContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const a = await advisorContext.newPage(),
    u = await userContext.newPage(),
    v = await visitorContext.newPage();
  for (const page of [a, u, v]) {
    page.setDefaultTimeout(10000);
    page.on("pageerror", (e) => runtimeErrors.push(e.message));
    page.on("response", (r) => {
      const path = new URL(r.url()).pathname;
      if (path.startsWith("/api/"))
        endpoints.add(
          `${r.request().method()} ${path.replace(/[a-f0-9]{8}-[a-f0-9-]{27}/g, ":id").replace("/not-a-uuid", "/:id")}`,
        );
    });
  }
  async function check(name, fn) {
    const record = { name, status: "FAIL" };
    results.push(record);
    try {
      await fn();
      record.status = "PASS";
      console.log(`PASS ${name}`);
    } catch (e) {
      record.error = e.message;
      throw new Error(`${name}: ${e.message}`);
    }
  }
  async function shown(page, text) {
    await page
      .getByText(text, { exact: false })
      .first()
      .waitFor({ state: "visible" });
  }
  async function mutation(page, path, action, status = 201) {
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === path && r.request().method() !== "GET",
    );
    await action();
    const r = await response;
    assert.equal(r.status(), status, `${path} status`);
    return r.json();
  }
  const credentials = {
    user: `${randomUUID()}@consultify-test.invalid`,
    advisor: `${randomUUID()}@consultify-test.invalid`,
    password: `Test-only-${randomUUID()}`,
  };
  async function register(page, advisor) {
    await page.goto(url + (advisor ? "/register/advisor" : "/register"));
    await page
      .getByLabel("Full name")
      .fill(advisor ? "Browser Finance Advisor" : "Browser User");
    await page
      .getByLabel("Email address")
      .fill(advisor ? credentials.advisor : credentials.user);
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    await page.getByLabel("Confirm password").fill(credentials.password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL("**/login");
  }
  async function login(page, advisor) {
    await page.goto(url + "/login");
    await page
      .getByLabel("Email address")
      .fill(advisor ? credentials.advisor : credentials.user);
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await shown(page, "Good to see you");
  }
  let profileId, appointmentId, cancelledId, postId;
  try {
    await check(
      "Vite proxy reaches real Express/PostgreSQL health",
      async () => {
        const response = await v.request.get(url + "/api/health");
        assert.equal(response.status(), 200);
        assert.deepEqual(await response.json(), {
          status: "ok",
          database: "connected",
        });
        endpoints.add("GET /api/health");
      },
    );
    await check(
      "Public/mobile landing, empty directory, protected destination",
      async () => {
        await v.goto(url);
        await v
          .getByRole("heading", { name: "Your money.", exact: false })
          .waitFor();
        await v.screenshot({
          path: resolve(output, "home-mobile.png"),
          fullPage: true,
        });
        await v.getByRole("button", { name: "Menu", exact: true }).click();
        await v
          .getByRole("navigation")
          .getByRole("link", { name: "Advisors", exact: true })
          .click();
        await shown(v, "A new community is taking shape");
        await v.goto(url + "/community/new");
        await v.waitForURL("**/login");
      },
    );
    await check("Advisor registration and real login", async () => {
      await register(a, true);
      await login(a, true);
    });
    await check("Advisor creates and edits professional profile", async () => {
      await a.goto(url + "/advisor/profile");
      await a
        .getByLabel("Specialization", { exact: true })
        .fill("Investment planning");
      await a
        .getByLabel("Professional bio")
        .fill(
          "Thoughtful guidance about financial planning and long-term investing.",
        );
      await a.getByLabel("Years of experience").fill("7");
      await a.getByLabel("Consultation fee").fill("500.50");
      const created = await mutation(a, "/api/advisors/profile", () =>
        a.getByRole("button", { name: "Create professional profile" }).click(),
      );
      profileId = created.advisorProfile.id;
      await shown(a, "Your professional profile is ready");
      await a
        .getByLabel("Professional bio")
        .fill(
          "Updated financial planning guidance for thoughtful long-term investing.",
        );
      await mutation(
        a,
        "/api/advisors/profile",
        () => a.getByRole("button", { name: "Save profile" }).click(),
        200,
      );
      await shown(a, "Your profile has been updated");
      await a.getByRole("link", { name: "View public profile" }).click();
      await shown(a, "Updated financial planning guidance");
      await shown(a, "No reviews yet");
    });
    await check(
      "User registration, password mismatch, login and session refresh",
      async () => {
        await u.goto(url + "/register");
        await u.getByLabel("Full name").fill("Browser User");
        await u.getByLabel("Email address").fill(credentials.user);
        await u
          .getByLabel("Password", { exact: true })
          .fill(credentials.password);
        await u.getByLabel("Confirm password").fill("Mismatched-password");
        await u
          .getByRole("button", { name: "Create account", exact: true })
          .click();
        await shown(u, "Your passwords don’t match");
        await register(u, false);
        await login(u, false);
        await u.reload();
        await shown(u, "Good to see you");
        await u.goto(url + "/account");
        await shown(u, credentials.user);
      },
    );
    await check(
      "User directory search, public detail and local-time booking",
      async () => {
        await u.goto(url + "/advisors");
        await u.getByRole("searchbox").fill("INVESTMENT");
        await u.getByRole("button", { name: "Search", exact: true }).click();
        await u.getByRole("link", { name: "View profile & reviews" }).click();
        assert.ok(u.url().endsWith("/advisors/" + profileId));
        const future = new Date(Date.now() + 7 * 86400000);
        const day = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
        await u.getByLabel("Date", { exact: true }).fill(day);
        await u.getByLabel("Time", { exact: true }).fill("11:15");
        await u
          .getByLabel("Notes (optional)")
          .fill("Discuss long-term investments");
        await shown(u, "Your local time:");
        const created = await mutation(u, "/api/appointments", () =>
          u
            .getByRole("button", { name: "Request appointment", exact: true })
            .click(),
        );
        appointmentId = created.appointment.id;
        assert.equal(created.appointment.advisor_id, profileId);
        assert.equal(
          created.appointment.scheduled_at,
          new Date(`${day}T11:15`).toISOString(),
        );
        await u.getByRole("link", { name: "View my appointments" }).click();
        await shown(u, "Discuss long-term investments");
      },
    );
    await check(
      "User books another appointment and cancels through confirmation",
      async () => {
        await u.goto(url + "/advisors/" + profileId);
        const future = new Date(Date.now() + 8 * 86400000);
        const day = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
        await u.getByLabel("Date", { exact: true }).fill(day);
        await u.getByLabel("Time", { exact: true }).fill("12:30");
        await u.getByLabel("Notes (optional)").fill("Cancellation scenario");
        cancelledId = (
          await mutation(u, "/api/appointments", () =>
            u
              .getByRole("button", { name: "Request appointment", exact: true })
              .click(),
          )
        ).appointment.id;
        await u.getByRole("link", { name: "View my appointments" }).click();
        const card = u
          .locator(".appointment-card")
          .filter({ hasText: "Cancellation scenario" });
        await card
          .getByRole("button", { name: "Cancel appointment", exact: true })
          .click();
        await mutation(
          u,
          `/api/appointments/${cancelledId}/cancel`,
          () =>
            u
              .getByRole("dialog")
              .getByRole("button", { name: "Cancel appointment", exact: true })
              .click(),
          200,
        );
        await shown(u, "Appointment cancelled.");
        await card.getByText("Cancelled", { exact: true }).waitFor();
      },
    );
    await check(
      "Advisor incoming appointment confirms then completes; role guard",
      async () => {
        await a.goto(url + "/advisor/appointments");
        const card = a
          .locator(".appointment-card")
          .filter({ hasText: "Discuss long-term investments" });
        await card
          .getByRole("button", { name: "Confirm appointment", exact: true })
          .click();
        await mutation(
          a,
          `/api/appointments/${appointmentId}/status`,
          () =>
            a
              .getByRole("dialog")
              .getByRole("button", { name: "Confirm appointment", exact: true })
              .click(),
          200,
        );
        await shown(a, "Appointment status updated.");
        await card
          .getByRole("button", { name: "Mark completed", exact: true })
          .click();
        await mutation(
          a,
          `/api/appointments/${appointmentId}/status`,
          () =>
            a
              .getByRole("dialog")
              .getByRole("button", { name: "Mark completed", exact: true })
              .click(),
          200,
        );
        await card.getByText("Completed", { exact: true }).waitFor();
        await a.goto(url + "/user/appointments");
        await shown(a, "This area belongs to a different role");
      },
    );
    await check(
      "Review submission, public aggregate and duplicate 409 UX",
      async () => {
        await u.goto(url + "/user/appointments");
        const card = u
          .locator(".appointment-card")
          .filter({ hasText: "Discuss long-term investments" });
        await card.getByRole("button", { name: "Write a review" }).click();
        await card.getByLabel("Rating", { exact: true }).selectOption("5");
        await card
          .getByLabel("Your review (optional)")
          .fill("Helpful and thoughtful financial guidance.");
        await mutation(u, "/api/reviews", () =>
          card.getByRole("button", { name: "Submit review" }).click(),
        );
        await shown(u, "Your review has been submitted");
        await u.goto(url + "/advisors/" + profileId);
        await shown(u, "5.0 / 5 · 1 review");
        await shown(u, "Helpful and thoughtful financial guidance.");
        await u.goto(url + "/user/appointments");
        const again = u
          .locator(".appointment-card")
          .filter({ hasText: "Discuss long-term investments" });
        await again.getByRole("button", { name: "Write a review" }).click();
        await again.getByLabel("Rating", { exact: true }).selectOption("4");
        await mutation(
          u,
          "/api/reviews",
          () => again.getByRole("button", { name: "Submit review" }).click(),
          409,
        );
        await shown(u, "This appointment already has a review");
      },
    );
    await check(
      "Community creation, search, advisor comment and ownership controls",
      async () => {
        await u.goto(url + "/community/new");
        await u
          .getByLabel("Discussion title")
          .fill("A browser-tested financial question");
        await u
          .getByLabel("Your discussion", { exact: true })
          .fill("How should I begin a long-term investment plan?");
        postId = (
          await mutation(u, "/api/community/posts", () =>
            u.getByRole("button", { name: "Publish discussion" }).click(),
          )
        ).post.id;
        await shown(u, "A browser-tested financial question");
        assert.ok(u.url().endsWith("/community/" + postId));
        await a.goto(url + "/community/" + postId);
        assert.equal(
          await a
            .getByRole("button", { name: "Delete discussion", exact: true })
            .count(),
          0,
        );
        await a
          .getByLabel("Your comment", { exact: true })
          .fill("Start with your goals and a sustainable savings habit.");
        await mutation(a, `/api/community/posts/${postId}/comments`, () =>
          a.getByRole("button", { name: "Post comment" }).click(),
        );
        await shown(a, "1 comment");
        await shown(a, "Start with your goals");
        await u.reload();
        assert.equal(
          await u
            .getByRole("button", { name: "Delete comment", exact: true })
            .count(),
          0,
        );
        await u.goto(url + "/community");
        await u.getByRole("searchbox").fill("browser-tested");
        await u.getByRole("button", { name: "Search", exact: true }).click();
        await u
          .getByRole("link", {
            name: "A browser-tested financial question",
            exact: true,
          })
          .click();
      },
    );
    await check(
      "Helpful votes and repeated vote conflict handling",
      async () => {
        await mutation(u, `/api/community/posts/${postId}/helpful`, () =>
          u.getByRole("button", { name: "Mark helpful", exact: true }).click(),
        );
        await shown(u, "1 helpful");
        await u.reload();
        await mutation(
          u,
          `/api/community/posts/${postId}/helpful`,
          () =>
            u
              .getByRole("button", { name: "Mark helpful", exact: true })
              .click(),
          409,
        );
        await shown(u, "You have already marked this discussion helpful");
      },
    );
    await check(
      "Owned comment deletion and owned post cascade through UI",
      async () => {
        await a.goto(url + "/community/" + postId);
        await a
          .getByRole("button", { name: "Delete comment", exact: true })
          .click();
        await mutation(
          a,
          `/api/community/comments/${(await client.query("SELECT id FROM comments WHERE post_id=$1", [postId])).rows[0].id}`,
          () =>
            a
              .getByRole("dialog")
              .getByRole("button", { name: "Delete comment", exact: true })
              .click(),
          200,
        );
        await shown(a, "0 comments");
        await a
          .getByLabel("Your comment", { exact: true })
          .fill("Disposable cascade child");
        await mutation(a, `/api/community/posts/${postId}/comments`, () =>
          a.getByRole("button", { name: "Post comment" }).click(),
        );
        await shown(a, "Disposable cascade child");
        await u.reload();
        await u
          .getByRole("button", { name: "Delete discussion", exact: true })
          .click();
        await mutation(
          u,
          `/api/community/posts/${postId}`,
          () =>
            u
              .getByRole("dialog")
              .getByRole("button", { name: "Delete discussion", exact: true })
              .click(),
          200,
        );
        await u.waitForURL("**/community");
        for (const table of ["comments", "post_helpful"])
          assert.equal(
            (
              await client.query(`SELECT * FROM ${table} WHERE post_id=$1`, [
                postId,
              ])
            ).rowCount,
            0,
          );
      },
    );
    await check(
      "Public mobile detail, no overflow, browser history and SPA refresh",
      async () => {
        await v.goto(url + "/advisors/" + profileId);
        await shown(v, "5.0 / 5 · 1 review");
        await v.reload();
        await shown(v, "Helpful and thoughtful financial guidance.");
        assert.equal(
          await v.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
          ),
          false,
        );
        await v.screenshot({
          path: resolve(output, "advisor-mobile.png"),
          fullPage: true,
        });
        await v
          .getByRole("link", { name: "All financial advisors", exact: false })
          .click();
        await v.goBack();
        await shown(v, "Start a conversation.");
        await v.goto(url + "/community");
        await shown(v, "Every good discussion starts");
        await v.goto(url + "/missing-page");
        await shown(v, "This page is a little off track");
        await a.goto(url + "/advisor/profile");
        await shown(a, "Client perspectives");
        await a.screenshot({
          path: resolve(output, "advisor-desktop.png"),
          fullPage: true,
        });
      },
    );
    await check(
      "Real backend errors, empty search, network failure retry and expired session",
      async () => {
        await u.goto(url + "/advisors?search=no-such-advisor");
        await shown(u, "No advisors matched your search");
        await u.goto(url + "/advisors/not-a-uuid");
        await shown(u, "Invalid resource ID");
        await u.goto(url + "/advisors");
        await shown(u, "Browser Finance Advisor");
        await userContext.setOffline(true);
        await u.getByRole("searchbox").fill("planning");
        await u.getByRole("button", { name: "Search", exact: true }).click();
        await shown(u, "We couldn’t reach Consultify");
        await userContext.setOffline(false);
        await u.getByRole("button", { name: "Try again", exact: true }).click();
        await shown(u, "Browser Finance Advisor");
        const identity = (
          await client.query("SELECT id FROM users WHERE email=$1", [
            credentials.user,
          ])
        ).rows[0];
        await u.evaluate(
          (token) => sessionStorage.setItem("consultify.session", token),
          expiredToken({ userID: identity.id, role: "USER" }),
        );
        await u.reload();
        await shown(u, "Your session has expired");
        assert.ok(
          (await u.evaluate(() =>
            sessionStorage.getItem("consultify.session"),
          )) === null,
          "Session token should be cleared",
        );
        await u.goto(url + "/account");
        await u.waitForURL("**/login");
      },
    );
    await check(
      "Expired-session return destination and rejected login feedback",
      async () => {
        await u.getByLabel("Email address").fill(credentials.user);
        await u
          .getByLabel("Password", { exact: true })
          .fill("Wrong-test-password");
        await u.getByRole("button", { name: "Sign in", exact: true }).click();
        await shown(u, "Invalid email or password");
        await u
          .getByLabel("Password", { exact: true })
          .fill(credentials.password);
        await u.getByRole("button", { name: "Sign in", exact: true }).click();
        await u.waitForURL("**/account");
        await shown(u, credentials.user);
        await u.goto(url + "/advisor/profile");
        await shown(u, "This area belongs to a different role");
      },
    );
    await check(
      "All primary public, USER and ADVISOR screens fit mobile and tablet",
      async () => {
        const publicRoutes = [
          "/",
          "/advisors",
          "/advisors/" + profileId,
          "/community",
          "/login",
          "/register",
          "/register/advisor",
        ];
        for (const width of [360, 768]) {
          await v.setViewportSize({ width, height: 900 });
          for (const path of publicRoutes) {
            await v.goto(url + path);
            await v.locator("main h1, main h2").first().waitFor();
            assert.equal(
              await v.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              ),
              false,
              `Public overflow ${path} at ${width}`,
            );
          }
          await u.setViewportSize({ width, height: 900 });
          for (const path of [
            "/dashboard",
            "/user/appointments",
            "/community/new",
            "/account",
          ]) {
            await u.goto(url + path);
            await u.locator("main h1").waitFor();
            assert.equal(
              await u.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              ),
              false,
              `USER overflow ${path} at ${width}`,
            );
          }
          await a.setViewportSize({ width, height: 900 });
          for (const path of [
            "/dashboard",
            "/advisor/profile",
            "/advisor/appointments",
            "/community/new",
            "/account",
          ]) {
            await a.goto(url + path);
            await a.locator("main h1").waitFor();
            assert.equal(
              await a.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              ),
              false,
              `ADVISOR overflow ${path} at ${width}`,
            );
          }
        }
        await u.getByRole("button", { name: "Menu", exact: true }).click();
        await u
          .getByRole("navigation")
          .getByRole("link", { name: "My appointments", exact: true })
          .click();
        await u.waitForURL("**/user/appointments");
        await u.getByRole("button", { name: "Menu", exact: true }).waitFor();
        await u.setViewportSize({ width: 1440, height: 1000 });
        await a.setViewportSize({ width: 1440, height: 1000 });
      },
    );
    await check(
      "Logout clears session and denies protected refresh; persisted SQL associations",
      async () => {
        await u.getByRole("button", { name: "Log out", exact: true }).click();
        await u.waitForURL("**/login");
        assert.ok(
          (await u.evaluate(() =>
            sessionStorage.getItem("consultify.session"),
          )) === null,
          "Session token should be cleared",
        );
        await a.getByRole("button", { name: "Log out", exact: true }).click();
        await a.waitForURL("**/login");
        assert.ok(
          (await a.evaluate(() =>
            sessionStorage.getItem("consultify.session"),
          )) === null,
          "Session token should be cleared",
        );
        await a.goto(url + "/advisor/profile");
        await a.waitForURL("**/login");
        const row = (
          await client.query(
            "SELECT a.status,a.advisor_id,r.rating FROM appointments a JOIN reviews r ON r.appointment_id=a.id WHERE a.id=$1",
            [appointmentId],
          )
        ).rows[0];
        assert.deepEqual(row, {
          status: "COMPLETED",
          advisor_id: profileId,
          rating: 5,
        });
        assert.equal(
          (
            await client.query("SELECT status FROM appointments WHERE id=$1", [
              cancelledId,
            ])
          ).rows[0].status,
          "CANCELLED",
        );
        assert.equal(
          (
            await client.query("SELECT * FROM community_posts WHERE id=$1", [
              postId,
            ])
          ).rowCount,
          0,
        );
        assert.deepEqual(runtimeErrors, []);
      },
    );
    await check(
      "Delayed session restoration cannot overwrite a newer login",
      async () => {
        await u.goto(url + "/register");
        await login(u, false);
        const oldToken = await u.evaluate(() =>
          sessionStorage.getItem("consultify.session"),
        );
        let release, observed;
        const gate = new Promise((done) => {
          release = done;
        });
        const startedRequest = new Promise((done) => {
          observed = done;
        });
        // Delay the real request; no response is mocked or fabricated.
        await u.route("**/api/auth/me", async (route) => {
          if (
            route.request().headers().authorization === `Bearer ${oldToken}`
          ) {
            observed();
            await gate;
          }
          await route.continue().catch(() => {});
        });
        try {
          const oldResponse = u.waitForResponse(
            (r) =>
              new URL(r.url()).pathname === "/api/auth/me" &&
              r.request().headers().authorization === `Bearer ${oldToken}`,
          );
          await u.goto(url + "/login");
          await startedRequest;
          await u.getByLabel("Email address").fill(credentials.advisor);
          await u
            .getByLabel("Password", { exact: true })
            .fill(credentials.password);
          await u.getByRole("button", { name: "Sign in", exact: true }).click();
          await u.waitForURL("**/dashboard");
          release();
          await (await oldResponse).finished();
          await u.evaluate(
            () =>
              new Promise((done) =>
                requestAnimationFrame(() => requestAnimationFrame(done)),
              ),
          );
          await u
            .getByRole("navigation")
            .getByRole("link", { name: "My professional profile", exact: true })
            .waitFor();
          await u.goto(url + "/account");
          await u.getByText("ADVISOR", { exact: true }).waitFor();
          await u.getByRole("button", { name: "Log out", exact: true }).click();
        } finally {
          release();
          await u.unroute("**/api/auth/me");
        }
      },
    );
  } finally {
    writeFileSync(
      resolve(output, "integration.json"),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          database,
          postgres,
          durationMs: Date.now() - started,
          total: results.length,
          passed: results.filter((r) => r.status === "PASS").length,
          failed: results.filter((r) => r.status === "FAIL").length,
          results,
          runtimeErrors,
          endpoints: [...endpoints],
        },
        null,
        2,
      ),
    );
    await browser.close();
  }
}
