import { redirect } from "next/navigation";
import { session } from "@/lib/server/auth";
import { LoginForm } from "@/components/admin/login";
export default async function Login() {
  if (await session()) redirect("/admin");
  return (
    <LoginForm
      configured={
        !!process.env.MONGODB_URI &&
        (process.env.AUTH_SECRET?.length || 0) >= 32
      }
    />
  );
}
