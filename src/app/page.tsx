import { publicContent } from "@/lib/server/content";
import {
  SiteShell,
  HomeContent,
  contactLinks,
} from "@/components/portfolio/site";
import { str } from "@/lib/cms/model";
import { jsonLd, siteOrigin } from "@/lib/server/seo";
export default async function Home() {
  const data = await publicContent();
  const profile = data.profile[0];
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: str(profile, "name"),
    jobTitle: str(profile, "title"),
    ...(siteOrigin(str(data.siteSettings[0], "siteUrl"))
      ? { url: siteOrigin(str(data.siteSettings[0], "siteUrl")) }
      : {}),
    sameAs: data.contact[0]
      ? contactLinks(data.contact[0])
          .filter((l) => ["linkedin", "github", "kaggle"].includes(l.key))
          .map((l) => l.href)
      : [],
  };
  return (
    <SiteShell data={data}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(person) }}
      />
      <HomeContent data={data} />
    </SiteShell>
  );
}
