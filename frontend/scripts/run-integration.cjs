// Test-only stack. No .env loading, existing databases, Docker volumes or production changes.
const { mkdtempSync, readFileSync, readdirSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { resolve, join } = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { createServer } = require("node:net");
const { Client } = require("../../node_modules/pg");
const root = resolve(__dirname, "../.."),
  frontend = resolve(__dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "consultify-ui-test-"));
const database = `consultify_test_${randomBytes(8).toString("hex")}`;
function command(bin, args) {
  const result = spawnSync(bin, args, { encoding: "utf8" });
  if (result.error || result.status !== 0)
    throw new Error(
      `${bin} failed: ${result.stderr || result.error || result.stdout}`,
    );
}
async function port() {
  return new Promise((done, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const value = server.address().port;
      server.close(() => done(value));
    });
  });
}
async function main() {
  let started = false,
    backend,
    vite,
    client;
  const stop = async () => {
    await vite?.close();
    if (backend && backend.exitCode === null) {
      backend.kill("SIGTERM");
      await new Promise((done) => backend.once("exit", done));
    }
    if (client) await client.end();
    if (started) {
      command("pg_ctl", ["-D", join(temp, "data"), "-m", "fast", "-w", "stop"]);
      started = false;
    }
  };
  try {
    const pgPort = await port();
    command("initdb", [
      "-D",
      join(temp, "data"),
      "-A",
      "trust",
      "-U",
      "consultify_ui_test",
      "--encoding=UTF8",
      "--locale=C",
    ]);
    command("pg_ctl", [
      "-D",
      join(temp, "data"),
      "-l",
      join(temp, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${pgPort} -k ${temp}`,
      "-w",
      "start",
    ]);
    started = true;
    const config = {
      host: "127.0.0.1",
      port: pgPort,
      user: "consultify_ui_test",
      database: "postgres",
    };
    const admin = new Client(config);
    await admin.connect();
    try {
      if (!/^consultify_test_[a-f0-9]{16}$/.test(database))
        throw Error("Unsafe database name");
      await admin.query(`CREATE DATABASE "${database}"`);
    } finally {
      await admin.end();
    }
    client = new Client({ ...config, database });
    await client.connect();
    const identity = (
      await client.query(
        "SELECT current_database() AS name, version() AS version",
      )
    ).rows[0];
    if (identity.name !== database || identity.name === "consultify")
      throw Error("Isolation check failed");
    if (
      (await client.query("SELECT * FROM pg_tables WHERE schemaname='public'"))
        .rowCount
    )
      throw Error("Refusing nonempty schema");
    for (const name of readdirSync(join(root, "database/migrations"))
      .filter((f) => /^00[1-5]_.*\.sql$/.test(f))
      .sort())
      await client.query(
        readFileSync(join(root, "database/migrations", name), "utf8"),
      );
    const backendPort = await port(),
      jwtSecret = randomBytes(48).toString("hex");
    backend = spawn(
      process.execPath,
      [
        "-e",
        `const app=require('./src/app');const pool=require('./src/config/db');const server=app.listen(${backendPort},'127.0.0.1',()=>console.log('READY'));process.on('SIGTERM',()=>server.close(()=>pool.end().then(()=>process.exit(0))));`,
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: "test",
          DATABASE_URL: `postgresql://consultify_ui_test@127.0.0.1:${pgPort}/${database}`,
          JWT_SECRET: jwtSecret,
          JWT_EXPIRES_IN: "1h",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await new Promise((done, reject) => {
      const timer = setTimeout(
        () => reject(Error("Express start timed out")),
        10000,
      );
      backend.once("error", reject);
      backend.once("exit", () => {
        clearTimeout(timer);
        reject(Error("Express failed to start"));
      });
      backend.stdout.on("data", (data) => {
        if (data.toString().includes("READY")) {
          clearTimeout(timer);
          done();
        }
      });
    });
    // Vite forwards each /api request to the real isolated Express listener.
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      root: frontend,
      configFile: join(frontend, "vite.config.js"),
      server: {
        host: "127.0.0.1",
        port: await port(),
        strictPort: true,
        proxy: {
          "/api": {
            target: `http://127.0.0.1:${backendPort}`,
            changeOrigin: true,
          },
        },
      },
    });
    await vite.listen();
    const url = `http://127.0.0.1:${vite.httpServer.address().port}`;
    console.log(
      `Isolated UI stack: ${url}; database ${database}; PostgreSQL ${identity.version.split(" on ")[0]}`,
    );
    const { runBrowserChecks } = await import("../tests/browser.mjs");
    await runBrowserChecks({
      url,
      client,
      database,
      postgres: identity.version,
      expiredToken: (claims) =>
        require("../../node_modules/jsonwebtoken").sign(claims, jwtSecret, {
          expiresIn: -1,
        }),
    });
    if (process.argv.includes("--serve")) {
      console.log(
        `Review preview: ${url} (isolated test data). Press Ctrl+C to stop.`,
      );
      await new Promise((done) => {
        process.once("SIGINT", done);
        process.once("SIGTERM", done);
      });
    }
  } finally {
    await stop();
    console.log(
      "Owned UI servers and disposable PostgreSQL cluster stopped. Development data unchanged.",
    );
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
