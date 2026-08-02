import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { EntityType } from "@/lib/reservations";

type Note = {
  id: string;
  note: string;
  author_id: string | null;
  author_email: string | null;
  created_at: string;
};

/** Staff-only notes. Never rendered on the public website. */
const InternalNotes = ({ entityType, entityId }: { entityType: EntityType; entityId: string }) => {
  const { user, can } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const allowed = can("view_operations");

  const load = async () => {
    const { data, error } = await supabase
      .from("reservation_notes")
      .select("id, note, author_id, author_email, created_at")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setNotes((data ?? []) as Note[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, allowed]);

  if (!allowed) return null;

  const add = async () => {
    const note = draft.trim();
    if (!note) return;
    setSaving(true);
    const { error } = await supabase.from("reservation_notes").insert({
      entity_type: entityType,
      entity_id: entityId,
      note,
      author_id: user?.id ?? null,
      author_email: user?.email ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setDraft("");
    toast.success("Note added");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reservation_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Note deleted");
    load();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-gold" />
        <h3 className="font-display text-base font-semibold">Internal Notes</h3>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Staff only</span>
      </div>

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a private note for the team…"
          aria-label="New internal note"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <button onClick={add} disabled={saving || !draft.trim()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--navy))] text-white text-sm disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save note
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gold" /></div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No internal notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                <button onClick={() => remove(n.id)} aria-label="Delete note" title="Delete note"
                  className="p-1 rounded-md hover:bg-destructive/10 text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {n.author_email ?? "Staff"} · {format(new Date(n.created_at), "PPp")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default InternalNotes;