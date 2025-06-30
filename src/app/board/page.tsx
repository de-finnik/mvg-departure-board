'use client';

import { fetchDepartures } from "@/lib/fetchDepartures";
import { parseStations, searchParamToConfig } from "@/lib/parseConfig";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Departure } from "@/types/config";
import { formatTimeDiff } from "@/lib/utils";

export default function DepartureBoard() {
  const searchParams = useSearchParams();
  const config = useMemo(() => {
    return searchParamToConfig(searchParams);
  }, [searchParams]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [departures, setDepartures] = useState<Departure[]>([]);

  const refreshDepartures = async () => {
    const d = await fetchDepartures(config);
    setDepartures(d);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if(departures.length > 0 && departures[0].departureTime.getTime() < currentTime.getTime()) {
      refreshDepartures();
      console.log("now");
    }
  }, [currentTime, departures]);
  useEffect(() => {
    refreshDepartures();
    const interval = setInterval(refreshDepartures, config.refresh*1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
      style={{ '--accent': config.accent } as React.CSSProperties}
    >
      <div className="w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
        {/* Header Section with Accent Background */}
        <div className="flex justify-between items-center p-5" style={{ backgroundColor: "var(--accent)" }}>
          <h1 className="text-2xl font-bold text-white">{config.displayName}</h1>
          <p className="text-lg font-mono text-white">
            {currentTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        
        {/* Departure Table */}
        <div className={`w-full p-6 ${config.darkMode ? "bg-gray-800" : "bg-gray-100 text-gray-900"}`}>
          {departures.map((departure, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 p-3 border-b border-gray-700 last:border-none text-lg"
            >
              <span className="font-mono text-center">{departure.departureTime.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}</span>
              <span className="font-bold text-center">{departure.transportLabel}</span>
              <span className="truncate text^-center">{departure.transportDestination}</span>
              <span className={`font-mono text-center ${config.darkMode ? "text-gray-300" : "text-gray-600"}`}>{formatTimeDiff(currentTime, departure.departureTime)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
