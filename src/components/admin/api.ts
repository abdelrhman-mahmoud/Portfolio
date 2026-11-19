"use client";
export async function adminApi(
  path: string,
  method = "GET",
  body?: unknown,
  raw = false,
) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: {
      "x-portfolio-admin": "1",
      ...(body
        ? { "Content-Type": raw ? (body as File).type : "application/json" }
        : {}),
    },
    ...(body ? { body: raw ? (body as File) : JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== "auth") {
      // Requests can expire inside event handlers, where redirect() would throw
      // into the form's catch block. Navigate to a fixed same-origin login URL.
      window.location.replace(
        new URL("/admin/login", window.location.origin).href,
      );
    }
    throw new Error(
      result.issues
        ? `${result.error} ${result.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ")}`
        : result.error || "Request failed.",
    );
  }
  return result;
}
