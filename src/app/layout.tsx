import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-minari | Ichiban Kuji Digital",
  description: "Back-office et borne client K-minari"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}