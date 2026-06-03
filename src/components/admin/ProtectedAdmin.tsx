import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

const ProtectedAdmin = () => {
  const { user, isStaff, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gradient-to-br from-[hsl(var(--navy-dark))] via-[hsl(var(--navy))] to-[hsl(var(--navy-dark))]">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-[hsl(var(--gold))]/20">
          <div className="w-14 h-14 rounded-full bg-[hsl(var(--gold))]/15 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Awaiting Approval</h2>
          <p className="text-muted-foreground mb-1">Your account has been created and is pending approval.</p>
          <p className="text-muted-foreground mb-6 text-sm">The CEO will assign your role shortly. Please check back later.</p>
          <div className="text-xs text-muted-foreground mb-6 break-all">{user.email}</div>
          <button
            onClick={async () => { await signOut(); toast.success("Signed out"); }}
            className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <div className="mt-4">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground">← Return to website</a>
          </div>
        </div>
      </div>
    );
  }
  return <Outlet />;
};

export default ProtectedAdmin;