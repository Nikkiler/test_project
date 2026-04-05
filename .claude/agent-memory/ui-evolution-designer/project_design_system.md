---
name: Design System — Chatroom App (Both Themes — Post Major Rework)
description: Full color tokens, typography, component conventions, and design rules for DXMD default + WH40K Imperial dual-theme system after April 2026 rework
type: project
---

# Chat App Design System

## Architecture
- Next.js app with dual-theme system. Theme toggled via Konami code; stored in `data-theme` attribute on `<html>`.
- Theme IDs: `"default"` (Deus Ex: Mankind Divided) and `"wh40k"` (Space Marine 2 Imperial).
- CSS variables live in `/app/globals.css`; component conditionals use `isWh40k = themeId === "wh40k"`.
- String overrides in `/lib/theme.ts` (THEMES object). Avatar palettes in AVATAR_COLORS.

---

## Theme 1: Default — Deus Ex: Mankind Divided

### Color Palette (:root)
| CSS Variable | Value | Use |
|---|---|---|
| `--accent` | `#EDA622` | Marigold gold — primary accent |
| `--accent2` | `#E55D02` | Electronic Copper — secondary |
| `--border-rgb` | `80, 58, 29` | Cafe Noir — borders |
| `--text` | `#FBFBFB` | White — primary text |
| `--bg-primary` | `#141514` | Eerie Black — page bg |
| `--badge-bg` | `#ED333C` | Imperial Red — unread badges |
| `--online-color` | `#A0FF33` | French Lime — online dot |
| `--font-display` | `'Orbitron', 'Inter', monospace` | |

### DXMD Design Rules
- **Angular everywhere**: `border-radius: 0` on nav-items (`.nav-item`), inputs (`.input-neon`), panels
- **Button clip-path**: `--btn-cut: 10px` hexagonal corner cut polygon (`calc(100% - 10px)`)
- **Input clip-path**: 8px corner cut polygon — same aesthetic as buttons, smaller
- **Section headers**: uppercase, 9px Orbitron, `rgba(--accent-rgb, 0.42)`, letter-spacing 0.12em+
- **Active nav**: left 2px gold border + gradient bg; `.active` class must be set explicitly in JSX
- **Mouse spotlight**: CSS-var `--mx/--my` driven radial gradient on `.spotlight-panel` — zero React re-renders
- **Glass/blur**: `backdrop-filter: blur(20px) saturate(1.3)` on sidebars; heavier on modals
- **Panel specular edge**: `.panel-specular::before` adds 1px gradient top-edge highlight
- **Thin gold divider lines** between sections (1px, `rgba(--accent-rgb, 0.1)`)

---

## Theme 2: WH40K — Space Marine 2 Imperial (Reworked April 2026)

**Replaced the old green phosphor CRT terminal look with gothic imperial aesthetic.**

### Color Palette ([data-theme="wh40k"])
| CSS Variable | Value | Use |
|---|---|---|
| `--accent` | `#C8AA50` | Warm imperial gold |
| `--accent2` | `#8B1A1A` | Imperial crimson |
| `--border-rgb` | `100, 80, 45` | Warm brown-gold borders |
| `--text` | `#D2C3A5` | Parchment — body text |
| `--bg-primary` | `#0A0806` | Very dark warm black |
| `--badge-bg` | `#8B1A1A` | Crimson — solid unread badges |
| `--online-color` | `#4a8c5c` | Muted green — online dot |
| `--font-display` | `'Cinzel', serif` | Gothic serif — NOT VT323 |

### WH40K Design Rules
- **Buttons**: share same angular clip-path as DXMD; warm gold gradient for filled, outlined for ghost
- **No CRT scanlines**: removed entirely — `TerminalOverlay.tsx` now shows SVG fractalNoise grain + warm dark vignette
- **Avatars**: heraldic square — 2px warm gold border, tinted bg. NO `[X]` bracket format
- **Section headers**: `═ LABEL ═` ornamental (U+2550 double bar) — NOT `// label //`
- **System messages**: `— message —` em-dash format — NOT `// message //`
- **Day separators**: `═ Label ═` ornamental — NOT `// label //`
- **Corner ornaments**: 2px border, w-4 h-4, `rgba(--accent-rgb, 0.55)`
- **Username display**: plain displayName in Cinzel; no brackets, not uppercased
- **Timestamps**: normal `HH:MM` — no brackets, no seconds
- **No `>_` input prefix**: removed
- **No monospace overrides**: all `fontFamily: "monospace"` removed from WH40K component branches
- **No glass/blur** on WH40K panels — solid dark surfaces with visible gold borders
- **Badge**: solid crimson `#8B1A1A` (not outlined)
- **Login card**: `borderRadius: 0`, warm dark gradient bg, `✦` logo mark, 2px corner ornaments
- **Intro overlay**: Cinzel font, parchment text colors, no VT323, no scanlines

