"use client";

import { useRef, useState } from "react";
import {
  backupAliasesToRemote,
  buildRecoveryKey,
  createAliasSyncConfig,
  parseRecoveryKey,
  restoreAliasesFromRemote,
  saveAliasSyncConfig,
  type AliasSyncConfig,
} from "@/lib/alias-sync";
import type { Alias } from "@/lib/aliases";
import { removeUserAlias, saveUserAliases } from "@/lib/aliases";

export function AliasManagerModal({
  open,
  aliases,
  syncConfig,
  syncStatus,
  onClose,
  onAliasesChange,
  onSyncConfigChange,
  onSyncStatusChange,
  onBackgroundSync,
}: {
  open: boolean;
  aliases: Alias[];
  syncConfig: AliasSyncConfig | null;
  syncStatus: string | null;
  onClose: () => void;
  onAliasesChange: (aliases: Alias[]) => void;
  onSyncConfigChange: (config: AliasSyncConfig | null) => void;
  onSyncStatusChange: (status: string | null) => void;
  onBackgroundSync: () => Promise<void>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState(syncConfig?.deviceName ?? "");
  const [passphrase, setPassphrase] = useState(syncConfig?.passphrase ?? "");
  const [syncId, setSyncId] = useState(syncConfig?.syncId ?? "");
  const [autoSync, setAutoSync] = useState(syncConfig?.autoSync ?? true);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) {
    return null;
  }

  async function removeAlias(term: string) {
    const nextAliases = await removeUserAlias(term);
    onAliasesChange(nextAliases);
    setMessage(`Removed alias "${term}".`);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(aliases, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "drug-interaction-aliases.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Exported aliases JSON.");
  }

  async function importJson(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Alias[];
      const nextAliases = await saveUserAliases(
        parsed.map((alias) => ({
          ...alias,
          source: "user",
        }))
      );
      onAliasesChange(nextAliases);
      setMessage(`Imported ${nextAliases.length} aliases.`);
    } catch {
      setMessage("Could not import aliases JSON.");
    }
  }

  async function saveSyncSetup() {
    if (!deviceName.trim() || !passphrase.trim()) {
      setMessage("Device name and passphrase are required.");
      return;
    }

    const nextConfig = await saveAliasSyncConfig(
      createAliasSyncConfig({
        syncId: syncId.trim() || undefined,
        deviceName,
        passphrase,
        autoSync,
        lastBackupAt: syncConfig?.lastBackupAt,
        lastRestoreAt: syncConfig?.lastRestoreAt,
        lastRemoteUpdatedAt: syncConfig?.lastRemoteUpdatedAt,
        lastSyncedAt: syncConfig?.lastSyncedAt,
      })
    );

    onSyncConfigChange(nextConfig);
    setSyncId(nextConfig.syncId);
    setRecoveryKey(buildRecoveryKey(nextConfig));
    setMessage("Alias backup setup saved on this device.");
  }

  async function backupNow() {
    if (!syncConfig && (!deviceName.trim() || !passphrase.trim())) {
      setMessage("Save sync setup first.");
      return;
    }

    setBusy(true);
    try {
      const baseConfig =
        syncConfig ??
        createAliasSyncConfig({
          syncId: syncId.trim() || undefined,
          deviceName,
          passphrase,
          autoSync,
        });
      const persistedConfig = await saveAliasSyncConfig(baseConfig);
      onSyncConfigChange(persistedConfig);
      const result = await backupAliasesToRemote(persistedConfig);
      onSyncConfigChange(result.config);
      setRecoveryKey(buildRecoveryKey(result.config));
      onSyncStatusChange(`Backed up aliases at ${new Date(result.config.lastBackupAt ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
      setMessage("Encrypted alias backup uploaded.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Backup failed";
      onSyncStatusChange(text);
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  async function restoreNow() {
    const baseSyncId = syncId.trim();
    if (!baseSyncId || !deviceName.trim() || !passphrase.trim()) {
      setMessage("Sync ID, device name, and passphrase are required.");
      return;
    }

    setBusy(true);
    try {
      const persistedConfig = await saveAliasSyncConfig(
        createAliasSyncConfig({
          syncId: baseSyncId,
          deviceName,
          passphrase,
          autoSync,
          lastBackupAt: syncConfig?.lastBackupAt,
          lastRestoreAt: syncConfig?.lastRestoreAt,
          lastRemoteUpdatedAt: syncConfig?.lastRemoteUpdatedAt,
          lastSyncedAt: syncConfig?.lastSyncedAt,
        })
      );
      onSyncConfigChange(persistedConfig);
      const restored = await restoreAliasesFromRemote(persistedConfig);
      onAliasesChange(restored.aliases);
      onSyncConfigChange(restored.config);
      setRecoveryKey(buildRecoveryKey(restored.config));
      onSyncStatusChange(`Restored aliases at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
      setMessage(`Restored ${restored.aliases.length} aliases from encrypted backup.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Restore failed";
      onSyncStatusChange(text);
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  function importRecoveryKey() {
    try {
      const parsed = parseRecoveryKey(recoveryKey);
      setSyncId(parsed.syncId);
      setMessage("Recovery key loaded.");
    } catch {
      setMessage("Could not parse recovery key.");
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 px-4 py-6">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-4 shadow-xl dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Alias database
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              User aliases stay local first and override the curated brand overlay on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl px-3 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {aliases.length > 0 ? (
            aliases.map((alias) => (
              <div
                key={alias.term}
                className="rounded-2xl border border-zinc-200/80 px-3 py-3 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {alias.term}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {alias.components.map((component) => component.name).join(" + ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAlias(alias.term)}
                    className="min-h-11 rounded-xl px-3 text-xs font-medium text-red-600 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 px-3 py-4 text-sm text-zinc-500 dark:border-zinc-800">
              No saved aliases yet.
            </div>
          )}
        </div>

        {message ? (
          <p className="mt-3 text-xs text-zinc-500">{message}</p>
        ) : null}
        {syncStatus ? (
          <p className="mt-1 text-xs text-zinc-500">{syncStatus}</p>
        ) : null}

        <div className="mt-4 rounded-2xl border border-zinc-200/80 px-3 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Encrypted alias backup
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Aliases only. Case data and patient data are never uploaded. Backup is encrypted in the browser before upload.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Device name
              <input
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Sync ID
              <input
                value={syncId}
                onChange={(event) => setSyncId(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Passphrase
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(event) => setAutoSync(event.target.checked)}
            />
            Enable automatic background sync on this device
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveSyncSetup}
              disabled={busy}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Save sync setup
            </button>
            <button
              type="button"
              onClick={backupNow}
              disabled={busy}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Backup now
            </button>
            <button
              type="button"
              onClick={restoreNow}
              disabled={busy}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Restore from backup
            </button>
            <button
              type="button"
              onClick={onBackgroundSync}
              disabled={busy || !syncConfig}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Sync now
            </button>
          </div>

          <label className="mt-3 block text-xs text-zinc-500">
            Recovery key
            <textarea
              value={recoveryKey}
              onChange={(event) => setRecoveryKey(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!syncId.trim()) {
                  setMessage("Save sync setup first.");
                  return;
                }
                const nextRecoveryKey = buildRecoveryKey({ syncId: syncId.trim() });
                setRecoveryKey(nextRecoveryKey);
                navigator.clipboard.writeText(nextRecoveryKey).catch(() => {});
                setMessage("Recovery key copied.");
              }}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Export recovery key
            </button>
            <button
              type="button"
              onClick={importRecoveryKey}
              className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Import recovery key
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                importJson(file);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
