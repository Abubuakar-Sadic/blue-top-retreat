import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  Capability,
  StaffRole,
  RANK,
  capsForRoles,
  isStaffRole,
} from "@/lib/permissions";

export type { StaffRole, Capability } from "@/lib/permissions";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: string[];
  /** highest-ranking staff role, or null if none */
  role: StaffRole | null;
  /** capability check — the preferred way to gate UI & routes */
  can: (cap: Capability) => boolean;
  isAdmin: boolean; // CEO — full access incl. staff & finances
  isManager: boolean; // can manage events/operations
  isStaff: boolean; // any staff role (controls dashboard access)
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r: { role: string }) => r.role));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { fetchRoles(s.user.id); }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchRoles(s.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchRoles]);

  const refreshRoles = useCallback(async () => {
    if (user) await fetchRoles(user.id);
  }, [user, fetchRoles]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const caps = capsForRoles(roles);
  const can = (cap: Capability) => caps.has(cap);
  const isAdmin = can("manage_staff");
  const isManager = can("manage_events");
  const isStaff = roles.some(isStaffRole);
  const role = (roles
    .filter((r) => r in RANK)
    .sort((a, b) => RANK[b] - RANK[a])[0] as StaffRole) ?? null;

  return (
    <AuthContext.Provider value={{ user, session, roles, role, can, isAdmin, isManager, isStaff, loading, refreshRoles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};