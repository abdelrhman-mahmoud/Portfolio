import { sanitizeRich } from "@/lib/server/sanitize";
export function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRich(html) }}
    />
  );
}
