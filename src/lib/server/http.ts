import "server-only";
import { ZodError } from "zod";
import { HttpError } from "./security";
import { ConfigurationError } from "./db";
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: "Please check the form fields.",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.status === 429 ? { "Retry-After": "900" } : undefined,
      },
    );
  if (error instanceof ConfigurationError)
    return Response.json({ error: error.message }, { status: 503 });
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000
  )
    return Response.json(
      { error: "This slug or section already exists." },
      { status: 409 },
    );
  console.error(
    "Portfolio operation failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "Operation failed. Please try again." },
    { status: 500 },
  );
}
