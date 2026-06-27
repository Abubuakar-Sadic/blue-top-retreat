import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ROLE_LABELS, type StaffRole } from "@/lib/permissions";

type AuditRow = {
  id: string;
  actor_id: string | null;
  target_id: string | null;
  role: string | null;
  action: string;
  created_at: string;
};
type Profile = { id: string; email: string | null; full_name: string | null };

const PAGE_SIZE = 15;

const roleLabel = (r: string | null) =>
  r ? ROLE_LABELS[r as StaffRole] ?? r : "—";

const AuditLog = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const [{ data: logs }, { data: p }] = await Promise.all([
      supabase.from("role_audit_log").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name"),
    ]);
    setRows((logs as AuditRow[]) ?? []);
    const map: Record<string, Profile> = {};
    ((p as Profile[]) ?? []).forEach((x) => { map[x.id] = x; });
    setProfiles(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-audit")
      .on("postgres_changes", { event: "*", schema: "public", table: "role_audit_log" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const who = (id: string | null) => {
    if (!id) return "—";
    const pr = profiles[id];
    return pr?.full_name || pr?.email || id.slice(0, 8);
  };

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Role Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">A permanent record of every staff-role change — who made it, who was affected, and when.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-16 text-center text-muted-foreground">No role changes recorded yet.</div>
      ) : (
        <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/60 flex items-center gap-2">
            <History className="w-4 h-4 text-gold" />
            <h2 className="font-display text-lg font-semibold">History ({rows.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Changed by</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Affected user</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((r) => (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "PPp")}</td>
                    <td className="px-5 py-3 font-medium">{who(r.actor_id)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${
                        r.action === "granted"
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                        {r.action === "granted" ? "Granted" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ArrowRight className="w-3 h-3" />{roleLabel(r.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{who(r.target_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border/60 text-sm">
              <span className="text-muted-foreground text-xs">Page {current + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <button disabled={current === 0} onClick={() => setPage(current - 1)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-muted">Previous</button>
                <button disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}
                  className="px-3 py-1.5 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-muted">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;