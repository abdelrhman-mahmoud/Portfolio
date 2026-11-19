import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/server/db";
import { getPortfolio } from "../src/lib/server/content";
import { initialContent } from "../src/lib/cms/initial";

const isolated = process.env.PORTFOLIO_ISOLATED_TEST === "1";
const originalUri = process.env.MONGODB_URI;
test.after(async () => {
  if (global.portfolioMongo)
    await (await global.portfolioMongo.catch(() => null))?.close();
  global.portfolioMongo = undefined;
  global.portfolioMongoUri = undefined;
  if (originalUri === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = originalUri;
});
test(
  "empty initial database renders supplied content without writing records",
  { skip: !isolated },
  async () => {
    const database = await db();
    assert.equal(database.databaseName, "portfolio_test");
    assert.deepEqual(await getPortfolio(), initialContent);
    assert.equal(await database.collection("projects").countDocuments(), 0);
  },
);
test(
  "changing the configured URI replaces the cached connection",
  { skip: !isolated },
  async () => {
    const first = await db();
    assert.equal((await db()).client, first.client);
    const changed = new URL(originalUri!);
    changed.pathname = "/portfolio_test_cache_check";
    process.env.MONGODB_URI = changed.href;
    const second = await db();
    assert.equal(second.databaseName, "portfolio_test_cache_check");
    assert.notEqual(second.client, first.client);
    process.env.MONGODB_URI = originalUri;
    assert.equal((await db()).databaseName, "portfolio_test");
  },
);
