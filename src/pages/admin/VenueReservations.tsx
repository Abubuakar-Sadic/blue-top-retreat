import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./Overview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VenueReservations = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("venue_reservations").select("*").order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-venue-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "venue_reservations" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("venue_reservations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Reservation ${status}`); load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("venue_reservations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Venue Reservations</h1>
        <p className="text-muted-foreground text-sm mt-1">Requests from guests who want to host an event at the villa (code prefix BKE).</p>
      </div>

      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Host</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Event Date</th>
                  <th className="px-5 py-3">Guests</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No venue reservations yet</td></tr>}
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="font-mono text-xs text-gold font-semibold">{r.reservation_code}</span></td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{r.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.event_type}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(r.event_date), "PP")}</td>
                    <td className="px-5 py-3">{r.guest_count}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setViewing(r)} className="p-1.5 rounded-md hover:bg-muted" title="View"><Eye className="w-4 h-4" /></button>
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Venue Reservation</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Row label="Code" value={<span className="font-mono text-gold font-semibold">{viewing.reservation_code}</span>} />
              <Row label="Host" value={viewing.customer_name} />
              <Row label="Phone" value={viewing.customer_phone} />
              <Row label="Email" value={viewing.customer_email || "—"} />
              <Row label="Event Type" value={viewing.event_type} />
              <Row label="Event Date" value={format(new Date(viewing.event_date), "PPP")} />
              <Row label="Expected Guests" value={viewing.guest_count} />
              <Row label="Status" value={<StatusBadge status={viewing.status} />} />
              {viewing.notes && <Row label="Notes" value={viewing.notes} />}
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

export default VenueReservations;