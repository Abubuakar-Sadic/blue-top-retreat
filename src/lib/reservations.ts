// Shared helpers for the admin reservation views (bookings, venue, events).
import { format } from "date-fns";

export type EntityType = "booking" | "venue_reservation" | "event_reservation" | "contact_message";

export const ENTITY_LABELS: Record<EntityType, string> = {
  booking: "Room Booking",
  venue_reservation: "Venue Reservation",
  event_reservation: "Event Reservation",
  contact_message: "Contact Message",
};

/** Route (within the admin dashboard) that lists a given entity type. */
export const ENTITY_ROUTES: Record<EntityType, string> = {
  booking: "/admin/bookings",
  venue_reservation: "/admin/venue-reservations",
  event_reservation: "/admin/event-reservations",
  contact_message: "/admin/messages",
};

export const RESERVATION_STATUSES = [
  "pending",
  "approved",
  "confirmed",
  "checked_in",
  "checked_out",
  "completed",
  "cancelled",
  "rejected",
];

export const safeDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmt = (value?: string | null, pattern = "PP") => {
  const d = safeDate(value);
  return d ? format(d, pattern) : "—";
};

/** Normalised view of any reservation row so shared UI can render it. */
export type ReservationView = {
  id: string;
  entityType: EntityType;
  reference: string;
  customerName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  dateLabel: string;
  summary: string;
  amount?: number | null;
  paymentStatus?: string | null;
};

export const toReservationView = (row: any, entityType: EntityType): ReservationView => {
  if (entityType === "booking") {
    return {
      id: row.id,
      entityType,
      reference: row.booking_code ?? "—",
      customerName: row.customer_name ?? "—",
      phone: row.customer_phone ?? "",
      email: row.customer_email ?? "",
      status: row.status,
      createdAt: row.created_at,
      dateLabel: `${fmt(row.check_in, "MMM d")} → ${fmt(row.check_out, "MMM d, yyyy")}`,
      summary: row.rooms?.room_name ?? "Room booking",
      amount: row.total_amount,
      paymentStatus: row.payment_status,
    };
  }
  if (entityType === "venue_reservation") {
    return {
      id: row.id,
      entityType,
      reference: row.reservation_code ?? "—",
      customerName: row.customer_name ?? "—",
      phone: row.customer_phone ?? "",
      email: row.customer_email ?? "",
      status: row.status,
      createdAt: row.created_at,
      dateLabel: fmt(row.event_date, "PP"),
      summary: row.event_type ?? "Event",
    };
  }
  return {
    id: row.id,
    entityType,
    reference: row.reservation_code ?? "—",
    customerName: row.attendee_name ?? "—",
    phone: row.attendee_phone ?? "",
    email: row.attendee_email ?? "",
    status: row.status,
    createdAt: row.created_at,
    dateLabel: fmt(row.event_date ?? row.created_at, "PP"),
    summary: row.event_title ?? "Event attendance",
  };
};

/** Case-insensitive match on reference, name, phone and email. */
export const matchesSearch = (v: ReservationView, term: string) => {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [v.reference, v.customerName, v.phone, v.email]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
};

export const withinRange = (iso: string | null | undefined, from: string, to: string) => {
  const d = safeDate(iso);
  if (!d) return !from && !to;
  if (from && d < new Date(`${from}T00:00:00`)) return false;
  if (to && d > new Date(`${to}T23:59:59`)) return false;
  return true;
};