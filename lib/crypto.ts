"use client";

/**
 * Web Crypto API wrappers for ECDH, ECDSA, AES-256-GCM, HKDF, and HMAC.
 */

const subtle = globalThis.crypto?.subtle;

// ─── Helpers: base64 ↔ ArrayBuffer ──────────────────────────────────────────

export function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const ab = new ArrayBuffer(bin.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return view;
}

// ─── Key generation ─────────────────────────────────────────────────────────

export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
}

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
}

// ─── Key export ─────────────────────────────────────────────────────────────

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const buf = await subtle.exportKey("spki", key);
  return toB64(buf);
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const buf = await subtle.exportKey("pkcs8", key);
  return toB64(buf);
}

// ─── Key import (ECDH) ─────────────────────────────────────────────────────

export async function importPublicKey(b64: string): Promise<CryptoKey> {
  return subtle.importKey(
    "spki",
    fromB64(b64).buffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function importPrivateKey(b64: string): Promise<CryptoKey> {
  return subtle.importKey(
    "pkcs8",
    fromB64(b64).buffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

// ─── Key import (ECDSA) ─────────────────────────────────────────────────────

export async function importSigningPublicKey(b64: string): Promise<CryptoKey> {
  return subtle.importKey(
    "spki",
    fromB64(b64).buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

export async function importSigningPrivateKey(b64: string): Promise<CryptoKey> {
  return subtle.importKey(
    "pkcs8",
    fromB64(b64).buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}

// ─── ECDH ───────────────────────────────────────────────────────────────────

export async function ecdhBits(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  return subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256 // 32 bytes
  );
}

// ─── AES-256-GCM ────────────────────────────────────────────────────────────

export async function aesEncrypt(
  key: ArrayBuffer,
  plaintext: Uint8Array<ArrayBuffer>
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await subtle.importKey("raw", key, "AES-GCM", false, [
    "encrypt",
  ]);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext);
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return toB64(combined.buffer);
}

export async function aesDecrypt(
  key: ArrayBuffer,
  ciphertext: string
): Promise<Uint8Array<ArrayBuffer>> {
  const data = fromB64(ciphertext);
  const iv = new Uint8Array(data.buffer, 0, 12);
  const ct = new Uint8Array(data.buffer, 12);
  const aesKey = await subtle.importKey("raw", key, "AES-GCM", false, [
    "decrypt",
  ]);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  return new Uint8Array(pt);
}

// ─── ECDSA ──────────────────────────────────────────────────────────────────

export async function ecdsaSign(
  privateKey: CryptoKey,
  data: Uint8Array<ArrayBuffer>
): Promise<string> {
  const sig = await subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    data
  );
  return toB64(sig);
}

export async function ecdsaVerify(
  publicKey: CryptoKey,
  signature: string,
  data: Uint8Array<ArrayBuffer>
): Promise<boolean> {
  return subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    fromB64(signature),
    data
  );
}

// ─── HKDF ───────────────────────────────────────────────────────────────────

export async function hkdf(
  ikm: ArrayBuffer,
  salt: Uint8Array<ArrayBuffer>,
  info: string,
  length: number
): Promise<ArrayBuffer> {
  const key = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: new TextEncoder().encode(info),
    },
    key,
    length * 8
  );
}

// ─── HMAC-SHA-256 ───────────────────────────────────────────────────────────

export async function hmac(
  key: ArrayBuffer,
  data: Uint8Array<ArrayBuffer>
): Promise<ArrayBuffer> {
  const hmacKey = await subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return subtle.sign("HMAC", hmacKey, data);
}
