"use client";

import { useEffect, useMemo, useState } from "react";
import { LineDest } from "@/types/types";
import { mvgRegistry } from "@/services/mvg.service";
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({ subsets: ["latin"] });

type Tri = "neutral" | "include" | "exclude";
type FilterMode = "simple" | "advanced";

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

function decodeFilters(str: string): LineDest[] {
    if (!str.trim()) return [];
    return str.split(";").filter(Boolean).map((tok) => {
        const [line = "", destination = ""] = tok.split(":");
        return { line, destination };
    });
}

interface Props {
    stationId: string;
    includeFilters: LineDest[];
    excludeFilters: LineDest[];
    onChange: (include: LineDest[], exclude: LineDest[]) => void;
}

export default function FilterEditor({ stationId, includeFilters, excludeFilters, onChange }: Props) {
    const svc = mvgRegistry.get(stationId);

    const [availableLines, setAvailableLines] = useState<LineDest[]>(() => svc.getAvailableLines());
    const [loading, setLoading] = useState(availableLines.length === 0);
    const [filterMode, setFilterMode] = useState<FilterMode>("simple");

    // Initialise pill state from incoming filters
    const [pillState, setPillState] = useState<Record<number, Tri>>({});
    const [includeText, setIncludeText] = useState(() =>
        includeFilters.map(f => `${f.line}:${f.destination}`).join(";")
    );
    const [excludeText, setExcludeText] = useState(() =>
        excludeFilters.map(f => `${f.line}:${f.destination}`).join(";")
    );

    // Subscribe to service so pills populate once data arrives
    useEffect(() => {
        const unsub = svc.subscribe(() => {
            const lines = svc.getAvailableLines();
            setAvailableLines(lines);
            setLoading(false);
        });
        // In case data is already there
        const existing = svc.getAvailableLines();
        if (existing.length > 0) {
            setAvailableLines(existing);
            setLoading(false);
        }
        return unsub;
    }, [svc]);

    const manualIncludes = useMemo(() => decodeFilters(includeText), [includeText]);
    const manualExcludes = useMemo(() => decodeFilters(excludeText), [excludeText]);

    // Emit changes upward whenever pill/text state changes
    useEffect(() => {
        if (filterMode === "advanced") {
            onChange(manualIncludes, manualExcludes);
        } else {
            const inc: LineDest[] = [];
            const exc: LineDest[] = [];
            Object.entries(pillState).forEach(([k, v]) => {
                const ld = availableLines[Number(k)];
                if (!ld) return;
                if (v === "include") inc.push(ld);
                if (v === "exclude") exc.push(ld);
            });
            onChange(inc, exc);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pillState, filterMode, manualIncludes, manualExcludes]);

    function onPillClick(idx: number) {
        setPillState((prev) => {
            const current = prev[idx] ?? "neutral";
            const next: Tri = current === "neutral" ? "include" : current === "include" ? "exclude" : "neutral";
            return { ...prev, [idx]: next };
        });
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm font-semibold text-gray-300">Filters</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className={`cursor-pointer px-3 py-1 rounded-md border text-xs ${filterMode === "simple" ? "bg-gray-200 text-black border-gray-300" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                        onClick={() => setFilterMode("simple")}
                    >
                        Simple
                    </button>
                    <button
                        type="button"
                        className={`cursor-pointer px-3 py-1 rounded-md border text-xs ${filterMode === "advanced" ? "bg-gray-200 text-black border-gray-300" : "bg-gray-800 text-gray-200 border-gray-700"}`}
                        onClick={() => setFilterMode("advanced")}
                    >
                        Advanced
                    </button>
                </div>
            </div>

            {filterMode === "simple" ? (
                <div>
                    {loading ? (
                        <div className="flex flex-wrap gap-2 animate-pulse">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="h-6 rounded-full border border-gray-700 bg-gray-800 w-20" />
                            ))}
                        </div>
                    ) : availableLines.length === 0 ? (
                        <p className="text-xs text-gray-400">No lines available yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {availableLines.map((ld, idx) => {
                                const state = pillState[idx] ?? "neutral";
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
                    <button
                        onClick={() => setPillState({})}
                        className="cursor-pointer mt-3 text-xs px-3 py-1 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-300"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs text-gray-300 mb-3">
                        Use <code>LINE:DESTINATION</code>, wildcards: <code>U*:*</code>, separated by semicolons.
                        Exclude wins if both match.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Include</label>
                            <input
                                className={`w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-sm text-white ${geistMono.className}`}
                                placeholder="U2:*;53:Aidenbachstraße"
                                value={includeText}
                                onChange={(e) => setIncludeText(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Exclude</label>
                            <input
                                className={`w-full px-3 py-2 rounded-md border border-gray-700 bg-gray-950 text-sm text-white ${geistMono.className}`}
                                placeholder="U*:*"
                                value={excludeText}
                                onChange={(e) => setExcludeText(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => { setIncludeText(""); setExcludeText(""); }}
                        className="cursor-pointer mt-3 text-xs px-3 py-1 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-300"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
