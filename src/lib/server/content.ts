import "server-only";
import { cache } from "react";
import { db } from "./db";
import { initialContent } from "@/lib/cms/initial";
import {
  collectionNames,
  type CollectionName,
  type Content,
  type Portfolio,
  shown,
} from "@/lib/cms/model";
export const getPortfolio = cache(async (): Promise<Portfolio> => {
  // Fallback is only for unconfigured initial setup. Configured DB errors fail visibly.
  if (!process.env.MONGODB_URI) return structuredClone(initialContent);
  const database = await db();
  const entries = await Promise.all(
    collectionNames.map(async (name) => {
      const docs = await database
        .collection(name)
        .find({}, { projection: { seedKey: 0 } })
        .sort({ sortOrder: 1, _id: 1 })
        .limit(1000)
        .toArray();
      return [
        name,
        docs.map((doc) => JSON.parse(JSON.stringify(doc)) as Content),
      ] as const;
    }),
  );
  // A brand-new database has no content yet. Show the supplied setup content
  // until the explicit seed command runs; preserve intentional empty collections
  // and hidden sections after initialization.
  if (entries.every(([, records]) => records.length === 0)) {
    return structuredClone(initialContent);
  }
  return Object.fromEntries(entries) as Portfolio;
});
export async function publicContent() {
  const portfolio = await getPortfolio();
  return Object.fromEntries(
    collectionNames.map((name) => [name, portfolio[name].filter(shown)]),
  ) as Portfolio;
}
export async function findProject(slug: string, preview = false) {
  const content = await getPortfolio();
  return content.projects.find(
    (item) => item.slug === slug && (preview || shown(item)),
  );
}
export async function records(name: CollectionName) {
  return (await getPortfolio())[name];
}
