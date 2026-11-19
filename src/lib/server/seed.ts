import "server-only";
import { initialContent } from "@/lib/cms/initial";
import { collectionNames, contentSchema, type Content } from "@/lib/cms/model";
import { db, ensureIndexes } from "./db";
import { sanitizeContent } from "./sanitize";
export async function seed() {
  await ensureIndexes();
  const database = await db();
  let inserted = 0;
  for (const name of collectionNames) {
    for (const item of initialContent[name]) {
      const { _id, ...rest } = item;
      const values = sanitizeContent(name, contentSchema(name).parse(rest));
      const now = new Date().toISOString();
      const result = await database
        .collection<Content>(name)
        .updateOne(
          { _id },
          {
            $setOnInsert: {
              ...values,
              createdAt: now,
              updatedAt: now,
              revision: 0,
            },
          },
          { upsert: true },
        );
      inserted += result.upsertedCount;
    }
  }
  return inserted;
}
