'use client';

import { useState } from 'react';

export default function ConfiguratorPage() {
  const [accentColor, setAccentColor] = useState('#068ce0');

  // For now: example URL (later dynamically generated)
  const boardUrl = `/board?stations=123:ubahn,bus:5&refresh=60&theme=dark&amount=10&accent=${encodeURIComponent(accentColor)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(boardUrl);
  };

  return (
    <div
      style={{ '--accent': accentColor } as React.CSSProperties}
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
    >
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 space-y-6">


        {/* Board Title Input */}
        <input
          type="text"
          placeholder="Board title (optional)"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
        />

        {/* Station Search */}
        <div className="flex">
          <input
            type="text"
            placeholder="Search station..."
            className="flex-grow border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          <button
            style={{ backgroundColor: 'var(--accent)' }}
            className="text-white px-4 rounded-r-md hover:opacity-90 transition"
          >
            Add
          </button>
        </div>

        {/* Added Stations List (Example) */}
        <div className="space-y-4">
          {/* Example Station Card */}
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Station Name Example</span>
              <button
                className="text-red-500 hover:underline transition"
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
            <div>
              <input
                type="number"
                placeholder="Time to run (min)"
                className="w-40 border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="space-y-4">
          {/* Refresh Rate */}
          <div>
            <input
              type="range"
              min="10"
              max="300"
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <p className="text-sm text-gray-600">Refresh rate (seconds)</p>
          </div>

          {/* Dark/Light Mode Switch */}
          <div className="flex items-center space-x-2">
            <span>Light</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer dark:bg-gray-700 peer-checked:bg-[var(--accent)] transition"></div>
            </label>
            <span>Dark</span>
          </div>

          {/* Number of Entries */}
          <div>
            <input
              type="number"
              placeholder="Number of entries to display"
              className="w-65 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Accent Color Picker */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#Accent color"
            className="border border-gray-300 rounded-md p-2 w-25 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 border-0 p-0 cursor-pointer"
          />
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
          className="w-full text-white py-3 rounded-md hover:opacity-90 transition"
        >
          Launch Departure Board
        </button>

      </div>
    </div>
  );
}
