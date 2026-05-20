"use client";

import { useState } from "react";
import { Manrope } from "next/font/google";
import { Deck } from "@/types/types";
import { useDecks } from "@/hooks/useDecks";
import { mvgRegistry } from "@/services/mvg.service";
import StationSearch from "@/components/StationSearch";
import DeckCard from "@/components/DeckCard";
import DeckList from "@/components/DeckList";

const manrope = Manrope({ subsets: ["latin"] });

export default function Dashboard() {
    const { decks, hydrated, addDeck, updateDeck, removeDeck, reorderDecks } = useDecks();
    const [tempDeck, setTempDeck] = useState<Deck | null>(null);

    function handleStationSelect(station: Deck["config"]["station"]) {
        // Pre-warm the service so data starts loading immediately
        mvgRegistry.get(station.id);

        const newDeck: Deck = {
            id: crypto.randomUUID(),
            label: station.name ?? station.id,
            collapsed: false,
            config: {
                station,
                amount: 5,
                darkMode: false,
                titleBar: "",
                includeFilters: [],
                excludeFilters: [],
            },
        };
        setTempDeck(newDeck);
    }

    function saveTempDeck() {
        if (!tempDeck) return;
        addDeck(tempDeck);
        setTempDeck(null);
    }

    const isEmpty = hydrated && decks.length === 0 && !tempDeck;

    return (
        <main className={`bg-gray-950 text-white min-h-dvh ${manrope.className}`}>
            <div className="mx-auto max-w-2xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center select-none">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                        <span className="underline decoration-blue-500/70 decoration-[6px] underline-offset-[10px]">
                            abfahrt
                        </span>
                        <span className="text-blue-500">.live</span>
                    </h1>
                    {isEmpty && (
                        <p className="mt-3 text-gray-400 text-sm">Search for a station to get started.</p>
                    )}
                </div>

                {/* Search bar */}
                <div className="mb-8 relative">
                    <StationSearch
                        onSelect={handleStationSelect}
                        placeholder="Search for a station in the MVG network…"
                        autoFocus={isEmpty}
                    />
                </div>

                {/* Temp (unsaved) deck */}
                {tempDeck && (
                    <div className="mb-4">
                        <DeckCard
                            deck={tempDeck}
                            onUpdate={(patch) => setTempDeck(prev => prev ? { ...prev, ...patch } : prev)}
                            onRemove={() => setTempDeck(null)}
                            onSave={saveTempDeck}
                        />
                    </div>
                )}

                {/* Saved decks */}
                {hydrated && (
                    <DeckList
                        decks={decks}
                        onReorder={reorderDecks}
                        onUpdate={updateDeck}
                        onRemove={removeDeck}
                    />
                )}

                {/* Hydration skeleton */}
                {!hydrated && (
                    <div className="flex flex-col gap-4 animate-pulse">
                        {[1, 2].map(i => (
                            <div key={i} className="h-14 rounded-xl bg-gray-800 border border-gray-700" />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
