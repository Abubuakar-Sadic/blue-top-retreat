import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./Overview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReservationFilters, { emptyFilters, type FilterState } from "@/components/admin/ReservationFilters";
import QuickActions from "@/components/admin/QuickActions";
import InternalNotes from "@/components/admin/InternalNotes";
import ReservationTimeline from "@/components/admin/ReservationTimeline";
import ReservationEditForm from "@/components/admin/ReservationEditForm";
import { fmt, matchesSearch, toReservationView, withinRange } from "@/lib/reservations";

const EventReservations = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters });
  const [params, setParams] = useSearchParams();

  const load = async () => {
    const { data } = await supabase.from("event_reservations").select("*").order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-event-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_reservations" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const ref = params.get("ref");
    if (!ref || !items.length) return;
    const hit = items.find((r) => r.reservation_code === ref);
    setFilters((f) => ({ ...f, search: ref }));
    if (hit) setViewing(hit);
    params.delete("ref");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (!viewing) return;
    const fresh = items.find((r) => r.id === viewing.id);
    if (fresh && fresh !== viewing) setViewing(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("event_reservations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Reservation ${status}`); load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("event_reservations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const eventOptions = useMemo(() => Array.from(new Set(items.map((r) => r.event_title).filter(Boolean))) as string[], [items]);

  const filtered = useMemo(
    () =>
      items.filter((r) => {
        const view = toReservationView(r, "event_reservation");
        if (!matchesSearch(view, filters.search)) return false;
        if (filters.status !== "all" && r.status !== filters.status) return false;
        if (filters.subject !== "all" && (r.event_title ?? "") !== filters.subject) return false;
        if (!withinRange(r.event_date ?? r.created_at, filters.from, filters.to)) return false;
        return true;
      }),
    [items, filters],
  );

  const viewingView = viewing ? toReservationView(viewing, "event_reservation") : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Event Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">"Reserve Your Spot" sign-ups to attend posted events (code prefix BKA).</p>
      </div>

      <ReservationFilters value={filters} onChange={setFilters} subjectLabel="events" subjectOptions={eventOptions} />

      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Attendee</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Party</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No reservations found</td></tr>}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="font-mono text-xs text-gold font-semibold">{r.reservation_code}</span></td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.attendee_name}</div>
                      <div className="text-xs text-muted-foreground">{r.attendee_phone}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.event_title}</td>
                    <td className="px-5 py-3">{r.party_size}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(r.created_at), "PPp")}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(false); setViewing(r); }} className="p-1.5 rounded-md hover:bg-muted" title="View" aria-label="View reservation"><Eye className="w-4 h-4" /></button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => update(r.id, "approved")} className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-600" title="Approve"><Check className="w-4 h-4" /></button>
                            <button onClick={() => update(r.id, "rejected")} className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-600" title="Reject"><X className="w-4 h-4" /></button>
                          </>
                        )}
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) { setViewing(null); setEditing(false); } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display text-2xl">Event Reservation</DialogTitle></DialogHeader>
          {viewing && viewingView && (
            <div className="space-y-3 text-sm">
              <QuickActions
                view={viewingView}
                onStatus={(s) => update(viewing.id, s)}
                onEdit={() => setEditing((e) => !e)}
                extra={[["Party size", String(viewing.party_size ?? "—")]]}
              />
              {editing && (
                <ReservationEditForm
                  table="event_reservations"
                  row={viewing}
                  fields={[
                    { key: "attendee_name", label: "Attendee name", type: "text" },
                    { key: "attendee_phone", label: "Phone", type: "text" },
                    { key: "attendee_email", label: "Email", type: "text" },
                    { key: "event_title", label: "Event", type: "text" },
                    { key: "event_date", label: "Event date", type: "date" },
                    { key: "arrival_time", label: "Arrival time", type: "time" },
                    { key: "party_size", label: "Party size", type: "number" },
                    { key: "celebration_type", label: "Celebration", type: "text" },
                    { key: "status", label: "Status", type: "select", options: ["pending", "approved", "confirmed", "completed", "cancelled", "rejected"] },
                    { key: "notes", label: "Guest notes", type: "textarea" },
                  ]}
                  onSaved={() => { setEditing(false); load(); }}
                  onCancel={() => setEditing(false)}
                />
              )}
              <Row label="Code" value={<span className="font-mono text-gold font-semibold">{viewing.reservation_code}</span>} />
              <Row label="Attendee" value={viewing.attendee_name} />
              <Row label="Phone" value={viewing.attendee_phone} />
              <Row label="Email" value={viewing.attendee_email || "—"} />
              <Row label="Event" value={viewing.event_title || "—"} />
              <Row label="Event Date" value={fmt(viewing.event_date, "PPP")} />
              <Row label="Party Size" value={viewing.party_size} />
              <Row label="VIP Table" value={viewing.vip_table ? "Yes" : "No"} />
              <Row label="Bottle Reservation" value={viewing.bottle_reservation ? "Yes" : "No"} />
              <Row label="Status" value={<StatusBadge status={viewing.status} />} />
              {viewing.notes && <Row label="Notes" value={viewing.notes} />}
              <ReservationTimeline entityType="event_reservation" entityId={viewing.id} />
              <InternalNotes entityType="event_reservation" entityId={viewing.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value }: any) => (
  <div className="flex justify-between gap-4 border-b border-border/40 pb-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default EventReservations;