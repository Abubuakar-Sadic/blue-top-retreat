// Shared helpers for one-time and recurring events.

export const WEEKDAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

export type EventLike = {
  event_type: string;
  event_at: string | null;
  recurrence_days: number[];
  recurrence_time: string | null;
  is_public?: boolean;
};

// Format a "HH:MM[:SS]" time string to a friendly "5:00 PM".
export const formatTime = (time: string | null): string => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const minute = Number(m ?? 0);
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
};

// Human-readable schedule, e.g. "Every Fri at 5:00 PM" or "Every Mon, Wed at 9:00 AM".
export const recurrenceLabel = (ev: EventLike): string => {
  if (!ev.recurrence_days?.length || !ev.recurrence_time) return "";
  const days = [...ev.recurrence_days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS.find((w) => w.value === d)?.short ?? "")
    .filter(Boolean)
    .join(", ");
  return `Every ${days} at ${formatTime(ev.recurrence_time)}`;
};

// Compute the next upcoming occurrence for a recurring event (from `from`).
export const nextOccurrence = (ev: EventLike, from = new Date()): Date | null => {
  if (ev.event_type !== "recurring" || !ev.recurrence_days?.length || !ev.recurrence_time) {
    return null;
  }
  const [h, m] = ev.recurrence_time.split(":").map(Number);
  for (let i = 0; i < 14; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    d.setHours(h, m ?? 0, 0, 0);
    if (ev.recurrence_days.includes(d.getDay()) && d.getTime() >= from.getTime()) {
      return d;
    }
  }
  return null;
};

// Whether an event should currently be visible on the public site.
// One-time events stay visible until their start time passes (with a small
// grace window so an ongoing event isn't hidden the moment it begins).
// Recurring events are always visible while public.
export const isEventVisible = (ev: EventLike, now = new Date()): boolean => {
  if (ev.is_public === false) return false;
  if (ev.event_type === "recurring") return true;
  if (!ev.event_at) return false;
  const GRACE_MS = 4 * 60 * 60 * 1000; // keep showing for 4h after start (ongoing)
  return new Date(ev.event_at).getTime() + GRACE_MS >= now.getTime();
};

// Sort key (timestamp) used to order events chronologically.
export const eventSortKey = (ev: EventLike): number => {
  if (ev.event_type === "recurring") {
    return nextOccurrence(ev)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }
  return ev.event_at ? new Date(ev.event_at).getTime() : Number.MAX_SAFE_INTEGER;
};
