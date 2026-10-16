import type { Metadata, Viewport } from "next";
import { THEME_SCRIPT } from "@/components/layout/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SafeGuard SA", template: "%s · SafeGuard SA" },
  description:
    "Shows whether a reported hazard has been made safe while it waits to be fixed, and how long people have gone unprotected.",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#14202E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
