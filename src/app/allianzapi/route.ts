import { NextResponse } from "next/server";
import axios from "axios";

interface Team {
    teamId: number;
    teamName: string;
    shortName: string;
    teamIconUrl: string;
}

interface Match {
    matchID: number;
    matchDateTime: string;
    leagueName: string;
    team1: Team;
    team2: Team;
    matchDateTimeUTC: string;
}

interface Response {
    leagueName: string;
    team1: string;
    team2: string;
    team1Icon: string;
    team2Icon: string;
    matchDateTime: string;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') ? searchParams.get('date') : new Date().toISOString().split('T')[0];
        const teamId = searchParams.get('team') ? searchParams.get('team') : "40";
        const response = await axios.get(`https://api.openligadb.de/getmatchesbyteamid/${teamId}/0/1`);
        const data: Match[] = response.data;

        const filteredMatches = data.filter(match => {
            const matchDate = match.matchDateTime.split('T')[0];
            return matchDate === date && match.team1.teamId.toString() === teamId;
        });
        console.log(data);
        console.log(filteredMatches);

        const result: Response[] = filteredMatches.map(match => ({
            leagueName: match.leagueName,
            team1: match.team1.teamName,
            team2: match.team2.teamName,
            team1Icon: match.team1.teamIconUrl,
            team2Icon: match.team2.teamIconUrl,
            matchDateTime: match.matchDateTime
        }));
        return NextResponse.json(result);

        console.log(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: 'An error occured while fetching data.'}, {status: 500});
    }
}