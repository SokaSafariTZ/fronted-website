/**
 * Supabase-backed booking store.
 * Same interface as lib/data/store.ts so callers can swap drivers transparently.
 * Used when SUPABASE_SERVICE_ROLE_KEY is set.
 */
import { createClient } from "@supabase/supabase-js";
import type {
  Booking,
  BookingDetail,
  BookingStatus,
  Passenger,
  PaymentStatus,
} from "@/lib/types";
import { generatePnr } from "@/lib/utils";
import { getTrip } from "@/lib/data/trips";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Row shapes returned by PostgREST ───────────────────────────────────────

interface BookingRow {
  id: string;
  pnr: string;
  mode: string;
  trip_id: string;
  user_id: string | null;
  contact_email: string;
  contact_phone: string;
  status: string;
  payment_status: string;
  passenger_count: number;
  total_amount: number;
  currency: string;
  created_at: string;
}

interface PassengerRow {
  id: string;
  booking_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document_type: string;
  document_number: string;
  nationality: string;
  seat_number: string | null;
  fare_class: string;
}

function rowToBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    pnr: r.pnr,
    mode: r.mode as Booking["mode"],
    tripId: r.trip_id,
    userId: r.user_id ?? undefined,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    status: r.status as BookingStatus,
    paymentStatus: r.payment_status as PaymentStatus,
    passengerCount: r.passenger_count,
    totalAmount: Number(r.total_amount),
    currency: r.currency,
    createdAt: r.created_at,
  };
}

function rowToPassenger(r: PassengerRow): Passenger {
  return {
    id: r.id,
    bookingId: r.booking_id,
    fullName: r.full_name,
    documentType: r.document_type as Passenger["documentType"],
    documentNumber: r.document_number,
    nationality: r.nationality,
    seatNumber: r.seat_number ?? undefined,
    fareClass: r.fare_class as Passenger["fareClass"],
  };
}

export interface CreateBookingInput {
  tripId: string;
  contactEmail: string;
  contactPhone: string;
  userId?: string;
  passengers: Omit<Passenger, "id" | "bookingId">[];
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingDetail | null> {
  const trip = getTrip(input.tripId);
  if (!trip) return null;

  const sb = getSupabase();
  const pnr = generatePnr();

  const total = input.passengers.reduce((sum, p) => {
    const mult =
      p.fareClass === "business" || p.fareClass === "vip"
        ? trip.mode === "flights"
          ? 2.6
          : 1.5
        : p.fareClass === "first"
          ? 4.2
          : 1;
    return sum + Math.round(trip.basePrice * mult);
  }, 0);

  // Insert booking row
  const { data: bData, error: bErr } = await sb
    .from("bookings")
    .insert({
      pnr,
      mode: trip.mode,
      trip_id: trip.id,
      user_id: input.userId ?? null,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      status: "pending",
      payment_status: "unpaid",
      passenger_count: input.passengers.length,
      total_amount: total,
      currency: trip.currency,
    })
    .select()
    .single();

  if (bErr || !bData) {
    console.error("[supabase/store] createBooking error:", bErr?.message);
    return null;
  }

  const booking = rowToBooking(bData as BookingRow);

  // Insert passenger rows
  const passengerInserts = input.passengers.map((p) => ({
    booking_id: booking.id,
    full_name: p.fullName,
    document_type: p.documentType,
    document_number: p.documentNumber,
    nationality: p.nationality,
    seat_number: p.seatNumber ?? null,
    fare_class: p.fareClass,
  }));

  const { data: pData, error: pErr } = await sb
    .from("passengers")
    .insert(passengerInserts)
    .select();

  if (pErr) {
    console.error("[supabase/store] insert passengers error:", pErr.message);
  }

  const passengers: Passenger[] = (pData ?? []).map((r) =>
    rowToPassenger(r as PassengerRow),
  );

  return { ...booking, trip, passengers };
}

export async function getBooking(
  idOrPnr: string,
): Promise<BookingDetail | null> {
  const sb = getSupabase();

  const isPnr = idOrPnr.length <= 8 && /^[A-Z0-9]+$/.test(idOrPnr);
  const column = isPnr ? "pnr" : "id";

  const { data: bData, error: bErr } = await sb
    .from("bookings")
    .select("*")
    .eq(column, idOrPnr)
    .single();

  if (bErr || !bData) return null;

  const booking = rowToBooking(bData as BookingRow);
  const trip = getTrip(booking.tripId);
  if (!trip) return null;

  const { data: pData } = await sb
    .from("passengers")
    .select("*")
    .eq("booking_id", booking.id);

  const passengers: Passenger[] = (pData ?? []).map((r) =>
    rowToPassenger(r as PassengerRow),
  );

  return { ...booking, trip, passengers };
}

export async function listBookings(): Promise<BookingDetail[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const details: BookingDetail[] = [];
  for (const row of data as BookingRow[]) {
    const booking = rowToBooking(row);
    const trip = getTrip(booking.tripId);
    if (!trip) continue;

    const { data: pData } = await sb
      .from("passengers")
      .select("*")
      .eq("booking_id", booking.id);

    details.push({
      ...booking,
      trip,
      passengers: (pData ?? []).map((r) => rowToPassenger(r as PassengerRow)),
    });
  }
  return details;
}

export async function updateBookingStatus(
  idOrPnr: string,
  patch: { status?: BookingStatus; paymentStatus?: PaymentStatus },
): Promise<BookingDetail | null> {
  const sb = getSupabase();
  const isPnr = idOrPnr.length <= 8 && /^[A-Z0-9]+$/.test(idOrPnr);
  const column = isPnr ? "pnr" : "id";

  const update: Record<string, string> = {};
  if (patch.status) update.status = patch.status;
  if (patch.paymentStatus) update.payment_status = patch.paymentStatus;

  const { error } = await sb
    .from("bookings")
    .update(update)
    .eq(column, idOrPnr);

  if (error) {
    console.error("[supabase/store] updateBookingStatus error:", error.message);
    return null;
  }

  return getBooking(idOrPnr);
}

export async function payBooking(
  idOrPnr: string,
  provider: string = "stripe",
): Promise<BookingDetail | null> {
  const updated = await updateBookingStatus(idOrPnr, {
    paymentStatus: "paid",
    status: "confirmed",
  });
  if (!updated) return null;

  const sb = getSupabase();
  await sb.from("payments").insert({
    booking_id: updated.id,
    provider,
    status: "paid",
    amount: updated.totalAmount,
    currency: updated.currency,
  });

  return updated;
}
