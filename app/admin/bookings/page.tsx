"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, Badge, Spinner, Select, EmptyState } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/utils";
import type { BookingDetail, BookingStatus } from "@/lib/types";

async function fetchBookings(): Promise<BookingDetail[]> {
  const res = await fetch("/api/v1/admin/bookings");
  if (!res.ok) throw new Error("Failed to load");
  return (await res.json()).data;
}

export default function AdminBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-bookings"], queryFn: fetchBookings });

  const patch = useMutation({
    mutationFn: async ({ ref, status }: { ref: string; status: BookingStatus }) => {
      const res = await fetch(`/api/v1/admin/bookings/${ref}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bookings"] }),
  });

  return (
    <>
      <AdminHeader title="Bookings" subtitle="All reservations across flights & buses" />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-subtitle">
            <Spinner /> Loading…
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState title="No bookings yet" subtitle="Bookings from the mobile app and website appear here." />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">PNR</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Departure</th>
                  <th className="px-4 py-3 font-medium">Passenger(s)</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id} className="border-b border-line/60 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary">{b.pnr}</span>
                      <div className="text-[10px] text-muted capitalize mt-0.5">{b.mode}</div>
                    </td>
                    <td className="px-4 py-3 text-title font-medium">
                      {b.trip.origin.city} ({b.trip.origin.code})
                      <span className="text-muted mx-1">→</span>
                      {b.trip.destination.city} ({b.trip.destination.code})
                    </td>
                    <td className="px-4 py-3 text-subtitle whitespace-nowrap">
                      {formatDate(b.trip.departAt)}
                      <div className="text-[11px] text-muted">
                        {new Date(b.trip.departAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {b.passengers.length > 0 ? (
                        <div className="space-y-0.5">
                          {b.passengers.map((p) => (
                            <div key={p.id} className="text-title text-[13px]">
                              {p.fullName}
                              <span className="text-muted ml-1 capitalize text-[11px]">· {p.fareClass}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">{b.passengerCount} pax</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-subtitle text-[12px]">
                      <div>{b.contactEmail}</div>
                      <div className="text-muted">{b.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={b.paymentStatus === "paid" ? "success" : "warning"}>
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-title">
                      {formatMoney(b.totalAmount, b.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={b.status}
                        className="h-9 w-36"
                        disabled={patch.isPending}
                        onChange={(e) =>
                          patch.mutate({ ref: b.pnr, status: e.target.value as BookingStatus })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
