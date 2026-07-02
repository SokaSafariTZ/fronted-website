import type { Fare, FareClass, Seat, SeatLayout, SeatPosition, Trip, TripWithRefs } from "@/lib/types";
import {
  AIRCRAFT,
  BUS_AMENITIES,
  COACHES,
  FLIGHT_AMENITIES,
  getLocationByCode,
  getLocationById,
  getOperatorById,
  ROUTES,
  type RouteDef,
} from "@/lib/data/catalog";

// Small deterministic PRNG so identical searches return identical trips
// (no DB required) while still looking varied.
function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Trip id encodes everything needed to regenerate it without storage.
function encodeTripId(route: RouteDef, date: string, slot: number, opId: string) {
  return `${route.mode === "flights" ? "fl" : "bs"}_${route.originCode}_${route.destCode}_${date}_${slot}_${opId}`;
}

export function decodeTripId(id: string) {
  // IDs may contain hyphens in codes (e.g. DAR-BT), so split on first 2 underscores
  // and last 2 underscores; the middle is origin_dest.
  const parts = id.split("_");
  if (parts.length < 6) return null;
  const prefix = parts[0];
  const mode = prefix === "fl" ? "flights" : "buses";

  // Reconstruct: last two parts are slot and opId; everything between prefix and those is origin_dest_date
  // Format: fl_DAR_ZNZ_2026-07-01_0_op-tc  → 6 parts
  // Format: bs_DAR-BT_ARU-BT_2026-07-01_0_op-ke → 8 parts (DAR-BT splits into DAR + BT)
  // Use a smarter approach: the slot is always a pure number, opId starts with "op-"
  const slotIdx = parts.findLastIndex((p) => /^\d+$/.test(p));
  if (slotIdx < 2) return null;

  const slot = Number(parts[slotIdx]);
  const opId = parts.slice(slotIdx + 1).join("_");
  const date = parts[slotIdx - 1];
  const origin = parts.slice(1, slotIdx - 1 - 1).join("-").replace(/-BT$/, "-BT"); // rejoin hyphenated codes
  const dest   = parts.slice(slotIdx - 1 - 1, slotIdx - 1)[0]; // see below

  // Simpler rebuild: we know the route from matching against ROUTES
  const inner = parts.slice(1, slotIdx - 1); // everything between prefix and date
  // inner might be: ["DAR","ZNZ"] or ["DAR","BT","ARU","BT"] depending on how hyphens split
  // Reconstruct by matching against known routes
  const route = ROUTES.find((r) => {
    const encoded = encodeTripId(r, date, slot, opId);
    return encoded === id;
  });
  if (!route) {
    // Fallback: match by scanning all routes that fit the prefix + date + slot + op
    const fallback = ROUTES.find((r) => {
      if (r.mode !== mode) return false;
      if (!r.operatorIds.includes(opId)) return false;
      const candidate = encodeTripId(r, date, slot, opId);
      return candidate === id;
    });
    if (!fallback) return null;
    return { route: fallback, date, slot, opId };
  }
  return { route, date, slot, opId };
}

function buildTrip(route: RouteDef, date: string, slot: number, opId: string): Trip {
  const id = encodeTripId(route, date, slot, opId);
  const rnd = mulberry32(hashSeed(id));
  const origin = getLocationByCode(route.originCode)!;
  const dest = getLocationByCode(route.destCode)!;

  const startHour = 6 + Math.floor((slot / route.daily) * 14); // 06:00 → ~20:00
  const startMin = [0, 15, 30, 45][Math.floor(rnd() * 4)];
  const departAt = new Date(`${date}T00:00:00Z`);
  departAt.setUTCHours(startHour, startMin, 0, 0);
  const arriveAt = new Date(departAt.getTime() + route.minutes * 60000);

  const op = getOperatorById(opId)!;
  const isFlight = route.mode === "flights";
  const totalSeats = isFlight ? 150 + Math.floor(rnd() * 40) : 44 + Math.floor(rnd() * 12);
  const seatsAvailable = Math.max(2, Math.floor(totalSeats * (0.15 + rnd() * 0.6)));
  const priceJitter = 0.85 + rnd() * 0.4;

  return {
    id,
    mode: route.mode,
    operatorId: opId,
    originId: origin.id,
    destinationId: dest.id,
    departAt: departAt.toISOString(),
    arriveAt: arriveAt.toISOString(),
    vehicle: isFlight
      ? AIRCRAFT[Math.floor(rnd() * AIRCRAFT.length)]
      : COACHES[Math.floor(rnd() * COACHES.length)],
    serviceNumber: `${op.code}${100 + Math.floor(rnd() * 800)}`,
    stops: route.stops,
    basePrice: Math.round(route.basePrice * priceJitter),
    currency: "USD",
    totalSeats,
    seatsAvailable,
    amenities: isFlight ? FLIGHT_AMENITIES : BUS_AMENITIES,
  };
}

export function hydrate(trip: Trip): TripWithRefs {
  return {
    ...trip,
    operator: getOperatorById(trip.operatorId)!,
    origin: getLocationById(trip.originId)!,
    destination: getLocationById(trip.destinationId)!,
    durationMinutes: Math.round(
      (new Date(trip.arriveAt).getTime() - new Date(trip.departAt).getTime()) / 60000,
    ),
  };
}

export function getTrip(id: string): TripWithRefs | null {
  const decoded = decodeTripId(id);
  if (!decoded) return null;
  return hydrate(buildTrip(decoded.route, decoded.date, decoded.slot, decoded.opId));
}

