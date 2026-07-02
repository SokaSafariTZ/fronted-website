import { fail, ok } from "@/lib/api";
import { getTrip, getFares, getSeatMap } from "@/lib/data/trips";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) return fail("Trip not found", 404);

  // In Supabase mode, load real occupied seats so the map reflects actual bookings.
  let occupiedSeats: Set<string> | undefined;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { getOccupiedSeats } = await import("@/lib/supabase/seats");
    occupiedSeats = await getOccupiedSeats(id);
  }

  const { layout, seats } = getSeatMap(trip, occupiedSeats);

  return ok({
    tripId: trip.id,
    mode: trip.mode,
    vehicle: trip.vehicle,
    serviceNumber: trip.serviceNumber,
    operator: trip.operator,
    origin: trip.origin,
    destination: trip.destination,
    departAt: trip.departAt,
    arriveAt: trip.arriveAt,
    totalSeats: trip.totalSeats,
    seatsAvailable: trip.seatsAvailable,
    layout,
    fares: getFares(trip),
    seats,
  });
}
