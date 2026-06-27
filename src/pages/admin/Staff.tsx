import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserCog, Crown, Clock, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  ASSIGNABLE_ROLES,
  ALL_STAFF_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  RANK,
  type StaffRole,
} from "@/lib/permissions";

type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

const isCeoRole = (r: string | null) => r === "ceo" || r === "admin";

const roleBadge = (role: string | null) => {
  const map: Record<string, string> = {
    ceo: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]/40",
    admin: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]/40",
    manager: "bg-[hsl(var(--navy))]/15 text-[hsl(var(--navy))] border-[hsl(var(--navy))]/30",
    receptionist: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    content_editor: "bg-violet-500/15 text-violet-700 border-violet-500/30",
    reports_viewer: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  };
  const label = role ? ROLE_LABELS[role as StaffRole] ?? role : "pending";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${role ? map[role] : "bg-amber-500/15 text-amber-700 border-amber-500/30"}`}>
      {!role && <Clock className="w-3 h-3" />}
      {label}
    </span>
  );
};

const Staff = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

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

  // Highest-ranking staff role currently held by a user.
  const roleOf = (uid: string): string | null => {
    const held = roles.filter((x) => x.user_id === uid).map((x) => x.role).filter((r) => r in RANK);
    return held.sort((a, b) => RANK[b] - RANK[a])[0] ?? null;
  };

  const ceoCount = profiles.filter((p) => isCeoRole(roleOf(p.id))).length;

  // Enforce a single role per user: clear every staff role, then grant the new one.
  const assignRole = async (uid: string, role: string) => {
    const current = roleOf(uid);
    if (current === role) return;
    // Guard against removing the last CEO.
    if (isCeoRole(current) && !isCeoRole(role) && ceoCount <= 1) {
      return toast.error("There must be at least one CEO at all times.");
    }
    setBusy(uid);
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", ALL_STAFF_ROLES as unknown as never[]);
    if (delErr) { setBusy(null); return toast.error(delErr.message); }
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as never });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${ROLE_LABELS[role as StaffRole] ?? role} access`);
    load();
  };

  const revoke = async (uid: string) => {
    const current = roleOf(uid);
    if (isCeoRole(current) && ceoCount <= 1) {
      return toast.error("There must be at least one CEO at all times.");
    }
    setBusy(uid);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", ALL_STAFF_ROLES as unknown as never[]);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Access revoked");
    load();
  };

  const pending = profiles.filter((p) => !roleOf(p.id));
  const active = profiles.filter((p) => roleOf(p.id));

  // Search across name + email, then paginate the active-staff table.
  const q = query.trim().toLowerCase();
  const matches = (p: Profile) =>
    !q ||
    (p.full_name ?? "").toLowerCase().includes(q) ||
    (p.email ?? "").toLowerCase().includes(q);
  const filteredActive = active.filter(matches);
  const filteredPending = pending.filter(matches);
  const pageCount = Math.max(1, Math.ceil(filteredActive.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pagedActive = filteredActive.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Staff & Roles</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve sign-ups and assign roles. The CEO role can be held by more than one person.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search staff by name or email…"
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          {/* Role legend */}
          <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ASSIGNABLE_ROLES.map((r) => (
                <div key={r} className="flex items-start gap-2 text-xs">
                  {roleBadge(r)}
                  <span className="text-muted-foreground leading-snug">{ROLE_DESCRIPTIONS[r]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending approvals */}
          <div className="bg-card rounded-xl border border-amber-500/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-display text-lg font-semibold">Pending Approval ({pending.length})</h2>
            </div>
            {filteredPending.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sign-ups awaiting approval.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredPending.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Joined {format(new Date(p.created_at), "PP")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                      <select disabled={busy === p.id} defaultValue=""
                        onChange={(e) => { if (e.target.value) assignRole(p.id, e.target.value); }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50">
                        <option value="" disabled>Assign role…</option>
                        {ASSIGNABLE_ROLES.map((g) => <option key={g} value={g}>{ROLE_LABELS[g]}</option>)}
                      </select>
                      {busy === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
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
                    const isCeo = isCeoRole(r);
                    const isSelf = p.id === user?.id;
                    const lockSelf = isSelf; // never let a CEO change/remove their own role here
                    return (
                      <tr key={p.id} className="border-t border-border/40 hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">
                          <span className="flex items-center gap-2">
                            {isCeo && <Crown className="w-4 h-4 text-gold" />}{p.full_name || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{p.email}</td>
                        <td className="px-5 py-3">{roleBadge(r)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 justify-end items-center">
                            {lockSelf ? (
                              <span className="text-xs text-muted-foreground">You</span>
                            ) : (
                              <>
                                <select value={isCeoRole(r) ? "ceo" : r ?? ""} disabled={busy === p.id}
                                  onChange={(e) => assignRole(p.id, e.target.value)}
                                  className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40">
                                  {ASSIGNABLE_ROLES.map((g) => <option key={g} value={g}>{ROLE_LABELS[g]}</option>)}
                                </select>
                                <button disabled={busy === p.id} onClick={() => revoke(p.id)}
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-50" title="Revoke access">
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
