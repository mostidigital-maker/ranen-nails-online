/**
 * Role & permission model.
 *
 * Only `admin` is granted today (see `user_roles` table + `has_role()` in the
 * database). The extra roles are declared so future modules can be written
 * against permissions instead of hardcoded "is admin" checks — no behaviour
 * change until those roles are actually issued.
 */
export const ROLES = ["admin", "manager", "employee", "receptionist", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "appointments.view",
  "appointments.manage",
  "content.view",
  "content.manage",
  "services.manage",
  "gallery.manage",
  "settings.manage",
  "schedule.manage",
  "payments.manage",
  "crm.view",
  "reports.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Capability matrix. Today only `admin` is ever assigned. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  manager: [
    "appointments.view", "appointments.manage",
    "content.view", "content.manage",
    "services.manage", "gallery.manage", "schedule.manage", "reports.view",
  ],
  employee: ["appointments.view", "appointments.manage", "content.view"],
  receptionist: ["appointments.view", "appointments.manage", "content.view"],
  viewer: ["appointments.view", "content.view", "reports.view"],
};

export function roleCan(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function anyRoleCan(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((r) => roleCan(r, permission));
}
