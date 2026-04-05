"use client";

/**
 * useE2E — React hook that manages Signal Protocol state for the current user.
 *
 * Encrypts/decrypts MessageContent objects (text + optional reply preview)
 * using the Sender Key ratchet. Identity keys are persisted to localStorage.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  generateECDHKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
} from "@/lib/crypto";
import {
  generateSenderKeyState,
  senderEncrypt,
  senderDecrypt,
  createDistribution,
  decryptDistribution,
  type SenderKeyState,
} from "@/lib/senderKey";
import type { EncryptedEnvelope, SenderKeyDistribution, ReplyPreview } from "@/lib/types";

// ─── Message content (encrypted payload) ────────────────────────────────────

export interface MessageContent {
  text: string;
  replyTo?: ReplyPreview;
}

// ─── Identity key persistence ────────────────────────────────────────────────

async function loadOrCreateIdentity(
  username: string
): Promise<{ publicKey: string; privateKey: string }> {
  const stored = localStorage.getItem(`e2e.identity.${username}`);
  if (stored) return JSON.parse(stored) as { publicKey: string; privateKey: string };
  const pair = await generateECDHKeyPair();
  const identity = {
    publicKey: await exportPublicKey(pair.publicKey),
    privateKey: await exportPrivateKey(pair.privateKey),
  };
  localStorage.setItem(`e2e.identity.${username}`, JSON.stringify(identity));
  return identity;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface E2EHandle {
  ready: boolean;
  encrypt(room: string, content: MessageContent): Promise<EncryptedEnvelope>;
  decrypt(sender: string, room: string, envelope: EncryptedEnvelope): Promise<MessageContent | null>;
  receiveDistribution(from: string, room: string, payload: SenderKeyDistribution): Promise<void>;
  distributeKeyTo(room: string, recipientUsername: string): Promise<void>;
}

export function useE2E(username: string): E2EHandle {
  const [ready, setReady] = useState(false);

  const identityRef = useRef<{ publicKey: string; privateKey: string } | null>(null);
  const mySenderKeys = useRef(new Map<string, SenderKeyState>());
  const peerSenderKeys = useRef(new Map<string, SenderKeyState>());

  useEffect(() => {
    if (!username) return;
    let active = true;
    (async () => {
      const identity = await loadOrCreateIdentity(username);
      if (!active) return;
      identityRef.current = identity;
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: identity.publicKey }),
      });
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [username]);

  const encrypt = useCallback(async (
    room: string,
    content: MessageContent
  ): Promise<EncryptedEnvelope> => {
    let state = mySenderKeys.current.get(room);
    if (!state) {
      state = await generateSenderKeyState();
      mySenderKeys.current.set(room, state);
    }
    const { envelope, nextState } = await senderEncrypt(state, JSON.stringify(content));
    mySenderKeys.current.set(room, nextState);
    return envelope;
  }, []);

  const decrypt = useCallback(async (
    sender: string,
    room: string,
    envelope: EncryptedEnvelope
  ): Promise<MessageContent | null> => {
    const key = `${sender}:${room}`;
    const state = peerSenderKeys.current.get(key);
    if (!state) return null;
    try {
      const { plaintext, nextState } = await senderDecrypt(state, envelope);
      peerSenderKeys.current.set(key, nextState);
      return JSON.parse(plaintext) as MessageContent;
    } catch {
      return null;
    }
  }, []);

  const receiveDistribution = useCallback(async (
    from: string,
    room: string,
    payload: SenderKeyDistribution
  ): Promise<void> => {
    if (!identityRef.current) return;
    const privateKey = await importPrivateKey(identityRef.current.privateKey);
    const state = await decryptDistribution(payload, privateKey);
    peerSenderKeys.current.set(`${from}:${room}`, state);
  }, []);

  const distributeKeyTo = useCallback(async (
    room: string,
    recipientUsername: string
  ): Promise<void> => {
    if (!identityRef.current) return;
    const res = await fetch(`/api/keys/${encodeURIComponent(recipientUsername)}`);
    if (!res.ok) return;
    const { publicKey: recipientPublicKey } = (await res.json()) as { publicKey: string };

    let state = mySenderKeys.current.get(room);
    if (!state) {
      state = await generateSenderKeyState();
      mySenderKeys.current.set(room, state);
    }

    const privateKey = await importPrivateKey(identityRef.current.privateKey);
    const distribution = await createDistribution(
      state,
      privateKey,
      identityRef.current.publicKey,
      recipientPublicKey
    );

    await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        room,
        type: "key_distribution",
        to: recipientUsername,
        payload: distribution,
      }),
    });
  }, [username]);

  return { ready, encrypt, decrypt, receiveDistribution, distributeKeyTo };
}
