import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { HttpError, jsonBody } from "@/lib/server/security";
import { isCollection } from "@/lib/cms/model";
import { reorderRecords } from "@/lib/server/repository";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ collection: string }> },
) {
  try {
    const admin = await requireAdmin(request, true);
    const { collection } = await ctx.params;
    if (!isCollection(collection))
      throw new HttpError(404, "Unknown collection.");
    await reorderRecords(collection, await jsonBody(request), admin.userId);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
