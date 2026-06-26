// Single source of truth for staff roles and what each role is allowed to do.
// Roles live in the `user_roles` table (never on profiles) to prevent
// privilege-escalation. The CEO role can be held by multiple users at once.

export type StaffRole =
  | "ceo"
  | "admin" // legacy synonym for ceo — treated as full access
  | "manager"
  | "receptionist"
  | "content_editor"
  | "reports_viewer";

export type Capability =
  | "view_operations" // see bookings / reservations / messages
  | "manage_bookings" // create / edit / approve bookings & reservations
  | "manage_rooms" // edit room details, content & images
  | "manage_events" // edit events & event content
  | "view_reports" // operational analytics (totals, occupancy, attendees)
  | "view_revenue" // financial figures (revenue stats)
  | "manage_payments" // create / edit financial records
  | "manage_staff"; // approve sign-ups & assign roles

const FULL: Capability[] = [
  "view_operations",
  "manage_bookings",
  "manage_rooms",
  "manage_events",
  "view_reports",
  "view_revenue",
  "manage_payments",
  "manage_staff",
];

export const ROLE_CAPS: Record<StaffRole, Capability[]> = {
  ceo: FULL,
  admin: FULL,
  manager: ["view_operations", "manage_bookings", "manage_rooms", "manage_events", "view_reports"],
  receptionist: ["view_operations", "manage_bookings", "manage_rooms"],
  content_editor: ["manage_rooms", "manage_events"],
  reports_viewer: ["view_operations", "view_reports", "view_revenue"],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  ceo: "CEO",
  admin: "CEO",
  manager: "Manager",
  receptionist: "Receptionist",
  content_editor: "Content Editor",
  reports_viewer: "Reports Viewer",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  ceo: "Full access to everything, including staff & finances.",
  admin: "Full access to everything, including staff & finances.",
  manager: "Bookings, events, rooms & operations. No finances or roles.",
  receptionist: "Bookings, room details & customer info. No finances or roles.",
  content_editor: "Update room & event content only. No bookings or finances.",
  reports_viewer: "View booking, event & revenue analytics. Read-only.",
};

// Roles a CEO can grant to others (admin is intentionally excluded — use ceo).
export const ASSIGNABLE_ROLES: StaffRole[] = [
  "ceo",
  "manager",
  "receptionist",
  "content_editor",
  "reports_viewer",
];

// Every role that counts as "staff" (controls admin dashboard access).
export const ALL_STAFF_ROLES: StaffRole[] = [
  "admin",
  "ceo",
  "manager",
  "receptionist",
  "content_editor",
  "reports_viewer",
];

// Higher rank wins when a user somehow holds more than one role.
export const RANK: Record<string, number> = {
  ceo: 5,
  admin: 5,
  manager: 3,
  content_editor: 2,
  reports_viewer: 2,
  receptionist: 1,
};

export const isStaffRole = (r: string): r is StaffRole => r in ROLE_CAPS;

export const capsForRoles = (roles: string[]): Set<Capability> => {
  const caps = new Set<Capability>();
  roles.filter(isStaffRole).forEach((r) => ROLE_CAPS[r].forEach((c) => caps.add(c)));
  return caps;
};
