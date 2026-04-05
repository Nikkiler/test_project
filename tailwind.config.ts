import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable tokens — bg-accent/10, text-accent/50, hover:text-accent all work
        // via CSS4 `rgb(... / <alpha>)` syntax (Chrome 111+, Firefox 113+, Safari 15+)
        accent:        "rgb(var(--accent-rgb))",
        accent2:       "rgb(var(--accent2-rgb))",
        "ui-border":   "rgb(var(--border-rgb))",
        "ui-text":     "rgb(var(--text-rgb))",
        "ui-overlay":  "rgb(var(--bg-overlay-rgb))",
        "ui-badge":    "rgb(var(--badge-rgb))",
        // Flat non-opacity tokens
        "ui-bg":           "var(--bg-primary)",
        "ui-online":       "var(--online-color)",
        "ui-accent":       "var(--accent)",
        "ui-accent2":      "var(--accent2)",
        "ui-text-solid":   "var(--text)",
        "ui-badge-solid":  "var(--badge-bg)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui"],
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "glow-accent":  "0 0 12px rgba(var(--accent-rgb),0.30), 0 0 40px rgba(var(--accent-rgb),0.10)",
        "glow-accent2": "0 0 12px rgba(var(--accent2-rgb),0.25), 0 0 40px rgba(var(--accent2-rgb),0.08)",
        "glow-sm":      "0 0 8px rgba(var(--accent-rgb),0.2)",
        "panel":        "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        "elevated":     "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
        "modal":        "0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(var(--accent-rgb),0.06)",
      },
      animation: {
        "badge-pulse": "badge-pulse 2s ease-in-out infinite",
        "fade-in":     "fade-in 0.18s ease-out",
        "slide-up":    "slide-up 0.20s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "modal-in":    "modal-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "glow-pulse":  "glow-pulse 3s ease-in-out infinite",
        "shimmer":     "shimmer 1.8s ease-in-out infinite",
        "float-bob":   "float-bob 3s ease-in-out infinite",
      },
      keyframes: {
        "badge-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(var(--badge-rgb), 0.5)" },
          "50%":       { boxShadow: "0 0 0 3px rgba(var(--badge-rgb), 0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.99)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
