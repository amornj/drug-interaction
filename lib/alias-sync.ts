"use client";

import { get as idbGet, set as idbSet } from "idb-keyval";
import {
  activeAliases,
  loadStoredAliases,
  loadUserAliases,
  mergeAliasRecords,
  replaceStoredAliases,
} from "@/lib/aliases";
import {
  decryptAliasBundle,
  encryptAliasBundle,
  type EncryptedAliasBundle,
} from "@/lib/alias-sync-crypto";

export type AliasSyncConfig = {
  syncId: string;
  deviceName: string;
  passphrase: string;
  autoSync: boolean;
  lastBackupAt?: string;
  lastRestoreAt?: string;
  lastSyncedAt?: string;
  lastRemoteUpdatedAt?: string;
};

export const ALIAS_SYNC_STORAGE_KEY = "di.aliasSync.v1";

type RecoveryPayload = {
  version: 1;
  app: "drug-interaction";
  syncId: string;
};

function newSyncId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2);
}

export function createAliasSyncConfig(
  partial: Partial<AliasSyncConfig> & Pick<AliasSyncConfig, "deviceName" | "passphrase">
) {
  return {
    syncId: partial.syncId ?? newSyncId(),
    deviceName: partial.deviceName.trim(),
    passphrase: partial.passphrase,
    autoSync: partial.autoSync ?? true,
    lastBackupAt: partial.lastBackupAt,
    lastRestoreAt: partial.lastRestoreAt,
    lastSyncedAt: partial.lastSyncedAt,
    lastRemoteUpdatedAt: partial.lastRemoteUpdatedAt,
  } satisfies AliasSyncConfig;
}

export async function loadAliasSyncConfig() {
  try {
    return ((await idbGet(ALIAS_SYNC_STORAGE_KEY)) as AliasSyncConfig | null) ?? null;
  } catch {
    return null;
  }
}

export async function saveAliasSyncConfig(config: AliasSyncConfig) {
  await idbSet(ALIAS_SYNC_STORAGE_KEY, config);
  return config;
}

export function buildRecoveryKey(config: Pick<AliasSyncConfig, "syncId">) {
  const payload: RecoveryPayload = {
    version: 1,
    app: "drug-interaction",
    syncId: config.syncId,
  };
  return JSON.stringify(payload);
}

export function parseRecoveryKey(value: string) {
  const parsed = JSON.parse(value) as RecoveryPayload;
  if (parsed.app !== "drug-interaction" || parsed.version !== 1 || !parsed.syncId) {
    throw new Error("Invalid recovery key");
  }
  return parsed;
}

async function fetchRemoteBundle(syncId: string) {
  const response = await fetch(`/api/aliases/backup/${encodeURIComponent(syncId)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to fetch alias backup");
  }
  return (await response.json()) as EncryptedAliasBundle;
}

async function uploadRemoteBundle(syncId: string, bundle: EncryptedAliasBundle) {
  const response = await fetch(`/api/aliases/backup/${encodeURIComponent(syncId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to upload alias backup");
  }
  return (await response.json()) as { updatedAt: string };
}

export async function backupAliasesToRemote(config: AliasSyncConfig) {
  const storedAliases = await loadStoredAliases();
  const bundle = await encryptAliasBundle({
    aliases: storedAliases,
    deviceName: config.deviceName,
    passphrase: config.passphrase,
  });
  const uploaded = await uploadRemoteBundle(config.syncId, bundle);
  const nextConfig = await saveAliasSyncConfig({
    ...config,
    lastBackupAt: uploaded.updatedAt,
    lastRemoteUpdatedAt: uploaded.updatedAt,
    lastSyncedAt: uploaded.updatedAt,
  });
  return {
    config: nextConfig,
    aliases: activeAliases(storedAliases),
  };
}

export async function restoreAliasesFromRemote(config: AliasSyncConfig) {
  const remoteBundle = await fetchRemoteBundle(config.syncId);
  if (!remoteBundle) {
    throw new Error("No remote alias backup found");
  }

  const remotePlaintext = await decryptAliasBundle({
    bundle: remoteBundle,
    passphrase: config.passphrase,
  });
  const localAliases = await loadStoredAliases();
  const mergedAliases = mergeAliasRecords(localAliases, remotePlaintext.aliases);
  const restoredAliases = await replaceStoredAliases(mergedAliases);
  const nextConfig = await saveAliasSyncConfig({
    ...config,
    lastRestoreAt: remotePlaintext.updatedAt,
    lastRemoteUpdatedAt: remotePlaintext.updatedAt,
    lastSyncedAt: new Date().toISOString(),
  });

  return {
    aliases: restoredAliases,
    config: nextConfig,
  };
}

export async function syncAliasesWithRemote(config: AliasSyncConfig) {
  const localAliases = await loadStoredAliases();
  const remoteBundle = await fetchRemoteBundle(config.syncId);

  if (!remoteBundle) {
    return backupAliasesToRemote(config);
  }

  const remotePlaintext = await decryptAliasBundle({
    bundle: remoteBundle,
    passphrase: config.passphrase,
  });

  const mergedAliases = mergeAliasRecords(localAliases, remotePlaintext.aliases);
  const persistedAliases = await replaceStoredAliases(mergedAliases);
  const encryptedBundle = await encryptAliasBundle({
    aliases: mergedAliases,
    deviceName: config.deviceName,
    passphrase: config.passphrase,
  });
  const uploaded = await uploadRemoteBundle(config.syncId, encryptedBundle);
  const nextConfig = await saveAliasSyncConfig({
    ...config,
    lastRemoteUpdatedAt: uploaded.updatedAt,
    lastSyncedAt: uploaded.updatedAt,
  });

  return {
    aliases: persistedAliases,
    config: nextConfig,
  };
}

export async function refreshAliasesFromDisk() {
  return loadUserAliases();
}
