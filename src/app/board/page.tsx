'use client';

import { fetchDepartures } from "@/lib/fetchDepartures";
import { useState, useEffect } from "react";

export default function DepartureBoard({ darkMode = false, accentColor = "#068ce0" }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
  fetchDepartures({
    stations: [
      {id: "de:09162:430", types: ["ubahn"], runTime: 60},
      {id: "de:09162:445", types: ["bus"], runTime: 60}
    ],
    displayName: "KG",
    amount: 10,
    refresh: 30,
    darkMode: true,
    accent: ""
  }).then(d=>console.log(d));
    return () => clearInterval(interval);
  }, []);

  const departures = [
    { time: "12:30", line: "U6", destination: "Marienplatz", countdown: "3:10" },
    { time: "12:35", line: "Tram 19", destination: "Hauptbahnhof", countdown: "7:15" },
    { time: "12:40", line: "Bus 230", destination: "Garching", countdown: "12:05" },
    { time: "12:45", line: "U2", destination: "Messestadt Ost", countdown: "16:20" },
    { time: "12:50", line: "S8", destination: "Flughafen", countdown: "21:00" },
  ];


  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <div className="w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
        {/* Header Section with Accent Background */}
        <div className="flex justify-between items-center p-5" style={{ backgroundColor: "var(--accent)" }}>
          <h1 className="text-2xl font-bold text-white">My Departure Board</h1>
          <p className="text-lg font-mono text-white">
            {currentTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        
        {/* Departure Table */}
        <div className={`w-full p-6 ${darkMode ? "bg-gray-800" : "bg-gray-100 text-gray-900"}`}>
          {departures.map((departure, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 p-3 border-b border-gray-700 last:border-none text-lg"
            >
              <span className="font-mono text-center">{departure.time}</span>
              <span className="font-bold text-center">{departure.line}</span>
              <span className="truncate text-center">{departure.destination}</span>
              <span className={`font-mono text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{departure.countdown}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
