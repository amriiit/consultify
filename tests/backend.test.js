const { assert, check, request: api, identity, profile, profileBody, fixtures: f, future, book, transition,
  completed, post, row, pool, password, randomUUID, jwt } = require('./helpers/harness');
const missing = randomUUID();
check('Health', 'real database connectivity', async () => assert.deepEqual(await api('GET', '/api/health'), { status: 'ok', database: 'connected' }));
for (const role of ['USER', 'ADVISOR']) {
  check('Authentication', `${role} registration normalization role assignment bcrypt and safe me`, async () => {
    const u = await identity(role);
    const db = await row('users', u.id);
    assert.equal(await require('bcrypt').compare(password, db.password_hash), true);
    assert.notEqual(db.password_hash, password); assert.equal(require('bcrypt').getRounds(db.password_hash), 12);
    assert.equal((await api('GET', '/api/auth/me', undefined, u)).user.id, u.id);
    const other = role === 'USER' ? '/api/auth/register/advisor' : '/api/auth/register';
    await api('POST', other, { name: 'Duplicate', email: u.email.toUpperCase(), password }, null, 409);
  });
  const endpoint = role === 'USER' ? '/api/auth/register' : '/api/auth/register/advisor';
  for (const [name, patch] of Object.entries({
    'missing name': { name: undefined }, 'blank name': { name: '  ' }, 'object name': { name: {} },
    'long name': { name: 'x'.repeat(101) }, 'bad email': { email: 'bad' }, 'missing email': { email: undefined },
    'long email': { email: `${'x'.repeat(250)}@x.invalid` }, 'array email': { email: [] },
    'short password': { password: 'short' }, 'multibyte password': { password: 'é'.repeat(37) },
    'long password': { password: 'x'.repeat(73) }, 'missing password': { password: undefined }, 'object password': { password: {} }
  })) check('Authentication', `${role} rejects ${name}`, () => api('POST', endpoint, { name: 'Valid', email: `${randomUUID()}@x.invalid`, password, ...patch }, null, 400));
}
for (const [name, body, status] of [
  ['wrong password', () => ({ email: f.ua.email, password: 'incorrect-test-password' }), 401],
  ['unknown email', () => ({ email: `${randomUUID()}@x.invalid`, password }), 401],
  ['missing email', () => ({ password }), 400], ['missing password', () => ({ email: f.ua.email }), 400],
  ['SQL injection email', () => ({ email: "' OR 1=1 --", password }), 401]
]) check('Authentication', `login ${name}`, () => api('POST', '/api/auth/login', body(), null, status));
const tokens = {
  missing: () => null, invalid: () => 'bad-token',
  expired: () => jwt.sign({ userID: f.ua.id, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: -1 }),
  tampered: () => `${f.ua.token.slice(0, -8)}aaaaaaaa`,
  unsigned: () => jwt.sign({ userID: f.ua.id, role: 'ADMIN' }, '', { algorithm: 'none' })
};
for (const [name, token] of Object.entries(tokens)) check('Security', `${name} JWT denied`, () => api('GET', '/api/auth/me', undefined, token(), 401));
check('Security', 'me ignores identity spoofing', async () => assert.equal((await api('GET', `/api/auth/me?userId=${f.ub.id}`, undefined, f.ua)).user.id, f.ua.id));
check('Advisors', 'duplicate profile conflicts', () => api('POST', '/api/advisors/profile', profileBody, f.aa, 409));
for (const method of ['POST', 'PATCH']) {
  check('Advisors', `${method} denies USER`, () => api(method, '/api/advisors/profile', profileBody, f.ua, 403));
  check('Advisors', `${method} requires authentication`, () => api(method, '/api/advisors/profile', profileBody, null, 401));
}
for (const [name, patch] of Object.entries({ domain: { domain: 'HEALTH' }, experience: { experienceYears: -1 }, decimal: { experienceYears: 1.2 }, fee: { consultationFee: -1 }, missing: { bio: undefined }, 'object bio': { bio: {} }, 'blank bio': { bio: ' ' }, 'long specialization': { specialization: 'x'.repeat(151) }, 'huge experience': { experienceYears: 2147483648 }, 'huge fee': { consultationFee: 1e10 } }))
  check('Advisors', `create rejects ${name}`, () => api('POST', '/api/advisors/profile', { ...profileBody, ...patch }, f.aa, 400));
check('Advisors', 'partial update persists and cannot target another advisor', async () => {
  const before = await row('advisor_profiles', f.pb.id);
  const { advisorProfile: p } = await api('PATCH', '/api/advisors/profile', { bio: 'Updated advice', userId: f.ab.id, id: f.pb.id }, f.aa);
  assert.equal(p.id, f.pa.id); assert.equal(p.specialization, f.pa.specialization);
  assert.equal((await row('advisor_profiles', f.pa.id)).bio, 'Updated advice');
  assert.deepEqual(await row('advisor_profiles', f.pb.id), before);
});
for (const patch of [{ experienceYears: -1 }, { consultationFee: -2 }, { bio: {} }, { bio: ' ' }, { specialization: 'x'.repeat(151) }, { consultationFee: 1e10 }, { experienceYears: 2147483648 }])
  check('Advisors', `update rejects ${Object.keys(patch)} ${JSON.stringify(patch).slice(0, 45)}`, () => api('PATCH', '/api/advisors/profile', patch, f.aa, 400));
