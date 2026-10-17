const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { test, before, after } = require('node:test');
const jwt = require('jsonwebtoken');
const expected = process.env.CONSULTIFY_TEST_DATABASE;
if (!/^consultify_test_[a-f0-9]{16}$/.test(expected || '') ||
    new URL(process.env.DATABASE_URL).pathname !== `/${expected}` ||
    process.env.NODE_ENV !== 'test') throw new Error('Refusing non-isolated test execution');
const pool = require('../../src/config/db');
const app = require('../../src/app');
const records = [], calls = [];
let server, base, currentCase;
const start = Date.now();
const password = `Test-only-${randomUUID()}`;
const fixtures = {};
function check(module, name, fn) {
  test(`${module}: ${name}`, async () => {
    const record = { module, name, status: 'FAIL' }; records.push(record); currentCase = `${module}: ${name}`;
    try { await fn(); record.status = 'PASS'; } catch (e) { record.error = e.message; throw e; }
  });
}
async function request(method, path, body, actor, status = 200, raw = false) {
  const headers = {};
  if (actor) headers.authorization = `Bearer ${typeof actor === 'string' ? actor : actor.token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, signal: AbortSignal.timeout(10000),
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
  const text = await response.text();
  const route = path.split('?')[0].replace(/[a-f0-9]{8}-[a-f0-9-]{27}/g, ':id');
  calls.push({ test: currentCase || "fixture setup", method, route, status: response.status, expected: status });
  assert.ok((Array.isArray(status) ? status : [status]).includes(response.status), `${method} ${route}: expected ${status}, received ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /application\/json/, `${method} ${route}: expected safe JSON`);
  const json = JSON.parse(text);
  assert.doesNotMatch(text, /password_hash|\$2[aby]\$|node_modules|SELECT .* FROM|at .*\.js:\d/i, 'Sensitive response');
  return Array.isArray(status) ? { status: response.status, body: json } : json;
}
async function identity(role = 'USER', name = role) {
  const email = `${randomUUID()}@consultify-test.invalid`;
  const { user } = await request('POST', role === 'ADVISOR' ? '/api/auth/register/advisor' : '/api/auth/register',
    { name, email: ` ${email.toUpperCase()} `, password, role: 'ADMIN' }, null, 201);
  assert.equal(user.role, role); assert.equal(user.email, email);
  const session = await request('POST', '/api/auth/login', { email, password });
  const claims = jwt.verify(session.token, process.env.JWT_SECRET);
  assert.equal(claims.userID, user.id); assert.equal(claims.role, role);
  return { ...user, token: session.token };
}
const profileBody = { domain: 'FINANCE', bio: 'Finance advice', specialization: 'Investment', experienceYears: 4, consultationFee: 100 };
async function profile(actor, extra = {}) {
  const { advisorProfile } = await request('POST', '/api/advisors/profile', { ...profileBody, ...extra }, actor, 201);
  assert.equal(advisorProfile.user_id, actor.id); assert.notEqual(advisorProfile.id, actor.id);
  return advisorProfile;
}
const future = () => new Date(Date.now() + 7 * 86400000).toISOString();
async function book(user = fixtures.ua, advisor = fixtures.pa, extra = {}) {
  const { appointment } = await request('POST', '/api/appointments', { advisorId: advisor.id, scheduledAt: future(), ...extra }, user, 201);
  assert.equal(appointment.status, 'PENDING'); assert.equal(appointment.user_id, user.id);
  assert.equal(appointment.advisor_id, advisor.id); return appointment;
}
async function transition(a, status, actor = fixtures.aa, expectedStatus = 200) {
  return request('PATCH', `/api/appointments/${a.id}/status`, { status }, actor, expectedStatus);
}
async function completed(user = fixtures.ua, advisor = fixtures.pa, actor = fixtures.aa) {
  const a = await book(user, advisor); await transition(a, 'CONFIRMED', actor); await transition(a, 'COMPLETED', actor); return a;
}
async function post(actor = fixtures.ua, extra = {}) {
  return (await request('POST', '/api/community/posts', { domain: 'FINANCE', title: `Investment ${randomUUID()}`, content: 'Budget and savings', ...extra }, actor, 201)).post;
}
async function row(table, id) { return (await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [id])).rows[0]; }
before(async () => {
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, expected);
  server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  fixtures.ua = await identity('USER', 'User A'); fixtures.ub = await identity('USER', 'User B');
  fixtures.aa = await identity('ADVISOR', 'Investment Advisor A'); fixtures.ab = await identity('ADVISOR', 'Advisor B');
  fixtures.pa = await profile(fixtures.aa); fixtures.pb = await profile(fixtures.ab, { specialization: 'Tax' });
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  await pool.end();
  mkdirSync('tests/results', { recursive: true });
  writeFileSync('tests/results/latest.json', JSON.stringify({
    ...JSON.parse(readFileSync(process.env.CONSULTIFY_TEST_ENVIRONMENT)),
    date: new Date().toISOString(), durationMs: Date.now() - start,
    total: records.length, passed: records.filter(r => r.status === 'PASS').length,
    failed: records.filter(r => r.status === 'FAIL').length, skipped: 0, constraints: fixtures.constraints, cases: records, calls
  }, null, 2));
});
module.exports = { assert, check, request, identity, profile, profileBody, fixtures, future, book, transition, completed, post, row, pool, password, randomUUID, jwt };
