"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DisplayMessage, ReplyPreview } from "@/lib/types";
import MessageItem from "@/components/MessageItem";
import { useTheme } from "@/lib/ThemeContext";
import type { UserProfiles } from "@/components/Chat";

type Props = {
  messages: DisplayMessage[];
  currentUser: string;
  profiles: UserProfiles;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (preview: ReplyPreview) => void;
};

// ─── Day separator ────────────────────────────────────────────────────────────

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function DaySeparator({ label }: { label: string }) {
  const { themeId } = useTheme();
  const isWh40k = themeId === "wh40k";
  return (
    <div className="flex items-center gap-3 my-4 px-5">
      <div className="flex-1 h-px" style={{ background: `rgba(var(--border-rgb), 0.14)` }} />
      <span
        className="font-medium tracking-widest uppercase px-2 select-none"
        style={{
          fontSize: isWh40k ? "10px" : "9px",
          fontFamily: "var(--font-display)",
          color: `rgba(var(--accent-rgb), ${isWh40k ? "0.45" : "0.3"})`,
          letterSpacing: isWh40k ? "0.18em" : "0.12em",
          textShadow: "none",
        }}
      >
        {isWh40k ? `\u2550 ${label} \u2550` : label}
      </span>
      <div className="flex-1 h-px" style={{ background: `rgba(var(--border-rgb), 0.14)` }} />
    </div>
  );
}

// ─── Grouping helpers ─────────────────────────────────────────────────────────

const GROUP_MS = 5 * 60 * 1000;

function isGrouped(prev: DisplayMessage | undefined, curr: DisplayMessage): boolean {
  if (!prev || prev.type !== "msg" || curr.type !== "msg") return false;
  if (prev.name !== curr.name) return false;
  return new Date(curr.time).getTime() - new Date(prev.time).getTime() < GROUP_MS;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// ─── MessageList ──────────────────────────────────────────────────────────────

export default function MessageList({ messages, currentUser, profiles, onReact, onReply }: Props) {
  const { themeId } = useTheme();
  const isWh40k = themeId === "wh40k";
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  // Track the ID of the most recently arrived message (for entrance animation)
  const lastSeenCountRef = useRef(0);
  const [newMsgId, setNewMsgId] = useState<string | null>(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (messages.length > lastSeenCountRef.current && last?.type === "msg") {
      setNewMsgId(last.msgId);
      // Clear after animation (200ms)
      const t = setTimeout(() => setNewMsgId(null), 220);
      return () => clearTimeout(t);
    }
    lastSeenCountRef.current = messages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnread(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(bottom);
    if (bottom) setUnread(0);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      const last = messages[messages.length - 1];
      if (last?.type === "msg" && last.name !== currentUser) setUnread((n) => n + 1);
    }
  }, [messages, atBottom, currentUser]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto py-2">
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDay = i === 0 || !isSameDay(prev?.time ?? "", msg.time);
          const grouped = isGrouped(prev, msg);
          const msgId = msg.type === "msg" || msg.type === "pending" ? msg.msgId : null;
          const isNew = msgId !== null && msgId === newMsgId;

          return (
            <div key={msgId ?? i}>
              {showDay && <DaySeparator label={dayLabel(msg.time)} />}
              <MessageItem
                msg={msg}
                isGrouped={grouped}
                currentUser={currentUser}
                profiles={profiles}
                onReact={onReact}
                onReply={onReply}
                isNew={isNew}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom pill */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-5 flex items-center gap-1.5 px-3 py-1.5 text-xs
                     font-medium animate-slide-up transition-all duration-200 scroll-pill
                     hover:-translate-y-0.5 hover:shadow-glow-sm active:translate-y-0 active:scale-95"
          style={{
            fontFamily: "var(--font-display)",
            background: `linear-gradient(135deg, rgba(var(--bg-overlay-rgb),0.97) 0%, rgba(var(--bg-overlay-rgb),0.99) 100%)`,
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            border: `1px solid rgba(var(--accent-rgb), 0.28)`,
            borderRadius: isWh40k ? "0" : "20px",
            color: `rgba(var(--accent-rgb), 0.65)`,
            boxShadow: [
              `0 6px 24px rgba(0,0,0,0.55)`,
              `0 0 0 1px rgba(var(--accent-rgb), 0.06)`,
              `inset 0 1px 0 rgba(255,255,255,0.06)`,
            ].join(", "),
          }}
        >
          {unread > 0 && (
            <span
              className="badge-pulse text-[10px] font-bold rounded-full min-w-[18px] h-[18px]
                         flex items-center justify-center px-1"
              style={{ background: "var(--badge-bg)", color: "var(--text)" }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          <span>↓</span>
        </button>
      )}
    </div>
  );
}
