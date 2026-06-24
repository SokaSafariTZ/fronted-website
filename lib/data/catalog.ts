import type { Location, Operator } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tanzania-centric catalog.
// Tanzania (DAR/JRO/ZNZ/MWZ) is the hub; regional connections radiate out
// to East Africa, SADC, North Africa, and key diaspora destinations.
// Mirrors the SokaSafari sports-tourism mission: support Tanzania sport &
// tourism, fan travel, and safari experiences.
// ---------------------------------------------------------------------------

export const LOCATIONS: Location[] = [
  // ── Tanzania airports ────────────────────────────────────────────────────
  { id: "loc-dar", code: "DAR", name: "Julius Nyerere Intl", city: "Dar es Salaam", country: "Tanzania", countryCode: "TZ", type: "airport" },
  { id: "loc-jro", code: "JRO", name: "Kilimanjaro Intl", city: "Arusha / Moshi", country: "Tanzania", countryCode: "TZ", type: "airport" },
  { id: "loc-znz", code: "ZNZ", name: "Abeid Amani Karume Intl", city: "Zanzibar", country: "Tanzania", countryCode: "TZ", type: "airport" },
  { id: "loc-mwz", code: "MWZ", name: "Mwanza Airport", city: "Mwanza", country: "Tanzania", countryCode: "TZ", type: "airport" },
  // ── Regional airports ────────────────────────────────────────────────────
  { id: "loc-nbo", code: "NBO", name: "Jomo Kenyatta Intl", city: "Nairobi", country: "Kenya", countryCode: "KE", type: "airport" },
  { id: "loc-add", code: "ADD", name: "Bole Intl", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET", type: "airport" },
  { id: "loc-jnb", code: "JNB", name: "O. R. Tambo Intl", city: "Johannesburg", country: "South Africa", countryCode: "ZA", type: "airport" },
  { id: "loc-ebb", code: "EBB", name: "Entebbe Intl", city: "Kampala", country: "Uganda", countryCode: "UG", type: "airport" },
  { id: "loc-cmn", code: "CMN", name: "Mohammed V Intl", city: "Casablanca", country: "Morocco", countryCode: "MA", type: "airport" },
  { id: "loc-los", code: "LOS", name: "Murtala Muhammed Intl", city: "Lagos", country: "Nigeria", countryCode: "NG", type: "airport" },
  { id: "loc-dxb", code: "DXB", name: "Dubai Intl", city: "Dubai", country: "UAE", countryCode: "AE", type: "airport" },

  // ── Tanzania bus terminals ────────────────────────────────────────────────
  { id: "loc-dar-bt", code: "DAR-BT", name: "Ubungo Bus Terminal", city: "Dar es Salaam", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-aru-bt", code: "ARU-BT", name: "Arusha Central Bus Terminal", city: "Arusha", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-msh-bt", code: "MSH-BT", name: "Moshi Bus Terminal", city: "Moshi", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-mwz-bt", code: "MWZ-BT", name: "Mwanza Bus Terminal", city: "Mwanza", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-dod-bt", code: "DOD-BT", name: "Dodoma Bus Terminal", city: "Dodoma", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-tga-bt", code: "TGA-BT", name: "Tanga Bus Terminal", city: "Tanga", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  { id: "loc-znz-bt", code: "ZNZ-BT", name: "Zanzibar Town Terminal", city: "Zanzibar", country: "Tanzania", countryCode: "TZ", type: "bus_terminal" },
  // ── Cross-border bus terminals ────────────────────────────────────────────
  { id: "loc-nbo-bt", code: "NBO-BT", name: "Machakos Country Bus", city: "Nairobi", country: "Kenya", countryCode: "KE", type: "bus_terminal" },
  { id: "loc-mba-bt", code: "MBA-BT", name: "Mombasa Bus Terminal", city: "Mombasa", country: "Kenya", countryCode: "KE", type: "bus_terminal" },
  { id: "loc-kla-bt", code: "KLA-BT", name: "Kampala Coach Park", city: "Kampala", country: "Uganda", countryCode: "UG", type: "bus_terminal" },
];

export const OPERATORS: Operator[] = [
  // ── Demo: one airline, one bus operator ───────────────────────────────────
  { id: "op-tc", code: "TC", name: "Air Tanzania", mode: "flights", logoColor: "#1D6CC8", rating: 4.1 },
  { id: "op-dx", code: "DX", name: "Dar Express", mode: "buses", logoColor: "#F59E0B", rating: 4.2 },
];

export interface RouteDef {
  mode: "flights" | "buses";
  operatorIds: string[];
  originCode: string;
  destCode: string;
  minutes: number;
  daily: number;
  basePrice: number;
  stops: number;
}

export const ROUTES: RouteDef[] = [
  // ── Domestic flights — Air Tanzania ───────────────────────────────────────
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "ZNZ", minutes: 35, daily: 5, basePrice: 60, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "JRO", minutes: 55, daily: 4, basePrice: 75, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "MWZ", minutes: 100, daily: 3, basePrice: 110, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "JRO", destCode: "ZNZ", minutes: 60, daily: 2, basePrice: 80, stops: 0 },
  // ── Regional flights — Air Tanzania ───────────────────────────────────────
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "NBO", minutes: 90, daily: 3, basePrice: 150, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "ADD", minutes: 165, daily: 2, basePrice: 220, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "JNB", minutes: 195, daily: 2, basePrice: 280, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "JRO", destCode: "NBO", minutes: 60, daily: 2, basePrice: 130, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "ZNZ", destCode: "NBO", minutes: 90, daily: 1, basePrice: 160, stops: 0 },
  // ── Long-haul flights — Air Tanzania ──────────────────────────────────────
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "DXB", minutes: 330, daily: 1, basePrice: 420, stops: 0 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "CMN", minutes: 480, daily: 1, basePrice: 540, stops: 1 },
  { mode: "flights", operatorIds: ["op-tc"], originCode: "DAR", destCode: "LOS", minutes: 360, daily: 1, basePrice: 380, stops: 1 },

  // ── Domestic buses — Dar Express ──────────────────────────────────────────
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "ARU-BT", minutes: 480, daily: 6, basePrice: 12, stops: 2 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "MSH-BT", minutes: 420, daily: 4, basePrice: 10, stops: 1 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "MWZ-BT", minutes: 720, daily: 2, basePrice: 20, stops: 3 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "DOD-BT", minutes: 360, daily: 4, basePrice: 8, stops: 1 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "TGA-BT", minutes: 300, daily: 3, basePrice: 9, stops: 1 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "ZNZ-BT", minutes: 180, daily: 3, basePrice: 7, stops: 0 },
  // ── Cross-border buses — Dar Express ──────────────────────────────────────
  { mode: "buses", operatorIds: ["op-dx"], originCode: "ARU-BT", destCode: "NBO-BT", minutes: 360, daily: 3, basePrice: 20, stops: 1 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "ARU-BT", destCode: "KLA-BT", minutes: 720, daily: 1, basePrice: 35, stops: 2 },
  { mode: "buses", operatorIds: ["op-dx"], originCode: "DAR-BT", destCode: "MBA-BT", minutes: 900, daily: 2, basePrice: 25, stops: 3 },
];

