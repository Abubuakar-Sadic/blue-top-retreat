import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { EntityType } from "@/lib/reservations";

type Entry = { id: string; event: string; detail: string | null; actor_email: string | null; created_at: string };

const STAGES: { key: string; label: string; matches: string[] }[] = [
  { key: "submitted", label: "Reservation submitted", matches: ["submitted"] },
  { key: "viewed", label: "Viewed by staff", matches: ["viewed"] },
  { key: "confirmed", label: "Confirmed", matches: ["confirmed", "approved"] },
  { key: "payment_received", label: "Payment received", matches: ["payment_received", "paid"] },
  { key: "checked_in", label: "Checked in", matches: ["checked_in"] },
  { key: "checked_out", label: "Checked out", matches: ["checked_out", "completed"] },
  { key: "cancelled", label: "Cancelled", matches: ["cancelled", "rejected"] },
];

const EVENT_LABELS: Record<string, string> = {
  submitted: "Reservation submitted",
  viewed: "Viewed by staff",
  approved: "Approved",
  confirmed: "Confirmed",
  payment_received: "Payment received",
  checked_in: "Checked in",
  checked_out: "Checked out",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  pending: "Marked pending",
};

const ReservationTimeline = ({ entityType, entityId }: { entityType: EntityType; entityId: string }) => {
  const { user, can } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const allowed = can("view_operations");

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reservation_timeline")
        .select("id, event, detail, actor_email, created_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: true });
      let rows = (data ?? []) as Entry[];
      // Record the first staff view so the timeline shows a "Viewed" step.
      if (!rows.some((r) => r.event === "viewed")) {
        const { data: inserted } = await supabase
          .from("reservation_timeline")
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            event: "viewed",
            detail: "Opened in the management dashboard",
            actor_id: user?.id ?? null,
            actor_email: user?.email ?? null,
          })
          .select("id, event, detail, actor_email, created_at")
          .maybeSingle();
        if (inserted) rows = [...rows, inserted as Entry];
      }
      if (!cancelled) { setEntries(rows); setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, allowed]);

  if (!allowed) return null;

  const reached = (stage: (typeof STAGES)[number]) =>
    entries.find((e) => stage.matches.includes(e.event));

  return (
    <section className="space-y-3">
      <h3 className="font-display text-base font-semibold">Reservation Timeline</h3>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gold" /></div>
      ) : (
        <ol className="relative border-l border-border/70 pl-5 space-y-3">
          {STAGES.map((stage) => {
            const hit = reached(stage);
            return (
              <li key={stage.key} className="relative">
                <span className="absolute -left-[27px] top-0.5 bg-card">
                  {hit ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-muted-foreground/50" />}
                </span>
                <p className={`text-sm ${hit ? "font-medium" : "text-muted-foreground"}`}>{stage.label}</p>
                {hit && (
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(hit.created_at), "PPp")}
                    {hit.actor_email ? ` · ${hit.actor_email}` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {entries.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Full activity history ({entries.length})</summary>
          <ul className="mt-2 space-y-1">
            {entries.map((e) => (
              <li key={e.id}>
                {format(new Date(e.created_at), "PPp")} — {EVENT_LABELS[e.event] ?? e.event}
                {e.detail ? ` (${e.detail})` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

export default ReservationTimeline;