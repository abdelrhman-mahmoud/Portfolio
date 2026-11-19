import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { deleteMedia, type MediaAsset } from "@/lib/server/media";
import { jsonBody, HttpError } from "@/lib/server/security";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/repository";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, ctx: Context) {
  try {
    const admin = await requireAdmin(request, true);
    await deleteMedia((await ctx.params).id, admin.userId);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, ctx: Context) {
  try {
    const admin = await requireAdmin(request, true);
    const { id } = await ctx.params;
    const values = z
      .object({ alt: z.string().max(500), caption: z.string().max(1000) })
      .strict()
      .parse(await jsonBody(request));
    const result = await (
      await db()
    )
      .collection<MediaAsset>("mediaAssets")
      .updateOne({ _id: id }, { $set: values });
    if (!result.matchedCount) throw new HttpError(404, "Media not found.");
    await audit(admin.userId, "update", "mediaAssets", id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
