import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Upload, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WEEKDAYS, recurrenceLabel, nextOccurrence } from "@/lib/events";

type Event = {
  id: string;
  title: string;
  description: string | null;
  event_at: string | null;
  location: string | null;
  image_url: string | null;
  is_public: boolean;
  event_type: string;
  recurrence_days: number[];
  recurrence_time: string | null;
};

const empty: Partial<Event> = {
  title: "", description: "", event_at: "", location: "", image_url: "", is_public: true,
  event_type: "one_time", recurrence_days: [], recurrence_time: "",
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("events").select("*").order("event_at", { ascending: true });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); setOpen(true); };
  const openEdit = (e: Event) => {
    setEditing({ ...e, event_at: e.event_at ? toLocalInput(e.event_at) : "", recurrence_time: e.recurrence_time ?? "" });
    setOpen(true);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("events").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("events").getPublicUrl(path);
    setEditing((p) => ({ ...p!, image_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!editing?.title) { toast.error("Title is required"); return; }
    const isRecurring = editing.event_type === "recurring";
    if (isRecurring) {
      if (!editing.recurrence_days?.length || !editing.recurrence_time) {
        toast.error("Select at least one day and a time for recurring events"); return;
      }
    } else if (!editing.event_at) {
      toast.error("Date and time are required for one-time events"); return;
    }
    const payload = {
      title: editing.title,
      description: editing.description,
      event_type: editing.event_type ?? "one_time",
      event_at: isRecurring ? null : new Date(editing.event_at!).toISOString(),
      recurrence_days: isRecurring ? (editing.recurrence_days ?? []) : [],
      recurrence_time: isRecurring ? editing.recurrence_time : null,
      location: editing.location,
      image_url: editing.image_url,
      is_public: editing.is_public ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Event updated" : "Event created");
    setOpen(false); setEditing(null); load();
  };

  const remove = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("events").delete().eq("id", confirmDel.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted"); setConfirmDel(null); load();
  };

  const togglePublic = async (ev: Event) => {
    const { error } = await supabase.from("events").update({ is_public: !ev.is_public }).eq("id", ev.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Upcoming Events</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and publish events for the villa.</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Event</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : events.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-16 text-center text-muted-foreground">No events scheduled yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <div key={ev.id} className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden group">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/40" /></div>
                )}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium border ${ev.is_public ? "bg-emerald-500/90 text-white border-emerald-600" : "bg-muted text-muted-foreground border-border"}`}>
                  {ev.is_public ? "Public" : "Hidden"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold">{ev.title}</h3>
                {ev.event_type === "recurring" ? (
                  <>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/15 text-gold border border-gold/30">Recurring</span>
                    <p className="text-xs text-muted-foreground mt-1">{recurrenceLabel(ev)}</p>
                    {nextOccurrence(ev) && <p className="text-[11px] text-muted-foreground">Next: {format(nextOccurrence(ev)!, "MMM d · h:mm a")}</p>}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">{ev.event_at ? format(new Date(ev.event_at), "MMM d, yyyy · h:mm a") : ""}</p>
                )}
                {ev.location && <p className="text-xs text-muted-foreground">{ev.location}</p>}
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
                  <button onClick={() => togglePublic(ev)} className="flex items-center gap-1.5 text-xs hover:text-gold">
                    {ev.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {ev.is_public ? "Visible" : "Hidden"}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(ev)} className="p-1.5 rounded-md hover:bg-muted" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDel(ev)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.id ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Field label="Title"><input className="input" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Date & Time"><input type="datetime-local" className="input" value={editing.event_at ?? ""} onChange={(e) => setEditing({ ...editing, event_at: e.target.value })} /></Field>
                <Field label="Location"><input className="input" value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Poolside Terrace" /></Field>
              </div>
              <Field label="Description">
                <textarea rows={4} className="input" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="Image">
                <div className="flex items-center gap-3">
                  {editing.image_url && <img src={editing.image_url} alt="" className="w-20 h-20 object-cover rounded-lg" />}
                  <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg border hover:bg-muted text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_public ?? true} onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })} className="accent-[hsl(var(--gold))]" />
                Show on public website
              </label>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border hover:bg-muted text-sm">Cancel</button>
            <button onClick={save} disabled={uploading} className="btn-gold text-sm py-2">{uploading ? "Uploading..." : "Save"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>"{confirmDel?.title}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="block text-sm font-medium mb-1.5">{label}</label>{children}</div>
);

export default Events;
