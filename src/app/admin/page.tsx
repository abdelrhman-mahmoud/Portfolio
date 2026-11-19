import { redirect } from "next/navigation";
import { session } from "@/lib/server/auth";
import { AdminShell } from "@/components/admin/shell";
import { Dashboard } from "@/components/admin/dashboard";
export default async function Admin() {
  if (!(await session())) redirect("/admin/login");
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}
