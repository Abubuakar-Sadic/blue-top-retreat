import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type Level = "staff" | "manager" | "admin";

/** Route guard that restricts nested admin routes to a minimum role level. */
const RequireRole = ({ allow }: { allow: Level }) => {
  const { isStaff, isManager, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }
  const ok = allow === "admin" ? isAdmin : allow === "manager" ? isManager : isStaff;
  if (!ok) return <Navigate to="/admin" replace />;
  return <Outlet />;
};

export default RequireRole;