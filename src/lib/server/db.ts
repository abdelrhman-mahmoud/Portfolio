import "server-only";
import { MongoClient, type Db } from "mongodb";
import { collectionNames } from "@/lib/cms/model";

declare global {
  var portfolioMongo: Promise<MongoClient> | undefined;
  var portfolioMongoUri: string | undefined;
}
export class ConfigurationError extends Error {}
export async function db(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new ConfigurationError(
      "Configure MONGODB_URI to enable content management.",
    );
  if (!global.portfolioMongo || global.portfolioMongoUri !== uri) {
    const previous = global.portfolioMongo;
    let client: MongoClient;
    try {
      client = new MongoClient(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
    } catch {
      throw new ConfigurationError(
        "MONGODB_URI is not a valid MongoDB connection string.",
      );
    }
    const connection = client.connect().catch((error: unknown) => {
      if (global.portfolioMongo === connection) {
        global.portfolioMongo = undefined;
        global.portfolioMongoUri = undefined;
      }
      if (
        error instanceof Error &&
        "code" in error &&
        (error.code === 18 ||
          (error.code === 8000 &&
            /auth|credentials|bad user/i.test(error.message)))
      ) {
        throw new ConfigurationError(
          "MongoDB authentication failed. Check the database username, password and authSource in MONGODB_URI.",
        );
      }
      throw new ConfigurationError(
        "Database connection unavailable. Check MongoDB configuration.",
      );
    });
    global.portfolioMongoUri = uri;
    global.portfolioMongo = connection;
    // Development reloads can change .env while the runtime remains alive.
    // Dispose of the previous pool instead of continuing to query the old database.
    if (previous) void previous.then((pool) => pool.close()).catch(() => {});
  }
  return (await global.portfolioMongo).db();
}
export async function ensureIndexes() {
  const database = await db();
  await Promise.all([
    database
      .collection("adminUsers")
      .createIndex({ email: 1 }, { unique: true }),
    database
      .collection("sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database
      .collection("rateLimits")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("projects").createIndex({ slug: 1 }, { unique: true }),
    database
      .collection("sectionSettings")
      .createIndex({ section: 1 }, { unique: true }),
    database.collection("auditLogs").createIndex({ createdAt: -1 }),
    ...collectionNames.map((name) =>
      database.collection(name).createIndex({ sortOrder: 1 }),
    ),
  ]);
}
