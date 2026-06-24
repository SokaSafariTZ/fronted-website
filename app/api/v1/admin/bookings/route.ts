import { ok } from "@/lib/api";
import { isAdminAuthed, getAdminRole } from "@/lib/auth";
import { listBookings } from "@/lib/data/booking-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthed()))
    return new Response("Unauthorized", { status: 401 });

  const role = await getAdminRole();
  const all = await listBookings();
  const data =
    role === "flights" ? all.filter((b) => b.mode === "flights")
    : role === "buses" ? all.filter((b) => b.mode === "buses")
    : all;

  return ok(data);
}
