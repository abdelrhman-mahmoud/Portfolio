import "server-only";
import type { Metadata } from "next";
import { getPortfolio } from "./content";
import { str, list } from "@/lib/cms/model";
import { initialContent } from "@/lib/cms/initial";
export async function siteMetadata(): Promise<Metadata> {
  // Metadata runs above page error boundaries. A database outage must not break
  // the root layout or prevent the page's recovery UI from rendering.
  let available = true;
  const data = await getPortfolio().catch(() => {
    available = false;
    return initialContent;
  });
  const settings = data.siteSettings[0];
  const profile = data.profile[0];
  const url = siteOrigin(str(settings, "siteUrl"));
  const title = str(settings, "title") || str(profile, "name");
  const description = str(settings, "description");
  const image = str(settings, "ogImage") || "/opengraph-image";
  return {
    ...(url
      ? { metadataBase: new URL(url), alternates: { canonical: url } }
      : {}),
    title: { default: title, template: `%s · ${str(profile, "displayName")}` },
    description,
    keywords: settings ? list(settings, "keywords") : [],
    authors: [{ name: str(profile, "name") }],
    openGraph: {
      title,
      description,
      type: "website",
      ...(url ? { url } : {}),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: available && settings?.indexing !== false,
      follow: available,
    },
  };
}
export function siteOrigin(configured = "") {
  const candidate =
    configured ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
