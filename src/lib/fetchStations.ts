import { Station } from "@/types/types";

export const fetchStations = async (): Promise<Station[]> => {
    try {
        const response = await fetch("https://www.mvg.de/.rest/zdm/stations");
        const data = await response.json();
        const stations = data
            .map((entry: any) => ({
                displayName: entry.name,
                id: entry.id, 
                place: entry.place,
                runTime: 300,
                filter: "",
            }));
        return stations;
    } catch (error) {
        throw new Error('Failed to fetch stations');
    }
};