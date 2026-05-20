"use client";

import { useEffect, useRef, useState } from "react";
import { Station } from "@/types/types";
import { fetchStations } from "@/services/mvg.service";

interface Props {
    onSelect: (station: Station) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function StationSearch({ onSelect, placeholder = "Search for a station…", autoFocus }: Props) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Station[]>([]);
    const [searching, setSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const t = setTimeout(async () => {
            const res = await fetchStations(query.trim());
            setSuggestions(res);
            setSearching(false);
        }, 450);
        return () => clearTimeout(t);
    }, [query]);

    function handleSelect(station: Station) {
        setQuery("");
        setSuggestions([]);
        onSelect(station);
    }

    return (
        <div className="relative">
            <input
                ref={inputRef}
                className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus={autoFocus}
            />
            {query && searching && (
                <p className="mt-2 text-sm text-gray-400 px-1">Searching…</p>
            )}
            {suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 rounded-xl border border-gray-700 bg-gray-900 divide-y divide-gray-800 max-h-64 overflow-y-auto shadow-xl">
                    {suggestions.map((s) => (
                        <li key={s.id}>
                            <button
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleSelect(s)}
                            >
                                <div className="font-medium text-white">{s.name}</div>
                                {s.place && <div className="text-xs text-gray-400">{s.place}</div>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
