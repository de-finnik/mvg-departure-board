export type StationConfig = {
    id: string;
    displayName?: string;
    place?: string;
    types: string[]; // available types: ubahn, bus, tram, sbahn
    runTime: number; // stored in seconds
};

// Get parameters:
// title: displayName
// stations: stringified stations array (name:ubahn,bus:100|name2:tram:200)
// amount: amount
// refresh: refresh
// darkMode: theme (dark if true else light)
export type Config = {
    stations: StationConfig[];
    displayName: string;
    amount: number;
    refresh: number;
    darkMode: boolean;
    accent: string;
};