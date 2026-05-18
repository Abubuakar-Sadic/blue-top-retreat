import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const ProtectedAdmin = () => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-4">This account is not an administrator.</p>
          <a href="/" className="text-gold hover:underline">Return to website</a>
        </div>
      </div>
    );
  }
  return <Outlet />;
};

export default ProtectedAdmin;