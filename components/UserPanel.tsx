"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { UserProfiles } from "@/components/Chat";

type Props = { users: string[]; profiles: UserProfiles };

function userHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function trackMouse(e: React.MouseEvent<HTMLElement>) {
  const { left, top } = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - top}px`);
}
function clearMouse(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--mx", "-9999px");
  e.currentTarget.style.setProperty("--my", "-9999px");
}

export default function UserPanel({ users, profiles }: Props) {
  const { t, themeId } = useTheme();
  const isWh40k = themeId === "wh40k";

  return (
    <aside
      className="spotlight-panel panel-specular flex flex-col overflow-hidden relative"
      style={{ borderLeft: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.16"})` }}
      onMouseMove={trackMouse}
      onMouseLeave={clearMouse}
    >
      {/* WH40K corner ornaments — thicker imperial gold */}
      {isWh40k && <>
        <div className="absolute top-0 right-0 pointer-events-none z-10 w-4 h-4"
          style={{ borderTop: `2px solid rgba(var(--accent-rgb),0.55)`, borderRight: `2px solid rgba(var(--accent-rgb),0.55)` }} />
        <div className="absolute top-0 left-0 pointer-events-none z-10 w-4 h-4"
          style={{ borderTop: `2px solid rgba(var(--accent-rgb),0.55)`, borderLeft: `2px solid rgba(var(--accent-rgb),0.55)` }} />
      </>}

      {/* Header */}
      <div
        className={`px-3.5 flex-shrink-0${isWh40k ? " terminal-section-hdr" : ""}`}
        style={{
          paddingTop: "9px",
          paddingBottom: "7px",
          fontSize: isWh40k ? "10px" : "9px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: isWh40k ? "0.18em" : "0.12em",
          textTransform: "uppercase",
          color: `rgba(var(--accent-rgb), ${isWh40k ? "0.65" : "0.42"})`,
          textShadow: "none",
          borderBottom: isWh40k ? undefined : `1px solid rgba(var(--border-rgb), 0.1)`,
        }}
      >
        {isWh40k ? `\u2550 ${t.usersHeader(users.length)} \u2550` : t.usersHeader(users.length)}
      </div>

      <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {users.map((name) => {
          const profile = profiles[name];
          const displayName = profile?.display_name || name;
          const customColor = profile?.avatar_color;
          const hue = userHue(name);
          return (
            <li
              key={name}
              className="flex items-center gap-2.5 px-2 py-1.5 text-xs rounded-md
                         transition-colors duration-150 hover:bg-accent/5 group"
            >
              <div className="relative flex-shrink-0">
                {isWh40k ? (
                  /* WH40K: heraldic imperial avatar with warm gold border */
                  <div
                    className="w-6 h-6 flex items-center justify-center font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      color: "var(--accent)",
                      border: `2px solid rgba(var(--accent-rgb), 0.45)`,
                      background: `rgba(var(--accent-rgb), 0.08)`,
                    }}
                  >
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </div>
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                               transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: customColor ? `${customColor}28` : `hsla(${hue}, 45%, 18%, 0.7)`,
                      color: customColor || `hsl(${hue}, 60%, 68%)`,
                      border: customColor
                        ? `1px solid ${customColor}50`
                        : `1px solid hsla(${hue}, 45%, 45%, 0.22)`,
                      boxShadow: `0 0 8px ${customColor || `hsl(${hue}, 55%, 55%)`}22`,
                    }}
                  >
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                {/* Online indicator */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{
                    background: "var(--online-color)",
                    border: `1.5px solid var(--bg-primary)`,
                    boxShadow: isWh40k ? "none" : `0 0 5px var(--online-color), 0 0 10px rgba(var(--accent-rgb),0.2)`,
                    animation: isWh40k ? "none" : "glow-pulse 2.5s ease-in-out infinite",
                  }}
                />
              </div>
              <span
                className="truncate transition-colors duration-150 group-hover:text-ui-text-solid"
                style={{
                  color: customColor || `rgba(var(--text-rgb), 0.48)`,
                  fontSize: isWh40k ? "11px" : undefined,
                }}
              >
                {displayName}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
