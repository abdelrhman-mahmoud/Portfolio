import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { HttpError, jsonBody } from "@/lib/server/security";
import { isCollection } from "@/lib/cms/model";
import { getAdminRecords, saveRecord } from "@/lib/server/repository";
type Context = { params: Promise<{ collection: string }> };
export async function GET(request: Request, ctx: Context) {
  try {
    await requireAdmin();
    const { collection } = await ctx.params;
    if (!isCollection(collection))
      throw new HttpError(404, "Unknown collection.");
    return Response.json(await getAdminRecords(collection), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, ctx: Context) {
  try {
    const admin = await requireAdmin(request, true);
    const { collection } = await ctx.params;
    if (!isCollection(collection))
      throw new HttpError(404, "Unknown collection.");
    return Response.json(
      await saveRecord(collection, null, await jsonBody(request), admin.userId),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
