import { redirect } from "next/navigation";
import { Plane, Bus, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Card, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import {
  createAdminSession,
  verifyCredentials,
  isAdminAuthed,
  getDemoCredentials,
  type AdminRole,
} from "@/lib/auth";

const ROLES: Array<{ role: AdminRole; label: string; sub: string; icon: typeof Plane }> = [
  { role: "admin", label: "Main Admin", sub: "Full platform access", icon: ShieldCheck },
  { role: "flights", label: "Air Tanzania", sub: "Flight provider portal", icon: Plane },
  { role: "buses", label: "Dar Express", sub: "Bus provider portal", icon: Bus },
];

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; role?: string }>;
}) {
  const { next, error, role: roleParam } = await searchParams;
  if (await isAdminAuthed()) redirect(next || "/admin");

  const selectedRole = (ROLES.find((r) => r.role === roleParam)?.role ?? null) as AdminRole | null;
  const demo = selectedRole ? getDemoCredentials(selectedRole) : null;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const target = String(formData.get("next") ?? "/admin");
    const role = verifyCredentials(email, password);
    if (!role) {
      const roleQ = formData.get("roleParam") ? `&role=${formData.get("roleParam")}` : "";
      redirect(`/admin/login?error=1${target ? `&next=${encodeURIComponent(target)}` : ""}${roleQ}`);
    }
    await createAdminSession(email, role);
    redirect(target || "/admin");
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Brand subtitle="Admin" size="lg" />
          <p className="mt-2 text-sm text-subtitle">Choose your portal to sign in</p>
        </div>

        {/* Role selector */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {ROLES.map(({ role, label, sub, icon: Icon }) => {
            const active = selectedRole === role;
            return (
              <a
                key={role}
                href={`/admin/login?role=${role}${next ? `&next=${encodeURIComponent(next)}` : ""}`}
                className={[
                  "flex flex-col items-center gap-1.5 rounded-[14px] border px-2 py-3 text-center transition",
                  active
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-line bg-nav/50 text-subtitle hover:border-primary/40 hover:text-title",
                ].join(" ")}
              >
                <Icon className="size-5" />
                <span className="text-[11px] font-semibold leading-tight">{label}</span>
                <span className="text-[10px] leading-tight opacity-70">{sub}</span>
              </a>
            );
          })}
        </div>

        {selectedRole && demo ? (
          <Card className="p-6">
            <p className="mb-4 text-center text-sm font-medium text-title">
              {ROLES.find((r) => r.role === selectedRole)?.label}
            </p>
            <form action={login} className="space-y-4">
              <input type="hidden" name="next" value={next ?? "/admin"} />
              <input type="hidden" name="roleParam" value={selectedRole} />
              <Field label="Email">
                <Input name="email" type="email" defaultValue={demo.email} required />
              </Field>
              <Field label="Password">
                <Input name="password" type="password" defaultValue={demo.password} required />
              </Field>
              {error && <p className="text-sm text-danger">Invalid credentials.</p>}
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
            <p className="mt-4 text-center text-[11px] text-muted">
              Demo credentials are pre-filled.
            </p>
          </Card>
        ) : (
          <p className="text-center text-sm text-muted">Select a portal above to continue.</p>
        )}
      </div>
    </div>
  );
}
