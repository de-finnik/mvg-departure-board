//  ─── /app/api/departing-lines/route.ts ─────────────────────────────
import { NextRequest } from 'next/server';
import { Station } from '@/types/types';
import { mvvFetchDepartingLines } from '@/lib/mvv';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id   = sp.get('stationId') ?? '';
  const name = sp.get('stationName') ?? '';

  if (!id || !name) {
    return new Response('Missing params', { status: 400 });
  }

  try {
    const lines = await mvvFetchDepartingLines({ id, name } as Station);
    return Response.json(lines, {
      // optional SWR‑style caching
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error(err);
    return new Response('MVV fetch failed', { status: 502 });
  }
}
