import { chromium, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const jwt = createRequire(import.meta.url)("../../node_modules/jsonwebtoken");
import { endpoints, normalizePath } from "./endpoint-contract.js";
const base = process.env.TEST_BASE_URL;
if (
  !base ||
  process.env.NODE_ENV !== "test" ||
  !/^consultify_test_[a-f0-9]{16}$/.test(
    new URL(process.env.DATABASE_URL).pathname.slice(1),
  )
)
  throw new Error("Run through npm run test:e2e for isolated data.");
mkdirSync("test-results", { recursive: true });
const calls = [],
  results = [],
  runtime = [],
  failedNetwork = [],
  layouts = [];
let phase = "",
  browser,
  context,
  page;
const uid = randomUUID();
const password = `Consultify-${randomUUID()}`;
const member = {
  name: "Perspective Member",
  email: `member-${uid}@consultify-test.invalid`,
};
const advisor = {
  name: "Perspective Advisor",
  email: `advisor-${uid}@consultify-test.invalid`,
};
let advisorId, appointmentId, cancelledId;
async function backend(up) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Backend test control timed out")),
      10000,
    );
    process.once("message", (m) => {
      clearTimeout(timer);
      m.type === "backend-ready"
        ? resolve()
        : reject(new Error("Backend control failed"));
    });
    process.send({ type: "backend", up });
  });
}
async function step(name, fn) {
  phase = name;
  try {
    await fn();
    results.push({ name, status: "PASS" });
    console.log(`PASS ${name}`);
  } catch (e) {
    results.push({ name, status: "FAIL", error: e.message });
    await page?.screenshot({
      path: "test-results/failure.png",
      fullPage: true,
    });
    throw e;
  }
}
async function go(path) {
  await page.goto(base + path);
  await page.locator(".loading").waitFor({ state: "hidden" });
}
async function clickRequest(label, method, path, status) {
  const promise = page.waitForResponse(
    (r) =>
      r.request().method() === method && new URL(r.url()).pathname === path,
  );
  await page.getByRole("button", { name: label, exact: true }).click();
  const response = await promise;
  assert.equal(response.status(), status, `${method} ${path}`);
  return response.json();
}
async function register(actor, isAdvisor) {
  await go(isAdvisor ? "/register/advisor" : "/register");
  await page.getByLabel("Full name", { exact: true }).fill(actor.name);
  await page.getByLabel("Email address").fill(actor.email);
  await page.locator("input[name=password]").fill(password);
  await page.locator("input[name=confirm]").fill(password);
  await clickRequest(
    "Create account",
    "POST",
    `/api/auth/register${isAdvisor ? "/advisor" : ""}`,
    201,
  );
  await expect(page).toHaveURL(base + "/login");
  await expect(page.getByRole("status")).toContainText("Account created");
}
async function login(actor) {
  await go("/login");
  await page.getByLabel("Email address").fill(actor.email);
  await page.locator("input[name=password]").fill(password);
  await clickRequest("Log in", "POST", "/api/auth/login", 200);
  await expect(page).toHaveURL(base + "/dashboard");
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.locator(".loading").waitFor({ state: "hidden" });
}
async function logout() {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "Log out", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(base + "/login");
}
async function layout(paths, role = "public") {
  for (const path of paths) {
    for (const width of [375, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await go(path);
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        body: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dimensions.body <= width + 1,
        `Overflow ${path} at ${width}: ${dimensions.body}`,
      );
      layouts.push({ path, width, role, status: "PASS" });
      if (
        (path === "/" ||
          path === "/dashboard" ||
          path === "/advisors" ||
          path === "/advisor/profile" ||
          path.startsWith("/community") ||
          path === "/user/appointments" ||
          path.startsWith("/advisors/")) &&
        [390, 1440].includes(width)
      )
        await page.screenshot({
          path: `test-results/${role}-${path.replaceAll("/", "_") || "home"}-${width}.png`,
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}
async function book(notes) {
  await go(`/advisors/${advisorId}`);
  const future = new Date(Date.now() + 7 * 86400000);
  const localDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Date", { exact: true }).fill(localDate);
  await page.getByLabel("Time", { exact: true }).fill("14:30");
  await page.getByLabel("What would you like to discuss?").fill(notes);
  const { appointment } = await clickRequest(
    "Request consultation",
    "POST",
    "/api/appointments",
    201,
  );
  await expect(page.getByRole("status")).toContainText("pending");
  assert.equal(appointment.advisor_id, advisorId);
  assert.equal(
    await page.evaluate(
      (value) => new Date(value).getHours(),
      appointment.scheduled_at,
    ),
    14,
  );
  return appointment.id;
}
try {
  browser = await chromium.launch(
    process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : { channel: "chrome" },
  );
  context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  page = await context.newPage();
  page.on("pageerror", (e) => runtime.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("Failed to load resource"))
      runtime.push(m.text());
  });
  page.on("requestfailed", (r) => {
    if (!r.failure()?.errorText?.includes("ERR_ABORTED"))
      failedNetwork.push({
        path: new URL(r.url()).pathname,
        error: r.failure()?.errorText,
        phase,
      });
  });
  page.on("response", (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith("/api"))
      calls.push({
        phase,
        method: r.request().method(),
        path: normalizePath(url.pathname),
        status: r.status(),
      });
  });
  await step(
    "Public pages, empty states, proxy health and five viewport widths",
    async () => {
      await go("/");
      const health = await page.evaluate(async () =>
        (await import("/src/api/client.js")).health(),
      );
      assert.equal(health.database, "connected");
      await layout([
        "/",
        "/advisors",
        "/community",
        "/login",
        "/register",
        "/register/advisor",
        "/missing",
      ]);
      await page.setViewportSize({ width: 390, height: 844 });
      await go("/");
      await page.getByRole("button", { name: "Menu" }).click();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Find an advisor" })
        .click();
      await expect(page).toHaveURL(base + "/advisors");
      await page.setViewportSize({ width: 1280, height: 900 });
    },
  );
  await step(
    "A: member registration, login, refresh restoration, logout and guard",
    async () => {
      await register(member, false);
      await login(member);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Welcome, Perspective." }),
      ).toBeVisible();
      await expect(page).toHaveURL(base + "/dashboard");
      await logout();
      await go("/account");
      await expect(page).toHaveURL(base + "/login");
    },
  );
  await step(
    "B: advisor registration and profile creation/edit/public visibility",
    async () => {
      await register(advisor, true);
      await login(advisor);
      await go("/advisor/profile");
      await page
        .getByLabel("Specialization", { exact: true })
        .fill("Investment planning");
      await page
        .getByLabel("Professional bio")
        .fill(
          "A thoughtful approach to investment planning. Fee currency: INR. Consultation arrangements are agreed directly.",
        );
      await page.getByLabel("Years of experience").fill("8");
      await page.getByLabel("Consultation fee", { exact: true }).fill("1500");
      const created = await clickRequest(
        "Save profile",
        "POST",
        "/api/advisors/profile",
        201,
      );
      advisorId = created.advisorProfile.id;
      await expect(page.getByRole("status")).toContainText("saved");
      await go("/advisors");
      await expect(
        page.getByRole("heading", { name: advisor.name }),
      ).toBeVisible();
      await go("/advisor/profile");
      await page
        .getByLabel("Specialization", { exact: true })
        .fill("Investment and retirement planning");
      await clickRequest("Save profile", "PATCH", "/api/advisors/profile", 200);
      await go(`/advisors/${advisorId}`);
      await expect(
        page.getByText("Investment and retirement planning", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Request consultation" }),
      ).toHaveCount(0);
      await go("/user/appointments");
      await expect(page).toHaveURL(base + "/dashboard");
      await layout(
        [
          "/dashboard",
          "/advisor/profile",
          "/advisor/appointments",
          "/account",
          `/advisors/${advisorId}`,
        ],
        "advisor",
      );
      await logout();
    },
  );
  await step(
    "C1: member search, local-time booking and pending status",
    async () => {
      await login(member);
      await go("/advisor/profile");
      await expect(page).toHaveURL(base + "/dashboard");
      await go("/advisors");
      await page
        .getByRole("textbox", { name: "Search", exact: true })
        .fill("retirement");
      await page
        .getByRole("combobox", { name: "Domain" })
        .selectOption("FINANCE");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: advisor.name }),
      ).toBeVisible();
      appointmentId = await book("Plan a considered investment strategy.");
      await go("/user/appointments");
      await expect(page.locator(".status")).toHaveText("pending");
      await layout(
        [
          "/dashboard",
          "/user/appointments",
          "/account",
          `/advisors/${advisorId}`,
        ],
        "member",
      );
      await logout();
    },
  );
  await step(
    "C2: advisor confirms and completes appointment through buttons",
    async () => {
      await login(advisor);
      await go("/advisor/appointments");
      await clickRequest(
        "Confirm appointment",
        "PATCH",
        `/api/appointments/${appointmentId}/status`,
        200,
      );
      await expect(page.locator(".status")).toHaveText("confirmed");
      await clickRequest(
        "Mark completed",
        "PATCH",
        `/api/appointments/${appointmentId}/status`,
        200,
      );
      await expect(page.locator(".status")).toHaveText("completed");
      await expect(
        page.getByRole("button", { name: "Mark completed" }),
      ).toHaveCount(0);
      await logout();
    },
  );
  await step(
    "C3: member review, public rating and duplicate 409 feedback",
    async () => {
      await login(member);
      await go("/user/appointments");
      await expect(page.locator(".status")).toHaveText("completed");
      await page
        .getByRole("button", { name: "Write a review", exact: true })
        .click();
      await page
        .getByLabel("Your review (optional)")
        .fill("A helpful and thoughtful perspective.");
      await clickRequest("Publish review", "POST", "/api/reviews", 201);
      await expect(page.getByRole("status")).toContainText("published");
      await go(`/advisors/${advisorId}`);
      await expect(page.getByText("5.0 / 5 · 1 reviews")).toBeVisible();
      await expect(
        page.getByText("A helpful and thoughtful perspective."),
      ).toBeVisible();
      await go("/user/appointments");
      await page
        .getByRole("button", { name: "Write a review", exact: true })
        .click();
      await clickRequest("Publish review", "POST", "/api/reviews", 409);
      await expect(page.getByRole("alert")).toContainText("already exists");
    },
  );
  await step(
    "D: cancellation, terminal UI and real backend rejection",
    async () => {
      cancelledId = await book("Cancellation test request.");
      await go("/user/appointments");
      await page
        .getByRole("button", { name: "Cancel appointment", exact: true })
        .click();
      await clickRequest(
        "Confirm",
        "PATCH",
        `/api/appointments/${cancelledId}/cancel`,
        200,
      );
      await expect(page.locator(".status.cancelled")).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "Cancel appointment", exact: true }),
      ).toHaveCount(0);
      const rejected = await page.evaluate(async (id) => {
        const r = await fetch(`/api/appointments/${id}/cancel`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("consultify.token")}`,
          },
        });
        return r.status;
      }, cancelledId);
      assert.equal(rejected, 404);
      await logout();
      await login(advisor);
      const bad = await page.evaluate(async (id) => {
        const r = await fetch(`/api/appointments/${id}/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("consultify.token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "CONFIRMED" }),
        });
        return r.status;
      }, cancelledId);
      assert.equal(bad, 404);
      await logout();
      await login(member);
    },
  );
  await step(
    "E: community publish, search, comment, helpful, duplicate and owner deletion",
    async () => {
      await go("/community/new");
      await page
        .getByLabel("Discussion title")
        .fill("A considered approach to saving");
      await page
        .getByLabel("Your question or perspective")
        .fill("How do you balance longer term goals with an emergency fund?");
      const { post } = await clickRequest(
        "Publish discussion",
        "POST",
        "/api/community/posts",
        201,
      );
      await expect(page).toHaveURL(base + `/community/${post.id}`);
      await go("/community");
      await page
        .getByRole("textbox", { name: "Search", exact: true })
        .fill("considered");
      await page
        .getByRole("combobox", { name: "Domain" })
        .selectOption("FINANCE");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await page
        .getByRole("heading", { name: post.title })
        .getByRole("link")
        .click();
      await page
        .getByLabel("Add your perspective")
        .fill("Start by considering your essential monthly expenses.");
      const comment = await clickRequest(
        "Post comment",
        "POST",
        `/api/community/posts/${post.id}/comments`,
        201,
      );
      await expect(
        page.getByText(
          "Start by considering your essential monthly expenses.",
          { exact: true },
        ),
      ).toBeVisible();
      await clickRequest(
        "Mark helpful",
        "POST",
        `/api/community/posts/${post.id}/helpful`,
        201,
      );
      await expect(
        page.getByText("1 found helpful · 1 comments"),
      ).toBeVisible();
      await clickRequest(
        "Mark helpful",
        "POST",
        `/api/community/posts/${post.id}/helpful`,
        409,
      );
      await expect(page.getByRole("alert")).toContainText("already marked");
      await layout(
        ["/community", `/community/${post.id}`, "/community/new"],
        "community",
      );
      await page.setViewportSize({ width: 1280, height: 900 });
      await go(`/community/${post.id}`);
      await page
        .getByRole("button", { name: "Delete comment", exact: true })
        .click();
      await clickRequest(
        "Confirm",
        "DELETE",
        `/api/community/comments/${comment.comment.id}`,
        200,
      );
      await expect(
        page.getByText(
          "Start by considering your essential monthly expenses.",
          { exact: true },
        ),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Delete discussion", exact: true })
        .click();
      await clickRequest(
        "Confirm",
        "DELETE",
        `/api/community/posts/${post.id}`,
        200,
      );
      await expect(page).toHaveURL(base + "/community");
      await expect(page.getByRole("heading", { name: post.title })).toHaveCount(
        0,
      );
    },
  );
  await step(
    "F: validation, missing resources, back navigation, token and outage handling",
    async () => {
      await go("/community/new");
      await page.getByLabel("Discussion title").fill("   ");
      await page.getByLabel("Your question or perspective").fill("   ");
      await page
        .getByRole("button", { name: "Publish discussion", exact: true })
        .click();
      await expect(page.getByRole("alert")).toContainText("title");
      await go("/advisors/00000000-0000-4000-8000-000000000000");
      await expect(page.getByRole("alert")).toHaveText("Advisor not found");
      await go("/advisors/not-an-id");
      await expect(page.getByRole("alert")).toHaveText("Invalid resource ID");
      await go("/community/00000000-0000-4000-8000-000000000000");
      await expect(page.getByRole("alert")).toHaveText("Post not found");
      await go("/advisors");
      await page
        .getByRole("link", { name: "View profile", exact: true })
        .click();
      await page.goBack();
      await expect(page).toHaveURL(base + "/advisors");
      await page.evaluate(() =>
        sessionStorage.setItem("consultify.token", "invalid-test-token"),
      );
      await go("/dashboard");
      await expect(page).toHaveURL(base + "/login");
      await expect(page.getByRole("alert")).toContainText("expired");
      await page.getByLabel("Email address").fill(member.email);
      await page.locator("input[name=password]").fill("wrong-password");
      await clickRequest("Log in", "POST", "/api/auth/login", 401);
      await expect(page.getByRole("alert")).toHaveText(
        "Invalid email or password",
      );
      // This is a transport-failure test, not a substitute for real API integration.
      await context.setOffline(true);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await expect(page.getByRole("alert")).toContainText("could not reach");
      await context.setOffline(false);
      await backend(false);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await expect(page.getByRole("alert")).toContainText(
        "temporarily unavailable",
      );
      await backend(true);
      await login(member);
      await backend(false);
      await go("/dashboard");
      await expect(
        page.getByRole("button", { name: "Retry session" }),
      ).toBeVisible();
      assert.ok(
        await page.evaluate(() => sessionStorage.getItem("consultify.token")),
      );
      await backend(true);
      await page.getByRole("button", { name: "Retry session" }).click();
      await expect(
        page.getByRole("heading", { name: "Welcome, Perspective." }),
      ).toBeVisible();
      const expired = jwt.sign(
        { userID: "00000000-0000-4000-8000-000000000000", role: "USER" },
        process.env.JWT_SECRET,
        { expiresIn: -10 },
      );
      await page.evaluate(
        (token) => sessionStorage.setItem("consultify.token", token),
        expired,
      );
      await go("/dashboard");
      await expect(page).toHaveURL(base + "/login");
      await expect(page.getByRole("alert")).toContainText("expired");
      await go("/register");
      await page.getByLabel("Full name", { exact: true }).fill("Mismatch");
      await page
        .getByLabel("Email address")
        .fill("mismatch@consultify-test.invalid");
      await page.locator("input[name=password]").fill(password);
      await page.locator("input[name=confirm]").fill("different-password");
      await page
        .getByRole("button", { name: "Create account", exact: true })
        .click();
      await expect(page.getByRole("alert")).toHaveText(
        "Passwords do not match.",
      );
      await page.getByLabel("Email address").fill(member.email);
      await page.locator("input[name=confirm]").fill(password);
      await clickRequest("Create account", "POST", "/api/auth/register", 409);
      await expect(page.getByRole("alert")).toHaveText(
        "Email is already registered",
      );
    },
  );
  await step(
    "All 24 endpoint templates reached with expected statuses",
    async () => {
      for (const [method, path, , , , allowed] of endpoints) {
        const observed = calls.filter(
          (c) => c.method === method && c.path === path,
        );
        assert.ok(observed.length, `Missing ${method} ${path}`);
        for (const call of observed)
          assert.ok(
            allowed.includes(call.status),
            `Unexpected ${call.status}: ${method} ${path}`,
          );
      }
    },
  );
  await step(
    "No JavaScript runtime errors or unexpected transport failures",
    async () => {
      assert.deepEqual(runtime, []);
      assert.deepEqual(
        failedNetwork.filter(
          (r) => !(r.phase.startsWith("F:") && r.path === "/api/auth/login"),
        ),
        [],
      );
    },
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  writeFileSync(
    "test-results/e2e.json",
    JSON.stringify(
      {
        results,
        calls,
        runtime,
        failedNetwork,
        layouts,
        browser: browser ? await browser.version() : null,
      },
      null,
      2,
    ),
  );
  await browser?.close();
}
