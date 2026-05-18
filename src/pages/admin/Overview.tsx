import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BedDouble, CalendarCheck, CircleDollarSign, DoorOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Stats = { totalBookings: number; available: number; occupied: number; revenue: number };

const Card = ({ icon: Icon, label, value, accent }: any) => (
  <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="font-display text-3xl font-bold mt-3">{value}</p>
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bookings, rooms, payments, recentB] = await Promise.all([
        supabase.from("bookings").select("id, status, total_amount"),
        supabase.from("rooms").select("id, is_available"),
        supabase.from("payments").select("amount, status"),
        supabase.from("bookings").select("*, rooms(room_name)").order("created_at", { ascending: false }).limit(5),
      ]);
      const totalBookings = bookings.data?.length ?? 0;
      const available = rooms.data?.filter((r) => r.is_available).length ?? 0;
      const occupied = (rooms.data?.length ?? 0) - available;
      const revenue = payments.data?.filter((p) => p.status === "successful").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
      setStats({ totalBookings, available, occupied, revenue });
      setRecent(recentB.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what's happening at Blue Top Villa.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={CalendarCheck} label="Total Bookings" value={stats?.totalBookings} accent="bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold-dark))]" />
        <Card icon={DoorOpen} label="Available Rooms" value={stats?.available} accent="bg-emerald-500/15 text-emerald-600" />
        <Card icon={BedDouble} label="Occupied Rooms" value={stats?.occupied} accent="bg-rose-500/15 text-rose-600" />
        <Card icon={CircleDollarSign} label="Total Revenue" value={`GHS ${(stats?.revenue ?? 0).toLocaleString()}`} accent="bg-[hsl(var(--navy))]/15 text-[hsl(var(--navy))]" />
      </div>

      <div className="bg-card rounded-xl border border-border/60 shadow-sm">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Check-in</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No bookings yet</td></tr>}
              {recent.map((b) => (
                <tr key={b.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{b.customer_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{b.rooms?.room_name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{format(new Date(b.check_in), "MMM d, yyyy")}</td>
                  <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-3 text-right font-medium">GHS {Number(b.total_amount ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    rejected: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    completed: "bg-[hsl(var(--navy))]/15 text-[hsl(var(--navy))] border-[hsl(var(--navy))]/30",
    successful: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    failed: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    unpaid: "bg-muted text-muted-foreground border-border",
    refunded: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
};

export default Overview;