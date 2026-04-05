"use client";

import { useState, useEffect, KeyboardEvent, useRef } from "react";
import type { Room } from "@/lib/types";
import { dmRoomName } from "@/lib/dmCache";
import { useTheme } from "@/lib/ThemeContext";

type Props = {
  rooms: Room[];
  currentRoom: string;
  currentUser: string;
  dmConversations: string[];
  unreadCounts: Record<string, number>;
  onSwitch: (room: string) => void;
  onOpenDm: (peer: string) => void;
};

function trackMouse(e: React.MouseEvent<HTMLElement>) {
  const { left, top } = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - top}px`);
}
function clearMouse(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--mx", "-9999px");
  e.currentTarget.style.setProperty("--my", "-9999px");
}

export default function RoomSidebar({
  rooms, currentRoom, currentUser, dmConversations,
  unreadCounts, onSwitch, onOpenDm,
}: Props) {
  const { t, themeId } = useTheme();
  const isWh40k = themeId === "wh40k";
  const [newRoom, setNewRoom] = useState("");
  const [dmPickerOpen, setDmPickerOpen] = useState(false);
  const [userList, setUserList] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const isDm = currentRoom.startsWith("dm:");

  function createRoom() {
    const name = newRoom.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (name) { onSwitch(name); setNewRoom(""); }
  }

  async function openPicker() {
    setDmPickerOpen(true);
    setSearch("");
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUserList(((await res.json()) as { users: string[] }).users);
    } catch { setUserList([]); }
  }

  useEffect(() => {
    if (dmPickerOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dmPickerOpen]);

  function selectDm(peer: string) { onOpenDm(peer); setDmPickerOpen(false); setSearch(""); }

  const filteredUsers = userList.filter((u) => u.toLowerCase().includes(search.toLowerCase()));

  return (
    <aside
      className="spotlight-panel panel-specular flex flex-col overflow-hidden relative"
      style={{ borderRight: `1px solid rgba(var(--border-rgb), ${isWh40k ? "0.35" : "0.16"})` }}
      onMouseMove={trackMouse}
      onMouseLeave={clearMouse}
    >
      {/* WH40K corner ornaments — thicker imperial gold */}
      {isWh40k && <>
        <div className="absolute top-0 left-0 pointer-events-none z-10 w-4 h-4"
          style={{ borderTop: `2px solid rgba(var(--accent-rgb),0.55)`, borderLeft: `2px solid rgba(var(--accent-rgb),0.55)` }} />
        <div className="absolute top-0 right-0 pointer-events-none z-10 w-4 h-4"
          style={{ borderTop: `2px solid rgba(var(--accent-rgb),0.55)`, borderRight: `2px solid rgba(var(--accent-rgb),0.55)` }} />
      </>}

      {/* ── Channels header ──────────────────────────────────────────────── */}
      <SectionHeader label={t.channelsHeader} isWh40k={isWh40k} />

      <ul className="overflow-y-auto p-1.5 flex-shrink-0 max-h-52 space-y-0.5">
        {rooms.map((room) => {
          const unread = unreadCounts[room.name] ?? 0;
          const isActive = room.name === currentRoom && !isDm;
          return (
            <li
              key={room.name}
              onClick={() => onSwitch(room.name)}
              className={`nav-item relative flex items-center justify-between px-2.5 py-1.5 cursor-pointer text-sm group/item${isActive ? " active" : ""}`}
              style={isActive ? {
                color: "var(--accent)",
                fontWeight: 600,
              } : {
                color: unread > 0 ? "var(--text)" : `rgba(var(--text-rgb), 0.38)`,
                fontWeight: unread > 0 ? 600 : 400,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex items-center gap-1.5 truncate min-w-0">
                {/* WH40K: show `>` on active, dim `·` otherwise */}
                <span
                  className="nav-prompt flex-shrink-0 font-mono"
                  style={{
                    color: "var(--accent)",
                    fontSize: "11px",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.15s",
                  }}
                >
                  &gt;
                </span>
                <span
                  className="flex-shrink-0 text-[11px] transition-colors duration-150"
                  style={{ color: isActive ? "var(--accent)" : `rgba(var(--accent-rgb), 0.25)` }}
                >
                  {t.channelPrefix}
                </span>
                <span className="truncate">{room.name}</span>
              </span>
              {unread > 0 && (
                <span
                  className="badge-pulse ml-1 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
                  style={{ background: "var(--badge-bg)", color: "var(--text)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* New channel input */}
      <div className="px-2 pb-2" style={{ borderTop: `1px solid rgba(var(--border-rgb), 0.08)` }}>
        <input
          className="input-neon w-full px-3 py-1.5 text-xs mt-2"
          style={{
            background: `rgba(var(--accent-rgb), 0.025)`,
            border: `1px solid rgba(var(--border-rgb), 0.14)`,
            color: "var(--text)",
          }}
          placeholder={t.newChannelPlaceholder}
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && createRoom()}
        />
      </div>

      {/* ── DMs header ───────────────────────────────────────────────────── */}
      <SectionHeader
        label={t.dmHeader}
        isWh40k={isWh40k}
        action={
          <button
            onClick={openPicker}
            title={t.newDmTitle}
            className="w-5 h-5 flex items-center justify-center text-sm leading-none rounded-md
                       transition-all duration-150 hover:bg-accent/10 hover:text-ui-accent active:scale-90"
            style={{ color: `rgba(var(--accent-rgb), 0.38)`, fontFamily: "sans-serif" }}
          >
            +
          </button>
        }
      />

      {/* User picker */}
      {dmPickerOpen && (
        <div
          className="mx-2 mb-2 p-2 animate-fade-in"
          style={{
            border: `1px solid rgba(var(--border-rgb), 0.18)`,
            borderRadius: "10px",
            background: `rgba(var(--accent-rgb), 0.025)`,
          }}
        >
          <input
            ref={searchRef}
            className="input-neon w-full px-3 py-1.5 text-xs mb-1.5"
            style={{
              background: `rgba(var(--bg-overlay-rgb), 0.6)`,
              border: `1px solid rgba(var(--border-rgb), 0.18)`,
              color: "var(--text)",
            }}
            placeholder={t.searchDmPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Escape") { setDmPickerOpen(false); setSearch(""); }
              if (e.key === "Enter" && filteredUsers.length === 1) selectDm(filteredUsers[0]);
            }}
          />
          <ul className="max-h-32 overflow-y-auto space-y-0.5">
            {filteredUsers.length === 0 && (
              <li
                className="px-2 py-1.5 text-xs italic"
                style={{ color: `rgba(var(--text-rgb), 0.22)` }}
              >
                {t.noDmFound}
              </li>
            )}
            {filteredUsers.map((u) => (
              <li
                key={u}
                onClick={() => selectDm(u)}
                className="nav-item px-2 py-1.5 text-xs cursor-pointer flex items-center gap-1.5"
                style={{ color: `rgba(var(--text-rgb), 0.55)` }}
              >
                <span className="text-[10px]" style={{ color: `rgba(var(--accent-rgb), 0.4)` }}>
                  ●
                </span>
                {u}
              </li>
            ))}
          </ul>
          <button
            onClick={() => { setDmPickerOpen(false); setSearch(""); }}
            className="mt-1.5 w-full text-[10px] transition-colors duration-150
                       hover:text-ui-accent py-0.5 rounded"
            style={{ color: `rgba(var(--accent-rgb), 0.2)` }}
          >
            {t.dismissButton}
          </button>
        </div>
      )}

      {/* DM list */}
      <ul className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {dmConversations.length === 0 && (
          <li
            className="px-3 py-2 text-xs italic"
            style={{ color: `rgba(var(--text-rgb), 0.18)` }}
          >
            {t.noDmText}
          </li>
        )}
        {dmConversations.map((peer) => {
          const dmRoom = dmRoomName(currentUser, peer);
          const unread = unreadCounts[dmRoom] ?? 0;
          const isActive = dmRoom === currentRoom;
          const initial = peer[0]?.toUpperCase() ?? "?";

          return (
            <li
              key={peer}
              onClick={() => onOpenDm(peer)}
              className={`nav-item relative flex items-center justify-between px-2.5 py-1.5 cursor-pointer text-sm${isActive ? " active" : ""}`}
              style={isActive ? {
                color: "var(--accent)", fontWeight: 600,
              } : {
                color: unread > 0 ? "var(--text)" : `rgba(var(--text-rgb), 0.40)`,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              <div className="flex items-center min-w-0 gap-2">
                {isWh40k ? (
                  /* WH40K: small heraldic avatar */
                  <div
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "10px",
                      color: isActive ? "var(--accent)" : `rgba(var(--accent-rgb), 0.50)`,
                      border: `1.5px solid ${isActive ? "rgba(var(--accent-rgb),0.6)" : "rgba(var(--accent-rgb),0.22)"}`,
                      background: isActive ? "rgba(var(--accent-rgb),0.10)" : "transparent",
                    }}
                  >
                    {initial}
                  </div>
                ) : (
                  /* Default: circular avatar */
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-150"
                    style={{
                      background: isActive ? `rgba(var(--accent-rgb), 0.18)` : `rgba(var(--border-rgb), 0.12)`,
                      color: isActive ? "var(--accent)" : `rgba(var(--accent-rgb), 0.55)`,
                      border: isActive ? `1px solid rgba(var(--accent-rgb), 0.45)` : `1px solid rgba(var(--border-rgb), 0.22)`,
                      boxShadow: isActive ? `0 0 10px rgba(var(--accent-rgb), 0.2)` : "none",
                    }}
                  >
                    {initial}
                  </div>
                )}
                <span className="truncate text-xs">{peer}</span>
              </div>
              {unread > 0 && (
                <span
                  className="badge-pulse ml-1 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
                  style={{ background: "var(--badge-bg)", color: "var(--text)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  label, isWh40k, action,
}: {
  label: string;
  isWh40k: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between flex-shrink-0 px-3.5${isWh40k ? " terminal-section-hdr" : ""}`}
      style={{
        paddingTop: "9px",
        paddingBottom: "7px",
        borderTop: isWh40k ? undefined : `1px solid rgba(var(--border-rgb), 0.1)`,
        borderBottom: isWh40k ? undefined : `1px solid rgba(var(--border-rgb), 0.1)`,
      }}
    >
      <span
        style={{
          fontSize: isWh40k ? "10px" : "9px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: isWh40k ? "0.18em" : "0.12em",
          textTransform: "uppercase",
          color: `rgba(var(--accent-rgb), ${isWh40k ? "0.65" : "0.42"})`,
          textShadow: "none",
        }}
      >
        {isWh40k ? `\u2550 ${label} \u2550` : label}
      </span>
      {action}
    </div>
  );
}
