import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./Overview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Bookings = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
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

  const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve, reject, or complete reservation requests.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected", "completed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors ${filter === s ? "bg-[hsl(var(--navy))] text-white border-transparent" : "bg-card hover:bg-muted"}`}>
            {s}
          </button>
        ))}
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
                        <button onClick={() => setViewing(b)} className="p-1.5 rounded-md hover:bg-muted" title="View"><Eye className="w-4 h-4" /></button>
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Booking Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
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