import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BrainCircuit,
  Code2,
  Mail,
  MessageCircle,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Navigation } from "./navigation";
import { RichText } from "./rich-text";
import { ProjectGrid } from "./project-grid";
import { ParticleBackground } from "@/components/layout/particle-background";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { Reveal } from "@/components/shared/reveal";
import { str, list, type Content, type Portfolio } from "@/lib/cms/model";
export function contactLinks(contact: Content) {
  const names: Record<string, string> = {
    email: "Email",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    github: "GitHub",
    kaggle: "Kaggle",
    cv: "View CV",
  };
  const order = list(contact, "linkOrder");
  return (order.length ? order : Object.keys(names))
    .filter((key, i, arr) => key in names && arr.indexOf(key) === i)
    .map((key) => ({
      key,
      label: names[key],
      href:
        key === "email"
          ? str(contact, "email")
            ? `mailto:${str(contact, "email")}`
            : ""
          : str(contact, key === "cv" ? "cvUrl" : key),
    }))
    .filter((link) => link.href);
}
export function SiteShell({
  data,
  children,
  preview = false,
}: {
  data: Portfolio;
  children: ReactNode;
  preview?: boolean;
}) {
  const profile = data.profile[0];
  const contact = data.contact[0];
  const appearance = data.appearance[0];
  const links = data.sectionSettings
    .filter((s) => s.visible !== false && str(s, "navLabel"))
    .map((s) => ({ id: str(s, "section"), label: str(s, "navLabel") }));
  const style = {
    "--brand-violet": str(appearance, "accent") || "#b46bd6",
    "--brand-pink": str(appearance, "pink") || "#e35b96",
    "--brand-orange": str(appearance, "orange") || "#e8965a",
  } as CSSProperties;
  const footerVisible = data.sectionSettings.some(
    (s) => s.section === "footer" && s.visible !== false,
  );
  return (
    <div
      style={style}
      className={`portfolio ${appearance?.animations === false ? "no-reveal" : ""}`}
    >
      {appearance?.particles !== false && <ParticleBackground />}
      <ScrollProgress />
      <Navigation
        name={str(profile, "name")}
        initials={str(profile, "initials")}
        links={links}
        cv={str(contact, "cvUrl")}
        cvLabel={str(profile, "cvLabel")}
      />
      {preview && (
        <aside className="preview-banner">
          Private preview · Includes unpublished records.{" "}
          <Link href="/admin">Return to admin</Link>
        </aside>
      )}
      <main id="main-content">{children}</main>
      {footerVisible && (
        <footer className="site-footer">
          <p>{str(contact, "footerText")}</p>
          <div>
            {contact &&
              contactLinks(contact).map((l) => (
                <a key={l.key} href={l.href} rel="noopener noreferrer">
                  {l.label}
                </a>
              ))}
          </div>
          <Link href="/card">Digital card</Link>
        </footer>
      )}
    </div>
  );
}
function Heading({ section }: { section: Content }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{str(section, "eyebrow")}</span>
      <h2 className="font-display">{str(section, "title")}</h2>
      {str(section, "description") && <p>{str(section, "description")}</p>}
    </div>
  );
}
function Period({ item }: { item: Content }) {
  return (
    <span className="period">
      {str(item, "startDate")}
      {(str(item, "endDate") || item.current) &&
        ` — ${item.current ? "Present" : str(item, "endDate")}`}
    </span>
  );
}
function Bullets({ values }: { values: string[] }) {
  return values.length ? (
    <ul className="content-list">
      {values.map((v, i) => (
        <li key={i}>{v}</li>
      ))}
    </ul>
  ) : null;
}
export function HomeContent({
  data,
  preview = false,
}: {
  data: Portfolio;
  preview?: boolean;
}) {
  const profile = data.profile[0];
  const contact = data.contact[0];
  return (
    <>
      {data.sectionSettings
        .filter((s) => s.visible !== false && s.section !== "footer")
        .map((section) => {
          const key = str(section, "section");
          let content: ReactNode;
          if (key === "hero")
            return (
              <section key={key} id="hero" className="hero-section page-width">
                <div className="hero-copy">
                  <p className="availability">{str(profile, "availability")}</p>
                  <span className="eyebrow">{str(section, "eyebrow")}</span>
                  <h1 className="font-display">
                    {str(profile, "displayName").split(" ")[0]}
                    <br />
                    <em className="text-gradient-brand">
                      {str(profile, "displayName")
                        .split(" ")
                        .slice(1)
                        .join(" ")}
                    </em>
                    <span className="hero-period">.</span>
                  </h1>
                  <h2>{str(profile, "title")}</h2>
                  <p className="secondary-role">
                    {str(profile, "secondaryTitle")}
                  </p>
                  <RichText html={str(profile, "intro")} />
                  <div className="hero-actions">
                    <a className="pill primary" href="#featured">
                      {str(profile, "projectsLabel")}
                    </a>
                    {str(contact, "cvUrl") && (
                      <a
                        className="pill"
                        href={str(contact, "cvUrl")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {str(profile, "cvLabel")}
                      </a>
                    )}
                    <a className="pill" href="#contact">
                      {str(profile, "contactLabel")}
                    </a>
                  </div>
                  <div className="quick-links">
                    {contact &&
                      contactLinks(contact)
                        .filter((l) => l.key !== "cv")
                        .map((l) => (
                          <a
                            key={l.key}
                            href={l.href}
                            rel="noopener noreferrer"
                          >
                            {l.label}
                          </a>
                        ))}
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="hero-core">
                    {str(profile, "photo") ? (
                      <Image
                        src={str(profile, "photo")}
                        alt={str(profile, "photoAlt") || str(profile, "name")}
                        fill
                        sizes="(min-width: 900px) 360px, 260px"
                        priority
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <BrainCircuit size={110} strokeWidth={0.7} />
                        <span className="font-display">
                          {str(profile, "initials")}
                        </span>
                      </>
                    )}
                  </div>
                  {profile &&
                    list(profile, "capabilities")
                      .slice(0, 4)
                      .map((label, i) => (
                        <span className={`orbit-label label-${i}`} key={i}>
                          {label}
                        </span>
                      ))}
                  <span className="visual-caption mono">
                    {str(profile, "location")} · {str(profile, "title")}
                  </span>
                </div>
              </section>
            );
          if (key === "about") {
            const item = data.about[0];
            content = (
              <div className="about-layout">
                <div>
                  <h3>{str(item, "title")}</h3>
                  <RichText html={str(item, "description")} />
                </div>
                <div className="strengths">
                  {item &&
                    list(item, "strengths").map((s, i) => (
                      <div key={i}>
                        <Code2 size={20} />
                        <span>{s}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          } else if (key === "skills")
            content = (
              <div className="skills-grid">
                {data.skills.map((item) => (
                  <Reveal key={item._id}>
                    <article className="content-card">
                      <h3>{str(item, "title")}</h3>
                      <div className="chips">
                        {list(item, "items")
                          .filter(
                            (skill) =>
                              !list(item, "hiddenItems").includes(skill),
                          )
                          .map((skill, i) => (
                            <span key={i}>{skill}</span>
                          ))}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            );
          else if (key === "featured" || key === "projects")
            content = (
              <ProjectGrid
                preview={preview}
                projects={data.projects.filter((p) =>
                  key === "featured" ? p.featured : !p.featured,
                )}
              />
            );
          else if (key === "experiences")
            content = (
              <div className="timeline">
                {data.experiences.map((item) => (
                  <Reveal key={item._id}>
                    <article className="timeline-entry">
                      <Period item={item} />
                      <h3>{str(item, "role")}</h3>
                      <p className="organization">
                        {str(item, "organization")}{" "}
                        <span>· {str(item, "employmentType")}</span>
                      </p>
                      <RichText html={str(item, "description")} />
                      <Bullets values={list(item, "bullets")} />
                    </article>
                  </Reveal>
                ))}
              </div>
            );
          else if (key === "publications")
            content = (
              <div className="publication-list">
                {data.publications.map((item) => (
                  <Reveal key={item._id}>
                    <article className="content-card publication-card">
                      {str(item, "image") ? (
                        <Image
                          src={str(item, "image")}
                          alt={str(item, "imageAlt") || str(item, "title")}
                          width={120}
                          height={160}
                          className="rounded-xl object-cover"
                        />
                      ) : (
                        <BookOpen size={30} strokeWidth={1} />
                      )}
                      <div>
                        <span className="eyebrow">
                          {str(item, "year")} · {str(item, "venue")}
                        </span>
                        <h3>{str(item, "title")}</h3>
                        <p className="authors">
                          {list(item, "authors").join(", ")}
                        </p>
                        <RichText html={str(item, "description")} />
                        <div className="inline-links">
                          {str(item, "paperUrl") && (
                            <a
                              href={str(item, "paperUrl")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Read paper
                            </a>
                          )}
                          {str(item, "pdfUrl") && (
                            <a
                              href={str(item, "pdfUrl")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              PDF
                            </a>
                          )}
                          {str(item, "doi") && (
                            <span>DOI: {str(item, "doi")}</span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            );
          else if (key === "education" || key === "training")
            content = (
              <div className="skills-grid">
                {data[key].map((item) => (
                  <article className="content-card" key={item._id}>
                    <GraduationCap className="mb-5 text-brand-pink" />
                    <Period item={item} />
                    <h3>{str(item, "title")}</h3>
                    <p className="organization">{str(item, "organization")}</p>
                    <RichText html={str(item, "description")} />
                    <div className="chips">
                      {list(item, "areas").map((area, i) => (
                        <span key={i}>{area}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            );
          else if (key === "certifications")
            content = (
              <div className="skills-grid">
                {data.certifications.map((item) => (
                  <article className="content-card" key={item._id}>
                    {str(item, "image") && (
                      <a
                        href={str(item, "image")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={str(item, "image")}
                          alt={
                            str(item, "imageAlt") ||
                            `${str(item, "title")} certificate`
                          }
                          width={600}
                          height={420}
                          className="certificate-image"
                        />
                      </a>
                    )}
                    <span className="eyebrow">{str(item, "issuer")}</span>
                    <h3>{str(item, "title")}</h3>
                    <p className="credential-status">{str(item, "status")}</p>
                    <RichText html={str(item, "description")} />
                    {str(item, "credentialId") && (
                      <p>Credential: {str(item, "credentialId")}</p>
                    )}
                    {str(item, "issueDate") && (
                      <p>Issued: {str(item, "issueDate")}</p>
                    )}
                    {str(item, "expirationDate") && (
                      <p>Expires: {str(item, "expirationDate")}</p>
                    )}
                    <div className="inline-links">
                      {str(item, "credentialUrl") && (
                        <a
                          href={str(item, "credentialUrl")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Verify credential
                        </a>
                      )}
                      {str(item, "pdfUrl") && (
                        <a
                          href={str(item, "pdfUrl")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View certificate PDF
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            );
          else if (key === "contact")
            content = (
              <div className="contact-panel glass">
                <div>
                  <h3>{str(contact, "title")}</h3>
                  <RichText html={str(contact, "description")} />
                </div>
                <div className="contact-links">
                  {contact &&
                    contactLinks(contact).map((l) => (
                      <a
                        key={l.key}
                        className="pill"
                        href={l.href}
                        target={l.key === "email" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                      >
                        {l.key === "email" ? (
                          <Mail size={18} />
                        ) : l.key === "whatsapp" ? (
                          <MessageCircle size={18} />
                        ) : null}
                        {l.label}
                      </a>
                    ))}
                </div>
              </div>
            );
          else return null;
          return (
            <section
              key={key}
              id={key}
              className="portfolio-section page-width"
            >
              <Heading section={section} />
              {content}
            </section>
          );
        })}
    </>
  );
}
