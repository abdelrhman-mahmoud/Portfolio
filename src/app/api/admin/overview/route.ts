import { requireAdmin } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
export async function GET() {
  try {
    await requireAdmin();
    const database = await db();
    const names = ["projects", "publications", "certifications", "experiences"];
    const totals = Object.fromEntries(
      await Promise.all(
        names.map(async (name) => [
          name,
          await database.collection(name).countDocuments(),
        ]),
      ),
    );
    totals.featured = await database
      .collection("projects")
      .countDocuments({ featured: true });
    const recent = await database
      .collection("auditLogs")
      .find({}, { projection: { _id: 0, actor: 0 } })
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray();
    return Response.json(
      { totals, recent },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
