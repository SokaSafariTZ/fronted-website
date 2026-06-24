# SokaSafari Travel — Web (Flights & Buses)

The public booking website **and** admin dashboard for SokaSafari Travel, plus a
versioned REST API. Two booking modes — **Flights** and **Buses** — share one
search → select → pay → ticket flow. Theme is matched to the SokaSafari Expo app
(dark canvas, blue primary, gold/amber accent).

Built with **Next.js 16 (App Router) + TypeScript + Tailwind v4**, **Supabase**
(optional), **TanStack Query**, and **zod**.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Runs out of the box against an **in-memory seed driver** — no database required.

### Admin portals (`/admin`)

Three role-scoped portals share the same login page. Select a portal card, then sign in:

| Portal | Email | Password | Access |
|---|---|---|---|
| Main Admin | `admin@sokasafari.co.tz` | `sokasafari2026!` | Full platform — all pages |
| Air Tanzania | `airtanzania@sokasafari.co.tz` | `airtanzania2026!` | Flight bookings & routes only |
| Dar Express | `darexpress@sokasafari.co.tz` | `darexpress2026!` | Bus bookings & routes only |

Override any credential via `.env.local` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FLIGHT_EMAIL`, `FLIGHT_PASSWORD`, `BUS_EMAIL`, `BUS_PASSWORD`).

## Data: in-memory now, Supabase-ready

- The catalog (locations, operators, routes) lives in `lib/data/catalog.ts`.
- Trips, fares and seat maps are **generated deterministically** per search date
  in `lib/data/trips.ts` (identical searches return identical results).
- Bookings persist in a process-level store (`lib/data/store.ts`) — they reset
  when the dev server restarts.
- To go database-backed: create a Supabase project, run `supabase/schema.sql`
  then `supabase/seed.sql`, and set `NEXT_PUBLIC_SUPABASE_*` in `.env.local`.

## Pages

| Route | Purpose |
|---|---|
| `/` | Home — Flights/Buses mode switcher + search |
| `/search` | Results with sort & price filter |
| `/book/[tripId]` | Fare + seat selection + traveller details |
| `/checkout` | Mock payment (card / mobile money / wallet) |
| `/confirmation/[ref]` | Boarding-pass ticket |
| `/manage` | Find a booking by PNR |
| `/admin` | Dashboard (auth) |
| `/admin/bookings` `/operators` `/locations` `/routes` | Management |

## REST API (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/catalog?mode=` | locations, operators, popular routes |
| GET | `/search?mode=&from=&to=&date=&passengers=` | available trips |
| GET | `/trips/:id` | trip detail + fares + seat map |
| POST | `/bookings` | create a booking (returns PNR) |
| GET | `/bookings/:ref` | booking by id or PNR |
| POST | `/payments` | mock-charge a booking |
| GET | `/admin/bookings` | all bookings (auth) |
| PATCH | `/admin/bookings/:ref` | update status (auth) |
| GET/POST | `/admin/operators` · `/admin/locations` | list / create (auth) |
| PATCH/DELETE | `/admin/operators/:id` · `/admin/locations/:id` | update / delete (auth) |

Example:

```bash
curl "http://localhost:3000/api/v1/search?mode=flights&from=NBO&to=CMN&date=2026-07-01&passengers=1"
```

## Project layout

```
app/                 public pages, admin pages, api/v1 route handlers
components/           UI kit, SearchForm, TripCard, SeatMap, Ticket, admin
lib/data/            catalog (seed), trips (generator), store (bookings)
lib/                 types, validation (zod), api helpers, auth, supabase
supabase/            schema.sql + seed.sql (production path)
```
