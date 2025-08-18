import { platform } from "os";

export type Station = {
    name: string;
    id: string;
}

export async function fetchStations(searchString: string): Promise<Station[]> {
    const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/locations?query=${encodeURIComponent(searchString)}&locationTypes=STATION`);
    const data = await response.json();
    return data.map((entry: any) => 
        ({
            name: entry.name,
            id: entry.globalId, 
            place: entry.place  
        })
    );
}

export async function fetchDepartures(stationId: string) {
    const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${stationId}&limit=100`);
    const data = await response.json();
    return data;
}

