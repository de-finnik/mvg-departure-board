'use client';

import { useState, useEffect, useRef } from 'react';
import { Station, Config } from '@/types/config';
import { stat } from 'fs';
import { toast } from 'sonner';
import { fetchStations } from '@/lib/fetchStations';


export default function ConfiguratorPage() {
  const baseUrl = 'http://localhost:3000';

  const [config, setConfig] = useState<Config>({
    stations: [],
    displayName: '',
    amount: 5,
    refresh: 30,
    darkMode: false,
    accent: '#068ce0'
  });

  const [stationSearch, setStationSearch] = useState('');

  const [allStations, setAllStations] = useState<Station[]>([]);

  const stationSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const stations = await fetchStations();
        setAllStations(stations);
      } catch (error) {
        toast.error('Failed to load stations');
      }
    };
    loadStations();
    stationSearchInputRef.current?.focus();
  }, []);

  const handleAddStation = (addStation: Station) => {
    if(config.stations.some((station) => station.id === addStation.id)) {
      toast.error("This station is already in the list");
      return;
    }
    if(config.displayName.length === 0) {
      config.displayName = addStation.displayName ?? "";
    }
    setConfig((prev) => ({
      ...prev,
      stations: [
        ...prev.stations,
        addStation
      ],
    }));
    setStationSearch('');
    stationSearchInputRef.current?.focus();
  }

  const handleRemoveStation = (stationId: string) => {
    setConfig((prev) => ({
      ...prev,
      stations: prev.stations.filter((s) => s.id !== stationId),
    }));
  };

  const handleRunTimeChange = (stationId: string, seconds: number) => {
    setConfig((prev) => ({
      ...prev,
      stations: prev.stations.map((s) => s.id !== stationId ? s : {
        ...s,
        runTime: seconds
      }),
    }));
  };

  const handleTransportTypeChange = (stationId: string, type: string) => {
    setConfig((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        stationId !== s.id ? s : 
        {
          ...s,
          types: s.types.includes(type) 
            ? s.types.filter((t) => t !== type)
            : [...s.types, type]
        })
    }));
  };

  const handleAmountChange = (amount: number) => {
    setConfig((prev) => ({
      ...prev,
      amount: amount
    }));
  };

  const handleRefreshChange = (refresh: number) => {
    setConfig((prev) => ({
      ...prev,
      refresh: refresh
    }));
  };

  const handleDarkMode = (darkMode: boolean) => {
    setConfig((prev) => ({
      ...prev,
      darkMode: darkMode
    }));
  };

  const handleAccentChange = (accent: string) => {
    setConfig((prev) => ({
      ...prev,
      accent: accent
    }));
  };

  const stationsString = config.stations
    .map(
      (station) =>
        `${station.id}:${station.types.join(',')}:${station.runTime}`
    )
    .join('|');

  const boardUrl = `${baseUrl}/board?title=${encodeURIComponent(config.displayName)}&stations=${stationsString}&amount=${config.amount}&refresh=${config.refresh}&accent=${encodeURIComponent(config.accent)}&theme=${config.darkMode?'dark':'light'}`;

  const searchParts = stationSearch.toLowerCase().split(" ");

  const filteredStations = allStations
    .filter((station) => 
      (station.displayName ?? "").toLowerCase().includes(searchParts[0])
    )
    .sort((a, b) => {
      if(searchParts.length > 1 && searchParts[1].length > 0 && (b.place ?? "").toLowerCase().includes(searchParts[1])) {
        return 1;
      }
      if(searchParts.length > 1 && searchParts[1].length > 0 && (a.place ?? "").toLowerCase().includes(searchParts[1])) {
        return -1;
      }
      if(a.place === "München" && b.place !== "München") {
        return -1;
      }
      if(a.place !== "München" && b.place === "München") {
        return 1;
      }
      return 0;
    })
    .slice(0, 8)

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter' && filteredStations.length > 0) {
      handleAddStation(filteredStations[0]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(boardUrl);
  };

  const normTransportType = (label: string) => label.toLowerCase().replace(/[^a-z]/g, '');

  return (
    <div
      style={{ '--accent': config.accent } as React.CSSProperties}
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
    >
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Board Title Input */}
        <p className="text-sm mb-1 text-gray-600">Name of departure board</p>
        <input
          type="text"
          placeholder="Board title (optional)"
          value={config.displayName}
          onChange={(e) => setConfig((prev) => ({...prev, displayName: e.target.value}))}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
        />

        {/* Station Search */}
        <div className="relative">
          <input
            ref={stationSearchInputRef}
            type="text"
            placeholder="Search station..."
            value={stationSearch}
            onKeyDown={handleSearchKeyDown}
            onChange={(e) => setStationSearch(e.target.value)}
            className="flex-grow border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 w-full"
            style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          {stationSearch && filteredStations.length > 0 && (
            <div className='absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto'>
              {filteredStations.map((station) => (
                <div
                  key={station.id}
                  className='p-2 hover:bg-gray-100 cursor-pointer'
                  onClick={() => handleAddStation(station)}
                  >
                    {station.displayName}<p className='text-sm text-gray-600'> {station.place}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Added Stations List (Example) */}
        <div className="space-y-4">
          {config.stations.map((station) => (
            <div
              key={station.id}
              className='border rounded-lg p-4 space-y-3 bg-gray-50'
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{station.displayName ?? station.id}</span>
                <button
                  className="text-red-500 hover:underline transition"
                  onClick={() => handleRemoveStation(station.id)}
                >
                  Remove
                </button>
              </div>

              {/* Transport Type Checkboxes */}
              <div className="space-x-4">
                {['U-Bahn', 'Bus', 'Tram', 'S-Bahn'].map((label) => (
                  <label key={label} className="inline-flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={station.types.includes(normTransportType(label))}
                      onChange={(e) => handleTransportTypeChange(station.id, normTransportType(label))}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                      style={{
                        accentColor: 'var(--accent)',
                        '--tw-ring-color': 'var(--accent)',
                      } as React.CSSProperties}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {/* Run Time Input */}
              <div className="flex items-center space-x-4">
                <p className="text-sm mb-1 text-gray-600">Time to get to station (seconds)</p>
                <input
                  type="number"
                  value={station.runTime}
                  onChange={(e) => handleRunTimeChange(station.id, Number(e.target.value))}
                  placeholder="Time to run (min)"
                  className="w-40 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Global Settings */}
        <div className="space-y-4">
          {/* Refresh Rate */}
          <div>
            <input
              value={config.refresh}
              onChange={(e) => handleRefreshChange(Number(e.target.value))}
              type="range"
              min="5"
              max="300"
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <p className="text-sm text-gray-600">Refresh rate: {config.refresh}s</p>
          </div>

          {/* Dark/Light Mode Switch */}
          <div className="flex items-center space-x-2">
            <span>Light</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={!config.darkMode} className="sr-only peer" onChange={(e)=>handleDarkMode(!e.target.checked)}/>
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer dark:bg-gray-700 peer-checked:bg-gray-300 transition"></div>
            </label>
            <span>Dark</span>
          </div>

          {/* Number of Entries */}
          <div>
            <p className="text-sm mb-1 text-gray-600">Number of entries to display</p>
            <input
              type="number"
              value={config.amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="w-65 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
          </div>

          {/* Accent Color Picker */}
          <div className="flex items-center space-x-4">
            <p className="text-sm mb-1 text-gray-600">Accent color:</p>
            <input
              type="text"
              value={config.accent}
              onChange={(e) => handleAccentChange(e.target.value)}
              placeholder="#Accent color"
              className="border border-gray-300 rounded-md p-2 w-25 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
            <input
              type="color"
              value={config.accent}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-10 h-10 border-0 p-0 cursor-pointer"
            />
          </div>
        </div>

        
        {/* Generated URL Display with Copy + Launch */}
        <div className="flex items-center space-x-2">
          <textarea
            value={boardUrl}
            readOnly
            className="flex-grow border border-gray-300 rounded-md p-2 text-sm h-24 resize-none focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          <button
            onClick={handleCopy}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
            title="Copy URL"
          >
            📋
          </button>
        </div>

        {/* Generate Button */}
        <button
          style={{ backgroundColor: 'var(--accent)' }}
          onClick={() => open(boardUrl)}
          className="w-full text-white py-3 rounded-md hover:opacity-90 transition"
        >
          Launch Departure Board
        </button>

      </div>
    </div>
  );
}
