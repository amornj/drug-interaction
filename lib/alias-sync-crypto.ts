"use client";

import { z } from "zod";
import type { Alias } from "@/lib/aliases";

export const encryptedAliasBundleSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().min(1),
  deviceName: z.string().min(1),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  salt: z.string().min(1),
});

export type EncryptedAliasBundle = z.infer<typeof encryptedAliasBundleSchema>;

type AliasPlaintextBundle = {
  aliases: Alias[];
  updatedAt: string;
  deviceName: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function asArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 250000,
      salt: asArrayBuffer(salt),
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAliasBundle({
  aliases,
  deviceName,
  passphrase,
}: {
  aliases: Alias[];
  deviceName: string;
  passphrase: string;
}): Promise<EncryptedAliasBundle> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const updatedAt = new Date().toISOString();

  const plaintext: AliasPlaintextBundle = {
    aliases,
    updatedAt,
    deviceName,
  };

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: asArrayBuffer(iv),
    },
    key,
    asArrayBuffer(new TextEncoder().encode(JSON.stringify(plaintext)))
  );

  return {
    version: 1,
    updatedAt,
    deviceName,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  };
}

export async function decryptAliasBundle({
  bundle,
  passphrase,
}: {
  bundle: EncryptedAliasBundle;
  passphrase: string;
}) {
  const validated = encryptedAliasBundleSchema.parse(bundle);
  const salt = base64ToBytes(validated.salt);
  const iv = base64ToBytes(validated.iv);
  const ciphertext = base64ToBytes(validated.ciphertext);
  const key = await deriveKey(passphrase, salt);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: asArrayBuffer(iv),
    },
    key,
    asArrayBuffer(ciphertext)
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as AliasPlaintextBundle;
}
