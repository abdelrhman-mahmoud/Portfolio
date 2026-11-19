import Image from "next/image";
import { publicContent } from "@/lib/server/content";
import { contactLinks } from "@/components/portfolio/site";
import { str } from "@/lib/cms/model";
import Link from "next/link";
export const metadata = {
  title: "Digital business card",
  alternates: { canonical: "/card" },
};
export default async function Card() {
  const data = await publicContent();
  const p = data.profile[0];
  const contact = data.contact[0];
  return (
    <main id="main-content" className="digital-card page-width">
      <div className="card-avatar">
        {str(p, "photo") ? (
          <Image
            src={str(p, "photo")}
            alt={str(p, "photoAlt") || str(p, "name")}
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        ) : (
          str(p, "initials")
        )}
      </div>
      <h1 className="font-display">{str(p, "displayName")}</h1>
      <p className="text-gradient-brand">{str(p, "title")}</p>
      <h2>{str(contact, "cardTitle")}</h2>
      <div className="card-links">
        {contact &&
          contactLinks(contact).map((l) => (
            <a
              key={l.key}
              className="pill"
              href={l.href}
              target={l.key === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {l.label}
            </a>
          ))}
      </div>
      <Link href="/">Explore portfolio</Link>
    </main>
  );
}