// Mutable runtime catalog — editable from the admin dashboard, persisted on
// globalThis so changes survive HMR and Next.js route module isolation.

declare global {
  // eslint-disable-next-line no-var
  var __soka_catalog: { locations: Location[]; operators: Operator[] } | undefined;
}

const catalog =
  globalThis.__soka_catalog ??
  (globalThis.__soka_catalog = {
    locations: [...LOCATIONS],
    operators: [...OPERATORS],
  });

export const listLocations = () => catalog.locations;
export const listOperators = () => catalog.operators;

export const getLocationByCode = (code: string) =>
  catalog.locations.find((l) => l.code === code);
export const getLocationById = (id: string) =>
  catalog.locations.find((l) => l.id === id);
export const getOperatorById = (id: string) =>
  catalog.operators.find((o) => o.id === id);

export function upsertLocation(input: Omit<Location, "id"> & { id?: string }): Location {
  if (input.id) {
    const existing = catalog.locations.find((l) => l.id === input.id);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
  }
  const created: Location = { ...input, id: input.id ?? `loc-${crypto.randomUUID().slice(0, 8)}` };
  catalog.locations.push(created);
  return created;
}

export function deleteLocation(id: string) {
  const i = catalog.locations.findIndex((l) => l.id === id);
  if (i >= 0) catalog.locations.splice(i, 1);
  return i >= 0;
}

export function upsertOperator(input: Omit<Operator, "id"> & { id?: string }): Operator {
  if (input.id) {
    const existing = catalog.operators.find((o) => o.id === input.id);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
  }
  const created: Operator = { ...input, id: input.id ?? `op-${crypto.randomUUID().slice(0, 8)}` };
  catalog.operators.push(created);
  return created;
}

export function deleteOperator(id: string) {
  const i = catalog.operators.findIndex((o) => o.id === id);
  if (i >= 0) catalog.operators.splice(i, 1);
  return i >= 0;
}

export const FLIGHT_AMENITIES = ["wifi", "meal", "power", "entertainment"];
export const BUS_AMENITIES = ["wifi", "ac", "recliner", "power", "toilet"];
export const AIRCRAFT = ["Boeing 787-8 Dreamliner", "Airbus A220-300", "Boeing 737-800", "Dash 8 Q400"];
export const COACHES = ["Scania Touring 49", "Yutong ZK6129H 55", "King Long XMQ6127 45", "VIP Recliner 33"];
