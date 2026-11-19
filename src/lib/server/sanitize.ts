import "server-only";
import sanitizeHtml from "sanitize-html";
import {
  definitions,
  type CollectionName,
  type Content,
  type Field,
} from "@/lib/cms/model";
export function sanitizeRich(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
    ],
    allowedAttributes: { a: ["href", "title", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
export function sanitizeContent(
  name: CollectionName,
  values: Record<string, unknown>,
) {
  const clean = { ...values };
  for (const field of definitions[name].fields as Field[]) {
    if (field.kind === "rich" && typeof clean[field.key] === "string")
      clean[field.key] = sanitizeRich(clean[field.key] as string);
  }
  return clean as Omit<Content, "_id">;
}
