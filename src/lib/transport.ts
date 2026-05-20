export type TransportType = "UBahn" | "SBahn" | "Tram" | "Bus";

const TRAM_NUMBERS = new Set([12, 15, 16, 17, 18, 19, 20, 21, 22, 25, 27, 28, 29, 32, 36]);

export function getTransportType(line: string): TransportType {
    if (/^U[1-9]$/.test(line)) return "UBahn";
    if (/^S[1-8]$/.test(line)) return "SBahn";
    const tramMatch = line.match(/^N?(\d+)$/);
    if (tramMatch && TRAM_NUMBERS.has(Number(tramMatch[1]))) return "Tram";
    return "Bus";
}

export const ALL_TRANSPORT_TYPES: TransportType[] = ["UBahn", "SBahn", "Tram", "Bus"];

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
    UBahn: "U-Bahn",
    SBahn: "S-Bahn",
    Tram: "Tram",
    Bus: "Bus",
};
