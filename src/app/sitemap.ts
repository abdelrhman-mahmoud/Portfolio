import type { MetadataRoute } from "next";
import { publicContent } from "@/lib/server/content";
import { siteOrigin } from "@/lib/server/seo";
import { str } from "@/lib/cms/model";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await publicContent();
  const origin = siteOrigin(str(data.siteSettings[0], "siteUrl"));
  if (!origin || data.siteSettings[0]?.indexing === false) return [];
  return [
    { url: origin },
    { url: `${origin}/card` },
    ...data.projects.map((p) => ({
      url: `${origin}/projects/${p.slug}`,
      ...(p.updatedAt ? { lastModified: str(p, "updatedAt") } : {}),
    })),
  ];
}
