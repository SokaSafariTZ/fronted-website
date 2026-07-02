import { fail, ok, parseBody } from "@/lib/api";
import { createBookingSchema } from "@/lib/validation";
import { createBooking } from "@/lib/data/booking-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = await parseBody(req, createBookingSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const booking = await createBooking(parsed.data);
    if (!booking) return fail("Trip not found or no longer available", 404);
    return ok(booking, { status: 201 });
  } catch (e: any) {
    // SeatConflictError from the Supabase store (UNIQUE constraint violation)
    if (e?.constructor?.name === "SeatConflictError" || e?.seatNumber) {
      return fail(`Seat ${e.seatNumber} is no longer available. Please choose a different seat.`, 409);
    }
    throw e;
  }
}
