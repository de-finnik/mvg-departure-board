import { StationConfig } from "@/types/config";

export const fetchStations = async (): Promise<StationConfig[]> => {
    try {
        const response = await fetch("https://www.mvg.de/.rest/zdm/stations");
        const data = await response.json();
        const stations = data
            .map((entry: any) => ({
                displayName: entry.name,
                id: entry.id, 
                place: entry.place,
                runTime: 300,
                types: entry.products.map((transport: string) => 
                    transport.toLowerCase())
            }));
        return stations;
    } catch (error) {
        throw new Error('Failed to fetch stations');
    }
};