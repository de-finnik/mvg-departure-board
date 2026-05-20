"use client";

import { useState, useEffect, useCallback } from "react";
import { Deck, DeckCollection } from "@/types/types";

const STORAGE_KEY = "mvg-decks";

function loadFromStorage(): DeckCollection {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as DeckCollection;
        // Always start collapsed — don't persist expanded state across visits
        return parsed.map(d => ({
            ...d,
            collapsed: true,
            config: { ...d.config, excludedTransportTypes: d.config.excludedTransportTypes ?? [] },
        }));
    } catch {
        return [];
    }
}

function saveToStorage(decks: DeckCollection) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch {
        // ignore storage errors
    }
}

export function useDecks() {
    const [decks, setDecks] = useState<DeckCollection>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setDecks(loadFromStorage());
        setHydrated(true);
    }, []);

    const persist = useCallback((updated: DeckCollection) => {
        setDecks(updated);
        saveToStorage(updated);
    }, []);

    const addDeck = useCallback((deck: Deck) => {
        setDecks(prev => {
            const updated = [...prev, deck];
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const updateDeck = useCallback((id: string, patch: Partial<Deck>) => {
        setDecks(prev => {
            const updated = prev.map(d => d.id === id ? { ...d, ...patch } : d);
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const removeDeck = useCallback((id: string) => {
        setDecks(prev => {
            const updated = prev.filter(d => d.id !== id);
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const reorderDecks = useCallback((ordered: DeckCollection) => {
        persist(ordered);
    }, [persist]);

    return { decks, hydrated, addDeck, updateDeck, removeDeck, reorderDecks };
}
