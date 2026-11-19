import { z } from "zod";

export type FieldKind =
  | "text"
  | "textarea"
  | "rich"
  | "list"
  | "url"
  | "image"
  | "gallery"
  | "boolean"
  | "number"
  | "select"
  | "color";
export type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  hint?: string;
};
const f = (
  key: string,
  label: string,
  kind: FieldKind = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, kind, ...extra });
const title = f("title", "Title", "text", { required: true });
const description = f("description", "Description", "rich");
const order = f("sortOrder", "Display order", "number");
const visible = f("visible", "Visible", "boolean");
const image = f("image", "Image / cover", "image");
export const definitions = {
  profile: {
    label: "Profile & Hero",
    singleton: true,
    fields: [
      f("name", "Full name", "text", { required: true }),
      f("displayName", "Display name", "text", { required: true }),
      f("initials", "Monogram"),
      f("title", "Professional title"),
      f("secondaryTitle", "Secondary title"),
      f("intro", "Hero introduction", "rich"),
      f("availability", "Availability"),
      f("location", "Location"),
      f("photo", "Portrait", "image"),
      f("photoAlt", "Portrait alt text"),
      f("capabilities", "Capability labels", "list"),
      f("projectsLabel", "Projects button label"),
      f("cvLabel", "CV button label"),
      f("contactLabel", "Contact button label"),
    ],
  },
  about: {
    label: "About Me",
    singleton: true,
    fields: [
      title,
      description,
      f("strengths", "Strengths / achievements", "list"),
    ],
  },
  skills: {
    label: "Skills",
    fields: [
      title,
      f("items", "Skills", "list"),
      f("hiddenItems", "Hidden skill names", "list"),
      order,
      visible,
    ],
  },
  experiences: {
    label: "Experience",
    fields: [
      f("organization", "Organization", "text", { required: true }),
      f("role", "Role", "text", { required: true }),
      f("employmentType", "Relationship", "select", {
        options: ["Freelance", "Internship", "Training", "Employment"],
      }),
      f("location", "Location"),
      f("startDate", "Start date"),
      f("endDate", "End date"),
      f("current", "Current", "boolean"),
      description,
      f("bullets", "Contributions", "list"),
      f("logo", "Organization logo", "image"),
      order,
      visible,
    ],
  },
  projects: {
    label: "Projects",
    fields: [
      title,
      f("slug", "URL slug", "text", {
        required: true,
        hint: "Lowercase letters, digits and hyphens; keep stable after sharing.",
      }),
      f("shortDescription", "Short description", "textarea"),
      f("description", "Full case study", "rich"),
      f("category", "Category"),
      f("organization", "Affiliation"),
      f("role", "Your role"),
      f("status", "Status", "select", {
        options: ["Completed", "In Development", "Research", "Prototype"],
      }),
      f("startDate", "Start date"),
      f("endDate", "End date"),
      ...[
        "technologies",
        "features",
        "responsibilities",
        "technicalDetails",
        "challenges",
        "solutions",
        "outcomes",
        "metrics",
        "memoryMechanisms",
      ].map((key) =>
        f(
          key,
          key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
          "list",
        ),
      ),
      f("thumbnail", "Cover image", "image"),
      f("thumbnailAlt", "Cover image alt text"),
      f("gallery", "Screenshots", "gallery"),
      f("videoUrl", "Video URL", "url"),
      f("githubUrl", "GitHub URL (optional)", "url"),
      f("liveDemoUrl", "Live demo URL (optional)", "url"),
      f("paperUrl", "Paper URL (optional)", "url"),
      f("featured", "Featured", "boolean"),
      f("published", "Published", "boolean"),
      visible,
      order,
    ],
  },
  publications: {
    label: "Publications",
    fields: [
      title,
      f("authors", "Authors", "list"),
      f("venue", "Venue"),
      f("year", "Year"),
      description,
      f("keywords", "Keywords", "list"),
      f("paperUrl", "Paper URL", "url"),
      f("pdfUrl", "PDF URL", "url"),
      f("doi", "DOI"),
      image,
      f("imageAlt", "Image alt text"),
      f("featured", "Featured", "boolean"),
      f("published", "Published", "boolean"),
      visible,
      order,
    ],
  },
  education: {
    label: "Education",
    fields: [
      title,
      f("organization", "Institution"),
      f("startDate", "Start date"),
      f("endDate", "End date"),
      description,
      order,
      visible,
    ],
  },
  certifications: {
    label: "Certifications",
    fields: [
      title,
      f("issuer", "Issuer"),
      f("category", "Category"),
      f("status", "Status", "select", {
        options: [
          "Course / unverified",
          "In Progress",
          "Completed course",
          "Earned certification",
        ],
      }),
      f("credentialUrl", "Credential URL", "url"),
      f("credentialId", "Credential ID"),
      f("issueDate", "Issue date"),
      f("expirationDate", "Expiration date"),
      image,
      f("imageAlt", "Image alt text"),
      f("pdfUrl", "Certificate PDF", "url"),
      description,
      order,
      visible,
    ],
  },
  training: {
    label: "Training",
    fields: [
      title,
      f("organization", "Organization"),
      f("startDate", "Start date"),
      f("endDate", "End date"),
      description,
      f("areas", "Training areas", "list"),
      order,
      visible,
    ],
  },
  contact: {
    label: "Contact & Social Links",
    singleton: true,
    fields: [
      title,
      description,
      f("email", "Email"),
      f("whatsapp", "WhatsApp URL", "url"),
      f("linkedin", "LinkedIn URL", "url"),
      f("github", "GitHub URL", "url"),
      f("kaggle", "Kaggle URL", "url"),
      f("cvUrl", "CV URL / uploaded PDF", "url"),
      f(
        "linkOrder",
        "Link order (email, whatsapp, linkedin, github, kaggle, cv)",
        "list",
      ),
      f("footerText", "Footer text"),
      f("cardTitle", "Digital card heading"),
    ],
  },
  sectionSettings: {
    label: "Sections & Navigation",
    fields: [
      f("section", "Section", "select", {
        required: true,
        options: [
          "hero",
          "about",
          "skills",
          "experiences",
          "featured",
          "projects",
          "publications",
          "education",
          "certifications",
          "training",
          "contact",
          "footer",
        ],
      }),
      title,
      f("eyebrow", "Eyebrow"),
      f("description", "Section introduction", "textarea"),
      f("navLabel", "Navigation label (blank to omit)"),
      visible,
      order,
    ],
  },
  appearance: {
    label: "Site Appearance",
    singleton: true,
    fields: [
      f("accent", "Violet accent", "color"),
      f("pink", "Pink accent", "color"),
      f("orange", "Orange accent", "color"),
      f("particles", "Animated background", "boolean"),
      f("animations", "Reveal animations", "boolean"),
    ],
  },
  siteSettings: {
    label: "SEO & Settings",
    singleton: true,
    fields: [
      title,
      f("description", "SEO description", "textarea"),
      f("siteUrl", "Canonical site URL", "url"),
      f("ogImage", "Social sharing image", "image"),
      f("keywords", "SEO keywords", "list"),
      f("indexing", "Allow search engine indexing", "boolean"),
    ],
  },
} satisfies Record<
  string,
  { label: string; singleton?: boolean; fields: Field[] }
