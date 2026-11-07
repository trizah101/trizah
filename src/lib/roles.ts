export const ROLES = ["super_admin", "admin", "accountant", "operations", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  accountant: "Accountant",
  operations: "Operations",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full system access, including role assignment.",
  admin: "User and financial management.",
  accountant: "Financial records, reporting and reconciliation.",
  operations: "Inventory, products and Amazon FBA costs.",
  viewer: "Read-only access to dashboards and reports.",
};

export const STATUSES = ["pending", "active", "suspended"] as const;
export type AccountStatus = (typeof STATUSES)[number];

export type Permission =
  | "finance:read"
  | "finance:write"
  | "operations:read"
  | "operations:write"
  | "reports:read"
  | "users:read"
  | "users:manage"
  | "settings:manage"
  | "system:admin";

const ALL: Permission[] = [
  "finance:read",
  "finance:write",
  "operations:read",
  "operations:write",
  "reports:read",
  "users:read",
  "users:manage",
  "settings:manage",
  "system:admin",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  admin: [
    "finance:read",
    "finance:write",
    "operations:read",
    "operations:write",
    "reports:read",
    "users:read",
  ],
  accountant: ["finance:read", "finance:write", "operations:read", "reports:read"],
  operations: ["finance:read", "operations:read", "operations:write", "reports:read"],
  viewer: ["finance:read", "operations:read", "reports:read"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canWriteFinance(role: string | null | undefined): boolean {
  return hasPermission(role, "finance:write");
}

export function canWriteOperations(role: string | null | undefined): boolean {
  return hasPermission(role, "operations:write");
}

export function canManageUsers(role: string | null | undefined): boolean {
  return hasPermission(role, "users:manage");
}

export function canViewUsers(role: string | null | undefined): boolean {
  return hasPermission(role, "users:read");
}

/** Roles a Super Admin is allowed to assign. */
export const ASSIGNABLE_ROLES: Role[] = [...ROLES];
