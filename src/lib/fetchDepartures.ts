import { Config, Departure } from "@/types/config"

export async function fetchDepartures(config: Config): Promise<Departure[]> {
    try {
        const departures = (await Promise.all(
            config.stations.map(async (station): Promise<Departure[]> => {
              const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${station.id}`);
              const data = await response.json();
              return data.map((entry: any) => ({
                departureStation: station.id,
                departureTime: new Date(entry.realtimeDepartureTime),
                transportType: entry.transportType,
                transportLabel: entry.label,
                transportDestination: entry.destination
              })).filter((departure: Departure)=>station.types.includes(departure.transportType.toLowerCase()));
            })
          )).flat()
            .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime())
            .slice(0, config.amount); 
        return departures;
    } catch (error) {
        console.error("Fetch failed:", error);
        throw new Error('Failed to fetch departures');
    }
    return [];
}