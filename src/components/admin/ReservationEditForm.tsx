import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type EditField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "time" | "select" | "textarea";
  options?: string[];
};

type Props = {
  table: "bookings" | "venue_reservations" | "event_reservations";
  row: any;
  fields: EditField[];
  onSaved: () => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40";

/** Compact editor used by the "Edit" quick action on reservation views. */
const ReservationEditForm = ({ table, row, fields, onSaved, onCancel }: Props) => {
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""])),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, any> = {};
    fields.forEach((f) => {
      const v = values[f.key];
      payload[f.key] = v === "" ? null : f.type === "number" ? Number(v) : v;
    });
    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation updated");
    onSaved();
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="text-xs text-muted-foreground space-y-1 block">
            <span>{f.label}</span>
            {f.type === "select" ? (
              <select value={values[f.key] ?? ""} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} className={`${inputClass} capitalize`}>
                {(f.options ?? []).map((o) => <option key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</option>)}
              </select>
            ) : f.type === "textarea" ? (
              <textarea rows={2} value={values[f.key] ?? ""} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} className={inputClass} />
            ) : (
              <input type={f.type} value={values[f.key] ?? ""} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} className={inputClass} />
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--navy))] text-white text-sm disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save changes
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
      </div>
    </div>
  );
};

export default ReservationEditForm;
