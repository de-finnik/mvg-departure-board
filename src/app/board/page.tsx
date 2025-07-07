'use client';

import { fetchDepartures } from "@/lib/fetchDepartures";
import { searchParamToConfig } from "@/lib/parseConfig";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Departure } from "@/types/types";
import { formatTimeDiff } from "@/lib/utils";
import { getLineBackground, getLineFontcolor } from "@/lib/colors";
import { Geist_Mono, Inconsolata, Manrope, Roboto_Mono } from "next/font/google";

const manrope = Manrope();
const robo_mono = Roboto_Mono();
const inconsolata = Inconsolata();
const geist_mono = Geist_Mono();

export default function DepartureBoard() {
  const searchParams = useSearchParams();
  const config = useMemo(() => {
    return searchParamToConfig(searchParams);
  }, [searchParams]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [departures, setDepartures] = useState<Departure[]>([]);

  const refreshDepartures = async () => {
    const d = await fetchDepartures(config.station, config.filter, config.amount);
    setDepartures(d);
  };
  useEffect(() => {
    refreshDepartures();
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      refreshDepartures();
    }, 10000);
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${manrope.className}`}
      style={{ '--accent': config.accent } as React.CSSProperties}
    >
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* Departure Table */}
          {departures.map(({linedest, time}, i) => {
        const msLeft = new Date(time).getTime() - Date.now();
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.2rem',
            }}
          >
            {/* Line badge */}
            <div
              style={{
                width: '60px',
                height: '30px',
                backgroundColor: getLineBackground(linedest.line),
                color: getLineFontcolor(linedest.line),
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '1rem',
              }}
            >
              {linedest.line}
            </div>

            {/* Destination */}
            <div className="font-semibold" style={{ flex: '1', width: '250px' }}>{linedest.destination}</div>

            {/* Time left */}
            <div style={{ width: '60px', textAlign: 'right'}} className={geist_mono.className}>
              {formatTimeDiff(currentTime, time)}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