check('Advisors', 'public list and detail use correct users JOIN', async () => {
  const all = (await api('GET', '/api/advisors')).advisors;
  assert.ok(all.length >= 2); assert.equal(all.find(a => a.id === f.pa.id).advisor_name, f.aa.name);
  const detail = (await api('GET', `/api/advisors/${f.pa.id}`)).advisor;
  assert.equal(detail.name, f.aa.name); assert.equal(detail.domain, 'FINANCE');
  assert.equal(detail.specialization, f.pa.specialization);
});
check('Advisors', 'nonexistent advisor', () => api('GET', `/api/advisors/${missing}`, undefined, null, 404));
check('Appointments', 'booking persisted with JWT owner ignoring spoofed owner and status', async () => {
  const a = await book(f.ua, f.pa, { userId: f.ub.id, status: 'COMPLETED' });
  const db = await row('appointments', a.id);
  assert.equal(db.user_id, f.ua.id); assert.equal(db.advisor_id, f.pa.id); assert.equal(db.status, 'PENDING');
  assert.equal(db.scheduled_at.toISOString(), a.scheduled_at);
});
for (const [name, body, expected] of [
  ['missing advisor', () => ({ scheduledAt: future() }), 400], ['missing time', () => ({ advisorId: f.pa.id }), 400],
  ['unknown advisor', () => ({ advisorId: missing, scheduledAt: future() }), 404],
  ['account UUID instead of profile', () => ({ advisorId: f.aa.id, scheduledAt: future() }), 404],
  ['malformed advisor', () => ({ advisorId: 'bad', scheduledAt: future() }), 400],
  ['invalid time', () => ({ advisorId: f.pa.id, scheduledAt: 'bad' }), 400],
  ['object time', () => ({ advisorId: f.pa.id, scheduledAt: {} }), 400],
  ['object notes', () => ({ advisorId: f.pa.id, scheduledAt: future(), notes: {} }), 400]
]) check('Appointments', `rejects ${name}`, () => api('POST', '/api/appointments', body(), f.ua, expected));
check('Appointments', 'booking requires USER', () => api('POST', '/api/appointments', {}, f.aa, 403));
check('Appointments', 'booking requires JWT', () => api('POST', '/api/appointments', {}, null, 401));
check('Appointments', 'private lists isolate both users and advisors with real JOINs', async () => {
  const a = await book(), b = await book(f.ub, f.pb);
  for (const [actor, path, own, excluded, field, name] of [
    [f.ua, 'user', a, b, 'advisor_name', f.aa.name], [f.ub, 'user', b, a, 'advisor_name', f.ab.name],
    [f.aa, 'advisor', a, b, 'user_name', f.ua.name], [f.ab, 'advisor', b, a, 'user_name', f.ub.name]
  ]) {
    const list = (await api('GET', `/api/appointments/${path}`, undefined, actor)).appointments;
    assert.ok(list.some(x => x.id === own.id && x[field] === name)); assert.ok(!list.some(x => x.id === excluded.id));
  }
  const joins = await pool.query('SELECT a.id,u.id AS customer,ap.user_id AS advisor FROM appointments a JOIN users u ON a.user_id=u.id JOIN advisor_profiles ap ON a.advisor_id=ap.id WHERE a.id=$1', [a.id]);
  assert.equal(joins.rows[0].customer, f.ua.id); assert.equal(joins.rows[0].advisor, f.aa.id);
});
for (const path of ['user', 'advisor']) {
  check('Appointments', `${path} list denies wrong role`, () => api('GET', `/api/appointments/${path}`, undefined, path === 'user' ? f.aa : f.ua, 403));
  check('Appointments', `${path} list requires JWT`, () => api('GET', `/api/appointments/${path}`, undefined, null, 401));
}
for (const [from, to, status] of [['PENDING', 'CONFIRMED', 200], ['CONFIRMED', 'COMPLETED', 200], ['PENDING', 'COMPLETED', 404], ['COMPLETED', 'CONFIRMED', 404], ['COMPLETED', 'COMPLETED', 404], ['CANCELLED', 'CONFIRMED', 404], ['CANCELLED', 'COMPLETED', 404], ['PENDING', 'INVALID', 400], ['PENDING', undefined, 400]]) {
  check('Lifecycle', `${from} to ${to}`, async () => {
    const a = await book();
    if (['CONFIRMED', 'COMPLETED'].includes(from)) await transition(a, 'CONFIRMED');
    if (from === 'COMPLETED') await transition(a, 'COMPLETED');
    if (from === 'CANCELLED') await api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua);
    const before = await row('appointments', a.id);
    await transition(a, to, f.aa, status);
    const after = await row('appointments', a.id);
    if (status === 200) assert.equal(after.status, to); else assert.deepEqual(after, before);
  });
}
for (const [name, actor, status] of [['other advisor', () => f.ab, 404], ['USER', () => f.ua, 403], ['missing JWT', () => null, 401], ['invalid JWT', () => 'bad', 401]])
  check('Lifecycle', `status denies ${name}`, async () => { const a = await book(), before = await row('appointments', a.id); await transition(a, 'CONFIRMED', actor(), status); assert.deepEqual(await row('appointments', a.id), before); });
