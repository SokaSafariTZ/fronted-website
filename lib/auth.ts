import { cookies } from "next/headers";
import crypto from "crypto";
import { ADMIN_COOKIE as COOKIE } from "@/lib/auth-edge";

export type AdminRole = "admin" | "flights" | "buses";

const CREDENTIALS: Array<{ email: string; password: string; role: AdminRole }> = [
  {
    email: process.env.ADMIN_EMAIL ?? "admin@sokasafari.com",
    password: process.env.ADMIN_PASSWORD ?? "sokasafari",
    role: "admin",
  },
  {
    email: process.env.FLIGHT_EMAIL ?? "airtanzania@sokasafari.com",
    password: process.env.FLIGHT_PASSWORD ?? "airtanzania",
    role: "flights",
  },
  {
    email: process.env.BUS_EMAIL ?? "darexpress@sokasafari.com",
    password: process.env.BUS_PASSWORD ?? "darexpress",
    role: "buses",
  },
];

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-me";

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function verifyCredentials(email: string, password: string): AdminRole | null {
  const cred = CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
  );
  return cred?.role ?? null;
}

export function getDemoCredentials(role: AdminRole) {
  return CREDENTIALS.find((c) => c.role === role) ?? CREDENTIALS[0];
}

export async function createAdminSession(email: string, role: AdminRole) {
  // payload format: base64url(email::role::timestamp)
  const payload = `${email}::${role}::${Date.now()}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) return false;
  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payloadB64 || !sig) return false;
  const payload = Buffer.from(payloadB64, "base64url").toString();
  return crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(sig));
}

function decodeRole(token: string): AdminRole {
  const dotIdx = token.lastIndexOf(".");
  const payloadB64 = token.slice(0, dotIdx);
  const payload = Buffer.from(payloadB64, "base64url").toString();
  // new format: email::role::timestamp
  const parts = payload.split("::");
  if (parts.length === 3) return (parts[1] as AdminRole) ?? "admin";
  // legacy format (single admin, no role): email.timestamp
  return "admin";
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(COOKIE)?.value);
}

export async function getAdminRole(): Promise<AdminRole> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!isValidToken(token)) return "admin";
  return decodeRole(token!);
}

export { COOKIE as ADMIN_COOKIE };
