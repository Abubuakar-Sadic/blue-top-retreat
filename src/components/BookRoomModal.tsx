import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingToWhatsApp } from "@/lib/whatsapp";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(7, "Valid phone required").max(20),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  checkin: z.string().min(1, "Check-in required"),
  checkout: z.string().min(1, "Check-out required"),
  guests: z.number().min(1).max(20),
});

type Room = { id: string; room_name: string; price_per_night: number; capacity: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-sm";

const BookRoomModal = ({ open, onOpenChange, room }: Props) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", checkin: "", checkout: "", guests: 1, notes: "" });
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setCode(null); setForm({ name: "", phone: "", email: "", checkin: "", checkout: "", guests: 1, notes: "" }); }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (new Date(form.checkin) > new Date(form.checkout)) { toast.error("Check-out must be after check-in"); return; }
    setBusy(true);
    const nights = Math.max(1, Math.ceil((new Date(form.checkout).getTime() - new Date(form.checkin).getTime()) / 86400000));
    const totalAmount = nights * Number(room.price_per_night || 0);
    const { data, error } = await supabase.from("bookings").insert({
      room_id: room.id,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      check_in: form.checkin,
      check_out: form.checkout,
      total_amount: totalAmount,
      notes: form.notes ? `Guests: ${form.guests}. ${form.notes}` : `Guests: ${form.guests}`,
    }).select("id, booking_code").single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    const bookingCode = data?.booking_code ?? null;
    setCode(bookingCode);
    // Fire-and-forget SMS
    supabase.functions.invoke("send-booking-sms", {
      body: { type: "room", id: data?.id },
    }).catch(() => {});

    // Send the full booking details directly to Blue Top Villa's WhatsApp
    sendBookingToWhatsApp([
      "🏨 *New Room Booking — Blue Top Villa*",
      bookingCode ? `Booking code: ${bookingCode}` : "",
      `Room: ${room.room_name}`,
      `Amount: GHS ${totalAmount.toLocaleString()} (${nights} night${nights > 1 ? "s" : ""})`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : "",
      `Check-in: ${form.checkin}`,
      `Check-out: ${form.checkout}`,
      `Guests: ${form.guests}`,
      form.notes ? `Notes: ${form.notes}` : "",
    ]);

    setBusy(false);
    toast.success("Booking submitted!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {code ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center">Booking Confirmed</DialogTitle>
              <DialogDescription className="text-center">
                Your booking code has been sent to {form.phone}. Please keep it safe — we'll need it at check-in.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg py-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Booking Code</p>
              <p className="font-mono text-2xl font-bold text-gold">{code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your booking details have been sent to Blue Top Villa on WhatsApp. If it didn't open, tap below.
            </p>
            <a
              href={`https://wa.me/233595543157?text=${encodeURIComponent(`Room booking ${code ?? ""} — ${room?.room_name ?? ""} for ${form.name} (${form.phone})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white py-2.5 font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" /> Send via WhatsApp
            </a>
            <button onClick={() => onOpenChange(false)} className="btn-gold w-full">Done</button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Book {room?.room_name}</DialogTitle>
              <DialogDescription>
                GHS {Number(room?.price_per_night ?? 0).toLocaleString()} / night · sleeps {room?.capacity}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={inputCls} placeholder="Phone (e.g. 059 554 3157)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <input className={inputCls} type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Check-in</label>
                  <input className={inputCls} type="date" required value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Check-out</label>
                  <input className={inputCls} type="date" required value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Guests</label>
                <input className={inputCls} type="number" min={1} max={20} value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
              </div>
              <textarea className={inputCls} rows={2} placeholder="Special requests (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">
                {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : "Confirm Booking"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookRoomModal;