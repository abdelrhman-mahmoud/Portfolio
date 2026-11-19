import type { ReactNode } from "react";
// Keep server-rendered content visible immediately; individual cards handle reveals.
export default function Template({ children }: { children: ReactNode }) {
  return children;
}
