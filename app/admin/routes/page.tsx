import { Plane, Bus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, Badge } from "@/components/ui";
import { ROUTES, getLocationByCode, getOperatorById } from "@/lib/data/catalog";
import { formatDuration, formatMoney } from "@/lib/utils";
import { getAdminRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminRoutes() {
  const role = await getAdminRole();
  const routes =
    role === "flights" ? ROUTES.filter((r) => r.mode === "flights")
    : role === "buses" ? ROUTES.filter((r) => r.mode === "buses")
    : ROUTES;

  const subtitle =
    role === "flights" ? "Flight routes operated by Air Tanzania"
    : role === "buses" ? "Bus routes operated by Dar Express"
    : "The network that powers schedule generation. Trips are generated per search date from these routes.";

  return (
    <>
      <AdminHeader title="Routes" subtitle={subtitle} />
      <div className="p-6">
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Operators</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Daily</th>
                <th className="px-4 py-3 font-medium">From</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => {
                const from = getLocationByCode(r.originCode);
                const to = getLocationByCode(r.destCode);
                return (
                  <tr key={i} className="border-b border-line/60">
                    <td className="px-4 py-3">
                      {r.mode === "flights" ? (
                        <Plane className="size-4 text-primary" />
                      ) : (
                        <Bus className="size-4 text-gold" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-title">
                      {from?.city} → {to?.city}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        {r.operatorIds.map((id) => (
                          <Badge key={id} tone="neutral">
                            {getOperatorById(id)?.name ?? id}
                          </Badge>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-subtitle">{formatDuration(r.minutes)}</td>
                    <td className="px-4 py-3 text-subtitle">{r.daily}×</td>
                    <td className="px-4 py-3 font-semibold text-title">{formatMoney(r.basePrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
