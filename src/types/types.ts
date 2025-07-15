export type Station = {
    id: string;
    name?: string;
    place?: string;
};

// Get parameters:
// title: displayName
// stations: stringified stations array (name:ubahn,bus:100|name2:tram:200)
// amount: amount
// refresh: refresh
// darkMode: theme (dark if true else light)
export type Config = {
    station: Station;
    amount: number;
    darkMode: boolean;
    titleBar: string;
    includeFilters: LineDest[];
    excludeFilters: LineDest[];
};

export type LineDest = {
    line: string;
    destination: string;
}

export type Departure = {
    linedest: LineDest;
    time: Date;
}