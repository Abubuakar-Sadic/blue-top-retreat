import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Archive, ArchiveRestore, ExternalLink, Loader2, Mail, MailOpen, Trash2, Volume2, VolumeX, CheckCheck } from "lucide-react";
import { StatusBadge } from "./Overview";
import { NOTIFICATION_TYPE_LABELS, notificationEntityType, useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { ENTITY_ROUTES } from "@/lib/reservations";

type Tab = "all" | "unread" | "archived";

const Notifications = () => {
  const { notifications, unread, loading, soundEnabled, toggleSound, markRead, markAllRead, setArchived, remove } = useNotifications();
  const [tab, setTab] = useState<Tab>("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      if (tab === "archived" ? !n.is_archived : n.is_archived) return false;
      if (tab === "unread" && n.is_read) return false;
      if (type !== "all" && n.type !== type) return false;
      if (q && ![n.reference, n.customer_name, n.summary].some((f) => String(f ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [notifications, tab, type, search]);

  const open = async (n: NotificationRow) => {
    if (!n.is_read) await markRead(n.id, true);
    const route = ENTITY_ROUTES[notificationEntityType(n.type)];
    navigate(n.reference ? `${route}?ref=${encodeURIComponent(n.reference)}` : route);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Notification Centre</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Every customer request in one place. {unread} unread.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSound}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound on" : "Sound off"}</span>
          </button>
          <button onClick={markAllRead}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            <CheckCheck className="w-4 h-4" /><span className="hidden sm:inline">Mark all read</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(["all", "unread", "archived"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${tab === t ? "bg-[hsl(var(--navy))] text-white border-transparent" : "bg-card hover:bg-muted"}`}>
            {t}
          </button>
        ))}
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40">
          <option value="all">All types</option>
          {Object.entries(NOTIFICATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference, name or details"
          aria-label="Search notifications"
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
      </div>

      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No notifications match this view</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {filtered.map((n) => (
              <li key={n.id} className={`p-4 sm:p-5 ${n.is_read ? "" : "bg-[hsl(var(--gold))]/5"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-border" : "bg-[hsl(var(--gold))]"}`}
                        title={n.is_read ? "Read" : "Unread"} />
                      <span className="font-mono text-xs text-gold font-semibold">{n.reference ?? "—"}</span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}</span>
                      <StatusBadge status={n.status} />
                      {n.is_archived && <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Archived</span>}
                    </div>
                    <p className="font-medium mt-1">{n.customer_name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{n.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "PPp")}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap sm:justify-end">
                    <button onClick={() => open(n)} title="Open reservation" aria-label="Open reservation"
                      className="p-2 rounded-md hover:bg-muted"><ExternalLink className="w-4 h-4" /></button>
                    <button onClick={() => markRead(n.id, !n.is_read)} title={n.is_read ? "Mark as unread" : "Mark as read"}
                      aria-label={n.is_read ? "Mark as unread" : "Mark as read"} className="p-2 rounded-md hover:bg-muted">
                      {n.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setArchived(n.id, !n.is_archived)} title={n.is_archived ? "Restore" : "Archive"}
                      aria-label={n.is_archived ? "Restore notification" : "Archive notification"} className="p-2 rounded-md hover:bg-muted">
                      {n.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button onClick={() => remove(n.id)} title="Delete" aria-label="Delete notification"
                      className="p-2 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;