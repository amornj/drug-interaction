"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDrugMetabolismTags, getMetabolismReference } from "@/lib/cyp";
import {
  getOtherAcidDependentDrugs,
  getOtherChelationSusceptibleDrugs,
  isChelationSusceptible,
  isGastricAcidDependent,
} from "@/lib/drug-properties";
import type { Drug } from "@/lib/store";
import { useStore } from "@/lib/store";

export function DrugChip({
  drug,
  index,
  totalCount,
  activeReferenceSystem,
  onToggleReferenceSystem,
  isDragSource,
  isDropTarget,
  dropTargetIndex,
  onDragStart: onParentDragStart,
  onDragEnd: onParentDragEnd,
  onDragOverItem,
}: {
  drug: Drug;
  index: number;
  totalCount: number;
  activeReferenceSystem: string | null;
  onToggleReferenceSystem: (system: string) => void;
  isDragSource: boolean;
  isDropTarget: boolean;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onDragOverItem?: (index: number) => void;
  dropTargetIndex: number | null;
}) {
  const [activeProperty, setActiveProperty] = useState<
    "acid-dependent" | "chelation" | null
  >(null);

  const removeDrug = useStore((s) => s.removeDrug);
  const moveDrug = useStore((s) => s.moveDrug);
  const number = String(index + 1).padStart(2, "0");
  const tags = getDrugMetabolismTags(drug.name);
  const reference =
    activeReferenceSystem ? getMetabolismReference(activeReferenceSystem) : null;
  const showReference =
    reference &&
    (reference.inhibitors.length > 0 || reference.inducers.length > 0 || reference.substrates.length > 0);

  const liRef = useRef<HTMLLIElement>(null);
  const touchRef = useRef<{
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const touchMovedRef = useRef(false);

  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  const doMove = useCallback(
    (dir: -1 | 1) => {
      if (dir === -1 && canMoveUp) moveDrug(index, index - 1);
      if (dir === 1 && canMoveDown) moveDrug(index, index + 1);
    },
    [canMoveUp, canMoveDown, index, moveDrug]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (!isModifier) return;
      if (e.key === "ArrowUp" && canMoveUp) {
        e.preventDefault();
        doMove(-1);
      } else if (e.key === "ArrowDown" && canMoveDown) {
        e.preventDefault();
        doMove(1);
      }
    },
    [canMoveUp, canMoveDown, doMove]
  );

  /* Touch long-press drag */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchMovedRef.current = false;
      const t = e.touches[0];
      const timer = setTimeout(() => {
        setTouchDragging(true);
        touchMovedRef.current = true;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(20);
        }
        onParentDragStart?.(index);
      }, 400);
      touchRef.current = { x: t.clientX, y: t.clientY, timer };
    },
    [index, onParentDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10 && !touchDragging) {
        clearTimeout(touchRef.current.timer);
        touchRef.current = null;
        return;
      }
      if (touchDragging) {
        e.preventDefault();
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const chip = el?.closest<HTMLElement>("[data-drug-chip]");
        if (chip) {
          const targetIndex = parseInt(chip.dataset.index || "-1", 10);
          if (targetIndex >= 0 && targetIndex !== index) {
            onDragOverItem?.(targetIndex);
          }
        }
      }
    },
    [touchDragging, index, onDragOverItem]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchRef.current) {
      clearTimeout(touchRef.current.timer);
      touchRef.current = null;
    }
    if (touchDragging) {
      if (dropTargetIndex !== null && dropTargetIndex !== index) {
        moveDrug(index, dropTargetIndex);
      }
      setTouchDragging(false);
      onParentDragEnd?.();
    }
  }, [touchDragging, dropTargetIndex, index, moveDrug, onParentDragEnd]);

  useEffect(() => {
    return () => {
      if (touchRef.current) clearTimeout(touchRef.current.timer);
    };
  }, []);

  const dragging = isDragSource || touchDragging;

  return (
    <li
      ref={liRef}
      tabIndex={-1}
      data-drug-chip
      data-index={index}
      data-rxcui={drug.rxcui}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(index));
        e.dataTransfer.effectAllowed = "move";
        onParentDragStart?.(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverItem?.(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (!Number.isNaN(from) && from !== index) {
          moveDrug(from, index);
        }
        onParentDragEnd?.();
      }}
      onDragEnd={onParentDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      className={[
        "group border-b border-rule py-3 last:border-b-0 transition-opacity select-none",
        dragging ? "opacity-60" : "opacity-100",
        isDropTarget && !dragging ? "bg-accent-soft/30" : "",
        touchDragging ? "touch-none" : "",
      ].join(" ")}
      style={{
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      <div className="flex items-baseline gap-3">
        {/* Drag handle + number */}
        <span
          className="shrink-0 flex items-center gap-1.5"
          aria-hidden
        >
          <svg
            viewBox="0 0 12 12"
            width="12"
            height="12"
            className="text-ink-mute opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            aria-hidden
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" />
            <circle cx="6" cy="2" r="1" fill="currentColor" />
            <circle cx="10" cy="2" r="1" fill="currentColor" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="6" cy="6" r="1" fill="currentColor" />
            <circle cx="10" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="10" r="1" fill="currentColor" />
            <circle cx="6" cy="10" r="1" fill="currentColor" />
            <circle cx="10" cy="10" r="1" fill="currentColor" />
          </svg>
          <span className="font-mono text-[11px] tabular-nums text-ink-mute">
            {number}
          </span>
        </span>

        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] leading-snug text-ink">
            {drug.name}
          </p>
          {drug.viaBrand || tags.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.04em] text-ink-mute">
              {drug.viaBrand ? <span>via {drug.viaBrand}</span> : null}
              {isGastricAcidDependent(drug.name) ? (
                <button
                  key="acid-dependent"
                  type="button"
                  onClick={() =>
                    setActiveProperty((current) =>
                      current === "acid-dependent" ? null : "acid-dependent"
                    )
                  }
                  className={`border px-1.5 py-0.5 transition-colors ${
                    activeProperty === "acid-dependent"
                      ? "border-rule-strong bg-paper text-ink"
                      : "border-rule bg-surface text-ink-mute hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  Acid dependent
                </button>
              ) : null}
              {isChelationSusceptible(drug.name) ? (
                <button
                  key="chelation"
                  type="button"
                  onClick={() =>
                    setActiveProperty((current) =>
                      current === "chelation" ? null : "chelation"
                    )
                  }
                  className={`border px-1.5 py-0.5 transition-colors ${
                    activeProperty === "chelation"
                      ? "border-rule-strong bg-paper text-ink"
                      : "border-rule bg-surface text-ink-mute hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  Chelate prop
                </button>
              ) : null}
              {tags.map((tag) =>
                tag.clickable ? (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleReferenceSystem(tag.system)}
                    className={`border px-1.5 py-0.5 transition-colors ${
                      activeReferenceSystem === tag.system
                        ? "border-rule-strong bg-paper text-ink"
                        : "border-rule bg-surface text-ink-mute hover:border-rule-strong hover:text-ink"
                    }`}
                  >
                    {tag.label}
                  </button>
                ) : (
                  <span key={tag.id}>{tag.label}</span>
                )
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={`Remove ${drug.name}`}
          onClick={() => removeDrug(drug.rxcui)}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-full text-ink-mute transition-colors hover:bg-accent-soft hover:text-accent active:bg-accent-soft"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
            <path
              d="M5 5l10 10M15 5l-10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
      {showReference ? (
        <div className="mt-3 ml-8 border border-rule bg-paper-raised p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">{reference.system} modifiers</p>
              <p className="mt-1 text-[13px] italic leading-snug text-ink-mute">
                Inhibitors, inducers, and other substrates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleReferenceSystem(reference.system)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-rule text-[14px] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
              aria-label={`Close ${reference.system} modifier list`}
            >
              ×
            </button>
          </div>
          <div className="mt-3 max-h-[38vh] overflow-y-auto space-y-3">
            {reference.substrates.length > 0 ? (
              <div>
                <p className="eyebrow mb-1.5">Other substrates</p>
                <div className="flex flex-wrap gap-1.5">
                  {reference.substrates.map((item) => (
                    <span
                      key={`${reference.system}-sub-${item}`}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {reference.inhibitors.length > 0 ? (
              <div>
                <p className="eyebrow mb-1.5">Inhibitors</p>
                <div className="flex flex-wrap gap-1.5">
                  {reference.inhibitors.map((item) => (
                    <span
                      key={`${reference.system}-inh-${item}`}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {reference.inducers.length > 0 ? (
              <div>
                <p className="eyebrow mb-1.5">Inducers</p>
                <div className="flex flex-wrap gap-1.5">
                  {reference.inducers.map((item) => (
                    <span
                      key={`${reference.system}-ind-${item}`}
                      className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {activeProperty === "acid-dependent" ? (
        <div className="mt-3 ml-8 border border-rule bg-paper-raised p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Acid-dependent drugs</p>
              <p className="mt-1 text-[13px] italic leading-snug text-ink-mute">
                Require gastric acid for absorption. Co-administration with acid-suppressive agents reduces bioavailability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveProperty(null)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-rule text-[14px] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
              aria-label="Close acid-dependent list"
            >
              ×
            </button>
          </div>
          <div className="mt-3 max-h-[38vh] overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {getOtherAcidDependentDrugs(drug.name).map((item) => (
                <span
                  key={`acid-dep-${item}`}
                  className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {activeProperty === "chelation" ? (
        <div className="mt-3 ml-8 border border-rule bg-paper-raised p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Chelation-susceptible drugs</p>
              <p className="mt-1 text-[13px] italic leading-snug text-ink-mute">
                Form insoluble complexes with polyvalent cations (Al, Mg, Ca, Fe, Zn). Separate administration by 2–6 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveProperty(null)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-rule text-[14px] text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
              aria-label="Close chelation list"
            >
              ×
            </button>
          </div>
          <div className="mt-3 max-h-[38vh] overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {getOtherChelationSusceptibleDrugs(drug.name).map((item) => (
                <span
                  key={`chelation-${item}`}
                  className="border border-rule bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}
