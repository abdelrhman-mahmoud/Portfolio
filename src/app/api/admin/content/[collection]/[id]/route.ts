import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { HttpError, jsonBody } from "@/lib/server/security";
import { isCollection } from "@/lib/cms/model";
import { saveRecord, deleteRecord } from "@/lib/server/repository";
type Context = { params: Promise<{ collection: string; id: string }> };
export async function PUT(request: Request, ctx: Context) {
  try {
    const admin = await requireAdmin(request, true);
    const { collection, id } = await ctx.params;
    if (!isCollection(collection))
      throw new HttpError(404, "Unknown collection.");
    return Response.json(
      await saveRecord(collection, id, await jsonBody(request), admin.userId),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, ctx: Context) {
  try {
    const admin = await requireAdmin(request, true);
    const { collection, id } = await ctx.params;
    if (!isCollection(collection))
      throw new HttpError(404, "Unknown collection.");
    await deleteRecord(collection, id, admin.userId);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
