"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
};

type ProfileData = {
  display_name: string | null;
  bio: string;
  avatar_color: string | null;
};

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#84cc16",
];

export default function SettingsModal({ open, onClose, onSave }: Props) {
  const { themeId } = useTheme();
  const isWh40k = themeId === "wh40k";

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarColor(data.avatar_color);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          bio: bio.trim(),
          avatar_color: avatarColor,
        }),
      });
      if (res.ok) {
        setMessage("Saved");
        onSave?.();
        setTimeout(() => setMessage(""), 2000);
      } else {
        const { error } = (await res.json()) as { error: string };
        setMessage(error);
      }
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 p-6 animate-modal-in panel-specular"
        style={{
          background: isWh40k
            ? "#000000"
            : `linear-gradient(160deg, rgba(var(--bg-overlay-rgb),0.98) 0%, rgba(var(--bg-overlay-rgb),0.99) 100%)`,
          backdropFilter: isWh40k ? "none" : "blur(28px) saturate(1.5)",
          WebkitBackdropFilter: isWh40k ? "none" : "blur(28px) saturate(1.5)",
          border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.25"})`,
          borderRadius: isWh40k ? "2px" : "18px",
          boxShadow: isWh40k ? "none" : [
            "0 32px 80px rgba(0,0,0,0.75)",
            "0 8px 24px rgba(0,0,0,0.5)",
            `0 0 0 1px rgba(var(--accent-rgb), 0.05)`,
            `inset 0 1px 0 rgba(255,255,255,0.06)`,
          ].join(", "),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={isWh40k ? "" : "text-gradient-accent"}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: isWh40k ? "16px" : "1rem",
              color: isWh40k ? "var(--accent)" : undefined,
              letterSpacing: isWh40k ? "0.14em" : "0.08em",
              textTransform: isWh40k ? "uppercase" : undefined,
            }}
          >
            {isWh40k ? "\u2550 Profile Configuration \u2550" : "Profile Settings"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                       transition-all duration-150 hover:bg-accent/10 hover:scale-110 active:scale-95"
            style={{ color: `rgba(var(--text-rgb), 0.3)`, fontSize: "18px" }}
          >
            ×
          </button>
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label
            className="block mb-1.5 font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isWh40k ? "13px" : "10px",
              color: `rgba(var(--accent-rgb), 0.6)`,
              letterSpacing: isWh40k ? "0.1em" : "0.08em",
            }}
          >
            {isWh40k ? "DESIGNATOR:" : "Display Name"}
          </label>
          <input
            className="input-neon w-full px-3 py-2"
            style={{
              background: isWh40k ? `rgba(var(--accent-rgb), 0.025)` : `rgba(var(--accent-rgb), 0.03)`,
              border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.2"})`,
              color: "var(--text)",
              fontSize: "0.875rem",
            }}
            placeholder={isWh40k ? "Enter your designation..." : "How others see you"}
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label
            className="block mb-1.5 font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isWh40k ? "13px" : "10px",
              color: `rgba(var(--accent-rgb), 0.6)`,
              letterSpacing: isWh40k ? "0.1em" : "0.08em",
            }}
          >
            {isWh40k ? "STATUS LOG:" : "Bio"}
          </label>
          <textarea
            className="input-neon w-full px-3 py-2 resize-none"
            style={{
              background: isWh40k ? `rgba(var(--accent-rgb), 0.025)` : `rgba(var(--accent-rgb), 0.03)`,
              border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.2"})`,
              color: "var(--text)",
              fontSize: "0.875rem",
              minHeight: "60px",
            }}
            placeholder={isWh40k ? "Record your status..." : "Tell people about yourself"}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <span className="text-[10px] mt-0.5 block" style={{ color: `rgba(var(--text-rgb), 0.2)` }}>
            {bio.length}/200
          </span>
        </div>

        {/* Avatar Color */}
        <div className="mb-5">
          <label
            className="block mb-2 font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isWh40k ? "13px" : "10px",
              color: `rgba(var(--accent-rgb), 0.6)`,
              letterSpacing: isWh40k ? "0.1em" : "0.08em",
            }}
          >
            {isWh40k ? "HERALDRY COLOR:" : "Avatar Color"}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reset to auto */}
            <button
              onClick={() => setAvatarColor(null)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px]
                         transition-all duration-150 hover:scale-110"
              style={{
                border: avatarColor === null
                  ? `2px solid var(--accent)`
                  : `1px solid rgba(var(--border-rgb), 0.25)`,
                background: `rgba(var(--border-rgb), 0.1)`,
                color: `rgba(var(--text-rgb), 0.4)`,
              }}
              title="Auto"
            >
              A
            </button>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAvatarColor(c)}
                className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110"
                style={{
                  background: c,
                  border: avatarColor === c
                    ? `2px solid var(--accent)`
                    : `1px solid rgba(0,0,0,0.2)`,
                  boxShadow: avatarColor === c ? `0 0 8px ${c}55` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient btn-filled px-5 py-2 flex-shrink-0"
          >
            {saving ? (isWh40k ? "Saving..." : "Saving...") : (isWh40k ? "Confirm" : "Save")}
          </button>
          <button
            onClick={onClose}
            className="text-xs transition-colors duration-150 hover:text-ui-accent"
            style={{ color: `rgba(var(--text-rgb), 0.3)` }}
          >
            Cancel
          </button>
          {message && (
            <span
              className="text-xs animate-fade-in"
              style={{ color: message === "Saved" ? "var(--online-color)" : "#ef4444" }}
            >
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
