import { Config, Departure } from "@/types/config"

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars
    .replace(/\\\*/g, '.*');                // Convert * → .*
  return new RegExp('^' + escaped + '$', 'i');
}

function matchFilter(filterString: string, departure: Departure): boolean {
  const filters = filterString.split(";").map(f => f.trim()).filter(Boolean);

  return filters.some(filter => {
    const [labelPattern, destPattern] = filter.split(":");
    if (!labelPattern || !destPattern) return false;

    const labelRegex = wildcardToRegex(labelPattern);
    const destRegex = wildcardToRegex(destPattern);

    return labelRegex.test(departure.transportLabel) &&
           destRegex.test(departure.transportDestination);
  });
}

export async function fetchDepartures(config: Config): Promise<Departure[]> {
  return fetchDeparturesWithLimit(config, 60);
}

export async function fetchDeparturesWithLimit(config: Config, limit: number): Promise<Departure[]> {
    try {
        const departures = (await Promise.all(
            config.stations.map(async (station): Promise<Departure[]> => {
              const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${station.id}&limit=${limit}`);
              const data = await response.json();
              return data.map((entry: any) => ({
                departureStation: station.id,
                departureTime: new Date(entry.realtimeDepartureTime),
                transportType: entry.transportType,
                transportLabel: entry.label,
                transportDestination: entry.destination
              })).filter((departure: Departure)=> !matchFilter(station.filter, departure) && departure.departureTime.getTime() > new Date().getTime())
            })
          )).flat()
            .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime())
            .slice(0, config.amount); 
        if(departures.length < config.amount) {
          return await fetchDeparturesWithLimit(config, limit*2);
        } 
        return departures;
    } catch (error) {
        console.error("Fetch failed:", error);
        throw new Error('Failed to fetch departures');
    }
    return [];
}