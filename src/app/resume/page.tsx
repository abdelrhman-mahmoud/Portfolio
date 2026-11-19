import { redirect } from "next/navigation";
import { publicContent } from "@/lib/server/content";
import { str } from "@/lib/cms/model";
import Link from "next/link";
export const metadata = {
  title: "CV",
  robots: { index: false },
  alternates: { canonical: null },
};
export default async function Resume() {
  const data = await publicContent();
  const url = str(data.contact[0], "cvUrl");
  if (url) redirect(url);
  return (
    <main id="main-content" className="digital-card">
      <h1 className="font-display">CV</h1>
      <p>A CV hasn’t been added yet.</p>
      <Link href="/#contact">Contact Abdelrhman</Link>
    </main>
  );
}
