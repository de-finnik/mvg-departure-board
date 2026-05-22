"use client";
import { useEffect, useState } from "react";
import { Station } from "@/types/types";
import { fetchNearbyStations } from "@/services/mvg.service";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Props {
    onSelect: (station: Station) => void;
}

export default function NearbyStations({ onSelect }: Props) {
    const { enabled, position, error, loading, enable, disable } = useGeolocation();
    const [stations, setStations] = useState<Station[]>([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!position) return;
        setFetching(true);
        fetchNearbyStations(position.latitude, position.longitude)
            .then(setStations)
            .finally(() => setFetching(false));
    }, [position]);

    if (!enabled) {
        return (
            <div className="flex justify-center mt-2">
                <button
                    onClick={enable}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    <LocateIcon />
                    Near me
                </button>
            </div>
        );
    }

    if ((loading || fetching) && stations.length === 0) {
        return <p className="text-xs text-gray-500 mt-2 text-center">Getting your location…</p>;
    }

    if (error) {
        return (
            <p className="text-xs text-red-400 mt-2 text-center">
                Location unavailable.{" "}
                <button onClick={disable} className="underline hover:text-red-300">Disable</button>
            </p>
        );
    }

    return (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
            <button
                onClick={disable}
                className="shrink-0 text-blue-500 hover:text-blue-400 transition-colors"
                title="Disable location"
            >
                <LocateIcon active />
            </button>
            {stations.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700 whitespace-nowrap"
                >
                    {s.name}
                </button>
            ))}
        </div>
    );
}

function LocateIcon({ active }: { active?: boolean }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={active ? "text-blue-500" : "text-gray-500"}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
    );
}
