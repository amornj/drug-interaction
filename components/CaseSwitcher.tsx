"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

type ChipMenu = { caseId: string; x: number; y: number };

const LONG_PRESS_MS = 500;

export function CaseSwitcher({
  onManageAliases,
}: {
  onManageAliases: () => void;
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
      `Delete "${target.label}"? Medications, modifiers, and PGx selections for this case will be removed.`
    );
    if (ok) removeCase(caseId);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2">
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
                  "shrink-0 select-none px-3 h-9 rounded-full text-sm font-medium",
                  isActive
                    ? "bg-sky-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300",
                ].join(" ")}
                title="Tap to switch · long-press or right-click for options"
              >
                {c.label}
                {isActive ? ` · ${c.drugs.length}` : ""}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!active) return addCase();
          renameFlow(active.id);
        }}
        className="h-9 px-3 rounded-full text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      >
        Rename
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="More actions"
          className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
            <path
              d="M5 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
              fill="currentColor"
            />
          </svg>
        </button>
        {menuOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onManageAliases();
              }}
              className="block min-h-11 w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Manage aliases
            </button>
            {active ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  deleteFlow(active.id);
                }}
                className="block min-h-11 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Delete current case
              </button>
            ) : null}
            <p className="border-t border-zinc-200 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800">
              Tip: long-press a case chip (or right-click) to rename or delete.
            </p>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={addCase}
        aria-label="New case"
        className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="2"
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
            className="absolute w-40 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            role="menu"
          >
            <p className="truncate border-b border-zinc-200 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800">
              {chipMenuCase.label}
            </p>
            <button
              type="button"
              onClick={() => {
                const id = chipMenu.caseId;
                setChipMenu(null);
                renameFlow(id);
              }}
              className="block min-h-11 w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
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
              className="block min-h-11 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
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
