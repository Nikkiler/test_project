"use client";

/**
 * Signal Protocol sender key mechanism.
 *
 * Implements the Sender Key ratchet for group/1:1 E2E encryption:
 * - Each sender maintains a chain key that ratchets forward with every message.
 * - Message keys are derived from the chain key via HMAC.
 * - Ciphertexts are signed with an ECDSA signing key for authentication.
 * - Sender Key Distribution Messages (SKDMs) distribute the initial state
 *   to recipients using ECDH + HKDF key wrapping.
 */

import type { EncryptedEnvelope, SenderKeyDistribution } from "@/lib/types";
import {
  generateSigningKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importSigningPublicKey,
  importSigningPrivateKey,
  importPublicKey,
  importPrivateKey,
  generateECDHKeyPair,
  ecdhBits,
  aesEncrypt,
  aesDecrypt,
  ecdsaSign,
  ecdsaVerify,
  hmac,
  hkdf,
  toB64,
  fromB64,
} from "@/lib/crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SenderKeyState = {
  chainKey: string; // base64-encoded 32-byte chain key
  iteration: number;
  signingPublicKey: string; // base64-encoded SPKI
  signingPrivateKey?: string; // base64-encoded PKCS8 (only present for own keys)
};

// ─── State generation ───────────────────────────────────────────────────────

export async function generateSenderKeyState(): Promise<SenderKeyState> {
  const chainKeyBuf = crypto.getRandomValues(new Uint8Array(32));
  const signingPair = await generateSigningKeyPair();
  return {
    chainKey: toB64(chainKeyBuf.buffer),
    iteration: 0,
    signingPublicKey: await exportPublicKey(signingPair.publicKey),
    signingPrivateKey: await exportPrivateKey(signingPair.privateKey),
  };
}

// ─── Chain ratchet helpers ──────────────────────────────────────────────────

async function deriveMessageKey(chainKey: ArrayBuffer): Promise<ArrayBuffer> {
  return hmac(chainKey, new Uint8Array([0x01]));
}

async function advanceChainKey(chainKey: ArrayBuffer): Promise<ArrayBuffer> {
  return hmac(chainKey, new Uint8Array([0x02]));
}

// ─── Encrypt ────────────────────────────────────────────────────────────────

export async function senderEncrypt(
  state: SenderKeyState,
  plaintext: string
): Promise<{ envelope: EncryptedEnvelope; nextState: SenderKeyState }> {
  const chainKeyBuf = fromB64(state.chainKey).buffer;
  const messageKey = await deriveMessageKey(chainKeyBuf);
  const nextChainKey = await advanceChainKey(chainKeyBuf);

  const ciphertext = await aesEncrypt(
    messageKey,
    new TextEncoder().encode(plaintext)
  );

  const signingPriv = await importSigningPrivateKey(state.signingPrivateKey!);
  const signature = await ecdsaSign(signingPriv, fromB64(ciphertext));

  const envelope: EncryptedEnvelope = {
    ciphertext,
    iteration: state.iteration,
    signingKey: state.signingPublicKey,
    signature,
  };

  const nextState: SenderKeyState = {
    chainKey: toB64(nextChainKey),
    iteration: state.iteration + 1,
    signingPublicKey: state.signingPublicKey,
    signingPrivateKey: state.signingPrivateKey,
  };

  return { envelope, nextState };
}

// ─── Decrypt ────────────────────────────────────────────────────────────────

