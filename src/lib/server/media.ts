import "server-only";
import { del } from "@vercel/blob";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { db, ConfigurationError } from "./db";
import { HttpError } from "./security";
import { audit } from "./repository";
import { collectionNames, type Content } from "@/lib/cms/model";
export type MediaAsset = {
  _id: string;
  url: string;
  storageKey: string;
  storageProvider?: "mongodb" | "blob";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt: string;
  caption: string;
  createdAt: string;
};
export const mediaBucket = async () =>
  new GridFSBucket(await db(), { bucketName: "portfolioMedia" });
export async function validateFile(bytes: Buffer, mime: string) {
  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024)
    throw new HttpError(400, "Files must be between 1 byte and 4 MB.");
  if (mime === "application/pdf") {
    if (
      bytes.subarray(0, 5).toString() !== "%PDF-" ||
      !bytes.subarray(-2048).toString().includes("%%EOF")
    )
      throw new HttpError(400, "Invalid PDF file.");
    return { bytes, mimeType: mime, extension: "pdf" };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
    throw new HttpError(415, "Choose a JPEG, PNG, WebP or PDF file.");
  try {
    const metadata = await sharp(bytes, {
      limitInputPixels: 40000000,
      animated: false,
    }).metadata();
    const expected = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    }[mime];
    if (metadata.format !== expected) throw new Error("Mismatched type");
    // Decode and re-encode images: strip metadata and discard embedded non-image data.
    const result = await sharp(bytes, { limitInputPixels: 40000000 })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    return {
      bytes: result.data,
      mimeType: "image/webp",
      extension: "webp",
      width: result.info.width,
      height: result.info.height,
    };
  } catch {
    throw new HttpError(
      400,
      "The image could not be decoded or exceeds the pixel limit.",
    );
  }
}
export async function uploadMedia(
  bytes: Buffer,
  mime: string,
  alt: string,
  actor: string,
) {
  const file = await validateFile(bytes, mime);
  const id = randomUUID();
  const fileId = new ObjectId();
  const bucket = await mediaBucket();
  const upload = bucket.openUploadStreamWithId(
    fileId,
    `${id}.${file.extension}`,
    {
      metadata: { mimeType: file.mimeType },
    },
  );
  try {
    await pipeline(Readable.from([file.bytes]), upload);
  } catch {
    await upload.abort().catch(() => {});
    throw new HttpError(
      503,
      "Could not save the file to MongoDB. Please try again.",
    );
  }
  const record: MediaAsset = {
    _id: id,
    url: `/api/media/${id}`,
    storageKey: fileId.toHexString(),
    storageProvider: "mongodb",
    mimeType: file.mimeType,
    size: file.bytes.length,
    alt,
    caption: "",
    createdAt: new Date().toISOString(),
    ...(file.width ? { width: file.width, height: file.height } : {}),
  };
  try {
    await (await db()).collection<MediaAsset>("mediaAssets").insertOne(record);
  } catch (error) {
    await bucket.delete(fileId);
    throw error;
  }
  await audit(actor, "upload", "mediaAssets", id);
  return record;
}
export async function deleteMedia(id: string, actor: string) {
  const database = await db();
  const asset = await database
    .collection<MediaAsset>("mediaAssets")
    .findOne({ _id: id });
  if (!asset) throw new HttpError(404, "Media not found.");
  // Never break an existing record: remove references in the content editor first.
  for (const name of collectionNames) {
    const records = await database.collection<Content>(name).find({}).toArray();
    if (records.some((item) => JSON.stringify(item).includes(asset.url)))
      throw new HttpError(
        409,
        `This media is used in ${name}. Remove or replace those references first.`,
      );
  }
  if (asset.storageProvider === "mongodb") {
    await (await mediaBucket()).delete(new ObjectId(asset.storageKey));
  } else {
    // Existing Blob files remain usable; new uploads always use MongoDB.
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new ConfigurationError(
        "Deleting this older Blob file requires BLOB_READ_WRITE_TOKEN.",
      );
    await del(asset.url);
  }
  await database.collection<MediaAsset>("mediaAssets").deleteOne({ _id: id });
  await audit(actor, "delete", "mediaAssets", id);
}
