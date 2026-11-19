import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { boundedBody } from "@/lib/server/security";
import { db } from "@/lib/server/db";
import { uploadMedia } from "@/lib/server/media";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      await (
        await db()
      )
        .collection("mediaAssets")
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray(),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request, true);
    const bytes = await boundedBody(request, 4 * 1024 * 1024);
    return Response.json(
      await uploadMedia(
        bytes,
        request.headers.get("content-type") || "",
        "",
        admin.userId,
      ),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
