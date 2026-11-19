import { login, logout, loginSchema } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { jsonBody, requireSameOrigin } from "@/lib/server/security";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const values = loginSchema.parse(await jsonBody(request));
    await login(request, { ...values, email: values.email.toLowerCase() });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    await logout(request);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
