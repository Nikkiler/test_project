"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { t, themeId } = useTheme();
  const isWh40k = themeId === "wh40k";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const { error: msg } = (await res.json()) as { error: string };
        setError(msg ?? "Login failed");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg min-h-screen flex items-center justify-center">
      <div className="relative z-10 w-full max-w-sm mx-4 animate-slide-up">

        {/* Ambient glow behind the card (default theme only) */}
        {!isWh40k && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-40px",
              background: `
                radial-gradient(ellipse 70% 50% at 50% 45%, rgba(var(--accent-rgb), 0.12) 0%, transparent 60%),
                radial-gradient(ellipse 50% 60% at 20% 80%, rgba(var(--accent2-rgb), 0.07) 0%, transparent 60%)
              `,
              filter: "blur(8px)",
              animation: "glow-pulse-soft 4s ease-in-out infinite",
            }}
          />
        )}

        {/* Card */}
        <div
          className="relative p-8 login-card-float login-card-glow panel-specular"
          style={{
            background: isWh40k
              ? `linear-gradient(160deg, rgba(var(--bg-overlay-rgb),0.98) 0%, rgba(14,10,6,0.99) 100%)`
              : `linear-gradient(160deg, rgba(var(--bg-overlay-rgb),0.97) 0%, rgba(var(--bg-overlay-rgb),0.99) 100%)`,
            backdropFilter: isWh40k ? "none" : "blur(32px) saturate(1.5)",
            WebkitBackdropFilter: isWh40k ? "none" : "blur(32px) saturate(1.5)",
            border: isWh40k
              ? `1px solid rgba(var(--border-rgb), 0.45)`
              : `1px solid rgba(var(--border-rgb), 0.32)`,
            borderRadius: isWh40k ? "0" : "18px",
            boxShadow: isWh40k ? "none" : [
              "0 32px 80px rgba(0,0,0,0.7)",
              `0 8px 24px rgba(0,0,0,0.5)`,
              `0 0 0 1px rgba(var(--accent-rgb), 0.05)`,
              `inset 0 0 48px rgba(var(--accent-rgb), 0.02)`,
              `inset 0 1px 0 rgba(255,255,255,0.06)`,
            ].join(", "),
          }}
        >
          {/* WH40K corner ornaments */}
          {isWh40k && (
            <>
              {[
                { pos: "top-0 left-0",     borders: "border-t-2 border-l-2" },
                { pos: "top-0 right-0",    borders: "border-t-2 border-r-2" },
                { pos: "bottom-0 left-0",  borders: "border-b-2 border-l-2" },
                { pos: "bottom-0 right-0", borders: "border-b-2 border-r-2" },
              ].map(({ pos, borders }) => (
                <div key={pos} className={`absolute ${pos} pointer-events-none w-5 h-5 ${borders}`}
                  style={{ borderColor: `rgba(var(--accent-rgb), 0.60)` }} />
              ))}
            </>
          )}

          {/* Logo + Title */}
          <div className="mb-8 text-center">
            {/* Logo mark */}
            <div
              className="w-14 h-14 mx-auto mb-4 flex items-center justify-center font-bold
                         transition-transform duration-300"
              style={{
                background: isWh40k
                  ? `rgba(var(--accent-rgb), 0.08)`
                  : `linear-gradient(135deg, rgba(var(--bg-overlay-rgb),1) 0%, rgba(var(--accent-rgb),0.18) 50%, rgba(var(--accent2-rgb),0.12) 100%)`,
                color: "var(--accent)",
                border: isWh40k
                  ? `2px solid rgba(var(--accent-rgb), 0.45)`
                  : `1px solid rgba(var(--accent-rgb), 0.42)`,
                borderRadius: isWh40k ? "0" : "14px",
                boxShadow: isWh40k
                  ? `inset 0 0 20px rgba(var(--accent-rgb), 0.06)`
                  : [
                    `0 0 0 6px rgba(var(--accent-rgb), 0.05)`,
                    `0 0 24px rgba(var(--accent-rgb), 0.15)`,
                    `inset 0 1px 0 rgba(255,255,255,0.08)`,
                  ].join(", "),
                fontSize: isWh40k ? "24px" : "22px",
                fontFamily: isWh40k ? "var(--font-display)" : undefined,
                animation: isWh40k ? "none" : "float-bob 3s ease-in-out infinite",
                textShadow: isWh40k ? "none" : `0 0 20px rgba(var(--accent-rgb), 0.55)`,
              }}
            >
              {isWh40k ? "✦" : "⬡"}
            </div>

            <h1
              className="font-bold tracking-widest"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: isWh40k ? "22px" : "1.5rem",
                color: "var(--accent)",
                textShadow: isWh40k ? "none" : `0 0 32px rgba(var(--accent-rgb), 0.45), 0 2px 8px rgba(0,0,0,0.5)`,
                letterSpacing: isWh40k ? "0.20em" : "0.14em",
              }}
            >
              {t.loginTitle}
            </h1>
            <p
              className="text-[9px] tracking-widest mt-1.5"
              style={{
                fontFamily: "var(--font-display)",
                color: `rgba(var(--accent-rgb), 0.38)`,
                letterSpacing: isWh40k ? "0.16em" : "0.16em",
              }}
            >
              {t.loginSubtitle}
            </p>
          </div>

          {/* Ornamental divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{
              background: isWh40k
                ? `linear-gradient(to right, transparent, rgba(var(--accent-rgb),0.35))`
                : `linear-gradient(to right, transparent, rgba(var(--accent-rgb),0.2), rgba(var(--border-rgb),0.2))`,
            }} />
            <span
              className="flex-shrink-0"
              style={{
                color: `rgba(var(--accent-rgb), ${isWh40k ? "0.55" : "0.35"})`,
                fontSize: isWh40k ? "10px" : "4px",
              }}
            >
              {isWh40k ? "✦" : "●"}
            </span>
            <div className="flex-1 h-px" style={{
              background: isWh40k
                ? `linear-gradient(to left, transparent, rgba(var(--accent-rgb),0.35))`
                : `linear-gradient(to left, transparent, rgba(var(--accent-rgb),0.2), rgba(var(--border-rgb),0.2))`,
            }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: isWh40k ? "14px" : "10px",
                  color: `rgba(var(--accent-rgb), 0.6)`,
                  letterSpacing: isWh40k ? "0.12em" : "0.10em",
                }}
              >
                {t.loginUserLabel}
              </label>
              <input
                className="input-neon px-4 py-2.5 font-medium"
                style={{
                  background: isWh40k ? `rgba(var(--accent-rgb), 0.025)` : `rgba(var(--accent-rgb), 0.03)`,
                  border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.22"})`,
                  color: "var(--text)",
                  fontSize: "0.875rem",
                }}
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: isWh40k ? "14px" : "10px",
                  color: `rgba(var(--accent-rgb), 0.6)`,
                  letterSpacing: isWh40k ? "0.12em" : "0.10em",
                }}
              >
                {t.loginPassLabel}
              </label>
              <input
                className="input-neon px-4 py-2.5 font-medium"
                style={{
                  background: isWh40k ? `rgba(var(--accent-rgb), 0.025)` : `rgba(var(--accent-rgb), 0.03)`,
                  border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.22"})`,
                  color: "var(--text)",
                  fontSize: "0.875rem",
                }}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-2.5 text-sm animate-slide-up"
                style={{
                  background: isWh40k ? `rgba(139,26,26,0.15)` : `rgba(239,68,68,0.08)`,
                  border: isWh40k ? `1px solid rgba(139,26,26,0.45)` : `1px solid rgba(239,68,68,0.28)`,
                  borderRadius: isWh40k ? "0" : "8px",
                  color: isWh40k ? "#D2756B" : "#f87171",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-imperial btn-filled mt-2 px-4 py-3 tracking-widest uppercase
                         disabled:transform-none"
            >
              {t.loginButton(loading)}
            </button>

            {/* Footer */}
            <p
              className="text-center text-[10px] mt-1"
              style={{
                fontFamily: "var(--font-display)",
                color: `rgba(var(--accent-rgb), 0.22)`,
                letterSpacing: isWh40k ? "0.1em" : "0.06em",
              }}
            >
              {t.loginFooter}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