### WH40K Avatar Palette
```
["#C8AA50", "#8B1A1A", "#A07830", "#6B4E20", "#B89040", "#7A1515", "#9A6820", "#C05010"]
```

### WH40K Theme Strings (lib/theme.ts)
- Section headers use plain English now (not ALL_CAPS terminal format)
- `channelPrefix`: `"⚔"`, `dmPrefix`: `"◆"`
- Login footer: `"— The Emperor Protects —"` (not `// ... //`)
- Input placeholder: `"Transmit to {room}"` (not `> TRANSMIT TO ...`)

---

## Shared Component Patterns

### CSS Classes in globals.css
- `.spotlight-panel` — mouse-spotlight via CSS vars `--mx/--my`; WH40K override: solid dark bg, no backdrop-filter
- `.panel-specular` — 1px gradient top-edge highlight via `::before`
- `.input-neon` — `border-radius: 0`, 8px clip-path, accent border on focus; WH40K: no glow, just border
- `.nav-item` — `border-radius: 0` (sharp); hover: gold inset shadow; `.active`: left 2px gold border + gradient
- `.btn-gradient` / `.btn-imperial` — angular clip-path with 10px corner cuts; shimmer sweep on hover
- `.btn-filled` — filled gradient CTA variant
- `.badge-pulse` — pulsing ring; WH40K: solid crimson, no animation
- `.msg-hover-line` — left accent bar + WH40K bottom gold sweep line on hover
- `.terminal-section-hdr` — double-rule border top+bottom with faint shadow (WH40K section headers)
- `.glass-panel` — heavy backdrop-filter panel for modals
- `.modal-backdrop` — dark radial + 4px blur overlay
- `.animate-modal-in`, `.animate-float-bob`, `.animate-spin-slow`

### Keyframes
- `msg-in`, `slide-up`, `modal-in`, `fade-in`
- `badge-pulse`, `glow-pulse`, `glow-pulse-soft`
- `float-bob`, `spin-slow`, `shimmer`, `blink`
- `ring-pulse`, `scan-h`, `crt-scroll`, `gradient-shift`
- `intro-float`, `intro-scan`, `line-draw`

### Components of Note
- `DXMDLoader` — Do NOT modify. Triangle loading animation used in IntroOverlay.
- `TerminalOverlay` — WH40K-only. Parchment grain + warm vignette. No CRT scanlines.
- `IntroOverlay` — Text scramble animation. WH40K: Cinzel, parchment palette, no VT323.
- `SettingsModal` — Modal title: `═ Profile Configuration ═` for WH40K. Angular for both themes.

### Tailwind Config Tokens
- `accent` → `rgb(var(--accent-rgb))` — supports `/10` opacity modifiers
- `accent2`, `ui-border`, `ui-text`, `ui-overlay`, `ui-badge` — RGB-opacity tokens
- Custom shadows: `glow-accent`, `glow-sm`, `panel`, `elevated`, `modal`

---

## Known Constraints
- `@import` for Google Fonts MUST appear before `@tailwind` directives in globals.css
- No external UI libraries — pure Tailwind + inline styles
- `backdrop-filter` requires both unprefixed and `-webkit-` prefixed in inline styles
- `clip-path` on `.input-neon` means `border-radius` is ignored — the polygon handles shaping
- `text-gradient-accent` uses `-webkit-background-clip: text` — works in all modern browsers
- Nav `.active` class must be set explicitly in JSX (alongside `aria-current`) for the CSS `.nav-item.active` selector to fire
- `glow-pulse-soft` is a CSS @keyframe referenced as inline style animation string (not a Tailwind class)
