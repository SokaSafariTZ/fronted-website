"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, Badge, EmptyState, Spinner } from "@/components/ui";
import type { BookingDetail } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeatInfo {
  id: string;
  number: string;
  row: number;
  col: string;
  fareClass: string;
  status: "available" | "occupied";
  position: string;
}

interface SeatMapData {
  tripId: string;
  mode: "flights" | "buses";
  vehicle: string;
  serviceNumber: string;
  operator: { name: string; logoColor: string };
  origin: { city: string; code: string };
  destination: { city: string; code: string };
  departAt: string;
  layout: { rows: number; cols: string[]; aisleAfterCol: string; premiumRows: number };
  seats: SeatInfo[];
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchBookings(): Promise<BookingDetail[]> {
  const res = await fetch("/api/v1/admin/bookings");
  if (!res.ok) throw new Error("Failed to load bookings");
  return (await res.json()).data;
}

async function fetchSeatMap(tripId: string): Promise<SeatMapData> {
  const res = await fetch(`/api/v1/trips/${encodeURIComponent(tripId)}/seats`);
  if (!res.ok) throw new Error("Failed to load seat map");
  return (await res.json()).data;
}

// ── Seat Map Grid ─────────────────────────────────────────────────────────────

const FARE_COLORS: Record<string, string> = {
  vip: "#F59E0B",
  business: "#6366F1",
  first: "#8B5CF6",
  standard: "#10B981",
  economy: "#3B82F6",
};

function SeatGrid({
  seatMap,
  manifest,
}: {
  seatMap: SeatMapData;
  manifest: Map<string, { pnr: string; passengerName: string }>;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { layout, seats } = seatMap;
  const byNumber = new Map(seats.map((s) => [s.number, s]));

  const rows: React.ReactElement[] = [];

  for (let row = 1; row <= layout.rows; row++) {
    const isLastRow = !seatMap.mode.includes("flights") && row === layout.rows;
    const rowCols = isLastRow ? [...layout.cols, "E"] : layout.cols;
    const isPremiumRow = row <= layout.premiumRows;
    const aisleIdx = layout.cols.indexOf(layout.aisleAfterCol);

    if (row === layout.premiumRows + 1) {
      rows.push(
        <div key="divider" className="my-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
          <div className="h-px flex-1 bg-line" />
          <span>Standard cabin</span>
          <div className="h-px flex-1 bg-line" />
        </div>,
      );
    }

    const cells = rowCols.map((col, ci) => {
      const num = `${row}${col}`;
      const seat = byNumber.get(num);
      const info = manifest.get(num);
      const isOccupied = seat?.status === "occupied" || !!info;
      const fareColor = seat ? FARE_COLORS[seat.fareClass] ?? "#6B7280" : "#6B7280";
      const showAisle = ci === aisleIdx && !isLastRow;

      return (
        <div key={col} className="relative flex items-center">
          {showAisle && <div className="w-4 shrink-0" />}
          <div
            className="relative flex h-9 w-9 cursor-default select-none flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-all"
            style={{
              borderColor: isOccupied ? "transparent" : isPremiumRow ? fareColor + "80" : "#e2e8f0",
              backgroundColor: isOccupied ? (isPremiumRow ? fareColor + "30" : "#e2e8f0") : "transparent",
              color: isOccupied ? (isPremiumRow ? fareColor : "#6b7280") : "#94a3b8",
            }}
            onMouseEnter={() => info && setHovered(num)}
            onMouseLeave={() => setHovered(null)}
            title={info ? `${info.passengerName} · ${info.pnr}` : isOccupied ? "Occupied" : "Available"}
          >
            <span>{col}</span>
            {isOccupied && (
              <div
                className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-white"
                style={{ backgroundColor: fareColor }}
              />
            )}
          </div>
          {/* Tooltip */}
          {hovered === num && info && (
            <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-canvas px-2.5 py-1.5 shadow-lg">
              <p className="text-[11px] font-semibold text-title">{info.passengerName}</p>
              <p className="font-mono text-[10px] text-primary">{info.pnr}</p>
            </div>
          )}
        </div>
      );
    });

    rows.push(
      <div key={row} className="flex items-center gap-1">
        <span className="w-6 text-right text-[10px] text-muted">{row}</span>
        <div className="flex gap-1">{cells}</div>
      </div>,
    );
  }

  return (
    <div className="space-y-1">
      {/* Column headers */}
      <div className="flex items-center gap-1 pb-1">
        <span className="w-6" />
        <div className="flex gap-1">
          {layout.cols.map((col, ci) => (
            <div key={col} className="relative flex items-center">
              {ci === layout.cols.indexOf(layout.aisleAfterCol) && <div className="w-4 shrink-0" />}
              <div className="flex h-9 w-9 items-center justify-center text-[11px] font-bold text-subtitle">{col}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle / cockpit header */}
      <div className="mb-2 ml-7 flex items-center justify-center rounded-xl border border-dashed border-line py-2 text-xs text-muted">
        {seatMap.mode === "flights" ? "✈ Cockpit" : "🚌 Driver"}
      </div>

      {rows}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(FARE_COLORS).map(([cls, color]) => (
          <div key={cls} className="flex items-center gap-1.5">
            <div className="size-3 rounded" style={{ backgroundColor: color + "30", border: `1.5px solid ${color}80` }} />
            <span className="text-[11px] capitalize text-subtitle">{cls}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded border border-transparent bg-[#e2e8f0]" />
          <span className="text-[11px] text-subtitle">Available</span>
        </div>
      </div>
    </div>
  );
}

// ── Trip Seat Panel ───────────────────────────────────────────────────────────

function TripSeatPanel({ tripId, bookings }: { tripId: string; bookings: BookingDetail[] }) {
  const { data: seatMap, isLoading } = useQuery({
    queryKey: ["seat-map", tripId],
    queryFn: () => fetchSeatMap(tripId),
  });

  // Build manifest from bookings: seat_number → passenger info
  const manifest = new Map<string, { pnr: string; passengerName: string }>();
  for (const b of bookings.filter((b) => b.tripId === tripId)) {
    for (const p of b.passengers) {
      if (p.seatNumber) {
        manifest.set(p.seatNumber, { pnr: b.pnr, passengerName: p.fullName });
      }
    }
  }

  const bookedSeats = bookings
    .filter((b) => b.tripId === tripId)
    .flatMap((b) => b.passengers.filter((p) => p.seatNumber));

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-subtitle">
        <Spinner /> Loading seat map…
      </div>
    );
  }

  if (!seatMap) return <p className="p-6 text-sm text-muted">Could not load seat map.</p>;

  return (
    <div className="p-6">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Route</p>
          <p className="font-semibold text-title">
            {seatMap.origin.city} ({seatMap.origin.code}) → {seatMap.destination.city} ({seatMap.destination.code})
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Departure</p>
          <p className="font-semibold text-title">
            {new Date(seatMap.departAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Vehicle · Service</p>
          <p className="font-semibold text-title">{seatMap.vehicle} · {seatMap.serviceNumber}</p>
        </div>
      </div>

      {bookedSeats.length === 0 && (
        <p className="mb-4 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-subtitle">
          No seats selected by passengers yet — seat numbers appear when passengers choose seats at booking.
        </p>
      )}

      <div className="overflow-x-auto">
        <SeatGrid seatMap={seatMap} manifest={manifest} />
      </div>

      {bookedSeats.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Seat Manifest</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {bookings
              .filter((b) => b.tripId === tripId)
              .flatMap((b) =>
                b.passengers
                  .filter((p) => p.seatNumber)
                  .map((p) => ({ seat: p.seatNumber!, name: p.fullName, pnr: b.pnr, fareClass: p.fareClass })),
              )
              .map(({ seat, name, pnr, fareClass }) => (
                <div key={seat} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: FARE_COLORS[fareClass] ?? "#6B7280" }}
                  >
                    {seat}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-title">{name}</p>
                    <p className="font-mono text-[11px] text-primary">{pnr}</p>
                  </div>
                  <Badge tone="neutral" className="ml-auto shrink-0 capitalize">{fareClass}</Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTrips() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: fetchBookings,
  });

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  // Group bookings by trip ID
  const tripMap = new Map<string, BookingDetail[]>();
  for (const b of bookings ?? []) {
    if (!tripMap.has(b.tripId)) tripMap.set(b.tripId, []);
    tripMap.get(b.tripId)!.push(b);
  }

  const tripIds = [...tripMap.keys()];

  return (
    <>
      <AdminHeader
        title="Trips & Seats"
        subtitle="Live seat maps for trips that have bookings. Hover a filled seat to see the passenger."
      />
      <div className="flex min-h-0 gap-0 p-6">
        {/* Trip list */}
        <div className="w-64 shrink-0 space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-subtitle">
              <Spinner /> Loading…
            </div>
          )}
          {!isLoading && tripIds.length === 0 && (
            <EmptyState title="No bookings yet" subtitle="Trips appear here once passengers book." />
          )}
          {tripIds.map((tripId) => {
            const bs = tripMap.get(tripId)!;
            const first = bs[0];
            const seatedCount = bs.flatMap((b) => b.passengers.filter((p) => p.seatNumber)).length;
            const isSelected = selectedTrip === tripId;
            return (
              <button
                key={tripId}
                onClick={() => setSelectedTrip(tripId)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/5 text-title"
                    : "border-line bg-canvas text-subtitle hover:border-primary/40 hover:bg-primary/3"
                }`}
              >
                <p className="text-[13px] font-semibold text-title">
                  {first.trip.origin.code} → {first.trip.destination.code}
                </p>
                <p className="mt-0.5 text-[11px] capitalize text-muted">{first.mode}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-subtitle">{bs.length} booking{bs.length !== 1 ? "s" : ""}</span>
                  {seatedCount > 0 && (
                    <Badge tone="info">{seatedCount} seated</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Seat map panel */}
        <div className="ml-4 min-w-0 flex-1">
          {selectedTrip ? (
            <Card className="p-0">
              <TripSeatPanel tripId={selectedTrip} bookings={bookings ?? []} />
            </Card>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted">
              Select a trip to view its seat map
            </div>
          )}
        </div>
      </div>
    </>
  );
}
