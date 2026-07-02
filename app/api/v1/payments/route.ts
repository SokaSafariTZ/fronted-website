import { fail, ok, parseBody } from "@/lib/api";
import { paymentSchema } from "@/lib/validation";
import { getBooking, payBooking } from "@/lib/data/booking-store";

export const dynamic = "force-dynamic";

// POST /api/v1/payments  -> mock-charge a booking, mark it paid + confirmed.
export async function POST(req: Request) {
  const parsed = await parseBody(req, paymentSchema);
  if ("response" in parsed) return parsed.response;

  const existing = await getBooking(parsed.data.reference);
  if (!existing) return fail("Booking not found", 404);
  if (existing.paymentStatus === "paid")
    return fail("Booking already paid", 409);

  const booking = await payBooking(parsed.data.reference, parsed.data.method);
  return ok({
    paid: true,
    method: parsed.data.method,
    transactionId: `${parsed.data.method}_${crypto.randomUUID().slice(0, 12)}`,
    booking,
  });
}
