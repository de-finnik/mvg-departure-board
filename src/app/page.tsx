"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Station, LineDest, Config } from "@/types/types";
import { configToURL } from "@/lib/parseConfig";
import { fetchStations, fetchDepartingLines } from "@/lib/mvg";
import { Manrope, Geist_Mono } from "next/font/google";
import DepartureBoardCore from "@/components/DepartureBoardCore";

const manrope = Manrope({subsets: ['latin']});
const geistMono = Geist_Mono({subsets: ['latin']});

/** helpers */
function decodeFilters(str: string): LineDest[] {
  if (!str.trim()) return [];
  return str.split(";").filter(Boolean).map((tok) => {
    const [line = "", destination = ""] = tok.split(":");
    return { line, destination };
  });
}
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}
function matches(ld: LineDest, f: LineDest) {
  const lineRe = patternToRegex(f.line || "*");
  const destRe = patternToRegex(f.destination || "*");
  return lineRe.test(ld.line) && destRe.test(ld.destination);
}
type Tri = "neutral" | "include" | "exclude";
function triClasses(state: Tri) {
  switch (state) {
    case "include":
      return "bg-green-900/30 text-green-200 border-green-700";
    case "exclude":
      return "bg-red-900/30 text-red-200 border-red-700";
    default:
      return "bg-gray-800 text-gray-100 border-gray-700";
  }
}

