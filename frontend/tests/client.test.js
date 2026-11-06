import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { request, tokenStore } from "../src/api/client.js";
const originalFetch = globalThis.fetch;
const values = new Map();
globalThis.sessionStorage = {
  getItem: (k) => values.get(k) || null,
  setItem: (k, v) => values.set(k, v),
  removeItem: (k) => values.delete(k),
};
globalThis.window = new EventTarget();
beforeEach(() => values.clear());
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test("sends JSON and bearer header, retains API prefix", async () => {
  tokenStore.set("test-only");
  globalThis.fetch = async (url, opts) => {
    assert.equal(url, "/api/appointments");
    assert.equal(opts.headers.Authorization, "Bearer test-only");
    assert.deepEqual(JSON.parse(opts.body), { advisorId: "profile" });
    return new Response('{"appointment":{"status":"PENDING"}}', {
      status: 201,
    });
  };
  assert.equal(
    (
      await request("/appointments", {
        method: "POST",
        body: { advisorId: "profile" },
      })
    ).appointment.status,
    "PENDING",
  );
});
test("public login never sends an old bearer token", async () => {
  tokenStore.set("old");
  globalThis.fetch = async (_, opts) => {
    assert.equal(opts.headers.Authorization, undefined);
    return new Response("{}");
  };
  await request("/auth/login", { auth: false });
});
test("401 clears active session and emits expiry, login 401 does not", async () => {
  let events = 0;
  const listener = () => events++;
  window.addEventListener("consultify:expired", listener);
  tokenStore.set("bad");
  globalThis.fetch = async () =>
    new Response('{"message":"Expired"}', { status: 401 });
  await assert.rejects(request("/auth/me"), /Expired/);
  assert.equal(tokenStore.get(), null);
  assert.equal(events, 1);
  await assert.rejects(request("/auth/login", { auth: false }));
  assert.equal(events, 1);
  window.removeEventListener("consultify:expired", listener);
});
test("late 401 cannot erase a newer session", async () => {
  tokenStore.set("old");
  globalThis.fetch = async () => {
    tokenStore.set("new");
    return new Response("{}", { status: 401 });
  };
  await assert.rejects(request("/auth/me"));
  assert.equal(tokenStore.get(), "new");
});
test("malformed response is actionable; empty 204 succeeds", async () => {
  globalThis.fetch = async () => new Response("<html>Error</html>");
  await assert.rejects(
    request("/health", { auth: false }),
    /unexpected response/,
  );
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.deepEqual(await request("/health", { auth: false }), {});
});
test("network and HTTP failures never resolve as success", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("network");
  };
  await assert.rejects(request("/health"), /could not reach/);
  globalThis.fetch = async () =>
    new Response("<html>Bad gateway</html>", { status: 502 });
  await assert.rejects(request("/health"), /temporarily unavailable/);
});
