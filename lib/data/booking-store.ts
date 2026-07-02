/**
 * Unified async booking store.
 * Delegates to the Supabase-backed store when SUPABASE_SERVICE_ROLE_KEY is set,
 * otherwise falls back to the in-memory driver.
 */
import type { BookingDetail, BookingStatus, PaymentStatus, Passenger } from "@/lib/types";

export interface CreateBookingInput {
  tripId: string;
  contactEmail: string;
  contactPhone: string;
  userId?: string;
  passengers: Omit<Passenger, "id" | "bookingId">[];
}

function useSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingDetail | null> {
  if (useSupabase()) {
    const { createBooking: sbCreate } = await import("@/lib/supabase/store");
    return sbCreate(input);
  }
  const { createBooking: memCreate } = await import("@/lib/data/store");
  return Promise.resolve(memCreate(input));
}

export async function getBooking(
  idOrPnr: string,
): Promise<BookingDetail | null> {
  if (useSupabase()) {
    const { getBooking: sbGet } = await import("@/lib/supabase/store");
    return sbGet(idOrPnr);
  }
  const { getBooking: memGet } = await import("@/lib/data/store");
  return Promise.resolve(memGet(idOrPnr));
}

export async function listBookings(): Promise<BookingDetail[]> {
  if (useSupabase()) {
    const { listBookings: sbList } = await import("@/lib/supabase/store");
    return sbList();
  }
  const { listBookings: memList } = await import("@/lib/data/store");
  return Promise.resolve(memList());
}

export async function updateBookingStatus(
  idOrPnr: string,
  patch: { status?: BookingStatus; paymentStatus?: PaymentStatus },
): Promise<BookingDetail | null> {
  if (useSupabase()) {
    const { updateBookingStatus: sbUpd } = await import("@/lib/supabase/store");
    return sbUpd(idOrPnr, patch);
  }
  const { updateBookingStatus: memUpd } = await import("@/lib/data/store");
  return Promise.resolve(memUpd(idOrPnr, patch));
}

export async function payBooking(
  idOrPnr: string,
  provider: string = "stripe",
): Promise<BookingDetail | null> {
  if (useSupabase()) {
    const { payBooking: sbPay } = await import("@/lib/supabase/store");
    return sbPay(idOrPnr, provider);
  }
  const { payBooking: memPay } = await import("@/lib/data/store");
  return Promise.resolve(memPay(idOrPnr));
}