export default function DepartureConfigurator() {
  const [step, setStep] = useState<1 | 2>(1);

  // station search
  const [stationQuery, setStationQuery] = useState("");
  const [stationSuggestions, setStationSuggestions] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // config: UI always dark; darkMode controls BOARD theme only
  const [config, setConfig] = useState<Config>(() => ({
    station: { id: "" },
    amount: 5,
    darkMode: false, // defaults from system below
    titleBar: "",    // empty means OFF
    includeFilters: [],
    excludeFilters: [],
  }));

  // default board theme from system preference (configurator stays dark)
  useEffect(() => {
    const prefersDark = typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setConfig((c) => ({ ...c, darkMode: !!prefersDark }));
  }, []);

  // station lookup
  useEffect(() => {
    if (!stationQuery.trim()) {
      setStationSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetchStations(stationQuery.trim());
      setStationSuggestions(res);
    }, 250);
    return () => clearTimeout(t);
  }, [stationQuery]);

  // lines at station + loading/error
  const [lineDestSuggestions, setLineDestSuggestions] = useState<LineDest[]>([]);
  const [pillState, setPillState] = useState<Record<number, Tri>>({});
  const [ldsLoading, setLdsLoading] = useState(false);
  const [ldsError, setLdsError] = useState<string | null>(null);
  const fetchSeq = useRef(0); // race guard

  async function loadLineDestSuggestions(station: Station) {
    fetchSeq.current += 1;
    const seq = fetchSeq.current;

    setLdsLoading(true);
    setLdsError(null);
    setLineDestSuggestions([]); // ensure skeletons show
    setPillState({});           // reset explicit toggles for new station

    try {
      const lds = await fetchDepartingLines(station);
      if (seq !== fetchSeq.current) return; // stale
      setLineDestSuggestions(lds);
    } catch {
      if (seq !== fetchSeq.current) return;
      setLdsError("Couldn’t load line suggestions. Please retry.");
      setLineDestSuggestions([]);
    } finally {
      if (seq === fetchSeq.current) setLdsLoading(false);
    }
  }

  // select station: go to step 2 immediately, update config, then fetch suggestions in background
  function selectStation(s: Station) {
    setSelectedStation(s);
    setConfig((c) => ({
      ...c,
      station: s,
      includeFilters: [],
      excludeFilters: [],
      // titleBar stays "" by default; checkbox will populate it if enabled
    }));
    setIncludeText("");
    setExcludeText("");
    setStep(2);                // show step 2 immediately
    void loadLineDestSuggestions(s); // fetch pills in background
  }

  // manual filters
  const [includeText, setIncludeText] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const manualIncludes = useMemo(() => decodeFilters(includeText), [includeText]);
  const manualExcludes = useMemo(() => decodeFilters(excludeText), [excludeText]);

  function computePillState(idx: number): Tri {
    const explicit = pillState[idx];
    if (explicit && explicit !== "neutral") return explicit;
    const ld = lineDestSuggestions[idx];
    if (manualExcludes.some((f) => matches(ld, f))) return "exclude";
    if (manualIncludes.some((f) => matches(ld, f))) return "include";
    return "neutral";
  }
  function onPillClick(idx: number) {
    setPillState((prev) => {
      const current = prev[idx] ?? "neutral";
      const next: Tri = current === "neutral" ? "include" : current === "include" ? "exclude" : "neutral";
      return { ...prev, [idx]: next };
    });
  }

  // build preview config + url in one place
  const { previewConfig, url } = useMemo(() => {
    if (!config.station.id) return { previewConfig: null, url: "" };

    const explicitIncludes: LineDest[] = [];
    const explicitExcludes: LineDest[] = [];
    Object.entries(pillState).forEach(([k, v]) => {
      const ld = lineDestSuggestions[Number(k)];
      if (!ld) return;
      if (v === "include") explicitIncludes.push(ld);
      if (v === "exclude") explicitExcludes.push(ld);
    });

    const merged: Config = {
      ...config,
      includeFilters: [...manualIncludes, ...explicitIncludes],
      excludeFilters: [...manualExcludes, ...explicitExcludes],
    };

    return { previewConfig: merged, url: configToURL(merged) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, pillState, includeText, excludeText, lineDestSuggestions]);

  async function copyUrl() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch {}
  }

  return (
    <main className={`bg-gray-950 text-white min-h-dvh ${manrope.className}`}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Step 1: choose station */}
        {step === 1 && (
          <>
            <div className="select-none mb-8 text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                <span className="underline decoration-blue-500/70 decoration-[6px] underline-offset-[10px]">
                  abfahrt
                </span>
                <span className="text-blue-500">.live</span>
              </h1>
              <p className="mt-2 text-sm text-gray-400">Generate your own MVG departure board.</p>
            </div>

            <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Station</h2>
              <input
                className="w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search for a station…"
                value={stationQuery}
                onChange={(e) => setStationQuery(e.target.value)}
                autoFocus
              />
              {stationQuery && stationSuggestions.length === 0 && (
                <p className="mt-2 text-sm text-gray-400">Searching…</p>
              )}
              {stationSuggestions.length > 0 && (
                <ul className="mt-2 rounded-md border border-gray-800 divide-y divide-gray-800 max-h-60 overflow-y-auto">
                  {stationSuggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-800"
                        onClick={() => selectStation(s)}
                      >
                        <div className="font-medium">{s.name}</div>
                        {s.place && <div className="text-xs text-gray-400">{s.place}</div>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* Step 2: two columns (Display + Live). No top Station card. */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display (left) */}
            <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm">
              <div className="mb-3 select-none">
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-none">
                  <span className="underline decoration-blue-500/70 decoration-[4px] underline-offset-[6px]">
                    abfahrt
                  </span>
                  <span className="text-blue-500">.live</span>
                </h2>
              </div>

              {/* Station summary */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-sm text-gray-300 flex flex-wrap items-center gap-2">
                  <span className="font-medium">Station:</span>
                  <span className="px-2 py-1 rounded bg-gray-800">{selectedStation?.name}</span>
                  {selectedStation?.place && (
                    <span className="px-2 py-1 rounded bg-gray-800">{selectedStation.place}</span>
                  )}
                </div>
                <button
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800"
                  onClick={() => {
                    setSelectedStation(null);
                    setStationQuery("");
                    setLineDestSuggestions([]);
                    setPillState({});
                    setIncludeText("");
                    setExcludeText("");
                    setConfig((c) => ({
                      ...c,
                      station: { id: "" },
                      amount: 5,
                      titleBar: "",
                      includeFilters: [],
                      excludeFilters: [],
                    }));
                    setStep(1);
                  }}
                >
                  Change
                </button>
              </div>

              <h2 className="text-lg font-semibold mb-4">Display</h2>

              {/* Rows */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-1">
                  Rows to display:{" "}
                  <span className={`${geistMono.className} text-xs`}>{config.amount}</span>
                </label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={config.amount}
                  onChange={(e) => setConfig((c) => ({ ...c, amount: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Theme (BOARD only) */}
              <div className="mb-5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.darkMode}
                    onChange={(e) => setConfig((c) => ({ ...c, darkMode: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Dark mode (board)</span>
                </label>
                <p className="mt-1 text-xs text-gray-400">
                  Defaults to your system preference. Toggling changes the preview & URL; the configurator stays dark.
                </p>
              </div>

              {/* Title bar (off by default; empty string) */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.titleBar !== ""}  // empty = OFF
                    onChange={(e) => {
                      const on = e.target.checked;
                      setConfig((c) => ({
                        ...c,
                        titleBar: on ? (c.titleBar || selectedStation?.name || "") : "",
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Show title</span>
                </label>
                {config.titleBar !== "" && (
                  <input
                    className={`w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-sm ${geistMono.className}`}
                    value={config.titleBar}
                    onChange={(e) => setConfig((c) => ({ ...c, titleBar: e.target.value }))}
                  />
                )}
              </div>
            </section>

            {/* Live (right) */}
            <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Live</h2>

              <div className="rounded-md overflow-hidden border border-gray-800">
                {previewConfig ? (
                  <DepartureBoardCore config={previewConfig} />
                ) : (
                  <div className="h-64 grid place-items-center text-sm text-gray-400">
                    Choose a station to preview…
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">URL</label>
                <div className="relative">
                  <input
                    readOnly
                    className={`w-full pr-36 px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-xs ${geistMono.className}`}
                    value={url}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button
                      disabled={!url}
                      onClick={copyUrl}
                      className="px-3 py-1.5 rounded-md text-sm border border-gray-700 hover:bg-gray-800 disabled:opacity-50"
                    >
                      Copy
                    </button>
                    <button
                      disabled={!url}
                      onClick={() => url && window.open(url, "_blank")}
                      className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Bottom: Filters */}
        {step === 2 && (
          <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="text-xs text-gray-400">
                Click a pill to toggle: include (green) / exclude (red). Wildcards in the fields colour matching pills automatically; exclude wins if both apply.
              </div>
            </div>

            {/* Manual fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Include</label>
                <input
                  className={`w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-sm ${geistMono.className}`}
                  placeholder="U2:*;53:Aidenbachstraße"
                  value={includeText}
                  onChange={(e) => setIncludeText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exclude</label>
                <input
                  className={`w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-sm ${geistMono.className}`}
                  placeholder="U*:*"
                  value={excludeText}
                  onChange={(e) => setExcludeText(e.target.value)}
                />
              </div>
            </div>

            {/* Pills / Loading / Error */}
            <div className="mt-4">
              {ldsLoading ? (
                // Skeleton chips while fetching suggestions
                <div className="flex flex-wrap gap-2 animate-pulse">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-6 rounded-full border border-gray-700 bg-gray-800"
                      style={{ width: `${Math.floor(50 + Math.random() * 100)}px` }}
                    />
                  ))}
                </div>
              ) : ldsError ? (
                <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded p-3 flex items-center justify-between">
                  <span>{ldsError}</span>
                  <button
                    onClick={() => selectedStation && loadLineDestSuggestions(selectedStation)}
                    className="ml-3 px-2 py-1 rounded border border-red-700 hover:bg-red-900/30"
                  >
                    Retry
                  </button>
                </div>
              ) : lineDestSuggestions.length === 0 ? (
                <p className="text-sm text-gray-400">No lines available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lineDestSuggestions.map((ld, idx) => {
                    const state = computePillState(idx);
                    return (
                      <button
                        key={`${ld.line}-${ld.destination}-${idx}`}
                        onClick={() => onPillClick(idx)}
                        className={`cursor-pointer select-none rounded-full px-3 py-1 text-xs border ${triClasses(state)} ${geistMono.className}`}
                        title={`${ld.line}:${ld.destination}`}
                      >
                        {ld.line}:{ld.destination}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setPillState({})} className="text-sm px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800">
                Clear pill selections
              </button>
              <button onClick={() => { setIncludeText(""); setExcludeText(""); }} className="text-sm px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800">
                Clear text filters
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
