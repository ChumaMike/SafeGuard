import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SafeGuard SA", template: "%s · SafeGuard SA" },
  description:
    "Shows whether a reported hazard has been made safe while it waits to be fixed, and how long people have gone unprotected.",
};

export const viewport: Viewport = {
  themeColor: "#14202E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
