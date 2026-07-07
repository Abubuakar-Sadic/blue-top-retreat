import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Upload, X, Image as ImageIcon, Film, Play } from "lucide-react";
import { convertImageToWebP, validateRoomVideo, storagePathFromPublicUrl, MAX_VIDEO_SECONDS } from "@/lib/media";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Room = {
  id: string;
  room_name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  room_type: string | null;
  amenities: string[];
  featured_image: string | null;
  gallery_images: string[];
  videos: string[];
  is_available: boolean;
};

const empty: Partial<Room> = {
  room_name: "", description: "", price_per_night: 0, capacity: 2,
  room_type: "Standard", amenities: [], featured_image: "", gallery_images: [], videos: [], is_available: true,
};

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Room> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Room | null>(null);
  const [amenityInput, setAmenityInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaDel, setMediaDel] = useState<{ kind: "featured" | "gallery" | "video"; url: string } | null>(null);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("rooms").select("*").order("created_at", { ascending: false });
    setRooms((data ?? []) as Room[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); setOpen(true); };
  const openEdit = (r: Room) => { setEditing({ ...r }); setOpen(true); };

  const uploadFile = async (file: File, ext: string): Promise<string | null> => {
    const path = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("rooms").upload(path, file, { upsert: false });
    if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from("rooms").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setUploading(true);
    try {
      const webp = await convertImageToWebP(file);
      const url = await uploadFile(webp, "webp");
      if (url) setEditing((p) => ({ ...p!, featured_image: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally { setUploading(false); }
  };
  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); e.target.value = ""; if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      try {
        const webp = await convertImageToWebP(f);
        const u = await uploadFile(webp, "webp");
        if (u) urls.push(u);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Could not process "${f.name}".`);
      }
    }
    if (urls.length) setEditing((p) => ({ ...p!, gallery_images: [...(p?.gallery_images ?? []), ...urls] }));
    setUploading(false);
  };
  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setUploading(true);
    try {
      const valid = await validateRoomVideo(file);
      const url = await uploadFile(valid, "mp4");
      if (url) setEditing((p) => ({ ...p!, videos: [...(p?.videos ?? []), url] }));
      else return;
      toast.success("Video uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Video processing failed.");
    } finally { setUploading(false); }
  };

  // Delete a single media file: remove from storage, from editing state, and
  // persist immediately when the room already exists.
  const deleteMedia = async () => {
    if (!mediaDel) return;
    setDeletingMedia(true);
    const { kind, url } = mediaDel;
    try {
      const path = storagePathFromPublicUrl(url, "rooms");
      if (path) {
        const { error } = await supabase.storage.from("rooms").remove([path]);
        // Ignore "not found" so a missing file can still be unlinked from the room.
        if (error && !/not.?found/i.test(error.message)) throw new Error(error.message);
      }
      const next: Partial<Room> = { ...editing! };
      if (kind === "featured") next.featured_image = "";
      if (kind === "gallery") next.gallery_images = (editing?.gallery_images ?? []).filter((g) => g !== url);
      if (kind === "video") next.videos = (editing?.videos ?? []).filter((v) => v !== url);
      setEditing(next);
      if (editing?.id) {
        const col = kind === "featured" ? { featured_image: next.featured_image } : kind === "gallery" ? { gallery_images: next.gallery_images } : { videos: next.videos };
        const { error } = await supabase.from("rooms").update(col).eq("id", editing.id);
        if (error) throw new Error(error.message);
      }
      toast.success("Media deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? `Delete failed: ${err.message}` : "Delete failed.");
    } finally {
      setDeletingMedia(false);
      setMediaDel(null);
    }
  };

  const save = async () => {
    if (!editing?.room_name) { toast.error("Room name is required"); return; }
    const payload = {
      room_name: editing.room_name,
      description: editing.description,
      price_per_night: Number(editing.price_per_night) || 0,
      capacity: Number(editing.capacity) || 1,
      room_type: editing.room_type,
      amenities: editing.amenities ?? [],
      featured_image: editing.featured_image,
      gallery_images: editing.gallery_images ?? [],
      videos: editing.videos ?? [],
      is_available: editing.is_available ?? true,
      slug: editing.room_name?.toLowerCase().replace(/\s+/g, "-"),
    };
    const { error } = editing.id
      ? await supabase.from("rooms").update(payload).eq("id", editing.id)
      : await supabase.from("rooms").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Room updated" : "Room created");
    setOpen(false); setEditing(null); load();
  };

  const remove = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("rooms").delete().eq("id", confirmDel.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Room deleted"); setConfirmDel(null); load();
  };

  const toggleAvailable = async (r: Room) => {
    const { error } = await supabase.from("rooms").update({ is_available: !r.is_available }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Rooms & Suites</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your villa inventory, pricing, and availability.</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Room</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : rooms.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-16 text-center text-muted-foreground">No rooms yet — add your first room.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden group">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {r.featured_image ? (
                  <img src={r.featured_image} alt={r.room_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/40" /></div>
                )}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium border ${r.is_available ? "bg-emerald-500/90 text-white border-emerald-600" : "bg-rose-500/90 text-white border-rose-600"}`}>
                  {r.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold">{r.room_name}</h3>
                    <p className="text-xs text-muted-foreground">{r.room_type} · {r.capacity} guests</p>
                  </div>
                  <p className="text-gold font-semibold">GHS {Number(r.price_per_night).toLocaleString()}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={r.is_available} onChange={() => toggleAvailable(r)} className="accent-[hsl(var(--gold))]" />
                    Available
                  </label>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-muted" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDel(r)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.id ? "Edit Room" : "New Room"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Room Name"><input className="input" value={editing.room_name ?? ""} onChange={(e) => setEditing({ ...editing, room_name: e.target.value })} /></Field>
                <Field label="Room Type"><input className="input" value={editing.room_type ?? ""} onChange={(e) => setEditing({ ...editing, room_type: e.target.value })} placeholder="Standard / Deluxe / Suite" /></Field>
                <Field label="Price per Night (GHS)"><input type="number" className="input" value={editing.price_per_night ?? 0} onChange={(e) => setEditing({ ...editing, price_per_night: Number(e.target.value) })} /></Field>
                <Field label="Capacity"><input type="number" className="input" value={editing.capacity ?? 2} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Description">
                <textarea rows={3} className="input" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="Amenities">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editing.amenities ?? []).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs">
                      {a}
                      <button onClick={() => setEditing({ ...editing, amenities: editing.amenities!.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Wi-Fi, AC, TV..." value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (amenityInput.trim()) { setEditing({ ...editing, amenities: [...(editing.amenities ?? []), amenityInput.trim()] }); setAmenityInput(""); } } }} />
                  <button type="button" onClick={() => { if (amenityInput.trim()) { setEditing({ ...editing, amenities: [...(editing.amenities ?? []), amenityInput.trim()] }); setAmenityInput(""); } }} className="px-3 py-2 rounded-lg border hover:bg-muted text-sm">Add</button>
                </div>
              </Field>
              <Field label="Featured Image">
                <div className="flex items-center gap-3">
                  {editing.featured_image && <img src={editing.featured_image} alt="" className="w-20 h-20 object-cover rounded-lg" />}
                  <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg border hover:bg-muted text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFeatured} />
                </div>
              </Field>
              <Field label="Gallery Images">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editing.gallery_images ?? []).map((g, i) => (
                    <div key={i} className="relative">
                      <img src={g} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <button onClick={() => setEditing({ ...editing, gallery_images: editing.gallery_images!.filter((_, j) => j !== i) })}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => galleryRef.current?.click()} className="px-3 py-2 rounded-lg border hover:bg-muted text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Add Photos
                </button>
                <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={handleGallery} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_available ?? true} onChange={(e) => setEditing({ ...editing, is_available: e.target.checked })} className="accent-[hsl(var(--gold))]" />
                Available for booking
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
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>"{confirmDel?.room_name}" will be permanently removed.</AlertDialogDescription>
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

export default Rooms;