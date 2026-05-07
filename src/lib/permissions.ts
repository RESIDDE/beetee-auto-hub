// ─── Role & Page Definitions ────────────────────────────────────────────────

export type AppRole = "super_admin" | "admin" | "sales" | "mechanic";

export type PageKey =
  | "dashboard"
  | "vehicles"
  | "resale-vehicles"
  | "customers"
  | "sales"
  | "invoices"
  | "inquiries"
  | "inspections"
  | "repairs"
  | "authority-to-sell"
  | "performance-quotes";

export const ALL_PAGES: { key: PageKey; label: string; path: string }[] = [
  { key: "dashboard",          label: "Dashboard",       path: "/dashboard" },
  { key: "vehicles",           label: "Beetee Vehicles", path: "/vehicles" },
  { key: "resale-vehicles",    label: "Resale Vehicles", path: "/resale-vehicles" },
  { key: "customers",          label: "Customers",       path: "/customers" },
  { key: "sales",              label: "Sales",           path: "/sales" },
  { key: "invoices",           label: "Invoices",        path: "/invoices" },
  { key: "inquiries",          label: "Inquiries",       path: "/inquiries" },
  { key: "inspections",        label: "Inspections",     path: "/inspections" },
  { key: "repairs",            label: "Repairs",         path: "/repairs" },
  { key: "authority-to-sell",  label: "Auth. Form",      path: "/authority-to-sell" },
  { key: "performance-quotes", label: "Proforma Quotes", path: "/performance-quotes" },
];

// super_admin can always see everything — not configurable
export const SUPER_ADMIN_PAGES: PageKey[] = ALL_PAGES.map((p) => p.key);

export type PermissionsMap = Record<
  Exclude<AppRole, "super_admin">,
  { view: PageKey[]; create: PageKey[]; edit: PageKey[] }
>;

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  admin: {
    view: ALL_PAGES.map((p) => p.key),
    create: ALL_PAGES.map((p) => p.key),
    edit: ALL_PAGES.map((p) => p.key),
  },
  sales: {
    view: ["dashboard", "vehicles", "resale-vehicles", "customers", "sales", "invoices", "inquiries", "performance-quotes", "authority-to-sell"],
    create: ["vehicles", "resale-vehicles", "customers", "sales", "invoices", "inquiries", "performance-quotes", "authority-to-sell"],
    edit: ["vehicles", "resale-vehicles", "customers", "sales", "invoices", "inquiries", "performance-quotes", "authority-to-sell"],
  },
  mechanic: {
    view: ["dashboard", "vehicles", "resale-vehicles", "repairs", "inspections"],
    create: ["vehicles", "resale-vehicles", "repairs", "inspections"],
    edit: ["vehicles", "resale-vehicles", "repairs", "inspections"],
  },
};

// ─── Pure helper functions (accept a permissions map — no localStorage) ───────

/**
 * Returns true if the given role can VIEW the given page.
 * super_admin always returns true.
 */
export function canAccess(
  role: AppRole | null,
  page: PageKey,
  permissions: PermissionsMap = DEFAULT_PERMISSIONS
): boolean {
  return true; // Everyone has access
}

/**
 * Returns true if the given role can CREATE (ADD) on the given page.
 * super_admin always returns true.
 */
export function canCreate(
  role: AppRole | null,
  page: PageKey,
  permissions: PermissionsMap = DEFAULT_PERMISSIONS
): boolean {
  return true; // Everyone can create
}

/**
 * Returns true if the given role can EDIT on the given page.
 * super_admin always returns true.
 */
export function canEdit(
  role: AppRole | null,
  page: PageKey,
  permissions: PermissionsMap = DEFAULT_PERMISSIONS
): boolean {
  return true; // Everyone can edit
}

/**
 * Returns the list of pages accessible (viewable) by this role.
 */
export function getAccessiblePages(
  role: AppRole | null,
  permissions: PermissionsMap = DEFAULT_PERMISSIONS
): PageKey[] {
  return SUPER_ADMIN_PAGES; // Everyone sees everything
}
