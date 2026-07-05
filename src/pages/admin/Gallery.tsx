import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Upload, ImageIcon, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type GalleryImage = {
  id: string;
  image_url: string;
  label: string | null;
  alt_text: string | null;
  sort_order: number;
  is_published: boolean;
};

const empty: Partial<GalleryImage> = {
  image_url: "", label: "", alt_text: "", sort_order: 0, is_published: true,
};

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<GalleryImage> | null>(null);
  const [confirmDel, setConfirmDel] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setImages((data ?? []) as GalleryImage[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () =>
    setEditing({ ...empty, sort_order: images.length ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0 }) || setOpen(true);
  const openEdit = (g: GalleryImage) => { setEditing({ ...g }); setOpen(true); };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `gallery/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("rooms").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("rooms").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setEditing((p) => ({ ...p!, image_url: url }));
    setUploading(false);
    e.target.value = "";
  };

  const save = async () => {
    if (!editing?.image_url) { toast.error("Please upload an image first"); return; }
    const payload = {
      image_url: editing.image_url,
      label: editing.label || null,
      alt_text: editing.alt_text || editing.label || "Blue Top Villa gallery image",
      sort_order: Number(editing.sort_order) || 0,
      is_published: editing.is_published ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("gallery_images").update(payload).eq("id", editing.id)
      : await supabase.from("gallery_images").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Image updated" : "Image added");
    setOpen(false); setEditing(null); load();
  };

  const remove = async () => {
    if (!confirmDel) return;
    // remove the underlying file from storage when possible
    const marker = "/rooms/";
    const idx = confirmDel.image_url.indexOf(marker);
    if (idx !== -1) {
      const key = confirmDel.image_url.slice(idx + marker.length);
      await supabase.storage.from("rooms").remove([key]);
    }
    const { error } = await supabase.from("gallery_images").delete().eq("id", confirmDel.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Image removed"); setConfirmDel(null); load();
  };

  const togglePublished = async (g: GalleryImage) => {
    const { error } = await supabase.from("gallery_images").update({ is_published: !g.is_published }).eq("id", g.id);
    if (error) return toast.error(error.message);
    load();
  };

  const move = async (g: GalleryImage, dir: -1 | 1) => {
    const sorted = [...images];
    const i = sorted.findIndex((x) => x.id === g.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    await Promise.all([
      supabase.from("gallery_images").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("gallery_images").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Gallery</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage the images shown in the website's gallery section.</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Image</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : images.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-16 text-center text-muted-foreground">No gallery images yet — add your first image.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((g, idx) => (
            <div key={g.id} className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden group">
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img src={g.image_url} alt={g.alt_text ?? ""} className="w-full h-full object-cover" />
                {!g.is_published && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-muted-foreground/90 text-background">Hidden</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{g.label || "Untitled"}</p>
                <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-border/50">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(g, -1)} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => move(g, 1)} disabled={idx === images.length - 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => togglePublished(g)} className="p-1.5 rounded-md hover:bg-muted" title={g.is_published ? "Hide" : "Show"}>
                      {g.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-muted" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDel(g)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.id ? "Edit Image" : "New Gallery Image"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Field label="Image">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {editing.image_url
                      ? <img src={editing.image_url} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-8 h-8 text-muted-foreground/40" />}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-lg border hover:bg-muted text-sm flex items-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {editing.image_url ? "Replace" : "Upload"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
                </div>
              </Field>
              <Field label="Label (shown on hover)">
                <input className="input" value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Swimming Pool" />
              </Field>
              <Field label="Alt text (for accessibility & SEO)">
                <input className="input" value={editing.alt_text ?? ""} onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })} placeholder="Describe the image" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_published ?? true} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} className="accent-[hsl(var(--gold))]" />
                Published (visible on the website)
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
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>This gallery image will be permanently removed.</AlertDialogDescription>
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

export default Gallery;