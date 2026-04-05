"use client";

/**
 * Client-side cache of messages sent by the current user.
 * Used to recover own message text from history after a page reload,
 * since sent messages are encrypted and the sender key chain is ephemeral.
 */

import type { ReplyPreview } from "./types";

const STORAGE_KEY = "sent-messages-v1";
const MAX_ENTRIES = 300;

export type CachedSent = {
  msgId: string;
  text: string;
  time: string;
  replyTo?: ReplyPreview;
};

function load(): CachedSent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CachedSent[];
  } catch {
    return [];
  }
}

function save(entries: CachedSent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function cacheSentMessage(entry: CachedSent) {
  const entries = load();
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  save(entries);
}

export function getSentMessage(msgId: string): CachedSent | null {
  return load().find((e) => e.msgId === msgId) ?? null;
}
