import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./Overview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReservationFilters, { emptyFilters, type FilterState } from "@/components/admin/ReservationFilters";
import QuickActions from "@/components/admin/QuickActions";
import InternalNotes from "@/components/admin/InternalNotes";
import ReservationTimeline from "@/components/admin/ReservationTimeline";
import ReservationEditForm from "@/components/admin/ReservationEditForm";
import { matchesSearch, toReservationView, withinRange } from "@/lib/reservations";

const Bookings = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters });
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [params, setParams] = useSearchParams();

  const load = async () => {
    const { data } = await supabase.from("bookings").select("*, rooms(room_name)").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Deep link from the notification centre: ?ref=BTV-ROOM-…
  useEffect(() => {
    const ref = params.get("ref");
    if (!ref || !items.length) return;
    const hit = items.find((b) => b.booking_code === ref);
    setFilters((f) => ({ ...f, search: ref }));
    if (hit) setViewing(hit);
    params.delete("ref");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Keep the open dialog in sync with realtime updates.
  useEffect(() => {
    if (!viewing) return;
    const fresh = items.find((b) => b.id === viewing.id);
    if (fresh && fresh !== viewing) setViewing(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`); load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking deleted"); load();
  };

  const roomOptions = useMemo(
    () => Array.from(new Set(items.map((b) => b.rooms?.room_name).filter(Boolean))) as string[],
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((b) => {
        const view = toReservationView(b, "booking");
        if (!matchesSearch(view, filters.search)) return false;
        if (filters.status !== "all" && b.status !== filters.status) return false;
        if (filters.subject !== "all" && (b.rooms?.room_name ?? "") !== filters.subject) return false;
        if (!withinRange(b.check_in, filters.from, filters.to)) return false;
        return true;
      }),
    [items, filters],
  );

  const viewingView = viewing ? toReservationView(viewing, "booking") : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve, reject, or complete reservation requests.</p>
      </div>

      <ReservationFilters
        value={filters}
        onChange={setFilters}
        subjectLabel="rooms"
        subjectOptions={roomOptions}
      />

      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No bookings found</td></tr>}
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-border/40 hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="font-mono text-xs text-gold font-semibold">{b.booking_code ?? "—"}</span></td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{b.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{b.rooms?.room_name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {format(new Date(b.check_in), "MMM d")} → {format(new Date(b.check_out), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        {["pending", "approved", "completed", "rejected"].map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={b.payment_status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(false); setViewing(b); }} className="p-1.5 rounded-md hover:bg-muted" title="View" aria-label="View booking"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => remove(b.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
          <DialogHeader><DialogTitle className="font-display text-2xl">Booking Details</DialogTitle></DialogHeader>
          {viewing && viewingView && (
            <div className="space-y-3 text-sm">
              <QuickActions
                view={viewingView}
                onStatus={(s) => updateStatus(viewing.id, s)}
                onEdit={() => setEditing((e) => !e)}
                extra={[["Guests", `${viewing.adults ?? 0} adult(s), ${viewing.children ?? 0} child(ren)`]]}
              />
              {editing && (
                <ReservationEditForm
                  table="bookings"
                  row={viewing}
                  fields={[
                    { key: "customer_name", label: "Customer name", type: "text" },
                    { key: "customer_phone", label: "Phone", type: "text" },
                    { key: "customer_email", label: "Email", type: "text" },
                    { key: "check_in", label: "Check-in", type: "date" },
                    { key: "check_out", label: "Check-out", type: "date" },
                    { key: "adults", label: "Adults", type: "number" },
                    { key: "children", label: "Children", type: "number" },
                    { key: "total_amount", label: "Total amount (GHS)", type: "number" },
                    { key: "status", label: "Status", type: "select", options: ["pending", "approved", "confirmed", "checked_in", "checked_out", "completed", "cancelled", "rejected"] },
                    { key: "payment_status", label: "Payment status", type: "select", options: ["unpaid", "paid", "refunded"] },
                    { key: "notes", label: "Guest notes", type: "textarea" },
                  ]}
                  onSaved={() => { setEditing(false); load(); }}
                  onCancel={() => setEditing(false)}
                />
              )}
              <Row label="Booking Code" value={<span className="font-mono text-gold font-semibold">{viewing.booking_code}</span>} />
              <Row label="Customer" value={viewing.customer_name} />
              <Row label="Phone" value={viewing.customer_phone} />
              <Row label="Email" value={viewing.customer_email || "—"} />
              <Row label="Room" value={viewing.rooms?.room_name || "—"} />
              <Row label="Check-in" value={format(new Date(viewing.check_in), "PPP")} />
              <Row label="Check-out" value={format(new Date(viewing.check_out), "PPP")} />
              <Row label="Event" value={viewing.event_type || "—"} />
              <Row label="Amount" value={`GHS ${Number(viewing.total_amount ?? 0).toLocaleString()}`} />
              <Row label="Status" value={<StatusBadge status={viewing.status} />} />
              <Row label="Payment" value={<StatusBadge status={viewing.payment_status} />} />
              {viewing.notes && <Row label="Notes" value={viewing.notes} />}
              <ReservationTimeline entityType="booking" entityId={viewing.id} />
              <InternalNotes entityType="booking" entityId={viewing.id} />
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

export default Bookings;