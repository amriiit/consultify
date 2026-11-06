// Owns a fresh disposable cluster only. Never reads .env or reuses development data.
const {
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { spawnSync, spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { createServer } = require("node:net");
const { Client } = require("../../node_modules/pg");
const root = resolve(__dirname, "../..");
const frontend = join(root, "frontend");
const temp = mkdtempSync(join(tmpdir(), "consultify-frontend-"));
const database = `consultify_test_${randomBytes(8).toString("hex")}`;
const output = join(frontend, "test-results");
mkdirSync(output, { recursive: true });
function run(bin, args) {
  const result = spawnSync(bin, args, { encoding: "utf8", timeout: 60000 });
  if (result.error || result.status !== 0)
    throw new Error(
      `${bin}: ${result.stderr || result.error || result.stdout}`,
    );
  return result.stdout;
}
async function freePort() {
  return new Promise((resolvePort, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolvePort(p));
    });
  });
}
async function main() {
  let cluster = false,
    container = null,
    appServer,
    vite,
    pool;
  try {
    let pgPort;
    const apiPort = await freePort();
    const webPort = await freePort();
    const dockerMode = process.argv.includes("--docker");
    let dbPassword;
    if (dockerMode) {
      const name = `consultify-frontend-${randomBytes(8).toString("hex")}`;
      dbPassword = randomBytes(32).toString("hex");
      const childEnv = { ...process.env, POSTGRES_PASSWORD: dbPassword };
      const created = spawnSync(
        "docker",
        [
          "run",
          "--detach",
          "--rm",
          "--name",
          name,
          "--publish",
          "127.0.0.1::5432",
          "--tmpfs",
          "/var/lib/postgresql/data:rw",
          "--env",
          "POSTGRES_USER=consultify_test_admin",
          "--env",
          "POSTGRES_DB=postgres",
          "--env",
          "POSTGRES_PASSWORD",
          "postgres:17.4",
        ],
        { env: childEnv, encoding: "utf8", timeout: 60000 },
      );
      if (created.status !== 0)
        throw new Error(`Isolated Docker startup failed: ${created.stderr}`);
      container = created.stdout.trim();
      pgPort = Number(
        run("docker", ["port", container, "5432/tcp"]).trim().split(":").pop(),
      );
      let ready = false;
      for (let i = 0; i < 100; i++) {
        const probe = new Client({
          host: "127.0.0.1",
          port: pgPort,
          user: "consultify_test_admin",
          database: "postgres",
          password: dbPassword,
        });
        try {
          await probe.connect();
          await probe.end();
          ready = true;
          break;
        } catch {
          await probe.end().catch(() => {});
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!ready) throw new Error("Isolated Docker PostgreSQL was not ready");
    } else {
      pgPort = await freePort();
      run("initdb", [
        "-D",
        join(temp, "data"),
        "-A",
        "trust",
        "-U",
        "consultify_test_admin",
        "--encoding=UTF8",
        "--locale=C",
      ]);
      run("pg_ctl", [
        "-D",
        join(temp, "data"),
        "-l",
        join(temp, "postgres.log"),
        "-o",
        `-h 127.0.0.1 -p ${pgPort} -k ${temp}`,
        "-w",
        "start",
      ]);
      cluster = true;
    }
    const config = {
      host: "127.0.0.1",
      port: pgPort,
      user: "consultify_test_admin",
      database: "postgres",
      password: dbPassword,
    };
    const admin = new Client(config);
    await admin.connect();
    if (!/^consultify_test_[a-f0-9]{16}$/.test(database))
      throw new Error("Unsafe isolation name");
    await admin.query(`CREATE DATABASE "${database}"`);
    await admin.end();
    const connectionString = `postgresql://consultify_test_admin${dbPassword ? `:${dbPassword}` : ""}@127.0.0.1:${pgPort}/${database}`;
    const client = new Client({ connectionString });
    await client.connect();
    const identity = (
      await client.query(
        "SELECT current_database() AS name, version() AS version",
      )
    ).rows[0];
    if (
      identity.name !== database ||
      (
        await client.query(
          "SELECT tablename FROM pg_tables WHERE schemaname='public'",
        )
      ).rowCount
    )
      throw new Error("Isolation verification failed");
    for (const file of readdirSync(join(root, "database/migrations"))
      .filter((f) => /^00[1-5]_.*\.sql$/.test(f))
      .sort())
      await client.query(
        readFileSync(join(root, "database/migrations", file), "utf8"),
      );
    await client.end();
    process.env.DATABASE_URL = connectionString;
    process.env.JWT_SECRET = randomBytes(48).toString("hex");
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.NODE_ENV = "test";
    const app = require("../../src/app");
    pool = require("../../src/config/db");
    appServer = app.listen(apiPort, "127.0.0.1");
    await new Promise((r) => appServer.once("listening", r));
    vite = spawn(
      process.execPath,
      [
        join(frontend, "node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        String(webPort),
      ],
      {
        cwd: frontend,
        env: {
          ...process.env,
          API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    vite.stdout.on("data", (d) => {
      logs += d;
    });
    vite.stderr.on("data", (d) => {
      logs += d;
    });
    const base = `http://127.0.0.1:${webPort}`;
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(base)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!ready) throw new Error(`Vite unavailable: ${logs}`);
    writeFileSync(
      join(output, "environment.json"),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          node: process.version,
          postgres: identity.version,
          database,
          temp,
          base,
        },
        null,
        2,
      ),
    );
    console.log(
      `Isolated ${identity.version.split(" on ")[0]}; browser tests starting.`,
    );
    const child = spawn(process.execPath, ["tests/e2e.mjs"], {
      cwd: frontend,
      env: { ...process.env, TEST_BASE_URL: base },
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });
    child.on("message", async (message) => {
      if (message.type !== "backend") return;
      try {
        if (message.up) {
          appServer = app.listen(apiPort, "127.0.0.1");
          await new Promise((r) => appServer.once("listening", r));
        } else await new Promise((r) => appServer.close(r));
        child.send({ type: "backend-ready", up: message.up });
      } catch {
        child.send({ type: "backend-error" });
      }
    });
    const result = await new Promise((resolveResult, reject) => {
      child.on("error", reject);
      child.on("exit", resolveResult);
    });
    process.exitCode = result || 0;
  } finally {
    if (vite) {
      vite.kill("SIGTERM");
      await new Promise((r) => vite.once("exit", r));
    }
    if (appServer) await new Promise((r) => appServer.close(r));
    if (pool) await pool.end();
    if (cluster)
      run("pg_ctl", ["-D", join(temp, "data"), "-m", "fast", "-w", "stop"]);
    if (container) run("docker", ["stop", "--time", "5", container]);
    console.log(
      "Owned disposable cluster stopped. No development database was used.",
    );
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
