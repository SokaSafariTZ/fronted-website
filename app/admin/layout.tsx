import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  MapPin,
  Route as RouteIcon,
  Armchair,
  LogOut,
  Plane,
  Bus,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { isAdminAuthed, destroyAdminSession, getAdminRole } from "@/lib/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/operators", label: "Operators", icon: Building2 },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/routes", label: "Routes", icon: RouteIcon },
  { href: "/admin/trips", label: "Trips & Seats", icon: Armchair },
];

const PROVIDER_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "My Bookings", icon: Ticket },
  { href: "/admin/routes", label: "My Routes", icon: RouteIcon },
];

const ROLE_META = {
  admin: { label: "Main Admin", icon: null },
  flights: { label: "Air Tanzania", icon: Plane },
  buses: { label: "Dar Express", icon: Bus },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthed();

  async function logout() {
    "use server";
    await destroyAdminSession();
    redirect("/admin/login");
  }

  if (!authed) return <>{children}</>;

  const role = await getAdminRole();
  const nav = role === "admin" ? ADMIN_NAV : PROVIDER_NAV;
  const meta = ROLE_META[role];

  return (
    <div className="grid min-h-dvh grid-cols-[230px_1fr]">
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-line bg-nav/70 p-4 backdrop-blur">
        <div className="px-2 py-3">
          <Brand subtitle="Admin" />
        </div>

        {/* Role badge */}
        <div className="mb-2 mt-1 flex items-center gap-1.5 rounded-[10px] border border-line/60 bg-white/4 px-3 py-2">
          {meta.icon && <meta.icon className="size-3.5 shrink-0 text-primary" />}
          <span className="text-[11px] font-semibold text-subtitle">{meta.label}</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href + n.label}
              href={n.href}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm text-subtitle transition hover:bg-white/5 hover:text-title"
            >
              <n.icon className="size-4.5" />
              {n.label}
            </Link>
          ))}
        </nav>

        <form action={logout}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-subtitle">
            <LogOut className="size-4" /> Sign out
          </Button>
        </form>
        <Link
          href="/"
          className="mt-2 px-3 text-[11px] text-muted hover:text-subtitle"
        >
          ← Back to site
        </Link>
      </aside>
      <main className="min-w-0 bg-canvas">{children}</main>
    </div>
  );
}
