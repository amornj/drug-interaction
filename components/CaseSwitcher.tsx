"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

type ChipMenu = { caseId: string; x: number; y: number };

const LONG_PRESS_MS = 500;

export function CaseSwitcher({
  onManageAliases,
  onManageInteractions,
}: {
  onManageAliases: () => void;
  onManageInteractions: () => void;
}) {
  const cases = useStore((s) => s.cases);
  const activeCaseId = useStore((s) => s.activeCaseId);
  const selectCase = useStore((s) => s.selectCase);
  const addCase = useStore((s) => s.addCase);
  const renameCase = useStore((s) => s.renameCase);
  const removeCase = useStore((s) => s.removeCase);

  const [menuOpen, setMenuOpen] = useState(false);
  const [chipMenu, setChipMenu] = useState<ChipMenu | null>(null);

  const pressTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const active = cases.find((c) => c.id === activeCaseId);
  const chipMenuCase = chipMenu
    ? cases.find((c) => c.id === chipMenu.caseId)
    : null;

  function clearPressTimer() {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  function openChipMenu(caseId: string, x: number, y: number) {
    const clampedX = Math.min(Math.max(x, 12), window.innerWidth - 172);
    const clampedY = Math.min(Math.max(y, 12), window.innerHeight - 140);
    setChipMenu({ caseId, x: clampedX, y: clampedY });
  }

  function startPress(
    caseId: string,
    point: { clientX: number; clientY: number }
  ) {
    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      openChipMenu(caseId, point.clientX, point.clientY);
    }, LONG_PRESS_MS);
  }

  useEffect(() => () => clearPressTimer(), []);

  useEffect(() => {
    if (!chipMenu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setChipMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chipMenu]);

  function renameFlow(caseId: string) {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;
    const next = window.prompt("Rename case", target.label);
    if (next && next.trim()) renameCase(caseId, next.trim());
  }

  function deleteFlow(caseId: string) {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;
    const ok = window.confirm(
      `Delete "${target.label}"? Medications and PGx selections for this case will be removed.`
    );
    if (ok) removeCase(caseId);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-baseline gap-5">
          {cases.map((c) => {
            const isActive = c.id === activeCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  selectCase(c.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openChipMenu(c.id, e.clientX, e.clientY);
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  startPress(c.id, { clientX: e.clientX, clientY: e.clientY });
                }}
                onMouseUp={clearPressTimer}
                onMouseLeave={clearPressTimer}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (!t) return;
                  startPress(c.id, { clientX: t.clientX, clientY: t.clientY });
                }}
                onTouchEnd={clearPressTimer}
                onTouchMove={clearPressTimer}
                onTouchCancel={clearPressTimer}
                style={{ WebkitTouchCallout: "none" }}
                className={[
                  "shrink-0 select-none pb-1.5 text-[13px] tracking-[0.04em] transition-colors",
                  "border-b-[1.5px]",
                  isActive
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-mute hover:text-ink-soft",
                ].join(" ")}
                title="Tap to switch · long-press or right-click for options"
              >
                <span className={isActive ? "font-medium" : ""}>{c.label}</span>
                {isActive ? (
                  <span className="ml-1.5 font-mono text-[10.5px] tabular-nums text-accent">
                    · {c.drugs.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="More actions"
          className="h-9 w-9 grid place-items-center rounded-full border border-rule text-ink-soft hover:text-ink hover:border-rule-strong"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
            <path
              d="M5 10a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm5 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm5 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
              fill="currentColor"
            />
          </svg>
        </button>
        {menuOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-md border border-rule-strong bg-paper-raised shadow-xl">
            <button
              type="button"
              onClick={() => {
                if (!active) return addCase();
                setMenuOpen(false);
                renameFlow(active.id);
              }}
              className="block min-h-11 w-full border-b border-rule px-4 py-2.5 text-left text-[13px] text-ink hover:bg-surface"
            >
              Rename current case
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onManageAliases();
              }}
              className="block min-h-11 w-full border-b border-rule px-4 py-2.5 text-left text-[13px] text-ink hover:bg-surface"
            >
              Manage aliases
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onManageInteractions();
              }}
              className="block min-h-11 w-full border-b border-rule px-4 py-2.5 text-left text-[13px] text-ink hover:bg-surface"
            >
              Manage interactions
            </button>
            {active ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  deleteFlow(active.id);
                }}
                className="block min-h-11 w-full px-4 py-2.5 text-left text-[13px] text-accent hover:bg-accent-soft"
              >
                Delete current case
              </button>
            ) : null}
            <p className="border-t border-rule px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-ink-mute">
              Long-press or right-click a case for quick actions
            </p>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={addCase}
        aria-label="New case"
        className="h-9 w-9 grid place-items-center rounded-full border border-rule text-ink-soft hover:text-ink hover:border-rule-strong"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {chipMenu && chipMenuCase ? (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setChipMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setChipMenu(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ top: chipMenu.y, left: chipMenu.x }}
            className="absolute w-44 overflow-hidden rounded-md border border-rule-strong bg-paper-raised shadow-xl"
            role="menu"
          >
            <p className="truncate border-b border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              {chipMenuCase.label}
            </p>
            <button
              type="button"
              onClick={() => {
                const id = chipMenu.caseId;
                setChipMenu(null);
                renameFlow(id);
              }}
              className="block min-h-11 w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-surface"
              role="menuitem"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                const id = chipMenu.caseId;
                setChipMenu(null);
                deleteFlow(id);
              }}
              className="block min-h-11 w-full px-3 py-2 text-left text-[13px] text-accent hover:bg-accent-soft"
              role="menuitem"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
