import Image from "next/image";
import Link from "next/link";
import { str, list, type Content, type GalleryItem } from "@/lib/cms/model";
import { RichText } from "./rich-text";
import { Gallery } from "./gallery";
import { jsonLd } from "@/lib/server/seo";
export function ProjectDetail({
  project,
  preview = false,
}: {
  project: Content;
  preview?: boolean;
}) {
  const lists = [
    "features",
    "responsibilities",
    "technicalDetails",
    "challenges",
    "solutions",
    "outcomes",
    "metrics",
    "memoryMechanisms",
  ];
  return (
    <article className="project-detail page-width">
      <Link
        href={preview ? "/admin/preview" : "/#featured"}
        className="back-link"
      >
        Back to portfolio
      </Link>
      <header>
        <span className="eyebrow">{str(project, "category")}</span>
        <h1 className="font-display">{str(project, "title")}</h1>
        <div className="project-meta">
          <span>{str(project, "status")}</span>
          {str(project, "organization") && (
            <span>{str(project, "organization")}</span>
          )}
          {str(project, "role") && <span>{str(project, "role")}</span>}
          <span>
            {str(project, "startDate")}
            {str(project, "endDate") && ` — ${str(project, "endDate")}`}
          </span>
        </div>
        <p className="project-lead">{str(project, "shortDescription")}</p>
        <div className="chips">
          {list(project, "technologies").map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <div className="inline-links">
          {[
            ["githubUrl", "Source code"],
            ["liveDemoUrl", "Live demo"],
            ["paperUrl", "Research paper"],
            ["videoUrl", "Watch video"],
          ]
            .filter(([key]) => str(project, key))
            .map(([key, label]) => (
              <a
                className="pill"
                key={key}
                href={str(project, key)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
        </div>
      </header>
      {str(project, "thumbnail") && (
        <Image
          className="project-cover"
          src={str(project, "thumbnail")}
          alt={str(project, "thumbnailAlt") || `${str(project, "title")} cover`}
          width={1200}
          height={700}
          priority
          sizes="(min-width: 1100px) 1100px, 100vw"
        />
      )}
      {str(project, "description") && (
        <section className="case-section">
          <h2>Overview</h2>
          <RichText html={str(project, "description")} />
        </section>
      )}
      {lists
        .filter((key) => list(project, key).length)
        .map((key) => (
          <section className="case-section" key={key}>
            <h2>
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (c) => c.toUpperCase())}
            </h2>
            <ul className="content-list">
              {list(project, key).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </section>
        ))}
      {(project.gallery as GalleryItem[] | undefined)?.length ? (
        <section className="case-section">
          <h2>Project gallery</h2>
          <Gallery images={project.gallery as GalleryItem[]} />
        </section>
      ) : null}
      {!preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: str(project, "title"),
              description: str(project, "shortDescription"),
              keywords: list(project, "technologies").join(", "),
            }),
          }}
        />
      )}
    </article>
  );
}
