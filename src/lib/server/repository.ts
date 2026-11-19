import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import {
  contentSchema,
  definitions,
  isSingleton,
  type CollectionName,
  type Content,
} from "@/lib/cms/model";
import { sanitizeContent } from "./sanitize";
import { HttpError } from "./security";
import { z } from "zod";
const requestSchema = z
  .object({
    values: z.record(z.string(), z.unknown()),
    revision: z.number().int().optional(),
  })
  .strict();
export async function saveRecord(
  name: CollectionName,
  id: string | null,
  input: unknown,
  actor: string,
) {
  const parsed = requestSchema.parse(input);
  const values = sanitizeContent(
    name,
    contentSchema(name).parse(parsed.values),
  );
  const database = await db();
  const records = database.collection<Content>(name);
  const now = new Date().toISOString();
  const recordId = isSingleton(name) ? "main" : id || randomUUID();
  const current = await records.findOne({ _id: recordId });
  if (id && !current) throw new HttpError(404, "Record not found.");
  if (current && parsed.revision !== (current.revision || 0))
    throw new HttpError(
      409,
      "This record changed in another tab. Reload before saving.",
    );
  const result = await records.updateOne(
    {
      _id: recordId,
      ...(current ? { revision: current.revision ?? { $exists: false } } : {}),
    },
    {
      $set: {
        ...values,
        updatedAt: now,
        revision: (current?.revision || 0) + 1,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: !current },
  );
  if (!result.matchedCount && !result.upsertedCount)
    throw new HttpError(409, "Record changed. Reload before saving.");
  await audit(actor, current ? "update" : "create", name, recordId);
  return records.findOne({ _id: recordId });
}
export async function deleteRecord(
  name: CollectionName,
  id: string,
  actor: string,
) {
  if (isSingleton(name))
    throw new HttpError(400, "Edit this setting instead of deleting it.");
  const result = await (
    await db()
  )
    .collection<Content>(name)
    .deleteOne({ _id: id });
  if (!result.deletedCount) throw new HttpError(404, "Record not found.");
  await audit(actor, "delete", name, id);
}
export async function reorderRecords(
  name: CollectionName,
  input: unknown,
  actor: string,
) {
  const { ids } = z
    .object({ ids: z.array(z.string().min(1).max(128)).min(1).max(1000) })
    .strict()
    .parse(input);
  if (new Set(ids).size !== ids.length || isSingleton(name))
    throw new HttpError(400, "Invalid ordering.");
  const records = (await db()).collection<Content>(name);
  const all = await records
    .find({}, { projection: { _id: 1, revision: 1 } })
    .toArray();
  if (all.length !== ids.length || all.some((v) => !ids.includes(v._id)))
    throw new HttpError(
      409,
      "The collection changed. Reload before reordering.",
    );
  await records.bulkWrite(
    ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            sortOrder: index,
            updatedAt: new Date().toISOString(),
            revision: (all.find((item) => item._id === id)?.revision || 0) + 1,
          },
        },
      },
    })),
  );
  await audit(actor, "reorder", name, name);
}
export async function audit(
  actor: string,
  action: string,
  collection: string,
  recordId: string,
) {
  await (
    await db()
  )
    .collection("auditLogs")
    .insertOne({
      actor,
      action,
      collection,
      recordId,
      createdAt: new Date().toISOString(),
    });
}
export async function getAdminRecords(name: CollectionName) {
  if (!(name in definitions)) throw new HttpError(404, "Unknown collection.");
  return (await db())
    .collection<Content>(name)
    .find({})
    .sort({ sortOrder: 1, _id: 1 })
    .limit(1000)
    .toArray();
}
