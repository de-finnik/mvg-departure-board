import { Config, Station } from "@/types/config";
import { ReadonlyURLSearchParams } from "next/navigation";


const baseUrl = 'http://localhost:3000';

export const defaultConfig = {
    stations: [],
    displayName: '',
    amount: 5,
    refresh: 30,
    darkMode: false,
    accent: '#068ce0'
};

export function parseStations(input: string): Station[] {
    if (!input) return [];
    return input.split('|').map(part => {
      const [id, filterRaw, runTimeRaw] = part.split('~');
      return {
        id,
        runTime: parseInt(runTimeRaw ?? '0'),
        filter: filterRaw ? decodeURIComponent(filterRaw) : ""
      };
    });
}

function parseIntOrDefault(input: string | null | undefined, defaultValue: number) {
    return input ? parseInt(input): defaultValue;
}

export function searchParamToConfig(searchParams: ReadonlyURLSearchParams): Config {
    return {
      displayName: searchParams.get('title') || defaultConfig['displayName'],
      refresh: parseIntOrDefault(searchParams.get('refresh'), defaultConfig['refresh']),
      darkMode: searchParams.get('theme') === 'dark',
      amount: parseIntOrDefault(searchParams.get('amount'), defaultConfig['amount']),
      accent: searchParams.get('accent') || defaultConfig['accent'],
      stations: parseStations(searchParams.get('stations') || ''),
    };
}

export function configToURL(config: Config): string {
  const stationsString = encodeURIComponent(config.stations
    .map(
      (station) =>
        `${station.id}~${station.filter}~${station.runTime}`
    )
    .join('|'));

  return `${baseUrl}/board?title=${encodeURIComponent(config.displayName)}&stations=${stationsString}&amount=${config.amount}&refresh=${config.refresh}&accent=${encodeURIComponent(config.accent)}&theme=${config.darkMode?'dark':'light'}`;
}