import { redirect, notFound } from "next/navigation";
import { session } from "@/lib/server/auth";
import { getPortfolio } from "@/lib/server/content";
import { SiteShell } from "@/components/portfolio/site";
import { ProjectDetail } from "@/components/portfolio/project-detail";
export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await session())) redirect("/admin/login");
  const data = await getPortfolio();
  const { slug } = await params;
  const project = data.projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return (
    <SiteShell data={data} preview>
      <ProjectDetail project={project} preview />
    </SiteShell>
  );
}