for (const from of ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']) check('Lifecycle', `cancel ${from}`, async () => {
  const a = await book();
  if (['CONFIRMED', 'COMPLETED'].includes(from)) await transition(a, 'CONFIRMED');
  if (from === 'COMPLETED') await transition(a, 'COMPLETED');
  if (from === 'CANCELLED') await api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua);
  const before = await row('appointments', a.id);
  const allowed = ['PENDING', 'CONFIRMED'].includes(from);
  await api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua, allowed ? 200 : 404);
  if (allowed) assert.equal((await row('appointments', a.id)).status, 'CANCELLED');
  else assert.deepEqual(await row('appointments', a.id), before);
});
for (const [name, actor, status] of [['other USER', () => f.ub, 404], ['ADVISOR', () => f.aa, 403], ['missing JWT', () => null, 401]])
  check('Lifecycle', `cancel denies ${name}`, async () => { const a = await book(), before = await row('appointments', a.id); await api('PATCH', `/api/appointments/${a.id}/cancel`, {}, actor(), status); assert.deepEqual(await row('appointments', a.id), before); });
for (const [name, patch] of Object.entries({ unsupported: { domain: 'HEALTH' }, title: { title: '' }, content: { content: ' ' }, missing: { content: undefined }, 'number domain': { domain: 7 }, 'object title': { title: {} }, 'array content': { content: [] }, 'long title': { title: 'x'.repeat(201) } }))
  check('Community', `create rejects ${name}`, () => api('POST', '/api/community/posts', { domain: 'FINANCE', title: 'Title', content: 'Content', ...patch }, f.ua, 400));
