import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/server/content";
import { siteOrigin } from "@/lib/server/seo";
import { str } from "@/lib/cms/model";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const data = await getPortfolio();
  const origin = siteOrigin(str(data.siteSettings[0], "siteUrl"));
  return {
    rules: {
      userAgent: "*",
      allow: data.siteSettings[0]?.indexing === false ? undefined : "/",
      disallow:
        data.siteSettings[0]?.indexing === false ? "/" : ["/admin", "/api/"],
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
