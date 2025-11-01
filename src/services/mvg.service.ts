import { Config, Departure, LineDest, Station } from "@/types/types";

type SubscriberCallback = () => void;

export async function fetchStations(searchString: string): Promise<Station[]> {
    const response = await fetch(`https://www.mvg.de/api/bgw-pt/v3/locations?query=${encodeURIComponent(searchString)}&locationTypes=STATION`);
    const data = await response.json();
    const stations: Station[] = [];
    for(const entry of data) {
        const station: Station = {
            name: entry.name,
            id: entry.globalId, 
            place: entry.place  

        }
        stations.push(station);
    }
    return stations;
}

class MvgService {
    private static instance: MvgService;

    private stationId: string | null = null;
    private departures: Departure[] = [];
    private error: Error | null = null;

    private apiRequestsCount = 0;
    private lastFullRefresh: Date | null = null;
    private isFetching = false;


    private subscribers: SubscriberCallback[] = [];

    private constructor() {}

    public static getInstance(): MvgService {
        if(!MvgService.instance) {
            MvgService.instance = new MvgService();
        }
        return MvgService.instance;
    }

    public subscribe(callback: SubscriberCallback): () => void {
        this.subscribers.push(callback);

        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private _notify() {
        this.subscribers.forEach(callback => callback());
    }

    public initialize(stationId: string) {
        if (this.stationId === stationId) return;

        console.log(`MvgService: Initializing for station with id: ${stationId}`);
        this.stationId = stationId;
        this.departures = [];

        this._backgroundRefresh();
        setInterval(() => this._backgroundRefresh(), 60000);
    }

    private resetCache() {
        this.departures = [];
    }

    private async _backgroundRefresh() {
        if (!this.stationId || this.isFetching) return;

        console.log("MvgService: starting background refresh");
        this.resetCache();
        await this._fetchAndAppendRawData(0);
        this.lastFullRefresh = new Date();
        this._notify();
    }

    public triggerRefresh() {
        this._backgroundRefresh();
    }

    // Rewrite some Line Names because they are too long
    private filterLine(line: string): string {
        if(line === "LUFTHANSA EXPRESS BUS") {
            return "LH";
        }
        return line;
    }

    private async _fetchAndAppendRawData(offset: number) {
        if (!this.stationId || this.isFetching) return;

        this.isFetching = true;
        try {
            const url = `https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${this.stationId}&offsetInMinutes=${offset}&transportTypes=UBAHN,REGIONAL_BUS,BUS,TRAM,SBAHN,BAHN`;
            const response = await fetch(url);
            const data = await response.json();

            this.apiRequestsCount++;
            console.log(`MvgService: api request #${this.apiRequestsCount} successful`);
            this.error = null;
            
            if (data && data.length > 0) {
                for (const entry of data) {
                    if(entry.cancelled) {
                        continue;
                    }
                    const departure: Departure = {
                        linedest: {
                            line: this.filterLine(entry.label),
                            destination: entry.destination
                        },
                        time: new Date(entry.realtimeDepartureTime)
                    };
                    // Departure in the past
                    if(departure.time.getTime() < new Date().getTime() + 10000) {
                    continue;
                    }

                    // Departure already in the list?
                    if(this.departures.some(
                        d=>d.time.getTime() === departure.time.getTime() && 
                        d.linedest.destination === departure.linedest.destination && 
                        d.linedest.line === departure.linedest.line)) {
                        continue;
                    }
                    this.departures.push(departure);
                }
            }
        } catch (error) {
            console.error("MvgService: error fetching from mvg:", error);
            if (error instanceof Error) {
                this.error = error;
            }
        } finally {
            this.isFetching = false;
        }
    }

    public getDepartures(config: Config): Departure[] | Error {
        if(this.error !== null) {
            return this.error;
        }

        return this.departures.filter(d => {
            if(config.excludeFilters.some(this._filterTestDep(d.linedest))) {
                return false;
            }
            if(config.includeFilters.length !== 0) {
                return config.includeFilters.some(this._filterTestDep(d.linedest));
            }
            return true;
        });
    }

    public getAvailableLines(): LineDest[] {
        const lines: LineDest[] = [];
        this.departures.forEach(d=>{
            if(!lines.some(ld => ld.destination === d.linedest.destination && ld.line === d.linedest.line)) {
                lines.push(d.linedest);
            }
        });
        return lines;
    }

    private _filterTestDep(departure: LineDest) {
        return (filter: LineDest): boolean => {
            return new RegExp(filter.destination.replaceAll("*", ".*")).test(departure.destination) && new RegExp(filter.line.replaceAll("*", ".*")).test(departure.line);
        }
    }

}

export const mvgService = MvgService.getInstance();