export async function senderDecrypt(
  state: SenderKeyState,
  envelope: EncryptedEnvelope
): Promise<{ plaintext: string; nextState: SenderKeyState }> {
  // Fast-forward the chain if needed
  let chainKeyBuf = fromB64(state.chainKey).buffer;
  let currentIteration = state.iteration;

  while (currentIteration < envelope.iteration) {
    chainKeyBuf = await advanceChainKey(chainKeyBuf);
    currentIteration++;
  }

  const messageKey = await deriveMessageKey(chainKeyBuf);
  const nextChainKey = await advanceChainKey(chainKeyBuf);

  // Verify signature
  const signingPub = await importSigningPublicKey(envelope.signingKey);
  const valid = await ecdsaVerify(
    signingPub,
    envelope.signature,
    fromB64(envelope.ciphertext)
  );
  if (!valid) throw new Error("Invalid signature");

  // Decrypt
  const ptBytes = await aesDecrypt(messageKey, envelope.ciphertext);
  const plaintext = new TextDecoder().decode(ptBytes);

  const nextState: SenderKeyState = {
    chainKey: toB64(nextChainKey),
    iteration: currentIteration + 1,
    signingPublicKey: state.signingPublicKey,
    signingPrivateKey: state.signingPrivateKey,
  };

  return { plaintext, nextState };
}

// ─── Sender Key Distribution Message (SKDM) ────────────────────────────────

export async function createDistribution(
  state: SenderKeyState,
  senderIdPriv: CryptoKey,
  senderIdPub: string,
  recipientIdPub: string
): Promise<SenderKeyDistribution> {
  const recipientPubKey = await importPublicKey(recipientIdPub);

  // DH1: sender identity private × recipient identity public
  const dh1 = await ecdhBits(senderIdPriv, recipientPubKey);

  // Generate ephemeral ECDH pair
  const ephemeralPair = await generateECDHKeyPair();
  const ephemeralPublicKey = await exportPublicKey(ephemeralPair.publicKey);

  // DH2: ephemeral private × recipient identity public
  const dh2 = await ecdhBits(ephemeralPair.privateKey, recipientPubKey);

  // Concatenate DH1 || DH2
  const combined = new Uint8Array(dh1.byteLength + dh2.byteLength);
  combined.set(new Uint8Array(dh1), 0);
  combined.set(new Uint8Array(dh2), dh1.byteLength);

  // Derive wrapping key via HKDF
  const salt = new Uint8Array(32); // zeros
  const wrappingKey = await hkdf(
    combined.buffer,
    salt,
    "signal-skdm-v1",
    32
  );

  // Serialize state without signingPrivateKey
  const stateToSend: SenderKeyState = {
    chainKey: state.chainKey,
    iteration: state.iteration,
    signingPublicKey: state.signingPublicKey,
  };
  const statePlain = new TextEncoder().encode(JSON.stringify(stateToSend));

  // AES-256-GCM encrypt the serialized state
  const encryptedState = await aesEncrypt(wrappingKey, statePlain);

  return {
    ephemeralPublicKey,
    senderIdentityKey: senderIdPub,
    encryptedState,
  };
}

export async function decryptDistribution(
  dist: SenderKeyDistribution,
  recipientIdPriv: CryptoKey
): Promise<SenderKeyState> {
  const senderIdPub = await importPublicKey(dist.senderIdentityKey);
  const ephemeralPub = await importPublicKey(dist.ephemeralPublicKey);

  // DH1: recipient identity private × sender identity public
  const dh1 = await ecdhBits(recipientIdPriv, senderIdPub);

  // DH2: recipient identity private × ephemeral public
  const dh2 = await ecdhBits(recipientIdPriv, ephemeralPub);

  // Concatenate DH1 || DH2
  const combined = new Uint8Array(dh1.byteLength + dh2.byteLength);
  combined.set(new Uint8Array(dh1), 0);
  combined.set(new Uint8Array(dh2), dh1.byteLength);

  // Derive wrapping key via HKDF
  const salt = new Uint8Array(32); // zeros
  const wrappingKey = await hkdf(
    combined.buffer,
    salt,
    "signal-skdm-v1",
    32
  );

  // AES-256-GCM decrypt
  const ptBytes = await aesDecrypt(wrappingKey, dist.encryptedState);
  const state = JSON.parse(new TextDecoder().decode(ptBytes)) as SenderKeyState;

  return state;
}
