'use client';

import { fetchDepartures } from "@/lib/fetchDepartures";
import { searchParamToConfig } from "@/lib/parseConfig";
import { useState, useEffect, useMemo, use } from "react";
import { useSearchParams } from "next/navigation";
import { Departure } from "@/types/types";
import { formatTimeDiff } from "@/lib/utils";
import { getLineBackground, getLineFontcolor } from "@/lib/colors";
import { Geist_Mono, Inconsolata, Manrope, Roboto_Mono } from "next/font/google";

const manrope = Manrope();
const geist_mono = Geist_Mono();

export default function DepartureBoard() {
  const searchParams = useSearchParams();
  const config = useMemo(() => {
    return searchParamToConfig(searchParams);
  }, [searchParams]);

  const [timeString, setTimeString] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departures, setDepartures] = useState<Departure[]>([]);

  const refreshDepartures = async () => {
    const d = await fetchDepartures(config.station, config.includeFilters, config.excludeFilters, config.amount);
    setDepartures(d);
  };
  useEffect(() => {
    refreshDepartures();
    const interval = setInterval(() => {
      refreshDepartures();
    }, 10000);
    if(config.titleBar != "no") {
      setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        setTimeString(now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }));
      }, 1000);
    }
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${manrope.className}`}
    >
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* Title bar */}
        {config.titleBar != "no" && (
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold truncate">
            {config.titleBar}
          </span>
          <span className={geist_mono.className}>
            {timeString}
          </span>
        </div>)}

        {/* Departure Table */}
          {departures.map(({linedest, time}, i) => {
        const msLeft = new Date(time).getTime() - Date.now();
        return (
          <div
            key={i}
            className="flex items-center text-[1.1rem] leading-tight"
          >
            {/* Line badge */}
            <div
              className="w-[3.5rem] h-[1.8rem] rounded-md font-bold mr-4 flex items-center justify-center"
              style={{
                backgroundColor: getLineBackground(linedest.line),
                color: getLineFontcolor(linedest.line),
              }}
            >
              {linedest.line}
            </div>

            {/* Destination name */}
            <div className="font-semibold flex-1 truncate">
              {linedest.destination}
            </div>

            {/* Time left */}
            <div
              className={`w-[3.5rem] text-right ${geist_mono.className}`}
            >
              {formatTimeDiff(currentTime, time)}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
