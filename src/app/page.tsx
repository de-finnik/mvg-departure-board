"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Station, LineDest, Config } from "@/types/types";

import { configToURL } from "@/lib/parseConfig";
import { fetchStations } from "@/lib/mvg";
import { fetchDepartingLines, mvvFetchDepartingLines } from "@/lib/mvv";

/**********************************************************************
 * Small, dependency‑free UI: plain HTML elements styled with Tailwind *
 **********************************************************************/

/** Draggable pill -------------------------------------------------- */
function LineDestPill({ id, ld }: { id: string; ld: LineDest }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab select-none rounded-full px-3 py-1 text-xs font-mono mr-2 mb-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      {ld.line}:{ld.destination}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function DepartureConfigurator() {
  /* ------------ wizard step ------------- */
  const [step, setStep] = useState<1 | 2>(1);

  /* ------------ station search ---------- */
  const [stationQuery, setStationQuery] = useState("");
  const [stationSuggestions, setStationSuggestions] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  /* ------------ config ------------------ */
  const [config, setConfig] = useState<Config>(() => ({
    station: { id: "" },
    amount: 8,
    darkMode: false,
    titleBar: "",
    includeFilters: [],
    excludeFilters: [],
  }));

  /* ------------ station suggestions fetch */
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

  /* ------------ line‑dest pills ------------ */
  const [lineDestSuggestions, setLineDestSuggestions] = useState<LineDest[]>([]);
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [includeIds, setIncludeIds] = useState<string[]>([]);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedStation) return;
    (async () => {
      const lds = await fetchDepartingLines(selectedStation);
      setLineDestSuggestions(lds);
      const ids = lds.map((_, i) => `${i}`);
      setAvailableIds(ids);
      setIncludeIds([]);
      setExcludeIds([]);
      setConfig((c) => ({
        ...c,
        station: selectedStation,
        titleBar: selectedStation.name ?? "",
        includeFilters: [],
        excludeFilters: [],
      }));
    })();
  }, [selectedStation]);

  /* ------------ drag end ----------------- */
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;

    if (over.id === "include-drop") {
      if (!includeIds.includes(active.id as string)) {
        setIncludeIds((prev) => [...prev, active.id as string]);
        setConfig((c) => ({
          ...c,
          includeFilters: [
            ...c.includeFilters,
            lineDestSuggestions[parseInt(active.id as string)],
          ],
        }));
      }
    } else if (over.id === "exclude-drop") {
      if (!excludeIds.includes(active.id as string)) {
        setExcludeIds((prev) => [...prev, active.id as string]);
        setConfig((c) => ({
          ...c,
          excludeFilters: [
            ...c.excludeFilters,
            lineDestSuggestions[parseInt(active.id as string)],
          ],
        }));
      }
    }
  }

  /* ------------ url preview -------------- */
  const url = useMemo(() => (config.station.id ? `${configToURL(config)}` : ""), [config]);

  /* ------------------------------------------------------------------ */
  /*                         RENDER                                     */
  /* ------------------------------------------------------------------ */
  if (step === 1) {
    return (
      <main className="max-w-md mx-auto mt-10 p-6 border rounded-lg bg-white dark:bg-gray-900 dark:text-white shadow">
        <h1 className="text-xl font-semibold mb-4">Choose station</h1>
        <input
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          placeholder="Start typing station name…"
          value={stationQuery}
          onChange={(e) => setStationQuery(e.target.value)}
        />
        {stationSuggestions.length > 0 && (
          <ul className="mt-2 border rounded max-h-56 overflow-y-auto divide-y">
            {stationSuggestions.map((s) => (
              <li key={s.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setSelectedStation(s);
                    setStep(2);
                  }}
                >
                  {s.name} {s.place && <span className="text-xs text-gray-500">({s.place})</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  /* --------------------- Step 2 --------------------- */
  return (
    <main className="max-w-xl mx-auto mt-8 p-6 border rounded-lg bg-grey shadow space-y-6">
      <h1 className="text-xl font-semibold mb-2">Configure departure board</h1>

      {/* Rows slider */}
      <section>
        <label className="block text-sm font-medium mb-1">
          Rows to display: <span className="font-mono">{config.amount}</span>
        </label>
        <input
          type="range"
          min={3}
          max={20}
          value={config.amount}
          onChange={(e) => setConfig((c) => ({ ...c, amount: Number(e.target.value) }))}
          className="w-full"
        />
      </section>

      {/* Theme & title toggles */}
      <section className="flex items-center gap-8">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.darkMode}
            onChange={(e) => setConfig((c) => ({ ...c, darkMode: e.target.checked }))}
            className="h-4 w-4"
          />
          <span className="text-sm">Dark mode</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.titleBar !== "no"}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                titleBar: e.target.checked ? selectedStation?.name ?? "" : "no",
              }))
            }
            className="h-4 w-4"
          />
          <span className="text-sm">Show title</span>
        </label>
      </section>

      {/* Filters text inputs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Include filters</label>
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring text-sm font-mono"
            placeholder="U2:*;Bus100:Marienplatz"
            value={config.includeFilters.map((ld) => `${ld.line}:${ld.destination}`).join(";")}
            onChange={(e) => {
              const arr: LineDest[] = e.target.value
                .split(";")
                .filter(Boolean)
                .map((tok) => {
                  const [line = "", dest = ""] = tok.split(":");
                  return { line, destination: dest };
                });
              setConfig((c) => ({ ...c, includeFilters: arr }));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Exclude filters</label>
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring text-sm font-mono"
            placeholder="Tram*:*"
            value={config.excludeFilters.map((ld) => `${ld.line}:${ld.destination}`).join(";")}
            onChange={(e) => {
              const arr: LineDest[] = e.target.value
                .split(";")
                .filter(Boolean)
                .map((tok) => {
                  const [line = "", dest = ""] = tok.split(":");
                  return { line, destination: dest };
                });
              setConfig((c) => ({ ...c, excludeFilters: arr }));
            }}
          />
        </div>
      </section>

      {/* Draggable pills */}
      {lineDestSuggestions.length > 0 && (
        <section>
          <p className="text-sm mb-2 font-medium">Drag a badge to include / exclude</p>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={availableIds} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap mb-4">
                {availableIds.map((id) => (
                  <LineDestPill key={id} id={id} ld={lineDestSuggestions[parseInt(id)]} />
                ))}
              </div>
            </SortableContext>

            {/* Drop zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                id="include-drop"
                className="min-h-[4rem] border-2 border-dashed rounded-md p-2 flex flex-wrap"
              >
                {includeIds.map((id) => (
                  <LineDestPill key={"inc-" + id} id={id} ld={lineDestSuggestions[parseInt(id)]} />
                ))}
                {includeIds.length === 0 && (
                  <p className="text-xs text-muted-foreground m-auto">Drop here to include</p>
                )}
              </div>
              <div
                id="exclude-drop"
                className="min-h-[4rem] border-2 border-dashed rounded-md p-2 flex flex-wrap"
              >
                {excludeIds.map((id) => (
                  <LineDestPill key={"exc-" + id} id={id} ld={lineDestSuggestions[parseInt(id)]} />
                ))}
                {excludeIds.length === 0 && (
                  <p className="text-xs text-muted-foreground m-auto">Drop here to exclude</p>
                )}
              </div>
            </div>
          </DndContext>
        </section>
      )}

      {/* URL preview + open */}
      <section>
        <label className="block text-sm font-medium mb-1">Live URL</label>
        <div className="relative">
          <input
            readOnly
            className="w-full px-3 py-2 border rounded text-sm font-mono pr-32 bg-gray-50 dark:bg-gray-800"
            value={url}
          />
          <button
            disabled={!url}
            onClick={() => url && window.open(url, "_blank")}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded"
          >
            Open
          </button>
        </div>
      </section>
    </main>
  );
}
