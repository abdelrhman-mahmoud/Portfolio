import { Readable } from "node:stream";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { mediaBucket, type MediaAsset } from "@/lib/server/media";
import { apiError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success)
      throw new HttpError(404, "File not found.");
    const asset = await (
      await db()
    )
      .collection<MediaAsset>("mediaAssets")
      .findOne({ _id: id, storageProvider: "mongodb" });
    if (!asset || !ObjectId.isValid(asset.storageKey))
      throw new HttpError(404, "File not found.");
    const bucket = await mediaBucket();
    const fileId = new ObjectId(asset.storageKey);
    const file = await bucket.find({ _id: fileId }).next();
    if (!file) throw new HttpError(404, "File not found.");
    const headers = new Headers({
      "Content-Type": asset.mimeType,
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      ETag: `"${id}"`,
      "Content-Disposition": `inline; filename="${id}.${asset.mimeType === "application/pdf" ? "pdf" : "webp"}"`,
      ...(asset.mimeType === "application/pdf"
        ? { "Content-Security-Policy": "sandbox; default-src 'none'" }
        : {}),
    });
    if (
      request.headers.get("if-none-match") === `"${id}"` &&
      !request.headers.has("range")
    ) {
      headers.delete("Content-Length");
      return new Response(null, { status: 304, headers });
    }
    let start = 0;
    let end = file.length - 1;
    let status = 200;
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${file.length}` },
        });
      }
      if (!match[1]) start = Math.max(0, file.length - Number(match[2]));
      else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      }
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= file.length ||
        (match[1] === "" && Number(match[2]) === 0)
      ) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${file.length}` },
        });
      }
      status = 206;
      headers.set("Content-Range", `bytes ${start}-${end}/${file.length}`);
      headers.set("Content-Length", String(end - start + 1));
    }
    const stream = bucket.openDownloadStream(fileId, { start, end: end + 1 });
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      status,
      headers,
    });
  } catch (error) {
    return apiError(error);
  }
}
