import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { Capability } from "@/lib/permissions";

/** Route guard that restricts nested admin routes to a required capability. */
const RequireCap = ({ cap }: { cap: Capability }) => {
  const { can, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }
  if (!can(cap)) return <Navigate to="/admin" replace />;
  return <Outlet />;
};

export default RequireCap;
