"use client";

import { InteractionExplanation } from "@/components/InteractionExplanation";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatSources, type InteractionCheckResponse } from "@/lib/interactions";

export function InteractionList({
  result,
}: {
  result: InteractionCheckResponse;
}) {
  if (result.pairs.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          No known interactions found in current data sources.
        </p>
        <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-100/70">
          {result.dataVersion}
        </p>
        {result.unknown.length > 0 ? (
          <p className="mt-2 text-xs text-emerald-900/70 dark:text-emerald-100/70">
            Unmapped RxCUIs: {result.unknown.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result.pairs.map((pair) => {
        const isPinned = pair.severity === "Contraindicated";
        return (
          <details
            key={`${pair.a.rxcui}|${pair.b.rxcui}`}
            className={[
              "group rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70",
              isPinned ? "ring-1 ring-red-500/30" : "",
            ].join(" ")}
          >
            <summary className="list-none cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {pair.a.name} <span className="text-zinc-400">↔</span>{" "}
                    {pair.b.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {pair.verdict}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatSources(pair.sources)}
                  </p>
                </div>
                <SeverityBadge severity={pair.severity} pulse={isPinned} />
              </div>
            </summary>
            <div className="mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {pair.mechanism_class ? (
                <p>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Mechanism:
                  </span>{" "}
                  {pair.mechanism_class}
                </p>
              ) : null}
              {pair.management ? (
                <p className={pair.mechanism_class ? "mt-2" : ""}>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Management:
                  </span>{" "}
                  {pair.management}
                </p>
              ) : null}
              <p
                className={[
                  "text-xs text-zinc-500",
                  pair.mechanism_class || pair.management ? "mt-3" : "",
                ].join(" ")}
              >
                Sources: {formatSources(pair.sources)}
              </p>
              <InteractionExplanation
                pair={pair}
                dataVersion={result.dataVersion}
              />
            </div>
          </details>
        );
      })}
      {result.unknown.length > 0 ? (
        <p className="text-xs text-zinc-500">
          Unmapped RxCUIs: {result.unknown.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