check('Community', 'create requires JWT', () => api('POST', '/api/community/posts', {}, null, 401));
check('Community', 'author spoofing and public joins/counts', async () => {
  const p = await post(f.ua, { userId: f.ub.id }); assert.equal(p.user_id, f.ua.id);
  assert.equal((await row('community_posts', p.id)).user_id, f.ua.id);
  const detail = (await api('GET', `/api/community/posts/${p.id}`)).post;
  assert.equal(detail.author_name, f.ua.name); assert.equal(Number(detail.comment_count), 0); assert.equal(Number(detail.helpful_count), 0);
  assert.ok((await api('GET', '/api/community/posts')).posts.some(x => x.id === p.id));
});
check('Community', 'unknown post 404', () => api('GET', `/api/community/posts/${missing}`, undefined, null, 404));
for (const content of ['', ' ', {}, [], 42]) check('Comments', `rejects content ${JSON.stringify(content)}`, async () => {
  const p = await post(); await api('POST', `/api/community/posts/${p.id}/comments`, { content }, f.ub, 400);
});
check('Comments', 'unknown post comment rejected', () => api('POST', `/api/community/posts/${missing}/comments`, { content: 'Hello' }, f.ub, 404));
check('Comments', 'unknown post listing 404', () => api('GET', `/api/community/posts/${missing}/comments`, undefined, null, 404));
check('Comments', 'authors ownership order and deletion', async () => {
  const p = await post();
  const c1 = (await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'First', userId: f.ua.id }, f.ub, 201)).comment;
  const c2 = (await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'Second' }, f.ua, 201)).comment;
  assert.equal(c1.user_id, f.ub.id); assert.equal(c1.post_id, p.id);
  assert.equal((await row('comments', c1.id)).user_id, f.ub.id);
  const comments = (await api('GET', `/api/community/posts/${p.id}/comments`)).comments;
  assert.deepEqual(comments.map(c => c.id), [c1.id, c2.id]); assert.equal(comments[0].author_name, f.ub.name);
  assert.equal(Number((await api('GET', `/api/community/posts/${p.id}`)).post.comment_count), 2);
  await api('DELETE', `/api/community/comments/${c1.id}`, undefined, f.ua, 404);
  await api('DELETE', `/api/community/comments/${c1.id}`, undefined, null, 401);
  await api('DELETE', `/api/community/comments/${c1.id}`, undefined, f.ub);
  assert.equal(await row('comments', c1.id), undefined);
  assert.deepEqual((await api('GET', `/api/community/posts/${p.id}/comments`)).comments.map(c => c.id), [c2.id]);
});
check('Helpful', 'duplicate votes counts ownership and cascade', async () => {
  const p = await post();
  await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'Cascade child' }, f.ub, 201);
  for (const actor of [f.ua, f.ub]) await api('POST', `/api/community/posts/${p.id}/helpful`, { userId: missing }, actor, 201);
  await api('POST', `/api/community/posts/${p.id}/helpful`, {}, f.ub, 409);
  const detail = (await api('GET', `/api/community/posts/${p.id}`)).post;
  assert.equal(Number(detail.helpful_count), 2); assert.equal(Number(detail.comment_count), 1);
  await api('DELETE', `/api/community/posts/${p.id}`, undefined, f.ub, 404);
  await api('DELETE', `/api/community/posts/${p.id}`, undefined, null, 401);
  await api('DELETE', `/api/community/posts/${p.id}`, undefined, f.ua);
  await api('GET', `/api/community/posts/${p.id}`, undefined, null, 404);
  for (const table of ['comments', 'post_helpful']) assert.equal((await pool.query(`SELECT * FROM ${table} WHERE post_id=$1`, [p.id])).rowCount, 0);
});
check('Helpful', 'unknown post 404', () => api('POST', `/api/community/posts/${missing}/helpful`, {}, f.ua, 404));
for (const operation of ['comments', 'helpful']) check('Security', `${operation} requires JWT`, async () => { const p = await post(); await api('POST', `/api/community/posts/${p.id}/${operation}`, { content: 'Test' }, null, 401); });
for (const rating of [0, 6, 1.5, undefined, true, [5]]) check('Reviews', `invalid rating ${JSON.stringify(rating)}`, () => api('POST', '/api/reviews', { appointmentId: missing, rating }, f.ua, 400));
check('Reviews', 'missing appointment', () => api('POST', '/api/reviews', { rating: 5 }, f.ua, 400));
check('Reviews', 'unknown appointment', () => api('POST', '/api/reviews', { appointmentId: missing, rating: 5 }, f.ua, 404));
for (const content of [{}, [], 42]) check('Reviews', `invalid comment ${JSON.stringify(content)}`, () => api('POST', '/api/reviews', { appointmentId: missing, rating: 5, comment: content }, f.ua, 400));
check('Reviews', 'requires JWT', () => api('POST', '/api/reviews', {}, null, 401));
check('Reviews', 'denies ADVISOR', () => api('POST', '/api/reviews', {}, f.aa, 403));
for (const status of ['PENDING', 'CONFIRMED', 'CANCELLED']) check('Reviews', `rejects ${status}`, async () => {
  const a = await book();
  if (status === 'CONFIRMED') await transition(a, status);
  if (status === 'CANCELLED') await api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua);
  await api('POST', '/api/reviews', { appointmentId: a.id, rating: 5 }, f.ua, 400);
  assert.equal((await pool.query('SELECT * FROM reviews WHERE appointment_id=$1', [a.id])).rowCount, 0);
});
check('Reviews', 'owner eligibility boundary ratings duplicate and DB association', async () => {
  for (const rating of [1, 5]) {
    const a = await completed();
    await api('POST', '/api/reviews', { appointmentId: a.id, rating }, f.ub, 403);
    const { review } = await api('POST', '/api/reviews', { appointmentId: a.id, rating, advisorId: f.pb.id }, f.ua, 201);
    assert.equal(review.appointment_id, a.id); assert.equal(review.rating, rating);
    assert.equal((await row('reviews', review.id)).appointment_id, a.id);
    await api('POST', '/api/reviews', { appointmentId: a.id, rating }, f.ua, 409);
  }
});
check('Ratings', 'fresh advisor zero then 5+4 average 4.5 count 2 then multiple appointments', async () => {
  const advisor = await identity('ADVISOR'), p = await profile(advisor);
  assert.deepEqual(await api('GET', `/api/advisors/${p.id}/reviews`), { averageRating: 0, reviewCount: 0, reviews: [] });
  for (const rating of [5, 4]) {
    const a = await completed(f.ua, p, advisor);
    await api('POST', '/api/reviews', { appointmentId: a.id, rating }, f.ua, 201);
  }
  let result = await api('GET', `/api/advisors/${p.id}/reviews`);
  assert.equal(result.averageRating, 4.5); assert.equal(result.reviewCount, 2);
  assert.equal(result.reviews.length, 2); assert.ok(result.reviews.every(r => r.reviewer_name === f.ua.name));
  const a = await completed(f.ub, p, advisor); await api('POST', '/api/reviews', { appointmentId: a.id, rating: 3 }, f.ub, 201);
  result = await api('GET', `/api/advisors/${p.id}/reviews`); assert.equal(result.averageRating, 4); assert.equal(result.reviewCount, 3);
});
check('Ratings', 'unknown advisor 404', () => api('GET', `/api/advisors/${missing}/reviews`, undefined, null, 404));
for (const resource of ['advisors', 'community/posts']) {
  const key = resource === 'advisors' ? 'advisors' : 'posts';
  for (const query of ['', '?domain=FINANCE', '?search=investment', '?search=INVESTMENT', '?domain=finance&search=investment'])
    check('Search', `${resource}${query} returns matches`, async () => assert.ok((await api('GET', `/api/${resource}${query}`))[key].length > 0));
  check('Search', `${resource} unsupported domain`, () => api('GET', `/api/${resource}?domain=HEALTH`, undefined, null, 400));
  for (const query of [`?search=${randomUUID()}`, `?search=${encodeURIComponent("' OR 1=1 --")}`])
    check('Search', `${resource}${query} empty safe result`, async () => assert.deepEqual((await api('GET', `/api/${resource}${query}`))[key], []));
  check('Search', `${resource} repeated query parameters safely rejected`, () => api('GET', `/api/${resource}?search=a&search=b`, undefined, null, 400));
}
check('Search', 'advisor name search', async () => assert.ok((await api('GET', '/api/advisors?search=Advisor%20B')).advisors.some(a => a.id === f.pb.id)));
check('Search', 'community title and content search', async () => {
  const title = randomUUID(), content = randomUUID(); const p = await post(f.ua, { title, content });
  for (const term of [title, content]) assert.ok((await api('GET', `/api/community/posts?search=${term}`)).posts.some(x => x.id === p.id));
});
const invalidPaths = [
  ['GET', '/api/advisors/bad'], ['GET', '/api/advisors/bad/reviews'],
  ['PATCH', '/api/appointments/bad/status', { status: 'CONFIRMED' }, 'aa'], ['PATCH', '/api/appointments/bad/cancel', {}, 'ua'],
  ['GET', '/api/community/posts/bad'], ['GET', '/api/community/posts/bad/comments'],
  ['POST', '/api/community/posts/bad/comments', { content: 'Test' }, 'ua'], ['POST', '/api/community/posts/bad/helpful', {}, 'ua'],
  ['DELETE', '/api/community/posts/bad', undefined, 'ua'], ['DELETE', '/api/community/comments/bad', undefined, 'ua'],
  ['POST', '/api/reviews', { appointmentId: 'bad', rating: 5 }, 'ua']
];
for (const [method, path, body, actor] of invalidPaths) check('Security', `malformed UUID ${method} ${path}`, () => api(method, path, body, f[actor], 400));
for (const [path, actor] of [['/api/auth/login'], ['/api/advisors/profile', 'aa'], ['/api/appointments', 'ua'], ['/api/community/posts', 'ua'], ['/api/reviews', 'ua']]) {
  check('Security', `malformed JSON ${path}`, () => api('POST', path, '{"broken":', f[actor], 400, true));
  check('Security', `missing JSON body ${path}`, () => api('POST', path, undefined, f[actor], 400));
}
check('Security', 'SQL injection content round trip and legitimate request after rejection', async () => {
  const text = "'; DROP TABLE users; --"; const p = await post(f.ua, { title: text, content: text });
  assert.equal((await api('GET', `/api/community/posts/${p.id}`)).post.content, text);
  assert.equal((await api('GET', '/api/auth/me', undefined, f.ua)).user.id, f.ua.id);
});
check('Database', 'catalog seven tables and constraint metadata plus fixtures', async () => {
  const tables = (await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r => r.tablename);
  assert.deepEqual(tables, ['advisor_profiles', 'appointments', 'comments', 'community_posts', 'post_helpful', 'reviews', 'users']);
  f.constraints = (await pool.query("SELECT conrelid::regclass::text AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conname")).rows;
  const a = await completed(); const p = await post();
  const c = (await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'DB fixture' }, f.ub, 201)).comment;
  await api('POST', `/api/community/posts/${p.id}/helpful`, {}, f.ua, 201);
  const r = (await api('POST', '/api/reviews', { appointmentId: a.id, rating: 5 }, f.ua, 201)).review;
  const noProfile = await identity('ADVISOR'); const unreviewed = await completed();
  f.existing = { users: await row('users', f.ua.id), advisor_profiles: await row('advisor_profiles', f.pa.id),
    appointments: await row('appointments', a.id), community_posts: await row('community_posts', p.id),
    comments: await row('comments', c.id), post_helpful: (await pool.query('SELECT * FROM post_helpful WHERE post_id=$1 AND user_id=$2', [p.id, f.ua.id])).rows[0], reviews: await row('reviews', r.id) };
  f.baseline = structuredClone(f.existing);
  for (const [table, data] of Object.entries(f.baseline)) if ('id' in data) data.id = randomUUID();
  f.baseline.users.email = `${randomUUID()}@x.invalid`;
  f.baseline.advisor_profiles.user_id = noProfile.id;
  f.baseline.reviews.appointment_id = unreviewed.id;
  f.baseline.post_helpful.user_id = f.ab.id;
});
async function invalidInsert(table, data, code) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); await client.query('SAVEPOINT invalid_write');
    const keys = Object.keys(data);
    let actual;
    try { await client.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(data)); }
    catch (e) { actual = e.code; }
    await client.query('ROLLBACK TO SAVEPOINT invalid_write');
    assert.equal(actual, code, `Expected actual PostgreSQL rejection ${code}, got ${actual || 'successful insert'}`);
    await client.query('SELECT 1');
  } finally { await client.query('ROLLBACK'); client.release(); }
}
const required = {
  users: ['id', 'name', 'email', 'password_hash', 'role', 'created_at'],
  advisor_profiles: ['id', 'user_id', 'domain', 'bio', 'specialization', 'experience_years', 'consultation_fee', 'created_at', 'updated_at'],
  appointments: ['id', 'user_id', 'advisor_id', 'scheduled_at', 'status', 'created_at', 'updated_at'],
  community_posts: ['id', 'user_id', 'domain', 'title', 'content', 'created_at', 'updated_at'],
  comments: ['id', 'post_id', 'user_id', 'content', 'created_at', 'updated_at'],
  post_helpful: ['post_id', 'user_id', 'created_at'], reviews: ['id', 'appointment_id', 'rating', 'created_at', 'updated_at']
};
for (const [table, fields] of Object.entries(required)) {
  check('Database', `${table} primary key 23505`, () => invalidInsert(table, f.existing[table], '23505'));
  for (const field of fields) check('Database', `${table}.${field} NOT NULL 23502`, () => invalidInsert(table, { ...f.baseline[table], [field]: null }, '23502'));
}
for (const [table, field] of [['advisor_profiles', 'user_id'], ['appointments', 'user_id'], ['appointments', 'advisor_id'], ['community_posts', 'user_id'], ['comments', 'post_id'], ['comments', 'user_id'], ['post_helpful', 'post_id'], ['post_helpful', 'user_id'], ['reviews', 'appointment_id']])
  check('Database', `${table}.${field} foreign key 23503`, () => invalidInsert(table, { ...f.baseline[table], [field]: missing }, '23503'));
