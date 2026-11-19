import type { ReactNode } from "react";
export const metadata = {
  title: "Portfolio admin",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
