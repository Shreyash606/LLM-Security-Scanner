import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "LLM Security Scanner",
  description: "GitHub-like UI | Free build"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
