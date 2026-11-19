import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import { db, ConfigurationError } from "./db";
import { HttpError, rateLimit, requireSameOrigin } from "./security";
export const cookieName =
  process.env.NODE_ENV === "production"
    ? "__Host-portfolio-session"
    : "portfolio-session";
const sessionDuration = 60 * 60 * 8;
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32)
    throw new ConfigurationError(
      "Configure AUTH_SECRET with at least 32 random characters.",
    );
  return new TextEncoder().encode(value);
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase().trim()),
    password: z.string().min(1).max(256),
  })
  .strict();
export async function login(request: Request, credentials: unknown) {
  requireSameOrigin(request);
  const input = loginSchema.parse(credentials);
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown"
    : "local";
  await rateLimit(`login:ip:${ip}`, 20, 900);
  await rateLimit(`login:account:${input.email}`, 6, 900);
  const database = await db();
  const admin = await database
    .collection("adminUsers")
    .findOne({ email: input.email, role: "admin" });
  if (!admin || !(await verify(admin.passwordHash, input.password)))
    throw new HttpError(401, "Invalid email or password.");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + sessionDuration * 1000);
  const token = await new SignJWT({ sid: id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin._id))
    .setIssuer("portfolio-admin")
    .setAudience("portfolio-admin")
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret());
  await database
    .collection("sessions")
    .insertOne({ tokenHash: digest(id), userId: String(admin._id), expiresAt });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDuration,
  });
  return String(admin._id);
}
export async function session() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  let payload;
  try {
    payload = (
      await jwtVerify(token, secret(), {
        algorithms: ["HS256"],
        issuer: "portfolio-admin",
        audience: "portfolio-admin",
      })
    ).payload;
  } catch {
    return null;
  }
  if (typeof payload.sid !== "string" || typeof payload.sub !== "string")
    return null;
  const database = await db();
  const stored = await database
    .collection("sessions")
    .findOne({
      tokenHash: digest(payload.sid),
      userId: payload.sub,
      expiresAt: { $gt: new Date() },
    });
  if (!stored) return null;
  const admin = await database
    .collection<{ _id: string; role: string }>("adminUsers")
    .findOne({ _id: payload.sub, role: "admin" });
  return admin
    ? { userId: payload.sub, sessionHash: digest(payload.sid) }
    : null;
}
export async function requireAdmin(request?: Request, write = false) {
  if (request && write) requireSameOrigin(request);
  const current = await session();
  if (!current) throw new HttpError(401, "Sign in to continue.");
  if (write) await rateLimit(`write:${current.userId}`, 120, 60);
  return current;
}
export async function logout(request: Request) {
  const current = await requireAdmin(request, true);
  await (
    await db()
  )
    .collection("sessions")
    .deleteOne({ tokenHash: current.sessionHash });
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
