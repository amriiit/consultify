// Creates a NEW cluster; never loads .env, accepts database URLs, or drops databases.
const { mkdtempSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { createServer } = require('node:net');
const { Client } = require('pg');
const { randomBytes } = require('node:crypto');
const root = resolve(__dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'consultify-test-'));
const database = `consultify_test_${randomBytes(8).toString('hex')}`;
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`${bin} failed; isolated infrastructure unavailable: ${r.stderr || r.error || r.stdout}`);
  return r.stdout;
}
async function main() {
  let started = false;
  try {
    const port = await new Promise((resolvePort, reject) => {
      const s = createServer(); s.on('error', reject);
      s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolvePort(p)); });
    });
    run('initdb', ['-D', join(temp, 'data'), '-A', 'trust', '-U', 'consultify_test_admin', '--encoding=UTF8', '--locale=C']);
    run('pg_ctl', ['-D', join(temp, 'data'), '-l', join(temp, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port} -k ${temp}`, '-w', 'start']);
    started = true;
    const config = { host: '127.0.0.1', port, user: 'consultify_test_admin', database: 'postgres' };
    const admin = new Client(config); await admin.connect();
    // No IF NOT EXISTS: collision MUST fail rather than reuse any database.
    if (!/^consultify_test_[a-f0-9]{16}$/.test(database)) throw new Error('Unsafe database name');
    await admin.query(`CREATE DATABASE "${database}"`); await admin.end();
    const connectionString = `postgresql://consultify_test_admin@127.0.0.1:${port}/${database}`;
    const client = new Client({ connectionString }); await client.connect();
    const identity = (await client.query('SELECT current_database() AS name, version() AS version')).rows[0];
    if (identity.name !== database || identity.name === 'consultify') throw new Error('Isolation verification failed');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    if (tables.rowCount !== 0) throw new Error('Refusing migrations into nonempty database');
    for (const file of readdirSync(join(root, 'database/migrations')).filter(f => /^00[1-5]_.*\.sql$/.test(f)).sort()) {
      await client.query(readFileSync(join(root, 'database/migrations', file), 'utf8'));
    }
    await client.end();
    console.log(`Isolated database: ${database}; ${identity.version.split(' on ')[0]}`);
    writeFileSync(join(temp, 'environment.json'), JSON.stringify({ database, postgres: identity.version, node: process.version, temp }));
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/backend.test.js'], {
      cwd: root, stdio: 'inherit', timeout: 120000, env: { ...process.env, DATABASE_URL: connectionString,
        JWT_SECRET: randomBytes(48).toString('hex'), JWT_EXPIRES_IN: '1h', NODE_ENV: 'test',
        CONSULTIFY_TEST_DATABASE: database, CONSULTIFY_TEST_ENVIRONMENT: join(temp, 'environment.json') }
    });
    process.exitCode = result.status ?? 1;
  } finally {
    if (started) run('pg_ctl', ['-D', join(temp, 'data'), '-m', 'fast', '-w', 'stop']);
    console.log(`Disposable cluster stopped; retained evidence directory: ${temp}`);
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
