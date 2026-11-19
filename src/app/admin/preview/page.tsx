import { redirect } from "next/navigation";
import { session } from "@/lib/server/auth";
import { getPortfolio } from "@/lib/server/content";
import { SiteShell, HomeContent } from "@/components/portfolio/site";
export default async function Preview() {
  if (!(await session())) redirect("/admin/login");
  const data = await getPortfolio();
  return (
    <SiteShell data={data} preview>
      <HomeContent data={data} preview />
    </SiteShell>
  );
}
