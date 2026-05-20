# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (Turbopack)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint
```

No test suite is configured.

## Architecture

This is a Next.js 15 app (App Router, React 19, TypeScript strict, Tailwind v4) that renders real-time MVG (Munich public transit) departure boards.

### Two pages

- **`/` (configurator):** Two-step wizard — pick a station, then configure display options and filters. Produces a shareable URL that encodes the full config.
- **`/board` (board):** Reads config from URL search params and renders a live departure board.

### Data flow

1. `MvgService` ([src/services/mvg.service.ts](src/services/mvg.service.ts)) is a singleton that fetches from the MVG public API and re-polls every 60 seconds. It exposes a pub/sub interface (`subscribe`) and a `getDepartures(config)` method that applies include/exclude filters.
2. `DepartureBoardCore` ([src/components/DepartureBoardCore.tsx](src/components/DepartureBoardCore.tsx)) subscribes to the service and re-renders on updates. The clock ticks every second; departures refresh from the service snapshot on each tick.
3. Config is serialized to/from URL params in [src/lib/parseConfig.ts](src/lib/parseConfig.ts).

### Filtering

Two modes, both resolved in `MvgService.getDepartures`:
- **Simple:** Include/exclude pill lists (exact `line:destination` strings).
- **Advanced:** Semicolon-separated wildcard patterns, e.g. `U*:*;S1:Ostbahnhof*`. Wildcards use `*` only.

### URL redirects

`next.config.ts` defines shorthand redirects (e.g. `/glh` → a full board URL with a pre-filled config). Add new shortcuts there.

### Styling

Tailwind v4 — no `tailwind.config.*` file. Configuration lives in [src/styles/globals.css](src/styles/globals.css) via `@import "tailwindcss"`. Line badge colors are hardcoded in [src/lib/colors.ts](src/lib/colors.ts).

### `/allianzapi` route

[src/app/allianzapi/route.ts](src/app/allianzapi/route.ts) is an unrelated sports-data endpoint (OpenLigaDB proxy). It is not used in the main app UI.
