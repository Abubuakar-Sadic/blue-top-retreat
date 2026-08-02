import { Link, useNavigate } from "react-router-dom";
import { Bell, Volume2, VolumeX, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/pages/admin/Overview";
import { NOTIFICATION_TYPE_LABELS, notificationEntityType, useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { ENTITY_ROUTES } from "@/lib/reservations";
import { useState } from "react";

const NotificationBell = () => {
  const { notifications, unread, soundEnabled, toggleSound, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const recent = notifications.filter((n) => !n.is_archived).slice(0, 8);

  const openReservation = async (n: NotificationRow) => {
    if (!n.is_read) await markRead(n.id, true);
    setOpen(false);
    const route = ENTITY_ROUTES[notificationEntityType(n.type)];
    navigate(n.reference ? `${route}?ref=${encodeURIComponent(n.reference)}` : route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--navy-dark))] text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <p className="font-display font-semibold">Notifications</p>
          <div className="flex items-center gap-1">
            <button onClick={toggleSound} title={soundEnabled ? "Turn sound off" : "Turn sound on"}
              aria-label={soundEnabled ? "Turn notification sound off" : "Turn notification sound on"}
              className="p-1.5 rounded-md hover:bg-muted">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={markAllRead} title="Mark all as read" aria-label="Mark all as read" className="p-1.5 rounded-md hover:bg-muted">
              <CheckCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {recent.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>}
          {recent.map((n) => (
            <button
              key={n.id}
              onClick={() => openReservation(n)}
              className={`w-full text-left px-4 py-3 border-b border-border/40 hover:bg-muted/50 transition-colors ${n.is_read ? "" : "bg-[hsl(var(--gold))]/5"}`}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))] mt-1.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}</span>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="font-medium text-sm truncate mt-0.5">{n.customer_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {n.reference && <span className="font-mono text-[11px] text-gold font-semibold">{n.reference}</span>}
                    <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-border/60">
          <Button asChild variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
            <Link to="/admin/notifications">Open notification centre</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;