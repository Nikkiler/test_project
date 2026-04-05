"use client";

import { useTheme } from "@/lib/ThemeContext";

/**
 * WH40K-only fixed overlay: subtle parchment grain texture + warm vignette corners.
 * Replaces the old CRT scanline look with a gothic imperial atmosphere.
 * pointer-events: none — never blocks interaction.
 */
export default function TerminalOverlay() {
  const { themeId } = useTheme();
  if (themeId !== "wh40k") return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 9990 }} aria-hidden>
      {/* ── Parchment grain — very subtle noise texture overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "220px",
        }}
      />

      {/* ── Warm vignette — dark amber-tinted corners ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(4,2,1,0.80) 100%)",
        }}
      />

      {/* ── Ambient warm glow — very subtle center warmth ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,170,80,0.018) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
