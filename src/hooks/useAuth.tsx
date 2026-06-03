import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "ceo" | "admin" | "manager" | "receptionist";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: string[];
  /** highest-ranking staff role, or null if none */
  role: StaffRole | null;
  isAdmin: boolean; // CEO / admin — full access incl. staff management
  isManager: boolean; // manager and above
  isStaff: boolean; // any staff role
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const RANK: Record<string, number> = { ceo: 4, admin: 4, manager: 2, receptionist: 1 };

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

  const isAdmin = roles.includes("admin") || roles.includes("ceo");
  const isManager = isAdmin || roles.includes("manager");
  const isStaff = isManager || roles.includes("receptionist");
  const role = (roles
    .filter((r) => r in RANK)
    .sort((a, b) => RANK[b] - RANK[a])[0] as StaffRole) ?? null;

  return (
    <AuthContext.Provider value={{ user, session, roles, role, isAdmin, isManager, isStaff, loading, refreshRoles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};