import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteMetadata } from "@/lib/server/seo";
import "./globals.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata();
}
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      // Translation extensions can change the root class before hydration.
      // Limit suppression to root attributes; content mismatches still surface.
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      lang="en"
      className="dark h-full antialiased"
    >
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
