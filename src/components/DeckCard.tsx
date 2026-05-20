"use client";

import { useRef, useState } from "react";
import { Deck, LineDest } from "@/types/types";
import { configToURL } from "@/lib/parseConfig";
import { mvgRegistry } from "@/services/mvg.service";
import { Manrope, Geist_Mono } from "next/font/google";
import { toast } from "sonner";
import DepartureBoardCore from "@/components/DepartureBoardCore";
import FilterEditor from "@/components/FilterEditor";

const manrope = Manrope({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

interface Props {
    deck: Deck;
    isSortable?: boolean;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
    onUpdate: (patch: Partial<Deck>) => void;
    onRemove: () => void;
    onSave?: () => void; // only for temp deck
}

export default function DeckCard({ deck, isSortable, dragHandleProps, onUpdate, onRemove, onSave }: Props) {
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelDraft, setLabelDraft] = useState(deck.label);
    const labelInputRef = useRef<HTMLInputElement>(null);

    const isTemp = !!onSave;
    const collapsed = deck.collapsed;

    function commitLabel() {
        const trimmed = labelDraft.trim() || deck.config.station.name || deck.config.station.id;
        setLabelDraft(trimmed);
        onUpdate({ label: trimmed });
        setIsEditingLabel(false);
    }

    function startEditLabel() {
        setLabelDraft(deck.label);
        setIsEditingLabel(true);
        setTimeout(() => labelInputRef.current?.select(), 0);
    }

    async function copyBoardUrl() {
        const url = configToURL(deck.config);
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Board URL copied!");
        } catch {
            toast.error("Failed to copy URL");
        }
    }

    function handleFilterChange(include: LineDest[], exclude: LineDest[]) {
        onUpdate({
            config: {
                ...deck.config,
                includeFilters: include,
                excludeFilters: exclude,
            },
        });
    }

    const svc = mvgRegistry.get(deck.config.station.id);

    return (
        <div className={`rounded-xl border ${isTemp ? "border-blue-700 bg-blue-950/20" : "border-gray-800 bg-gray-900"} overflow-hidden ${manrope.className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3">
                {/* Drag handle */}
                {isSortable && (
                    <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 flex-shrink-0 touch-none"
                        aria-label="Drag to reorder"
                        tabIndex={-1}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="5" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/>
                            <circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
                        </svg>
                    </button>
                )}

                {/* Label */}
                <div className="flex-1 min-w-0">
                    {isEditingLabel ? (
                        <input
                            ref={labelInputRef}
                            className="w-full bg-transparent border-b border-gray-600 text-white font-semibold text-base focus:outline-none focus:border-blue-500"
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onBlur={commitLabel}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") commitLabel();
                                if (e.key === "Escape") { setLabelDraft(deck.label); setIsEditingLabel(false); }
                            }}
                        />
                    ) : (
                        <button
                            className="font-semibold text-base text-white truncate max-w-full text-left hover:text-gray-300 cursor-text"
                            onClick={startEditLabel}
                            title="Click to rename"
                        >
                            {deck.label}
                        </button>
                    )}
                    {deck.config.station.place && (
                        <span className={`text-xs text-gray-500 ${geistMono.className}`}>{deck.config.station.place}</span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copy board URL */}
                    <button
                        onClick={copyBoardUrl}
                        className="cursor-pointer p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                        title="Copy board URL"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>

                    {/* Remove */}
                    <button
                        onClick={onRemove}
                        className="cursor-pointer p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-800"
                        title="Remove deck"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                    </button>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => onUpdate({ collapsed: !collapsed })}
                        className="cursor-pointer p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <svg
                            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
                        >
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded body */}
            {!collapsed && (
                <div className="border-t border-gray-800">
                    {/* Live board */}
                    <div className="border-b border-gray-800">
                        <DepartureBoardCore config={deck.config} service={svc} />
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-gray-800">
                        <FilterEditor
                            stationId={deck.config.station.id}
                            includeFilters={deck.config.includeFilters}
                            excludeFilters={deck.config.excludeFilters}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Settings row */}
                    <div className="p-4 flex flex-wrap items-center gap-6">
                        {/* Rows */}
                        <div className="flex items-center gap-3 min-w-[160px]">
                            <label className="text-xs text-gray-400 whitespace-nowrap">
                                Rows: <span className={geistMono.className}>{deck.config.amount}</span>
                            </label>
                            <input
                                type="range"
                                min={3}
                                max={20}
                                value={deck.config.amount}
                                onChange={(e) => onUpdate({ config: { ...deck.config, amount: Number(e.target.value) } })}
                                className="flex-1"
                            />
                        </div>

                        {/* Dark mode */}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-400">
                            <input
                                type="checkbox"
                                checked={deck.config.darkMode}
                                onChange={(e) => onUpdate({ config: { ...deck.config, darkMode: e.target.checked } })}
                                className="h-3.5 w-3.5"
                            />
                            Dark board
                        </label>

                        {/* Title bar */}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-400">
                            <input
                                type="checkbox"
                                checked={deck.config.titleBar !== ""}
                                onChange={(e) => {
                                    const on = e.target.checked;
                                    onUpdate({
                                        config: {
                                            ...deck.config,
                                            titleBar: on ? (deck.config.titleBar || deck.label) : "",
                                        },
                                    });
                                }}
                                className="h-3.5 w-3.5"
                            />
                            Show title
                        </label>
                        {deck.config.titleBar !== "" && (
                            <input
                                className={`px-2 py-1 rounded-md border border-gray-700 bg-gray-950 text-xs text-white ${geistMono.className} flex-1 min-w-[120px]`}
                                value={deck.config.titleBar}
                                onChange={(e) => onUpdate({ config: { ...deck.config, titleBar: e.target.value } })}
                            />
                        )}
                    </div>

                    {/* Save button (temp deck only) */}
                    {isTemp && (
                        <div className="px-4 pb-4">
                            <button
                                onClick={onSave}
                                className="cursor-pointer w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm"
                            >
                                Save as favorite
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
