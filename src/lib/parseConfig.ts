import { Config, LineDest, Station } from "@/types/types";
import { ReadonlyURLSearchParams } from "next/navigation";


export const defaultConfig = {
    station: {id: ''},
    amount: 5,
    darkMode: false,
    titleBar: "no",
    includeFilters: [],
    excludeFilters: []
};

function parseIntOrDefault(input: string | null | undefined, defaultValue: number) {
    return input ? parseInt(input): defaultValue;
}

function encodeFilters(filters: LineDest[]): string {
  return filters
    .map(f => `${f.line}:${f.destination}`)
    .join(";");
}

function decodeFilters(str: string | null): LineDest[] {
  if(!str) return [];
  return str
    .split(";")
    .filter(s=>s.length>0)
    .map(p => {
      const [line, destination] = p.split(':');
      return { line, destination };
    });
}

export function searchParamToConfig(searchParams: ReadonlyURLSearchParams): Config {
    return {
      station: {id: searchParams.get('station') || ''},
      amount: parseIntOrDefault(searchParams.get('amount'), defaultConfig['amount']),
      darkMode: searchParams.get('theme') === 'dark',
      titleBar: searchParams.get('titlebar') || defaultConfig['titleBar'],
      includeFilters: decodeFilters(searchParams.get('include')),
      excludeFilters: decodeFilters(searchParams.get('exclude'))
    };
}

export function configToURL(config: Config): string {
  const q = new URLSearchParams(window.location.search);
  q.set('station', config.station.id);
  q.set('amount', String(config.amount));
  q.set('theme', config.darkMode?"dark":"light");
  q.set('titlebar', config.titleBar);
  q.set('include', encodeFilters(config.includeFilters));
  q.set('exclude', encodeFilters(config.excludeFilters));
  return `${window.location.origin}/board?${q.toString()}`;
}