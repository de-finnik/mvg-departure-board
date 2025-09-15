"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Config, Departure } from "@/types/types";
import { fetchDepartures } from "@/lib/mvg";
import { formatTimeDiff } from "@/lib/utils";
import { getLineBackground, getLineFontcolor } from "@/lib/colors";
import { Manrope, Geist_Mono } from "next/font/google";

const manrope = Manrope({subsets: ['latin']});
const geist_mono = Geist_Mono({subsets: ['latin']});

export default function DepartureBoardCore({ config }: { config: Config }) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  function departuresInFuture() {
    return departures.filter(dep=>dep.time.getTime() >= Date.now());
  }
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeString, setTimeString] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // avoid object-identity churn in effect deps
  const includeKey = useMemo(
    () => config.includeFilters.map((f) => `${f.line}:${f.destination}`).join(";"),
    [config.includeFilters]
  );
  const excludeKey = useMemo(
    () => config.excludeFilters.map((f) => `${f.line}:${f.destination}`).join(";"),
    [config.excludeFilters]
  );

  const refreshNow = useCallback(async () => {
    try {
      const d = await fetchDepartures(
        config.station,
        config.includeFilters,
        config.excludeFilters,
        config.amount
      );
      setDepartures(d);
      setLoadError(null);
      setIsInitialLoad(false);
    } catch {
      setLoadError("Failed to fetch departures.");
      setIsInitialLoad(false);
    }
  }, [
    config.station,
    config.includeFilters,
    config.excludeFilters,
    config.amount,
  ]);

  // Kick off fetch + poll every 30s
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        await refreshNow();
      }
    })();

    const fetchThirty = window.setInterval(() => {
      if (!cancelled) refreshNow();
    }, 30_000);

    // live clock only if title is non-empty
    const clockId = window.setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if(config.titleBar) {
        setTimeString(
          now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(fetchThirty);
      if (clockId) window.clearInterval(clockId);
    };
  }, [refreshNow, config.titleBar]);

  // When core inputs change, show skeletons again until the first new fetch returns
  useEffect(() => {
    setIsInitialLoad(true);
    setDepartures([]);
    setLoadError(null);
  }, [config.station.id, includeKey, excludeKey, config.amount]);

  const skeletonBar = config.darkMode ? "bg-gray-700" : "bg-gray-200";
  const skeletonCount = Math.max(3, config.amount || 5);

  return (
    <div
      className={[
        "w-full md:max-w-md flex items-center justify-center p-4",
        config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
        manrope.className,
      ].join(" ")}
    >
      <div className="w-full md:max-w-md flex flex-col space-y-2 min-w-0" aria-live="polite">
        {/* Title bar */}
        {config.titleBar !== "" && (
          <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold truncate">{config.titleBar}</span>
            <span className={geist_mono.className}>{timeString}</span>
          </div>
        )}

        {/* Error state (with retry) */}
        {loadError && !isInitialLoad && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3">
            {loadError}{" "}
            <button
              onClick={refreshNow}
              className="underline hover:no-underline ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton (first load after any config change) */}
        {isInitialLoad ? (
          <div className="space-y-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="flex items-center text-[1.1rem] leading-tight animate-pulse">
                <div className={`w-[3.5rem] h-[1.8rem] rounded-md mr-4 ${skeletonBar}`} />
                <div className={`h-4 rounded flex-1 ${skeletonBar}`} />
                <div className={`w-[3.5rem] h-4 rounded ml-4 ${skeletonBar}`} />
              </div>
            ))}
          </div>
        ) : (
          // Rows
          departuresInFuture().slice(0, config.amount).map(({ linedest, time }, i) => (
            <div key={i} className="flex items-center text-[1.1rem] leading-tight">
              <div
                className="w-[3.5rem] h-[1.8rem] rounded-md font-bold mr-4 flex items-center justify-center"
                style={{
                  backgroundColor: getLineBackground(linedest.line),
                  color: getLineFontcolor(linedest.line),
                }}
              >
                {linedest.line}
              </div>
              <div className="font-semibold flex-1 min-w-0 truncate">{linedest.destination}</div>
              <div className={`w-[3.5rem] text-right ${geist_mono.className}`}>
                {formatTimeDiff(currentTime, time)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
