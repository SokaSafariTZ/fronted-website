import Link from "next/link";
import { Ticket, DollarSign, Building2, MapPin, Plane, Bus, TrendingUp } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, Badge } from "@/components/ui";
import { listBookings } from "@/lib/data/store";
import { listOperators, listLocations } from "@/lib/data/catalog";
import { formatMoney, formatDate } from "@/lib/utils";
import { getAdminRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const role = await getAdminRole();
  const allBookings = listBookings();

  const bookings =
    role === "flights" ? allBookings.filter((b) => b.mode === "flights")
    : role === "buses" ? allBookings.filter((b) => b.mode === "buses")
    : allBookings;

  const revenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + b.totalAmount, 0);
  const flights = bookings.filter((b) => b.mode === "flights").length;
  const buses = bookings.filter((b) => b.mode === "buses").length;

  const stats =
    role === "admin"
      ? [
          { label: "Bookings", value: String(bookings.length), icon: Ticket, tone: "info" as const },
          { label: "Revenue (paid)", value: formatMoney(revenue), icon: DollarSign, tone: "success" as const },
          { label: "Operators", value: String(listOperators().length), icon: Building2, tone: "neutral" as const },
          { label: "Locations", value: String(listLocations().length), icon: MapPin, tone: "neutral" as const },
        ]
      : [
          { label: "Bookings", value: String(bookings.length), icon: Ticket, tone: "info" as const },
          { label: "Revenue (paid)", value: formatMoney(revenue), icon: DollarSign, tone: "success" as const },
        ];

  const subtitle =
    role === "flights" ? "Air Tanzania bookings & route overview"
    : role === "buses" ? "Dar Express bookings & route overview"
    : "Overview of bookings & inventory";

  return (
    <>
      <AdminHeader title="Dashboard" subtitle={subtitle} />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-primary" />
                <Badge tone={s.tone}>live</Badge>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-title">{s.value}</p>
              <p className="text-sm text-subtitle">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-title">Recent bookings</h2>
              <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-subtitle">
                No bookings yet. Create one from the public site to see it here.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">PNR</th>
                    <th className="pb-2 font-medium">Route</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="border-t border-line">
                      <td className="py-2 font-mono text-primary">{b.pnr}</td>
                      <td className="py-2 text-title">
                        {b.trip.origin.code} → {b.trip.destination.code}
                      </td>
                      <td className="py-2 text-subtitle">{formatDate(b.trip.departAt)}</td>
                      <td className="py-2">
                        <Badge tone={b.paymentStatus === "paid" ? "success" : "warning"}>
                          {b.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-semibold text-title">
                        {formatMoney(b.totalAmount, b.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-title">
              <TrendingUp className="size-4 text-primary" /> Mode split
            </h2>
            <div className="space-y-3">
              {(role === "admin" || role === "flights") && (
                <ModeRow icon={Plane} label="Flights" value={flights} total={bookings.length} />
              )}
              {(role === "admin" || role === "buses") && (
                <ModeRow icon={Bus} label="Buses" value={buses} total={bookings.length} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function ModeRow({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: typeof Plane;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-subtitle">
          <Icon className="size-4" /> {label}
        </span>
        <span className="text-title">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-input">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
