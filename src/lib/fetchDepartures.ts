import { Config, Departure, Station, LineDest } from "@/types/types"

function filterTestDep(departure: LineDest) {
  return (filter: LineDest): boolean => {
    return new RegExp(filter.destination.replaceAll("*", ".*")).test(departure.destination) && new RegExp(filter.line.replaceAll("*", ".*")).test(departure.line);
  }
}

export async function fetchDepartures(station: Station, includeFilters: LineDest[], excludeFilters: LineDest[], min: number): Promise<Departure[]> {
    const departures: Departure[] = [];
    let offset = 0;
    outer: while (departures.length < min) {
        const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${station.id}&offsetInMinutes=${offset}`);
        const data = await response.json();
        for (const entry of data) {
            if(entry.cancelled) {
                continue;
            }
            const departure: Departure = {
                linedest: {
                    line: entry.label,
                    destination: entry.destination
                },
                time: new Date(entry.realtimeDepartureTime)
            };
            // Departure in the past
            if(departure.time.getTime() < new Date().getTime() + 10000) {
              continue;
            }
            // Include filters exist and match the departure
            if(includeFilters.length != 0) {
              if(!includeFilters.some(filterTestDep(departure.linedest))) {
                continue;
              }
            }

            // No exclude filter matches the departure
            if(excludeFilters.some(filterTestDep(departure.linedest))) {
              continue;
            }
            

            // Departure already in the list?
            if(departures.some(
                d=>d.time.getTime() === departure.time.getTime() && 
                d.linedest.destination === departure.linedest.destination && 
                d.linedest.line === departure.linedest.line)) {
                continue;
            }
            departures.push(departure);
            if(departures.length == min) {
                break outer;
            }
        }
        const lastDeparture = data[data.length - 1].realtimeDepartureTime;
        const now = Date.now();
        offset = Math.ceil((lastDeparture - now) / 60000);
    }
    return departures;
}