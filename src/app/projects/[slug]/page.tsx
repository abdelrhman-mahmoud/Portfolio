import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicContent } from "@/lib/server/content";
import { SiteShell } from "@/components/portfolio/site";
import { ProjectDetail } from "@/components/portfolio/project-detail";
import { str } from "@/lib/cms/model";
import { siteOrigin } from "@/lib/server/seo";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await publicContent();
  const project = data.projects.find((p) => p.slug === slug);
  if (!project)
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  const origin = siteOrigin(str(data.siteSettings[0], "siteUrl"));
  return {
    title: str(project, "title"),
    description: str(project, "shortDescription"),
    alternates: origin
      ? { canonical: `${origin}/projects/${slug}` }
      : { canonical: null },
    openGraph: {
      title: str(project, "title"),
      description: str(project, "shortDescription"),
      ...(origin ? { url: `${origin}/projects/${slug}` } : {}),
      images: str(project, "thumbnail")
        ? [str(project, "thumbnail")]
        : ["/opengraph-image"],
    },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const data = await publicContent();
  const project = data.projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return (
    <SiteShell data={data}>
      <ProjectDetail project={project} />
    </SiteShell>
  );
}