>;
export type CollectionName = keyof typeof definitions;
export type GalleryItem = { url: string; alt: string; caption: string };
export type Value = string | number | boolean | string[] | GalleryItem[];
export type Content = {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  revision?: number;
  [key: string]: Value | undefined;
};
export type Portfolio = Record<CollectionName, Content[]>;
export const collectionNames = Object.keys(definitions) as CollectionName[];
export function isCollection(value: string): value is CollectionName {
  return Object.hasOwn(definitions, value);
}
export function isSingleton(name: CollectionName) {
  return "singleton" in definitions[name];
}
export const urlSchema = z
  .string()
  .max(2048)
  .refine(
    (s) =>
      !s ||
      (() => {
        try {
          const u = new URL(s);
          return (
            ["http:", "https:"].includes(u.protocol) &&
            !u.username &&
            !u.password
          );
        } catch {
          return false;
        }
      })(),
    "Use a complete http:// or https:// URL.",
  );
export const localMediaSchema = z
  .string()
  .regex(
    /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    "Select a file from the media library.",
  );
export const mediaUrlSchema = z.union([urlSchema, localMediaSchema]);
export const imageSchema = z.union([
  localMediaSchema,
  urlSchema.refine(
    (s) =>
      !s ||
      (() => {
        try {
          const u = new URL(s);
          return (
            u.protocol === "https:" &&
            u.hostname.endsWith(".public.blob.vercel-storage.com")
          );
        } catch {
          return false;
        }
      })(),
    "Select an image uploaded to the media library.",
  ),
]);
export function contentSchema(name: CollectionName) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of definitions[name].fields as Field[]) {
    let schema: z.ZodType;
    switch (field.kind) {
      case "boolean":
        schema = z.boolean();
        break;
      case "number":
        schema = z.number().int().min(0).max(100000);
        break;
      case "list":
        schema = z.array(z.string().trim().min(1).max(2000)).max(150);
        break;
      case "gallery":
        schema = z
          .array(
            z
              .object({
                url: imageSchema.refine((s) => !!s),
                alt: z.string().max(500),
                caption: z.string().max(1000),
              })
              .strict(),
          )
          .max(40);
        break;
      case "url":
        schema = ["cvUrl", "pdfUrl"].includes(field.key)
          ? mediaUrlSchema
          : urlSchema;
        break;
      case "image":
        schema = imageSchema;
        break;
      case "color":
        schema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
        break;
      case "select":
        schema = z.enum(field.options as [string, ...string[]]);
        break;
      default:
        schema = z
          .string()
          .trim()
          .max(field.kind === "rich" ? 60000 : 5000);
        if (field.required) schema = (schema as z.ZodString).min(1);
    }
    if (field.key === "slug")
      schema = z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    if (field.key === "email") schema = z.union([z.email(), z.literal("")]);
    shape[field.key] = field.required ? schema : schema.optional();
  }
  return z.object(shape).strict();
}
export const str = (item: Content | undefined, key: string): string =>
  typeof item?.[key] === "string" ? (item[key] as string) : "";
export const list = (item: Content, key: string): string[] =>
  Array.isArray(item[key]) ? (item[key] as string[]) : [];
export const shown = (item: Content) =>
  item.visible !== false && item.published !== false;
