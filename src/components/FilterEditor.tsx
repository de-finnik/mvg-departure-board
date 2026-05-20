"use client";

import { useEffect, useMemo, useState } from "react";
import { LineDest, TransportType } from "@/types/types";
import { ALL_TRANSPORT_TYPES, TRANSPORT_TYPE_LABELS, getTransportType } from "@/lib/transport";
import { mvgRegistry } from "@/services/mvg.service";

interface Props {
    stationId: string;
    excludedTransportTypes: TransportType[];
    excludeFilters: LineDest[];
    onChange: (excludedTransportTypes: TransportType[], excludeFilters: LineDest[]) => void;
}

interface DirectionNode { destination: string }
interface LineNode { line: string; directions: DirectionNode[] }
interface TypeNode { type: TransportType; lines: LineNode[] }

export default function FilterEditor({ stationId, excludedTransportTypes, excludeFilters, onChange }: Props) {
    const svc = mvgRegistry.get(stationId);

    const [availableLines, setAvailableLines] = useState<LineDest[]>(() => svc.getAvailableLines());
    const [loading, setLoading] = useState(availableLines.length === 0);
    const [expandedTypes, setExpandedTypes] = useState<Set<TransportType>>(new Set());
    const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsub = svc.subscribe(() => {
            setAvailableLines(svc.getAvailableLines());
            setLoading(false);
        });
        const existing = svc.getAvailableLines();
        if (existing.length > 0) { setAvailableLines(existing); setLoading(false); }
        return unsub;
    }, [svc]);

    const hierarchy = useMemo((): TypeNode[] => {
        const byType = new Map<TransportType, Map<string, string[]>>();
        for (const ld of availableLines) {
            const type = getTransportType(ld.line);
            if (!byType.has(type)) byType.set(type, new Map());
            const byLine = byType.get(type)!;
            if (!byLine.has(ld.line)) byLine.set(ld.line, []);
            byLine.get(ld.line)!.push(ld.destination);
        }
        return ALL_TRANSPORT_TYPES
            .filter(t => byType.has(t))
            .map(t => ({
                type: t,
                lines: Array.from(byType.get(t)!.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([line, dests]) => ({
                        line,
                        directions: dests
                            .sort((a, b) => a.localeCompare(b))
                            .map(d => ({ destination: d })),
                    })),
            }));
    }, [availableLines]);

    // --- exclusion helpers ---
    const isTypeExcluded = (type: TransportType) => excludedTransportTypes.includes(type);
    const isLineExcluded = (line: string) =>
        excludeFilters.some(f => f.line === line && f.destination === "*");
    const isDirExcluded = (line: string, dest: string) =>
        excludeFilters.some(f => f.line === line && f.destination === dest);

    // --- toggle handlers ---
    function toggleType(type: TransportType) {
        if (isTypeExcluded(type)) {
            onChange(excludedTransportTypes.filter(t => t !== type), excludeFilters);
        } else {
            setExpandedTypes(prev => { const s = new Set(prev); s.delete(type); return s; });
            onChange([...excludedTransportTypes, type], excludeFilters);
        }
    }

    function toggleLine(line: string) {
        if (isLineExcluded(line)) {
            onChange(excludedTransportTypes, excludeFilters.filter(f => !(f.line === line && f.destination === "*")));
        } else {
            setExpandedLines(prev => { const s = new Set(prev); s.delete(line); return s; });
            onChange(excludedTransportTypes, [...excludeFilters, { line, destination: "*" }]);
        }
    }

    function toggleDir(line: string, destination: string) {
        if (isDirExcluded(line, destination)) {
            onChange(excludedTransportTypes, excludeFilters.filter(f => !(f.line === line && f.destination === destination)));
        } else {
            onChange(excludedTransportTypes, [...excludeFilters, { line, destination }]);
        }
    }

    function toggleExpandType(type: TransportType) {
        setExpandedTypes(prev => {
            const s = new Set(prev);
            s.has(type) ? s.delete(type) : s.add(type);
            return s;
        });
    }

    function toggleExpandLine(line: string) {
        setExpandedLines(prev => {
            const s = new Set(prev);
            s.has(line) ? s.delete(line) : s.add(line);
            return s;
        });
    }

    const hasAnyExclusion = excludedTransportTypes.length > 0 || excludeFilters.length > 0;

    return (
        <div className="text-sm">
            {loading ? (
                <div className="flex flex-col gap-2 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-7 rounded bg-gray-800" />
                    ))}
                </div>
            ) : hierarchy.length === 0 ? (
                <p className="text-xs text-gray-500">No lines available yet.</p>
            ) : (
                <div className="flex flex-col gap-0.5">
                    {hierarchy.map(typeNode => {
                        const typeExcluded = isTypeExcluded(typeNode.type);
                        const typeExpanded = expandedTypes.has(typeNode.type);
                        return (
                            <div key={typeNode.type}>
                                {/* Transport type row */}
                                <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${typeExcluded ? "opacity-50" : "hover:bg-gray-800/50"}`}>
                                    <button
                                        onClick={() => toggleType(typeNode.type)}
                                        className="cursor-pointer flex-shrink-0 text-gray-400 hover:text-white"
                                        title={typeExcluded ? "Show" : "Hide"}
                                    >
                                        {typeExcluded ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                    <button
                                        onClick={() => toggleType(typeNode.type)}
                                        className="cursor-pointer flex-1 text-left font-medium text-gray-200"
                                    >
                                        {TRANSPORT_TYPE_LABELS[typeNode.type]}
                                    </button>
                                    {!typeExcluded && (
                                        <button
                                            onClick={() => toggleExpandType(typeNode.type)}
                                            className="cursor-pointer text-gray-500 hover:text-gray-300 p-0.5"
                                        >
                                            <ChevronIcon expanded={typeExpanded} />
                                        </button>
                                    )}
                                </div>

                                {/* Line rows */}
                                {typeExpanded && !typeExcluded && (
                                    <div className="ml-5 flex flex-col gap-0.5 mt-0.5">
                                        {typeNode.lines.map(lineNode => {
                                            const lineExcluded = isLineExcluded(lineNode.line);
                                            const lineExpanded = expandedLines.has(lineNode.line);
                                            return (
                                                <div key={lineNode.line}>
                                                    <div className={`flex items-center gap-2 rounded-md px-2 py-1 ${lineExcluded ? "opacity-50" : "hover:bg-gray-800/50"}`}>
                                                        <button
                                                            onClick={() => toggleLine(lineNode.line)}
                                                            className="cursor-pointer flex-shrink-0 text-gray-500 hover:text-white"
                                                            title={lineExcluded ? "Show" : "Hide"}
                                                        >
                                                            {lineExcluded ? <EyeOffIcon small /> : <EyeIcon small />}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleLine(lineNode.line)}
                                                            className="cursor-pointer flex-1 text-left text-gray-300 font-mono text-xs"
                                                        >
                                                            {lineNode.line}
                                                        </button>
                                                        {!lineExcluded && lineNode.directions.length > 0 && (
                                                            <button
                                                                onClick={() => toggleExpandLine(lineNode.line)}
                                                                className="cursor-pointer text-gray-600 hover:text-gray-400 p-0.5"
                                                            >
                                                                <ChevronIcon expanded={lineExpanded} small />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Direction rows */}
                                                    {lineExpanded && !lineExcluded && (
                                                        <div className="ml-5 flex flex-col gap-0.5 mt-0.5">
                                                            {lineNode.directions.map(dir => {
                                                                const dirExcluded = isDirExcluded(lineNode.line, dir.destination);
                                                                return (
                                                                    <div
                                                                        key={dir.destination}
                                                                        className={`flex items-center gap-2 rounded-md px-2 py-0.5 ${dirExcluded ? "opacity-50" : "hover:bg-gray-800/50"}`}
                                                                    >
                                                                        <button
                                                                            onClick={() => toggleDir(lineNode.line, dir.destination)}
                                                                            className="cursor-pointer flex-shrink-0 text-gray-600 hover:text-white"
                                                                            title={dirExcluded ? "Show" : "Hide"}
                                                                        >
                                                                            {dirExcluded ? <EyeOffIcon small /> : <EyeIcon small />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => toggleDir(lineNode.line, dir.destination)}
                                                                            className={`cursor-pointer flex-1 text-left text-xs ${dirExcluded ? "line-through text-gray-500" : "text-gray-400"}`}
                                                                        >
                                                                            {dir.destination}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {hasAnyExclusion && (
                <button
                    onClick={() => onChange([], [])}
                    className="cursor-pointer mt-3 text-xs px-3 py-1 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-400"
                >
                    Reset all filters
                </button>
            )}
        </div>
    );
}

function EyeIcon({ small }: { small?: boolean }) {
    const s = small ? 13 : 15;
    return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );
}

function EyeOffIcon({ small }: { small?: boolean }) {
    const s = small ? 13 : 15;
    return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function ChevronIcon({ expanded, small }: { expanded: boolean; small?: boolean }) {
    const s = small ? 12 : 14;
    return (
        <svg
            width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
        >
            <polyline points="6 9 12 15 18 9"/>
        </svg>
    );
}
