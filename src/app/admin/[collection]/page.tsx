import { notFound, redirect } from "next/navigation";
import { session } from "@/lib/server/auth";
import { isCollection, type CollectionName } from "@/lib/cms/model";
import { AdminShell } from "@/components/admin/shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { MediaLibrary } from "@/components/admin/media-library";
export default async function Page({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  if (!(await session())) redirect("/admin/login");
  const { collection } = await params;
  if (collection !== "media" && !isCollection(collection)) notFound();
  return (
    <AdminShell>
      {collection === "media" ? (
        <MediaLibrary />
      ) : (
        <ContentEditor key={collection} name={collection as CollectionName} />
      )}
    </AdminShell>
  );
}
