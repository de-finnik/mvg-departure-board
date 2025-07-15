'use client';

import { useState, useEffect, useRef } from 'react';
import { Station, Config } from '@/types/types';
import { stat } from 'fs';
import { toast } from 'sonner';
import { fetchStations } from '@/lib/mvg';
import { configToURL, defaultConfig } from '@/lib/parseConfig';
import { useDebounce } from 'use-debounce';


export default function ConfiguratorPage() {

  const [config, setConfig] = useState<Config>(defaultConfig);

  const [stationSearch, setStationSearch] = useState('');

  const [searchResults, setSearchResults] = useState<Station[]>([]);

  const [debouncedSearch] = useDebounce(stationSearch, 300);

  const stationSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stationSearchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const search = async () => {
      if(debouncedSearch.length < 3) {
        setSearchResults([]);
        return;
      }
      console.log("now");
      try {
        const results = await fetchStations(debouncedSearch);
        setSearchResults(results);
      } catch (err) {
        console.log(err);
        toast.error("Failed to search stations");
      }
    };
    search();
  }, [debouncedSearch]);

  const handleSetStation = (station: Station) => {
    setConfig((prev) => ({
      ...prev,
      station: station
    }));
    setStationSearch('');
    stationSearchInputRef.current?.focus();
  }

  const handleRemoveStation = () => {
    setConfig((prev) => ({
      ...prev,
      station: {id: ''}
    }));
  };

  const handleFilterChange = (stationId: string, filter: string) => {
    setConfig((prev) => ({
      ...prev,
      filter: filter
    }));
  };

  const handleAmountChange = (amount: number) => {
    setConfig((prev) => ({
      ...prev,
      amount: amount
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

  const boardUrl = configToURL(config);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter' && searchResults.length > 0) {
      handleSetStation(searchResults[0]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(boardUrl);
  };

  const normTransportType = (label: string) => label.toLowerCase().replace(/[^a-z]/g, '');

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
    >
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Station Search */}
        
        {config.station.id.length == 0 && (<div className="relative">
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
          {stationSearch && searchResults.length > 0 && (
            <div className='absolute bg-white border border-gray-300 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto'>
              {searchResults.map((station) => (
                <div
                  key={station.id}
                  className='p-2 hover:bg-gray-100 cursor-pointer'
                  onClick={() => handleSetStation(station)}
                  >
                    {station.name}
                    <p className='text-sm text-gray-600'> {station.place}</p>
                </div>
              ))}
            </div>
          )}
        </div>)}

        {/* Added Stations List (Example) */}
        {config.station.id.length != 0 && (<div className="space-y-4">
            <div
              key={config.station.id}
              className='border rounded-lg p-4 space-y-3 bg-gray-50'
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{config.station.name ?? config.station.id}</span>
                <button
                  className="text-red-500 hover:underline transition"
                  onClick={() => handleRemoveStation()}
                >
                  Remove
                </button>
              </div>

              {/* Label + help button */}
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-gray-600">Exclusion Filters</p>
                {/* Tooltip block */}
                <div className="relative inline-block group">
                  <button
                    type="button"
                    className="text-xs bg-gray-300 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center font-bold hover:bg-gray-400"
                  >
                    ?
                  </button>
                  <div className="absolute z-10 hidden group-hover:block left-6 top-1 bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
                    Exclude certain departures from the departure board<br />
                    Format: <code>line:destination</code><br />
                    Use <code>*</code> as wildcard<br />
                    Separate filters with <code>;</code>
                  </div>
                </div>
              </div>

              {/* Input itself */}
              <input
                type="text"
                value={config.filter}
                onChange={(e) => handleFilterChange(config.station.id, e.target.value)}
                placeholder="e.g. U2:Feldmoching;170:Kieferngarten"
                className="w-full border rounded-md p-2 text-sm font-mono"
              />

            </div>
        </div>)}

        {/* Global Settings */}
        <div className="space-y-4">
          {/* Dark/Light Mode Switch */}
          <div className="flex items-center space-x-2">
            <span>Light</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={!config.darkMode} className="sr-only peer" onChange={(e)=>handleDarkMode(!e.target.checked)}/>
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer dark:bg-gray-700 peer-checked:bg-gray-300 transition"></div>
            </label>
            <span>Dark</span>
          </div>

          {/* Titlebar */}
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
