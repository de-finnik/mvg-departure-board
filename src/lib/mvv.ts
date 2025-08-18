import { Station, LineDest } from "@/types/types"
import { load } from "cheerio";

// somewhere in your component
export async function fetchDepartingLines(station: Station) {
  const url = `/api/departing-lines?stationId=${station.id}&stationName=${encodeURIComponent(station.name ?? '')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<LineDest[]>;
}

export async function mvvFetchDepartingLines(station: Station): Promise<LineDest[]> {
    console.log(station.name);
    let response = await fetch(`https://efa.mvv-muenchen.de/ng/XML_STOPFINDER_REQUEST?macro_sf=mvv&type_sf=any&name_sf=${station.name}`);
    const data = await response.json();
    let id = null;
    for(const point of data.stopFinder.points) {
        if(point.ref.gid === station.id) {
            id = point.ref.id;
        }
    }
    if(id === null) {
        return Promise.reject(new Error("No id found"));
    }
    response = await fetch(`https://efa.mvv-muenchen.de/xhr_departures?type_dm=any&name_dm=${id}&zope_command=enquiry%3Aselect_lines`) 
    
    const document = load(await response.text());
    document().text();
    const results: LineDest[] = []

    document('.line_sel_list label').each((_, el) => {
        const line = document(el).find('.line').text().trim()
        const destination = document(el)
            .clone()                     // clone to safely modify
            .children()                 // remove child elements (e.g., <span>, <input>)
            .remove()
            .end()
            .text()
            .trim()

        if (line && destination) {
            results.push({
                line: line,
                destination: destination
            });
        }
    })
    return results;
}