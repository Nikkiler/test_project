import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import TerminalOverlay from "@/components/TerminalOverlay";

export const metadata: Metadata = {
  title: "Nexus — Encrypted Chat",
  description: "Secure end-to-end encrypted communications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-screen">
        <ThemeProvider>
          <TerminalOverlay />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
