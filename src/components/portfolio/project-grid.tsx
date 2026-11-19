"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers3, Search } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { str, list, type Content } from "@/lib/cms/model";
export function ProjectGrid({
  projects,
  preview = false,
}: {
  projects: Content[];
  preview?: boolean;
}) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const categories = [
    ...new Set(projects.map((p) => str(p, "category"))),
  ].filter(Boolean);
  const filtered = projects.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.title} ${p.shortDescription} ${list(p, "technologies").join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="project-controls">
        <label className="search-control">
          <Search size={17} />
          <span className="sr-only">Search projects</span>
          <input
            placeholder="Search projects or technology"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter projects by category</span>
          <select
            aria-label="Filter projects by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="project-grid">
        {filtered.map((project, i) => (
          <Reveal key={project._id} delay={(i % 2) * 0.05}>
            <Link
              className="project-card"
              href={`${preview ? "/admin/preview" : ""}/projects/${project.slug}`}
            >
              <div className="project-art">
                {str(project, "thumbnail") ? (
                  <Image
                    src={str(project, "thumbnail")}
                    alt={
                      str(project, "thumbnailAlt") ||
                      `${project.title} — project cover`
                    }
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="project-placeholder">
                    <Layers3 size={40} strokeWidth={1} />
                    <span>{project.title as string}</span>
                    <span className="mono">
                      {list(project, "technologies").slice(0, 3).join(" / ")}
                    </span>
                  </div>
                )}
                <span className="status">{project.status as string}</span>
              </div>
              <div className="project-copy">
                <span className="eyebrow">{project.category as string}</span>
                <h3>{project.title as string}</h3>
                <p>{project.shortDescription as string}</p>
                <div className="chips">
                  {list(project, "technologies")
                    .slice(0, 5)
                    .map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                </div>
                {str(project, "organization") && (
                  <div className="project-affiliation">
                    {project.organization as string}
                  </div>
                )}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty-state">No projects match these filters.</p>
      )}
    </>
  );
}