export interface SearchQuery {
  mode: "flights" | "buses";
  from: string;
  to: string;
  date: string;
}

export function searchTrips(q: SearchQuery): TripWithRefs[] {
  const routes = ROUTES.filter(
    (r) => r.mode === q.mode && r.originCode === q.from && r.destCode === q.to,
  );
  const trips: TripWithRefs[] = [];
  for (const route of routes) {
    for (let slot = 0; slot < route.daily; slot++) {
      const opId = route.operatorIds[slot % route.operatorIds.length];
      trips.push(hydrate(buildTrip(route, q.date, slot, opId)));
    }
  }
  return trips.sort((a, b) => a.departAt.localeCompare(b.departAt));
}

// ── Fares ──────────────────────────────────────────────────────────────────

const FARE_TABLE: Record<
  string,
  { fareClass: FareClass; label: string; mult: number; refundable: boolean; baggageKg: number }[]
> = {
  flights: [
    { fareClass: "economy",  label: "Economy",  mult: 1,   refundable: false, baggageKg: 23 },
    { fareClass: "business", label: "Business", mult: 2.6, refundable: true,  baggageKg: 32 },
    { fareClass: "first",    label: "First",    mult: 4.2, refundable: true,  baggageKg: 40 },
  ],
  buses: [
    { fareClass: "standard", label: "Standard",    mult: 1,   refundable: false, baggageKg: 20 },
    { fareClass: "vip",      label: "VIP Recliner", mult: 1.6, refundable: true,  baggageKg: 30 },
  ],
};

export function getFares(trip: TripWithRefs): Fare[] {
  const rnd = mulberry32(hashSeed(trip.id + "fares"));
  return FARE_TABLE[trip.mode].map((f, i) => ({
    id: `${trip.id}_fare_${f.fareClass}`,
    tripId: trip.id,
    fareClass: f.fareClass,
    label: f.label,
    price: Math.round(trip.basePrice * f.mult),
    refundable: f.refundable,
    baggageKg: f.baggageKg,
    seatsAvailable: Math.max(1, Math.floor(trip.seatsAvailable * (i === 0 ? 0.7 : 0.15))),
  }));
}

// ── Seat maps ──────────────────────────────────────────────────────────────
//
// Bus layout: 4 columns A|B [aisle] C|D — realistic Tanzania coach seating.
// Last row is a bench of 5 (A B C D E) across the full width.
// Flight layout: 6 columns A B C [aisle] D E F.

function getSeatPosition(col: string, cols: string[]): SeatPosition {
  const n = cols.length;
  const i = cols.indexOf(col);
  const mid = Math.floor(n / 2);
  if (n === 4) {
    // Bus: A=window-left, B=aisle-left, C=aisle-right, D=window-right
    const map: Record<string, SeatPosition> = {
      A: "window-left", B: "aisle-left", C: "aisle-right", D: "window-right",
    };
    return map[col] ?? "aisle-left";
  }
  if (n === 6) {
    // Flight ABC|DEF
    const map: Record<string, SeatPosition> = {
      A: "window-left", B: "middle-left", C: "aisle-left",
      D: "aisle-right", E: "middle-right", F: "window-right",
    };
    return map[col] ?? "aisle-left";
  }
  // Fallback for any width
  if (i === 0) return "window-left";
  if (i === n - 1) return "window-right";
  if (i < mid) return i === mid - 1 ? "aisle-left" : "middle-left";
  return i === mid ? "aisle-right" : "middle-right";
}

export interface SeatMapResult {
  layout: SeatLayout;
  seats: Seat[];
}

export function getSeatMap(trip: TripWithRefs, occupiedSeats?: Set<string>): SeatMapResult {
  const rnd = mulberry32(hashSeed(trip.id + "seats"));
  const isFlight = trip.mode === "flights";
  const cols = isFlight ? ["A", "B", "C", "D", "E", "F"] : ["A", "B", "C", "D"];
  const aisleAfterCol = isFlight ? "C" : "B";
  const premiumRows = isFlight ? 3 : 2;

  // For buses, add a 5th back-row column so the last row spans the full width
  const totalRows = Math.ceil(trip.totalSeats / cols.length);

  const seats: Seat[] = [];

  for (let row = 1; row <= totalRows; row++) {
    const rowCols = (!isFlight && row === totalRows) ? [...cols, "E"] : cols;
    for (const col of rowCols) {
      const number = `${row}${col}`;
      const fareClass: FareClass = isFlight
        ? row <= premiumRows ? "business" : "economy"
        : row <= premiumRows ? "vip" : "standard";
      const position = getSeatPosition(col, rowCols);
      seats.push({
        id: `${trip.id}_seat_${number}`,
        tripId: trip.id,
        number,
        row,
        col,
        fareClass,
        position,
        status: occupiedSeats
          ? (occupiedSeats.has(number) ? "occupied" : "available")
          : (rnd() < 0.32 ? "occupied" : "available"),
        priceModifier: 0,
      });
    }
  }

  const layout: SeatLayout = {
    mode: trip.mode,
    rows: totalRows,
    cols,
    aisleAfterCol,
    premiumRows,
    totalSeats: trip.totalSeats,
  };

  return { layout, seats };
}

// Legacy export for callers that only need the seats array
export function getSeatArray(trip: TripWithRefs): Seat[] {
  return getSeatMap(trip).seats;
}
