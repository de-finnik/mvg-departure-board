export type Station = {
    id: string;
    displayName?: string;
    place?: string;
    filter: string;
    runTime: number; // stored in seconds
};

// Get parameters:
// title: displayName
// stations: stringified stations array (name:ubahn,bus:100|name2:tram:200)
// amount: amount
// refresh: refresh
// darkMode: theme (dark if true else light)
export type Config = {
    stations: Station[];
    displayName: string;
    amount: number;
    refresh: number;
    darkMode: boolean;
    accent: string;
};

export type Departure = {
    departureStation: string;
    departureTime: Date;
    transportType: string;
    transportLabel: string;
    transportDestination: string;
}