for (const [table, field] of [['users', 'email'], ['advisor_profiles', 'user_id'], ['reviews', 'appointment_id']])
  check('Database', `${table}.${field} UNIQUE 23505`, () => invalidInsert(table, { ...f.baseline[table], [field]: f.existing[table][field] }, '23505'));
for (const [table, field, value] of [['users', 'role', 'OWNER'], ['advisor_profiles', 'domain', 'OTHER'], ['advisor_profiles', 'experience_years', -1], ['advisor_profiles', 'consultation_fee', -1], ['appointments', 'status', 'OTHER'], ['reviews', 'rating', 0], ['reviews', 'rating', 6]])
  check('Database', `${table}.${field} CHECK ${value} 23514`, () => invalidInsert(table, { ...f.baseline[table], [field]: value }, '23514'));
check('Database', 'catalog matches exercised constraints and allowed enums', async () => {
  const catalog = f.constraints;
  assert.equal(catalog.filter(c => c.contype === 'p').length, 7);
  assert.equal(catalog.filter(c => c.contype === 'f').length, 9);
  assert.equal(catalog.filter(c => c.contype === 'u').length, 3);
  assert.equal(catalog.filter(c => c.contype === 'c').length, 6);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const role of ['USER', 'ADVISOR', 'ADMIN']) await client.query('UPDATE users SET role=$1 WHERE id=$2', [role, f.ua.id]);
    for (const status of ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']) await client.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, f.existing.appointments.id]);
    for (const domain of ['FINANCE', 'HEALTH', 'ASTROLOGY']) await client.query('UPDATE advisor_profiles SET domain=$1 WHERE id=$2', [domain, f.pa.id]);
  } finally { await client.query('ROLLBACK'); client.release(); }
});
for (let iteration = 1; iteration <= 3; iteration++) {
  // Raw bounded calls allow either scheduling order; ordinary API assertions still validate each response.
  async function compete(method, path, body, actor) {
    const responses = await Promise.all([api(method, path, body, actor, [201, 409]), api(method, path, body, actor, [201, 409])]);
    const results = responses.map(r => r.status);
    assert.deepEqual(results.sort(), [201, 409]);
  }
  check('Concurrency', `registration iteration ${iteration}`, async () => {
    const email = `${randomUUID()}@x.invalid`;
    await compete('POST', '/api/auth/register', { name: 'Race', email, password }, null);
    assert.equal((await pool.query('SELECT * FROM users WHERE email=$1', [email])).rowCount, 1);
  });
  check('Concurrency', `helpful iteration ${iteration}`, async () => {
    const p = await post(); await compete('POST', `/api/community/posts/${p.id}/helpful`, {}, f.ub);
    assert.equal((await pool.query('SELECT * FROM post_helpful WHERE post_id=$1 AND user_id=$2', [p.id, f.ub.id])).rowCount, 1);
  });
  check('Concurrency', `review iteration ${iteration}`, async () => {
    const a = await completed(); await compete('POST', '/api/reviews', { appointmentId: a.id, rating: 5 }, f.ua);
    assert.equal((await pool.query('SELECT * FROM reviews WHERE appointment_id=$1', [a.id])).rowCount, 1);
  });
  check('Concurrency', `competing confirms and cancel iteration ${iteration}`, async () => {
    const a = await book();
    const attempt = (fn) => fn().then(r => r.status);
    const statuses = await Promise.all([attempt(() => transition(a, 'CONFIRMED', f.aa, [200, 404])), attempt(() => transition(a, 'CONFIRMED', f.aa, [200, 404])),
      attempt(() => api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua, [200, 404]))]);
    assert.ok(statuses.filter(s => s === 200).length >= 1); assert.ok(statuses.slice(0, 2).filter(s => s === 200).length <= 1);
    assert.equal((await row('appointments', a.id)).status, 'CANCELLED');
    await transition(a, 'COMPLETED', f.aa, 404);
  });
  check('Concurrency', `complete versus cancel iteration ${iteration}`, async () => {
    const a = await book(); await transition(a, 'CONFIRMED');
    const attempt = (fn) => fn().then(r => r.status);
    const results = await Promise.all([attempt(() => transition(a, 'COMPLETED', f.aa, [200, 404])), attempt(() => api('PATCH', `/api/appointments/${a.id}/cancel`, {}, f.ua, [200, 404]))]);
    assert.deepEqual(results.sort(), [200, 404]); assert.ok(['COMPLETED', 'CANCELLED'].includes((await row('appointments', a.id)).status));
  });
}
check('E2E', 'Professional consultation steps 1–23', async () => {
  let step = 1;
  try {
    const advisor = await identity('ADVISOR', `E2E ${randomUUID()}`); step = 4;
    const p = await profile(advisor); step = 5;
    assert.ok((await api('GET', '/api/advisors')).advisors.some(x => x.id === p.id)); step = 6;
    const user = await identity('USER', 'Professional E2E User'); step = 9;
    assert.ok((await api('GET', `/api/advisors?search=${encodeURIComponent(advisor.name)}`)).advisors.some(x => x.id === p.id)); step = 10;
    assert.equal((await api('GET', `/api/advisors/${p.id}`)).advisor.id, p.id); step = 11;
    const a = await book(user, p); step = 13;
    assert.ok((await api('GET', '/api/appointments/user', undefined, user)).appointments.some(x => x.id === a.id)); step = 14;
    assert.ok((await api('GET', '/api/appointments/advisor', undefined, advisor)).appointments.some(x => x.id === a.id)); step = 15;
    assert.equal((await transition(a, 'CONFIRMED', advisor)).appointment.status, 'CONFIRMED'); step = 17;
    assert.equal((await transition(a, 'COMPLETED', advisor)).appointment.status, 'COMPLETED'); step = 19;
    const review = (await api('POST', '/api/reviews', { appointmentId: a.id, rating: 5 }, user, 201)).review;
    assert.equal(review.appointment_id, a.id); step = 21;
    const result = await api('GET', `/api/advisors/${p.id}/reviews`);
    assert.equal(result.averageRating, 5); assert.equal(result.reviewCount, 1); step = 23;
    const persisted = (await pool.query('SELECT a.user_id,a.advisor_id,a.status,r.rating,ap.user_id AS advisor_user FROM appointments a JOIN reviews r ON r.appointment_id=a.id JOIN advisor_profiles ap ON ap.id=a.advisor_id WHERE a.id=$1', [a.id])).rows[0];
    assert.deepEqual(persisted, { user_id: user.id, advisor_id: p.id, status: 'COMPLETED', rating: 5, advisor_user: advisor.id });
  } catch (e) { throw new Error(`Professional E2E step ${step}: ${e.message}`); }
});
check('E2E', 'Community consultation steps 1–17', async () => {
  let step = 1;
  try {
    const ua = await identity('USER'), ub = await identity('USER'); step = 2;
    const p = await post(ua); step = 3;
    assert.ok((await api('GET', '/api/community/posts')).posts.some(x => x.id === p.id)); step = 5;
    assert.equal((await api('GET', `/api/community/posts/${p.id}`, undefined, ub)).post.id, p.id); step = 6;
    const c = (await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'E2E comment' }, ub, 201)).comment; step = 7;
    assert.equal((await api('GET', `/api/community/posts/${p.id}/comments`)).comments[0].author_id, ub.id); step = 8;
    assert.equal(Number((await api('GET', `/api/community/posts/${p.id}`)).post.comment_count), 1); step = 9;
    await api('POST', `/api/community/posts/${p.id}/helpful`, {}, ub, 201); step = 10;
    assert.equal(Number((await api('GET', `/api/community/posts/${p.id}`)).post.helpful_count), 1); step = 11;
    await api('POST', `/api/community/posts/${p.id}/helpful`, {}, ub, 409); step = 12;
    assert.ok((await api('GET', `/api/community/posts?search=${encodeURIComponent(p.title)}`)).posts.some(x => x.id === p.id)); step = 13;
    await api('DELETE', `/api/community/posts/${p.id}`, undefined, ub, 404); step = 14;
    await api('DELETE', `/api/community/comments/${c.id}`, undefined, ub); assert.equal(await row('comments', c.id), undefined);
    // A second child proves cascade even after USER_B deletes their own comment.
    await api('POST', `/api/community/posts/${p.id}/comments`, { content: 'Cascade proof' }, ua, 201); step = 15;
    await api('DELETE', `/api/community/posts/${p.id}`, undefined, ua); step = 16;
    for (const table of ['comments', 'post_helpful']) assert.equal((await pool.query(`SELECT * FROM ${table} WHERE post_id=$1`, [p.id])).rowCount, 0);
    step = 17; assert.equal(await row('community_posts', p.id), undefined);
  } catch (e) { throw new Error(`Community E2E step ${step}: ${e.message}`); }
});
check('Database', 'all nine foreign-key relationships have no orphans after negative/concurrent tests', async () => {
  for (const [child, field, parent] of [['advisor_profiles', 'user_id', 'users'], ['appointments', 'user_id', 'users'], ['appointments', 'advisor_id', 'advisor_profiles'], ['community_posts', 'user_id', 'users'], ['comments', 'post_id', 'community_posts'], ['comments', 'user_id', 'users'], ['post_helpful', 'post_id', 'community_posts'], ['post_helpful', 'user_id', 'users'], ['reviews', 'appointment_id', 'appointments']]) {
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${child} c LEFT JOIN ${parent} p ON c.${field}=p.id WHERE p.id IS NULL`);
    assert.equal(result.rows[0].count, 0, `${child}.${field} orphans`);
  }
});
check('Security', 'oversized JSON returns safe 413', () => api('POST', '/api/community/posts', { domain: 'FINANCE', title: 'Large', content: 'x'.repeat(110000) }, f.ua, 413));
check('Security', 'status missing body safely rejected', async () => { const a = await book(); await api('PATCH', `/api/appointments/${a.id}/status`, undefined, f.aa, 400); });
check('Security', 'comment missing body safely rejected', async () => { const p = await post(); await api('POST', `/api/community/posts/${p.id}/comments`, undefined, f.ua, 400); });
check('Advisors', 'blank profile on fresh advisor rejected without persistence', async () => {
  const actor = await identity('ADVISOR'); await api('POST', '/api/advisors/profile', { ...profileBody, bio: ' ' }, actor, 400);
  assert.equal((await pool.query('SELECT * FROM advisor_profiles WHERE user_id=$1', [actor.id])).rowCount, 0);
});
check('Authentication', 'password boundaries 12 characters and 72 UTF8 bytes accepted', async () => {
  for (const boundary of ['x'.repeat(12), 'é'.repeat(36)]) {
    const email = `${randomUUID()}@x.invalid`;
    const result = await api('POST', '/api/auth/register', { name: 'Boundary', email, password: boundary }, null, 201);
    assert.equal(await require('bcrypt').compare(boundary, (await row('users', result.user.id)).password_hash), true);
    await api('POST', '/api/auth/login', { email, password: boundary });
  }
});
check('Reviews', 'existing numeric string rating contract retained', async () => {
  const a = await completed();
  assert.equal((await api('POST', '/api/reviews', { appointmentId: a.id, rating: '5', comment: ' ' }, f.ua, 201)).review.comment, null);
});
check('Advisors', 'missing profile update 404', async () => {
  const advisor = await identity('ADVISOR'); await api('PATCH', '/api/advisors/profile', { bio: 'Valid bio' }, advisor, 404);
});
check('Lifecycle', 'unknown appointment status and cancellation 404', async () => {
  await api('PATCH', `/api/appointments/${missing}/status`, { status: 'CONFIRMED' }, f.aa, 404);
  await api('PATCH', `/api/appointments/${missing}/cancel`, {}, f.ua, 404);
});
check('Appointments', 'invalid calendar date rejected safely', () => api('POST', '/api/appointments', {
  advisorId: f.pa.id, scheduledAt: `${new Date().getUTCFullYear() + 1}-02-30T10:00:00Z`
}, f.ua, 400));
check('Security', 'malformed percent encoding returns safe 400', () => api('GET', '/api/advisors/%', undefined, null, 400));
