import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
loadEnvConfig(process.cwd());
async function main() {
  const { db, ensureIndexes } = await import("../src/lib/server/db");
  await ensureIndexes();
  const database = await db();
  const users = database.collection<{
    _id: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
    updatedAt?: Date;
  }>("adminUsers");
  const reset = process.argv.includes("--reset-password");
  const cli = createInterface({ input: process.stdin, output: process.stdout });
  const email = z
    .email()
    .parse(
      (process.env.ADMIN_EMAIL || (await cli.question("Admin email: ")))
        .trim()
        .toLowerCase(),
    );
  const password = process.env.ADMIN_PASSWORD;
  cli.close();
  if (!password || password.length < 14 || password.length > 256)
    throw new Error(
      "Set ADMIN_PASSWORD to a unique password of 14–256 characters in your shell, then retry. The password is never printed.",
    );
  const passwordHash = await hash(password, {
    algorithm: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  if (reset) {
    const result = await users.updateOne(
      { _id: "owner", email },
      { $set: { passwordHash, updatedAt: new Date() } },
    );
    if (!result.matchedCount) throw new Error("Admin email not found.");
    await database.collection("sessions").deleteMany({ userId: "owner" });
    console.log("Password updated. All sessions revoked.");
  } else {
    // A fixed id enforces single-admin bootstrap atomically, including concurrent CLI runs.
    await users.insertOne({
      _id: "owner",
      email,
      passwordHash,
      role: "admin",
      createdAt: new Date(),
    });
    console.log("Admin initialized. Sign in at /admin.");
  }
  await database.collection("auditLogs").insertOne({
    actor: "cli",
    action: reset ? "password-reset" : "admin-bootstrap",
    collection: "adminUsers",
    recordId: randomUUID(),
    createdAt: new Date().toISOString(),
  });
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      error.code === 11000
        ? "An admin already exists. Use --reset-password for recovery."
        : error.message,
    );
    process.exit(1);
  });
