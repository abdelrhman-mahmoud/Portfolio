import { spawn } from "node:child_process";
import { mkdtemp, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient } from "mongodb";
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
const directory = await mkdtemp(join(tmpdir(), "portfolio-mongo-"));
const mongoPort = await freePort();
const webPort = await freePort();
const environment = {
  ...process.env,
  MONGODB_URI: `mongodb://127.0.0.1:${mongoPort}/portfolio_test`,
  AUTH_SECRET: randomBytes(32).toString("hex"),
  ADMIN_EMAIL: "integration@example.test",
  ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
  PORTFOLIO_TEST_PORT: String(webPort),
  PORTFOLIO_ISOLATED_TEST: "1",
  BLOB_READ_WRITE_TOKEN: "",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${webPort}`,
};
if (!environment.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  try {
    await access("/usr/bin/google-chrome");
    environment.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "/usr/bin/google-chrome";
  } catch {}
}
const mongo = spawn(
  "mongod",
  [
    "--dbpath",
    directory,
    "--port",
    String(mongoPort),
    "--bind_ip",
    "127.0.0.1",
    "--quiet",
    "--logpath",
    join(directory, "mongo.log"),
  ],
  { stdio: "ignore" },
);
let mongoError;
mongo.on("error", (error) => {
  mongoError = error;
});
function command(args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: environment,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let result = "";
    if (capture) {
      child.stdout.on("data", (data) => {
        result += data;
      });
      child.stderr.on("data", (data) => {
        result += data;
      });
    }
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve(result)
        : reject(
            new Error(capture ? result : `Test command failed (${code}).`),
          ),
    );
  });
}
let client;
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (mongoError)
      throw new Error(
        "Browser integration tests need the mongod executable on PATH. See SETUP.md.",
      );
    try {
      client = await new MongoClient(environment.MONGODB_URI, {
        serverSelectionTimeoutMS: 500,
      }).connect();
      break;
    } catch {
      if (attempt === 39) throw new Error("Test MongoDB did not start.");
    }
  }
  const args = ["--conditions=react-server", "--import", "tsx"];
  await command([...args, "--test", "tests/database.test.ts"]);
  console.log("Seeding isolated temporary MongoDB…");
  await command([...args, "scripts/seed.ts"]);
  const database = client.db();
  const countBefore = await database.collection("projects").countDocuments();
  await database
    .collection("projects")
    .updateOne(
      { _id: "project-1" },
      { $set: { role: "Edited before repeat seed" } },
    );
  await command([...args, "scripts/seed.ts"]);
  if (
    (await database.collection("projects").countDocuments()) !== countBefore ||
    (await database.collection("projects").findOne({ _id: "project-1" }))
      .role !== "Edited before repeat seed"
  )
    throw new Error("Seed idempotence failed.");
  console.log("PASS: repeat seed creates no duplicates and preserves edits.");
  await command([...args, "scripts/admin.ts"]);
  const owner = await database
    .collection("adminUsers")
    .findOne({ _id: "owner" });
  if (!owner?.passwordHash.startsWith("$argon2id$"))
    throw new Error("Password is not hashed with Argon2id.");
  let duplicateRejected = false;
  try {
    await command([...args, "scripts/admin.ts"], true);
  } catch {
    duplicateRejected = true;
  }
  if (
    !duplicateRejected ||
    (await database.collection("adminUsers").countDocuments()) !== 1
  )
    throw new Error("Duplicate bootstrap was not rejected.");
  console.log("PASS: Argon2id hash and duplicate-admin bootstrap protection.");
  await command(["node_modules/@playwright/test/cli.js", "test"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client?.close();
  mongo.kill("SIGTERM");
  await new Promise((resolve) => {
    if (mongoError || mongo.exitCode !== null) resolve();
    else mongo.once("exit", resolve);
  });
  await rm(directory, { recursive: true, force: true });
}
