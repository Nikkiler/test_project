"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { useChat } from "@/hooks/useChat";
import MessageList from "@/components/MessageList";
import RoomSidebar from "@/components/RoomSidebar";
import UserPanel from "@/components/UserPanel";
import SettingsModal from "@/components/SettingsModal";
import IntroOverlay from "@/components/IntroOverlay";
import type { ReplyPreview } from "@/lib/types";
import { clearUserMsgCache } from "@/lib/msgCache";
import { clearDmList, isDmRoom, dmPeer } from "@/lib/dmCache";
import { useTheme } from "@/lib/ThemeContext";

type Props = { username: string; isAdmin?: boolean };

export type UserProfiles = Record<string, { display_name: string | null; bio: string; avatar_color: string | null }>;

// ─── Mouse spotlight helper (no React state — writes CSS vars directly) ──────

function trackMouse(e: React.MouseEvent<HTMLElement>) {
  const { left, top } = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - top}px`);
}
function clearMouse(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--mx", "-9999px");
  e.currentTarget.style.setProperty("--my", "-9999px");
}

// ─── Blinking terminal cursor glyph ──────────────────────────────────────────

function TermCursor() {
  return (
    <span
      className="cursor-blink ml-1 text-sm select-none"
      style={{ color: "var(--accent)", fontFamily: "monospace" }}
    >
      █
    </span>
  );
}

export default function Chat({ username, isAdmin }: Props) {
  const { t, themeId } = useTheme();
  const isWh40k = themeId === "wh40k";

  const {
    messages, users, rooms, currentRoom, typingUsers, connected,
    replyingTo, setReplyingTo,
    dmConversations, openDm,
    unreadCounts,
    sendMessage, sendReaction, switchRoom, sendTyping,
  } = useChat(username);

  const [draft, setDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfiles>({});
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("intro.seen")) setShowIntro(true);
  }, []);
  const lastTypingRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchProfiles = useCallback(() => {
    fetch("/api/profiles").then((r) => r.ok ? r.json() : {}).then(setProfiles).catch(() => {});
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);
  // Re-fetch when user list changes (new users may have joined)
  useEffect(() => { if (users.length > 0) fetchProfiles(); }, [users.length, fetchProfiles]);

  const inDm = isDmRoom(currentRoom);
  const dmPartner = inDm ? dmPeer(currentRoom, username) : null;

  function handleSend() {
    const text = draft.trim();
    if (!text || !connected) return;
    sendMessage(text);
    setDraft("");
  }

  function handleInput(value: string) {
    setDraft(value);
    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now;
      sendTyping();
    }
  }

  const handleReply = useCallback((preview: ReplyPreview) => {
    setReplyingTo(preview);
    inputRef.current?.focus();
  }, [setReplyingTo]);

  const handleLogout = useCallback(async () => {
    clearUserMsgCache(username);
    clearDmList(username);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, [username]);

  const typingNames = Object.keys(typingUsers);
  const typingLabel =
    typingNames.length === 0 ? "" :
    typingNames.length === 1 ? t.typingOne(typingNames[0]) :
    typingNames.length <= 3 ? t.typingMany(typingNames.join(", ")) :
    t.typingLots;

  return (
    <div
      className="h-screen grid"
      style={{ gridTemplateColumns: "220px 1fr 190px", background: "var(--bg-primary)" }}
    >
      <RoomSidebar
        rooms={rooms}
        currentRoom={currentRoom}
        currentUser={username}
        dmConversations={dmConversations}
        unreadCounts={unreadCounts}
        onSwitch={switchRoom}
        onOpenDm={openDm}
      />

      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden spotlight-main"
        onMouseMove={trackMouse}
        onMouseLeave={clearMouse}
      >

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header
          className="px-5 py-3 flex items-center gap-3 flex-shrink-0 panel-specular"
          style={{
            background: isWh40k
              ? "#000000"
              : `linear-gradient(180deg, rgba(var(--bg-overlay-rgb),0.92) 0%, rgba(var(--bg-overlay-rgb),0.88) 100%)`,
            backdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.4)",
            borderBottom: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.25" : "0.16"})`,
            boxShadow: isWh40k ? "none" : "0 1px 0 rgba(var(--border-rgb),0.08), 0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          {isWh40k ? (
            /* ── WH40K gothic imperial header ────────────────────────── */
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="flex-shrink-0 select-none text-[11px] tracking-widest uppercase"
                style={{ color: `rgba(var(--accent-rgb), 0.35)`, fontFamily: "var(--font-display)" }}
              >
                {inDm ? t.dmPrefix : t.channelPrefix}
              </span>
              <span
                className="font-bold truncate"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  color: "var(--accent)",
                  textShadow: "none",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {inDm ? dmPartner : currentRoom}
              </span>
              {!connected && (
                <span
                  className="flex-shrink-0 text-[11px] tracking-widest uppercase"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#ef4444",
                    background: "rgba(139,26,26,0.15)",
                    border: "1px solid rgba(139,26,26,0.4)",
                    padding: "1px 8px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t.disconnected}
                </span>
              )}
            </div>
          ) : (
            /* ── Default futuristic header ───────────────────────────── */
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500"
                style={{
                  background: connected ? "var(--online-color)" : "#ef4444",
                  boxShadow: connected
                    ? `0 0 8px var(--online-color), 0 0 16px rgba(var(--accent-rgb),0.2)`
                    : "0 0 8px #ef4444",
                  animation: connected ? "glow-pulse 2.5s ease-in-out infinite" : "none",
                }}
              />
              <span
                className="font-semibold text-sm tracking-wide truncate font-display"
                style={{
                  color: "var(--accent)",
                  textShadow: `0 0 18px rgba(var(--accent-rgb), 0.40), 0 1px 4px rgba(0,0,0,0.5)`,
                  letterSpacing: "0.05em",
                }}
              >
                {inDm ? `${t.dmPrefix} ${dmPartner}` : `${t.channelPrefix} ${currentRoom}`}
              </span>
              {!connected && (
                <span
                  className="text-[10px] px-2 py-0.5 flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.28)",
                    borderRadius: "6px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t.disconnected}
                </span>
              )}
            </div>
          )}

          {/* Right-side controls */}
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-[11px] hidden sm:flex items-center gap-1.5 transition-colors duration-150
                         hover:text-ui-accent active:scale-95"
              style={{
                color: `rgba(var(--text-rgb), 0.30)`,
                fontFamily: isWh40k ? "var(--font-display)" : undefined,
                fontSize: isWh40k ? "11px" : undefined,
                letterSpacing: isWh40k ? "0.06em" : undefined,
              }}
            >
              {username}
              <span style={{ fontSize: "10px", opacity: 0.5 }}>⚙</span>
            </button>
            {isAdmin && (
              <a
                href="/admin"
                className="text-xs font-medium transition-colors duration-150 hover:text-ui-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  color: `rgba(var(--accent-rgb), 0.45)`,
                  letterSpacing: isWh40k ? "0.1em" : "0.06em",
                }}
              >
                {t.adminLink}
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-xs transition-colors duration-150 hover:text-red-400 active:scale-95"
              style={{ color: `rgba(var(--text-rgb), 0.2)` }}
            >
              {t.logoutButton}
            </button>
          </div>
        </header>

        {/* ── Messages ─────────────────────────────────────────────────── */}
        <MessageList
          messages={messages}
          currentUser={username}
          profiles={profiles}
          onReact={sendReaction}
          onReply={handleReply}
        />

        {/* ── Typing indicator ─────────────────────────────────────────── */}
        <div
          className="h-5 px-5 text-[11px] italic flex-shrink-0 flex items-center gap-1
                     transition-all duration-300"
          style={{
            color: `rgba(var(--accent-rgb), 0.38)`,
            opacity: typingLabel ? 1 : 0,
            fontFamily: isWh40k ? "var(--font-display)" : undefined,
            fontSize: isWh40k ? "11px" : undefined,
            letterSpacing: isWh40k ? "0.04em" : undefined,
          }}
        >
          {typingLabel}
        </div>

        {/* ── Reply bar ────────────────────────────────────────────────── */}
        {replyingTo && (
          <div
            className="flex items-center gap-3 px-4 py-2 flex-shrink-0 animate-slide-up"
            style={{
              background: `linear-gradient(90deg, rgba(var(--accent-rgb), 0.06) 0%, rgba(var(--accent-rgb), 0.025) 100%)`,
              borderTop: `1px solid rgba(var(--accent-rgb), 0.16)`,
              borderLeft: `3px solid rgba(var(--accent-rgb), 0.45)`,
            }}
          >
            <span className="text-xs flex-shrink-0" style={{ color: `rgba(var(--accent-rgb), 0.5)` }}>
              ↩
            </span>
            <div className="flex-1 text-xs truncate" style={{ color: `rgba(var(--text-rgb), 0.4)` }}>
              <span className="font-semibold not-italic mr-1.5" style={{ color: "var(--accent)" }}>
                {replyingTo.name}
              </span>
              {replyingTo.preview}
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="w-6 h-6 flex items-center justify-center text-base leading-none
                         rounded-full transition-all duration-150 hover:bg-accent/10 hover:text-ui-text-solid"
              style={{ color: `rgba(var(--text-rgb), 0.2)` }}
              title="Cancel reply"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Input bar ────────────────────────────────────────────────── */}
        <div
          className="flex gap-2 px-4 py-3 flex-shrink-0 items-center"
          style={{
            background: isWh40k
              ? "#000000"
              : `linear-gradient(0deg, rgba(var(--bg-overlay-rgb),0.98) 0%, rgba(var(--bg-overlay-rgb),0.94) 100%)`,
            backdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: isWh40k ? "none" : "blur(20px) saturate(1.4)",
            borderTop: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.25" : "0.14"})`,
            boxShadow: isWh40k ? "none" : "0 -4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <input
            ref={inputRef}
            className="input-neon flex-1 px-4 py-2.5"
            style={{
              background: `rgba(var(--accent-rgb), 0.028)`,
              border: `1px solid rgba(var(--border-rgb), 0.18)`,
              color: "var(--text)",
              fontSize: "0.875rem",
            }}
            placeholder={inDm ? t.inputPlaceholderDm(dmPartner!) : t.inputPlaceholderChannel(currentRoom)}
            value={draft}
            autoFocus
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              if (e.key === "Escape") setReplyingTo(null);
            }}
          />
          <button
            className="btn-gradient btn-filled px-6 py-2.5 flex-shrink-0
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            onClick={handleSend}
            disabled={!connected}
          >
            {t.sendButton}
          </button>
        </div>
      </div>

      <UserPanel users={users} profiles={profiles} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onSave={fetchProfiles} />
      {showIntro && (
        <IntroOverlay
          username={username}
          onComplete={() => { setShowIntro(false); sessionStorage.setItem("intro.seen", "1"); }}
        />
      )}
    </div>
  );
}
