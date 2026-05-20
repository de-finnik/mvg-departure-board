import { Config, LineDest, TransportType } from "@/types/types";
import { ReadonlyURLSearchParams } from "next/navigation";

export const defaultConfig: Config = {
  station: { id: "" },
  amount: 5,
  darkMode: false,
  titleBar: "",
  includeFilters: [],
  excludeFilters: [],
  excludedTransportTypes: [],
};

function parseIntOrDefault(input: string | null | undefined, def: number) {
  if (!input) return def;
  const n = parseInt(input, 10);
  return Number.isFinite(n) ? n : def;
}

function encodeFilters(filters: LineDest[]): string {
  return filters.map(f => `${f.line}:${f.destination}`).join(";");
}

function decodeFilters(str: string | null): LineDest[] {
  if (!str) return [];
  return str
    .split(";")
    .filter(Boolean)
    .map(p => {
      const [line = "", destination = ""] = p.split(":");
      return { line, destination };
    });
}

const VALID_TRANSPORT_TYPES = new Set<string>(["UBahn", "SBahn", "Tram", "Bus"]);

function decodeTransportTypes(str: string | null): TransportType[] {
  if (!str) return [];
  return str.split(",").filter(t => VALID_TRANSPORT_TYPES.has(t)) as TransportType[];
}

function encodeTransportTypes(types: TransportType[]): string {
  return types.join(",");
}

export function searchParamToConfig(searchParams: ReadonlyURLSearchParams): Config {
  return {
    station: { id: searchParams.get("station") || "" },
    amount: parseIntOrDefault(searchParams.get("amount"), defaultConfig.amount),
    darkMode: searchParams.get("theme") === "dark",
    titleBar: searchParams.get("titlebar") ?? "",
    includeFilters: decodeFilters(searchParams.get("include")),
    excludeFilters: decodeFilters(searchParams.get("exclude")),
    excludedTransportTypes: decodeTransportTypes(searchParams.get("excludeTypes")),
  };
}

export function configToURL(config: Config): string {
  const q = new URLSearchParams(window.location.search);
  q.set("station", config.station.id);
  q.set("amount", String(config.amount));
  q.set("theme", config.darkMode ? "dark" : "light");

  if (config.titleBar) q.set("titlebar", config.titleBar);
  else q.delete("titlebar");

  q.set("include", encodeFilters(config.includeFilters));
  q.set("exclude", encodeFilters(config.excludeFilters));

  if (config.excludedTransportTypes.length > 0) {
    q.set("excludeTypes", encodeTransportTypes(config.excludedTransportTypes));
  } else {
    q.delete("excludeTypes");
  }

  return `${window.location.origin}/board?${q.toString()}`;
}
