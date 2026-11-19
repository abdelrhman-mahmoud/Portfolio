import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // An exact Origin check plus a custom header blocks browser CSRF, including login CSRF.
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    request.headers.get("x-portfolio-admin") !== "1"
  )
    throw new HttpError(403, "Request origin rejected.");
}
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = createHash("sha256").update(`${key}:${bucket}`).digest("hex");
  const limits = (await db()).collection<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>("rateLimits");
  // updateOne + read avoids a first-hit upsert race; duplicate key means another request created it.
  try {
    await limits.updateOne(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date((bucket + 2) * windowSeconds * 1000),
        },
      },
      { upsert: true },
    );
  } catch (e) {
    if (!(e && typeof e === "object" && "code" in e && e.code === 11000))
      throw e;
    await limits.updateOne({ _id: id }, { $inc: { count: 1 } });
  }
  const entry = await limits.findOne({ _id: id });
  if (!entry || entry.count > max)
    throw new HttpError(429, "Too many requests. Please try again later.");
}
export async function boundedBody(request: Request, max = 256000) {
  if (Number(request.headers.get("content-length")) > max)
    throw new HttpError(413, "Request is too large.");
  if (!request.body) throw new HttpError(400, "Request body required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Send JSON content.");
  try {
    return JSON.parse((await boundedBody(request)).toString());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Invalid JSON.");
  }
}
