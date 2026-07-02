/**
 * Seat reservation queries — Supabase-backed.
 * The UNIQUE(trip_id, seat_number) constraint on seat_reservations is the
 * atomic lock; a concurrent insert will throw a 23505 error which callers
 * should convert to a 409 Conflict response.
 */
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export class SeatConflictError extends Error {
  readonly seatNumber: string;
  constructor(seatNumber: string) {
    super(`Seat ${seatNumber} is no longer available`);
    this.seatNumber = seatNumber;
  }
}

/** Returns the set of occupied seat numbers for a given trip. */
export async function getOccupiedSeats(tripId: string): Promise<Set<string>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("seat_reservations")
    .select("seat_number")
    .eq("trip_id", tripId);

  if (error) {
    console.error("[seats] getOccupiedSeats error:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: { seat_number: string }) => r.seat_number));
}

export interface SeatReservationInput {
  tripId: string;
  seatNumber: string;
  bookingId: string;
}

/**
 * Atomically reserves seats. Throws SeatConflictError if any seat is
 * already taken (the UNIQUE constraint fires a 23505 Postgres error).
 */
export async function reserveSeats(inputs: SeatReservationInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const sb = getSupabase();

  const rows = inputs.map((r) => ({
    trip_id: r.tripId,
    seat_number: r.seatNumber,
    booking_id: r.bookingId,
  }));

  const { error } = await sb.from("seat_reservations").insert(rows);

  if (error) {
    if (error.code === "23505") {
      // Extract conflicting seat number from the error detail when possible
      const match = error.details?.match(/\(seat_number\)=\(([^)]+)\)/);
      const seat = match?.[1] ?? inputs[0].seatNumber;
      throw new SeatConflictError(seat);
    }
    throw new Error(`[seats] reserveSeats error: ${error.message}`);
  }
}

/** Remove the seat reservation for a given booking (e.g. on cancellation). */
export async function releaseSeats(bookingId: string): Promise<void> {
  const sb = getSupabase();
  await sb.from("seat_reservations").delete().eq("booking_id", bookingId);
}

/** Returns a map of seat_number → { bookingId, passengerName } for admin views. */
export async function getSeatManifest(tripId: string): Promise<
  Map<string, { bookingId: string; pnr: string; passengerName: string }>
> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("seat_reservations")
    .select("seat_number, booking_id, bookings(pnr, passengers(full_name))")
    .eq("trip_id", tripId);

  if (error || !data) return new Map();

  const manifest = new Map<string, { bookingId: string; pnr: string; passengerName: string }>();
  for (const row of data as any[]) {
    const passenger = row.bookings?.passengers?.[0];
    manifest.set(row.seat_number, {
      bookingId: row.booking_id,
      pnr: row.bookings?.pnr ?? "",
      passengerName: passenger?.full_name ?? "Unknown",
    });
  }
  return manifest;
}
