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
  partySize: z.number().min(1).max(500),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id?: string; title: string } | null;
};

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-sm";

const ReserveEventModal = ({ open, onOpenChange, event }: Props) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", partySize: 1, notes: "" });
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setCode(null); setForm({ name: "", phone: "", email: "", partySize: 1, notes: "" }); }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { data, error } = await supabase.from("event_reservations").insert({
      event_id: event.id ?? null,
      event_title: event.title,
      attendee_name: form.name,
      attendee_phone: form.phone,
      attendee_email: form.email || null,
      party_size: form.partySize,
      notes: form.notes || null,
    }).select("id, reservation_code").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const resCode = data?.reservation_code ?? null;
    setCode(resCode);
    supabase.functions.invoke("send-booking-sms", {
      body: { type: "event", id: data?.id },
    }).catch(() => {});
    sendBookingToWhatsApp([
      "🎉 *New Event Attendance Booking — Blue Top Villa*",
      resCode ? `Reservation code: ${resCode}` : "",
      `Event: ${event.title}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : "",
      `Party size: ${form.partySize}`,
      form.notes ? `Notes: ${form.notes}` : "",
    ]);
    toast.success("Reservation confirmed!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        {code ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center">Spot Reserved</DialogTitle>
              <DialogDescription className="text-center">
                Your reservation code has been sent to {form.phone}. Show this at the door.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg py-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Reservation Code</p>
              <p className="font-mono text-2xl font-bold text-gold">{code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your booking details have been sent to Blue Top Villa on WhatsApp. If it didn't open, tap below.
            </p>
            <a
              href={`https://wa.me/233559171787?text=${encodeURIComponent(`Event booking ${code ?? ""} — ${event?.title ?? ""} for ${form.name} (${form.phone})`)}`}
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
              <DialogTitle className="font-display text-2xl">Reserve: {event?.title}</DialogTitle>
              <DialogDescription>Fill in your details and we'll save your spot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={inputCls} placeholder="Phone (e.g. 055 917 1787)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <input className={inputCls} type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Party size</label>
                <input className={inputCls} type="number" min={1} max={500} value={form.partySize} onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })} />
              </div>
              <textarea className={inputCls} rows={2} placeholder="Dietary needs, special requests (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">
                {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Reserving...</span> : "Confirm Reservation"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReserveEventModal;