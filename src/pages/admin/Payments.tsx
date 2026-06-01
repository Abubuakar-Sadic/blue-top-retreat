import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, XCircle, CircleDollarSign } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./Overview";

const Payments = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*, bookings(customer_name, customer_phone, booking_code, status)")
      .order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const successful = items.filter((p) => p.status === "successful");
  const pending = items.filter((p) => p.status === "pending");
  const failed = items.filter((p) => p.status === "failed");
  const total = successful.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Transaction history and revenue tracking.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={CircleDollarSign} label="Revenue" value={`GHS ${total.toLocaleString()}`} accent="text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold))]/15" />
        <Stat icon={CheckCircle2} label="Successful" value={successful.length} accent="text-emerald-600 bg-emerald-500/15" />
        <Stat icon={Clock} label="Pending" value={pending.length} accent="text-amber-600 bg-amber-500/15" />
        <Stat icon={XCircle} label="Failed" value={failed.length} accent="text-rose-600 bg-rose-500/15" />
      </div>

      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No payments recorded yet</td></tr>}
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{p.bookings?.customer_name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-gold font-semibold">{p.bookings?.booking_code ?? p.transaction_reference ?? "—"}</div>
                      {p.bookings?.status && <div className="mt-0.5"><StatusBadge status={p.bookings.status} /></div>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.payment_method ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{p.paid_at ? format(new Date(p.paid_at), "PP") : format(new Date(p.created_at), "PP")}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-right font-semibold">GHS {Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, accent }: any) => (
  <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}><Icon className="w-4 h-4" /></div>
    </div>
    <p className="font-display text-2xl lg:text-3xl font-bold mt-3">{value}</p>
  </div>
);

export default Payments;