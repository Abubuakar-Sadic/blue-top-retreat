import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EntityType } from "@/lib/reservations";

export type NotificationRow = {
  id: string;
  type: string;
  entity_id: string | null;
  reference: string | null;
  customer_name: string | null;
  summary: string | null;
  status: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  room_booking: "Room Booking",
  venue_reservation: "Venue Reservation",
  event_reservation: "Event Reservation",
  contact_message: "Contact Message",
};

export const notificationEntityType = (type: string): EntityType => {
  if (type === "room_booking") return "booking";
  if (type === "venue_reservation") return "venue_reservation";
  if (type === "event_reservation") return "event_reservation";
  return "contact_message";
};

const SOUND_KEY = "btv_notification_sound";

/** Short two-tone chime built with the Web Audio API (no asset required). */
const playChime = () => {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.18);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* audio is a nice-to-have — ignore failures */
  }
};

type Ctx = {
  notifications: NotificationRow[];
  unread: number;
  loading: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  markRead: (id: string, read?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<Ctx | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_KEY) === "on");
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setNotifications((data ?? []) as NotificationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("admin-notifications-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const row = payload.new as NotificationRow;
        setNotifications((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
        toast.info(`New ${NOTIFICATION_TYPE_LABELS[row.type] ?? "request"}`, {
          description: [row.reference, row.customer_name, row.summary].filter(Boolean).join(" · "),
        });
        if (soundRef.current) playChime();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => {
        const row = payload.new as NotificationRow;
        setNotifications((prev) => prev.map((n) => (n.id === row.id ? row : n)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, (payload) => {
        const old = payload.old as { id: string };
        setNotifications((prev) => prev.filter((n) => n.id !== old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      if (next) playChime();
      toast.success(next ? "Notification sound on" : "Notification sound off");
      return next;
    });
  }, []);

  const patch = useCallback(async (id: string, values: Partial<NotificationRow>) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...values } : n)));
    const { error } = await supabase.from("notifications").update(values).eq("id", id);
    if (error) { toast.error(error.message); await refresh(); }
  }, [refresh]);

  const markRead = useCallback((id: string, read = true) => patch(id, { is_read: read }), [patch]);
  const setArchived = useCallback((id: string, archived: boolean) => patch(id, { is_archived: archived, ...(archived ? { is_read: true } : {}) }), [patch]);

  const markAllRead = useCallback(async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    if (error) { toast.error(error.message); await refresh(); } else toast.success("All notifications marked as read");
  }, [notifications, refresh]);

  const remove = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { toast.error(error.message); await refresh(); } else toast.success("Notification deleted");
  }, [refresh]);

  const unread = notifications.filter((n) => !n.is_read && !n.is_archived).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unread, loading, soundEnabled, toggleSound, markRead, markAllRead, setArchived, remove, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};