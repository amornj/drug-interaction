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
  onManualSync,
}: {
  open: boolean;
  aliases: Alias[];
  syncConfig: AliasSyncConfig | null;
  syncStatus: string | null;
  onClose: () => void;
  onAliasesChange: (aliases: Alias[]) => void;
  onSyncConfigChange: (config: AliasSyncConfig | null) => void;
  onSyncStatusChange: (status: string | null) => void;
  onManualSync: () => Promise<void>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState(syncConfig?.deviceName ?? "");
  const [passphrase, setPassphrase] = useState(syncConfig?.passphrase ?? "");
  const [syncId, setSyncId] = useState(syncConfig?.syncId ?? "");
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
        autoSync: false,
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
          autoSync: false,
        });
      const persistedConfig = await saveAliasSyncConfig(baseConfig);
      onSyncConfigChange(persistedConfig);
      const result = await backupAliasesToRemote(persistedConfig);
      onSyncConfigChange(result.config);
      setRecoveryKey(buildRecoveryKey(result.config));
      onSyncStatusChange(
        `Backed up · ${new Date(result.config.lastBackupAt ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      );
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
          autoSync: false,
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
      onSyncStatusChange(
        `Restored · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      );
      setMessage(`Restored ${restored.aliases.length} aliases from backup.`);
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

  const fieldInput =
    "mt-1 h-11 w-full border border-rule bg-paper-raised px-3 font-mono text-[13px] text-ink outline-none focus:border-accent";
  const smallButton =
    "min-h-11 border border-rule px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/60 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-xl border border-rule-strong bg-paper p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
          <div>
            <p className="eyebrow text-accent">Alias Database</p>
            <h2 className="serif-display mt-1 text-[24px] text-ink">
              Personal <span className="italic">dictionary</span>
            </h2>
            <p className="mt-1 text-[12px] italic text-ink-mute">
              Local first. Overrides the curated brand overlay on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[42vh] overflow-y-auto border border-rule">
          {aliases.length > 0 ? (
            aliases.map((alias, index) => (
              <div
                key={alias.term}
                className="flex items-baseline gap-3 border-b border-rule px-3 py-3 last:border-b-0"
              >
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-mute">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[16px] italic text-ink">
                    {alias.term}
                  </p>
                  <p className="stamp mt-0.5">
                    {alias.components.map((c) => c.name).join(" + ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAlias(alias.term)}
                  className="text-[11px] uppercase tracking-[0.12em] text-ink-mute hover:text-accent"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-[12px] italic text-ink-mute">
              No saved aliases yet.
            </p>
          )}
        </div>

        {(message || syncStatus) ? (
          <p className="stamp mt-3">
            {message ?? syncStatus}
          </p>
        ) : null}

        <div className="mt-5 border border-rule p-3">
          <p className="eyebrow">Encrypted Cross-Device Backup</p>
          <p className="mt-1 text-[11.5px] italic text-ink-mute">
            Aliases only. Encrypted in-browser before upload. Runs on press, never
            automatic.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="stamp block">
              Device name
              <input
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                className={fieldInput}
              />
            </label>
            <label className="stamp block">
              Sync ID
              <input
                value={syncId}
                onChange={(event) => setSyncId(event.target.value)}
                className={fieldInput}
              />
            </label>
            <label className="stamp block sm:col-span-2">
              Passphrase
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                className={fieldInput}
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveSyncSetup}
              disabled={busy}
              className={smallButton}
            >
              Save setup
            </button>
            <button
              type="button"
              onClick={backupNow}
              disabled={busy}
              className={smallButton}
            >
              Backup now
            </button>
            <button
              type="button"
              onClick={restoreNow}
              disabled={busy}
              className={smallButton}
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => void onManualSync()}
              disabled={busy || !syncConfig}
              className={smallButton}
            >
              Sync
            </button>
          </div>

          <label className="stamp mt-3 block">
            Recovery key
            <textarea
              value={recoveryKey}
              onChange={(event) => setRecoveryKey(event.target.value)}
              rows={2}
              className="mt-1 w-full border border-rule bg-paper-raised px-3 py-2 font-mono text-[12px] text-ink outline-none focus:border-accent"
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
              className={smallButton}
            >
              Export key
            </button>
            <button
              type="button"
              onClick={importRecoveryKey}
              className={smallButton}
            >
              Import key
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-rule pt-4">
          <button
            type="button"
            onClick={exportJson}
            className={smallButton}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={smallButton}
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
