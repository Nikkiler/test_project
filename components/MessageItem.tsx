"use client";

import { useState, useCallback, useRef } from "react";
import type { DisplayMessage, Reactions, ReplyPreview } from "@/lib/types";
import { useTheme } from "@/lib/ThemeContext";
import { AVATAR_COLORS } from "@/lib/theme";
import type { UserProfiles } from "@/components/Chat";

// ─── Avatar color ─────────────────────────────────────────────────────────────

function avatarColor(name: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s<>'"]+/g;

function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of [...text.matchAll(URL_RE)]) {
    if (m.index! > last) parts.push(...renderInline(text.slice(last, m.index)));
    parts.push(
      <a key={m.index} href={m[0]} target="_blank" rel="noopener noreferrer"
        className="text-ui-accent hover:underline break-all transition-colors duration-100">
        {m[0]}
      </a>
    );
    last = m.index! + m[0].length;
  }
  if (text.slice(last)) parts.push(...renderInline(text.slice(last)));
  return parts;
}

function renderInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|`([^`]+)`)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    if (m[0].startsWith("**"))
      result.push(<strong key={m.index} className="font-semibold">{m[2]}</strong>);
    else if (m[0].startsWith("`"))
      result.push(
        <code key={m.index}
          className="px-1.5 py-0.5 font-mono text-xs text-ui-accent"
          style={{
            background: `rgba(var(--border-rgb), 0.1)`,
            border: `1px solid rgba(var(--border-rgb), 0.2)`,
            borderRadius: "4px",
          }}>{m[5]}</code>
      );
    else result.push(<em key={m.index} className="italic opacity-90">{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👎"];

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div
      className="absolute z-50 bottom-full mb-2 right-0 flex gap-0.5 px-2 py-1.5 animate-slide-up"
      style={{
        background: `linear-gradient(135deg, rgba(var(--bg-overlay-rgb),0.97) 0%, rgba(var(--bg-overlay-rgb),0.99) 100%)`,
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        border: `1px solid rgba(var(--border-rgb), 0.26)`,
        borderRadius: "12px",
        boxShadow: [
          `0 12px 40px rgba(0,0,0,0.65)`,
          `inset 0 1px 0 rgba(255,255,255,0.07)`,
          `0 0 0 1px rgba(var(--accent-rgb), 0.04)`,
        ].join(", "),
      }}
      onMouseLeave={onClose}
    >
      {QUICK_EMOJIS.map((e) => (
        <button key={e}
          className="text-base hover:scale-125 active:scale-105 transition-transform duration-100 p-0.5"
          onClick={() => { onPick(e); onClose(); }}>
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Reaction bar ─────────────────────────────────────────────────────────────

function ReactionBar({ reactions, onReact, currentUser }: {
  reactions: Reactions; onReact: (e: string) => void; currentUser: string;
}) {
  const entries = Object.entries(reactions).filter(([, u]) => u.length > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {entries.map(([emoji, users]) => {
        const reacted = users.includes(currentUser);
        return (
          <button key={emoji}
            onClick={() => onReact(emoji)}
            title={users.join(", ")}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                       transition-all duration-150 hover:scale-105 active:scale-100"
            style={reacted ? {
              background: `rgba(var(--accent-rgb), 0.14)`,
              border: `1px solid rgba(var(--accent-rgb), 0.45)`,
              color: "var(--accent)",
            } : {
              background: `rgba(var(--border-rgb), 0.05)`,
              border: `1px solid rgba(var(--border-rgb), 0.14)`,
              color: `rgba(var(--text-rgb), 0.42)`,
            }}
          >
            <span>{emoji}</span>
            <span className="font-medium tabular-nums">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Reply quote ──────────────────────────────────────────────────────────────

function ReplyQuote({ replyTo }: { replyTo: ReplyPreview }) {
  return (
    <div className="flex items-center gap-1.5 mb-1 text-xs pl-2"
      style={{
        borderLeft: `2px solid rgba(var(--accent-rgb), 0.28)`,
        color: `rgba(var(--text-rgb), 0.3)`,
      }}
    >
      <span style={{ color: `rgba(var(--accent-rgb), 0.4)`, fontWeight: 700 }}>↰</span>
      <span className="font-semibold" style={{ color: `rgba(var(--text-rgb), 0.42)` }}>{replyTo.name}</span>
      <span className="truncate max-w-xs">{replyTo.preview}</span>
    </div>
  );
}

// ─── MessageItem ──────────────────────────────────────────────────────────────

export type MessageItemProps = {
  msg: DisplayMessage;
  isGrouped: boolean;
  currentUser: string;
  profiles: UserProfiles;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (preview: ReplyPreview) => void;
  isNew?: boolean;
};

export default function MessageItem({ msg, isGrouped, currentUser, profiles, onReact, onReply, isNew }: MessageItemProps) {
  const { themeId, t } = useTheme();
  const palette = AVATAR_COLORS[themeId];
  const isWh40k = themeId === "wh40k";

  const [hovered, setHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleReact = useCallback((emoji: string) => {
    if (msg.type === "msg") onReact(msg.msgId, emoji);
  }, [msg, onReact]);

  const handleReply = useCallback(() => {
    if (msg.type !== "msg") return;
    onReply({ msgId: msg.msgId, name: msg.name, preview: msg.text.slice(0, 80) });
  }, [msg, onReply]);

  // Mouse spotlight per-row (WH40K gets a different, dimmer version via CSS)
  function trackRowMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (isWh40k) return; // WH40K uses scan-line CSS instead
    const { left, top } = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--rx", `${e.clientX - left}px`);
    e.currentTarget.style.setProperty("--ry", `${e.clientY - top}px`);
  }

  // ── System message ──────────────────────────────────────────────────────
  if (msg.type === "system") {
    return (
      <div className="flex justify-center my-3">
        <span
          className="text-[9px] font-medium tracking-widest uppercase px-4 py-1"
          style={{
            fontFamily: "var(--font-display)",
            color: `rgba(var(--accent-rgb), 0.32)`,
            background: `rgba(var(--border-rgb), 0.05)`,
            border: `1px solid rgba(var(--border-rgb), 0.1)`,
            borderRadius: isWh40k ? "0" : "20px",
            letterSpacing: isWh40k ? "0.18em" : "0.1em",
            textShadow: "none",
          }}
        >
          {isWh40k ? `\u2014 ${msg.text} \u2014` : msg.text}
        </span>
      </div>
    );
  }

  // Pending decrypt messages are filtered out before rendering
  if (msg.type === "pending") return null;

  const isOwn = msg.name === currentUser;
  const profile = profiles[msg.name];
  const displayName = profile?.display_name || msg.name;
  const color = profile?.avatar_color || avatarColor(msg.name, palette);
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div
      ref={rowRef}
      className="msg-hover-line relative flex gap-3 px-5 py-0.5 group transition-colors duration-100"
      style={{
        background: hovered
          ? isWh40k
            ? `rgba(var(--accent-rgb), 0.018)`
            : `radial-gradient(circle 200px at var(--rx, 50%) var(--ry, 50%), rgba(var(--accent-rgb), 0.04), transparent 80%)`
          : "transparent",
        animation: isNew ? "msg-in 0.2s ease-out" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPickerOpen(false); }}
      onMouseMove={trackRowMouse}
    >
      {/* Own-message tint — subtle left-fading gradient */}
      {isOwn && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(var(--accent-rgb), 0.024) 0%, transparent 80%)`,
            borderLeft: "2px solid rgba(var(--accent-rgb), 0.10)",
          }}
        />
      )}

      {/* Avatar column */}
      <div className="w-9 flex-shrink-0 flex items-start pt-0.5">
        {isGrouped ? (
          <span
            className="w-9 text-center text-[10px] opacity-0 group-hover:opacity-100
                       transition-opacity duration-150 pt-1 select-none tabular-nums"
            style={{
              color: `rgba(var(--accent-rgb), 0.22)`,
            }}
          >
            {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : isWh40k ? (
          /* WH40K: heraldic shield avatar with warm gold border */
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold
                       select-none flex-shrink-0"
            style={{
              color: color,
              fontFamily: "var(--font-display)",
              fontSize: "13px",
              border: `2px solid ${color}70`,
              borderRadius: "0",
              background: `${color}12`,
              letterSpacing: "0.04em",
            }}
          >
            {initial}
          </div>
        ) : (
          /* Default: circular avatar with layered glow */
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                       select-none flex-shrink-0 transition-all duration-200 group-hover:scale-110"
            style={{
              backgroundColor: color,
              color: "var(--text)",
              border: `1.5px solid rgba(var(--border-rgb), 0.28)`,
              boxShadow: `0 0 0 0 ${color}00, 0 2px 8px rgba(0,0,0,0.4)`,
              filter: "saturate(0.9) brightness(0.95)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow = `0 0 0 3px ${color}30, 0 0 12px ${color}55, 0 2px 8px rgba(0,0,0,0.4)`;
              el.style.filter = "saturate(1.1) brightness(1.05)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow = `0 0 0 0 ${color}00, 0 2px 8px rgba(0,0,0,0.4)`;
              el.style.filter = "saturate(0.9) brightness(0.95)";
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span
              className={isWh40k ? "" : "text-gradient-accent"}
              style={{
                fontSize: isWh40k ? "14px" : "0.875rem",
                fontWeight: isWh40k ? 700 : 600,
                fontFamily: "var(--font-display)",
                letterSpacing: isWh40k ? "0.06em" : "0.02em",
                color: isWh40k ? "var(--accent)" : undefined,
                textShadow: "none",
              }}
            >
              {isWh40k ? displayName : displayName}
              {isOwn && (
                <span
                  className="font-normal ml-1.5 text-[10px] opacity-50"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  (you)
                </span>
              )}
            </span>
            <span
              className="text-[10px] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{
                color: `rgba(var(--accent-rgb), 0.28)`,
              }}
            >
              {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}

        {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} />}

        <p
          className={`leading-relaxed break-words msg-text`}
          style={{
            color: "var(--text)",
            fontSize: "0.875rem",
          }}
        >
          {renderMarkdown(msg.text)}
        </p>

        <ReactionBar reactions={msg.reactions} onReact={handleReact} currentUser={currentUser} />
      </div>

      {/* Hover actions */}
      {hovered && (
        <div
          className="absolute right-4 top-0 -translate-y-1/2 z-40 flex items-center gap-0.5
                     px-1 py-0.5 animate-fade-in"
          style={{
            background: isWh40k
              ? "#000000"
              : `linear-gradient(135deg, rgba(var(--bg-overlay-rgb),0.96) 0%, rgba(var(--bg-overlay-rgb),0.98) 100%)`,
            backdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.5)",
            WebkitBackdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.5)",
            border: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.22"})`,
            borderRadius: isWh40k ? "2px" : "10px",
            boxShadow: isWh40k ? "none" : [
              `0 6px 24px rgba(0,0,0,0.6)`,
              `inset 0 1px 0 rgba(255,255,255,0.07)`,
              `inset 0 -1px 0 rgba(0,0,0,0.2)`,
            ].join(", "),
          }}
        >
          <div className="relative">
            <button
              title="Add reaction"
              className="p-1.5 text-base leading-none rounded-lg
                         transition-all duration-100 hover:bg-accent/10 hover:scale-110"
              style={{ color: `rgba(var(--text-rgb), 0.38)` }}
              onClick={() => setPickerOpen((p) => !p)}
            >
              😊
            </button>
            {pickerOpen && <EmojiPicker onPick={handleReact} onClose={() => setPickerOpen(false)} />}
          </div>
          <button
            title="Reply"
            className="p-1.5 text-sm leading-none font-medium rounded-lg
                       transition-all duration-100 hover:bg-accent/10 hover:text-ui-accent"
            style={{ color: `rgba(var(--text-rgb), 0.38)` }}
            onClick={handleReply}
          >
            ↩
          </button>
        </div>
      )}
    </div>
  );
}
