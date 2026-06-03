import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserCog, Crown, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

const GRANTABLE = ["receptionist", "manager"] as const;
const STAFF_ROLES = ["ceo", "admin", "manager", "receptionist"];

const roleBadge = (role: string | null) => {
  const map: Record<string, string> = {
    ceo: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]/40",
    admin: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]/40",
    manager: "bg-[hsl(var(--navy))]/15 text-[hsl(var(--navy))] border-[hsl(var(--navy))]/30",
    receptionist: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  };
  const label = role === "admin" ? "ceo" : role;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${role ? map[role] : "bg-amber-500/15 text-amber-700 border-amber-500/30"}`}>
      {!role && <Clock className="w-3 h-3" />}
      {role ? label : "pending"}
    </span>
  );
};

const Staff = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p as Profile[]) ?? []);
    setRoles((r as RoleRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const roleOf = (uid: string): string | null => {
    const userRoles = roles.filter((x) => x.user_id === uid).map((x) => x.role);
    return STAFF_ROLES.find((sr) => userRoles.includes(sr)) ?? null;
  };

  const assignRole = async (uid: string, role: string) => {
    setBusy(uid);
    // Enforce a single staff role: clear existing staff roles, then grant the new one.
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", [...GRANTABLE]);
    if (delErr) { setBusy(null); return toast.error(delErr.message); }
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as never });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role} access`);
    load();
  };

  const revoke = async (uid: string) => {
    setBusy(uid);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", [...GRANTABLE]);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Access revoked");
    load();
  };

  const pending = profiles.filter((p) => !roleOf(p.id));
  const active = profiles.filter((p) => roleOf(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Staff & Roles</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve sign-ups and manage Receptionist & Manager access.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : (
        <>
          {/* Pending approvals */}
          <div className="bg-card rounded-xl border border-amber-500/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-display text-lg font-semibold">Pending Approval ({pending.length})</h2>
            </div>
            {pending.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sign-ups awaiting approval.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {pending.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Joined {format(new Date(p.created_at), "PP")}</div>
                    </div>
                    <div className="flex gap-2">
                      {GRANTABLE.map((g) => (
                        <button key={g} disabled={busy === p.id} onClick={() => assignRole(p.id, g)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted disabled:opacity-50 capitalize">
                          {busy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} {g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active staff */}
          <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-gold" />
              <h2 className="font-display text-lg font-semibold">Active Staff ({active.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((p) => {
                    const r = roleOf(p.id);
                    const isPrivileged = r === "admin" || r === "ceo";
                    const isSelf = p.id === user?.id;
                    return (
                      <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium flex items-center gap-2">
                          {isPrivileged && <Crown className="w-4 h-4 text-gold" />}{p.full_name || "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{p.email}</td>
                        <td className="px-5 py-3">{roleBadge(r)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 justify-end items-center">
                            {isPrivileged || isSelf ? (
                              <span className="text-xs text-muted-foreground">{isSelf ? "You" : "Protected"}</span>
                            ) : (
                              <>
                                <select value={r ?? ""} disabled={busy === p.id}
                                  onChange={(e) => assignRole(p.id, e.target.value)}
                                  className="rounded-md border border-border bg-background px-2 py-1 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-gold/40">
                                  {GRANTABLE.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
                                </select>
                                <button disabled={busy === p.id} onClick={() => revoke(p.id)}
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Revoke access">
                                  {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Staff;