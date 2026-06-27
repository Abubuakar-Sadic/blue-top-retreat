import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Capability } from "@/lib/permissions";

/** Route guard that restricts nested admin routes to a required capability. */
const RequireCap = ({ cap }: { cap: Capability }) => {
  const { can, loading } = useAuth();
  const allowed = can(cap);
  useEffect(() => {
    if (!loading && !allowed) {
      toast.error("You don't have permission to access that area.");
    }
  }, [loading, allowed]);
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }
  if (!allowed) return <Navigate to="/admin" replace />;
  return <Outlet />;
};

export default RequireCap;
