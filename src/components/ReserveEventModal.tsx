import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingToWhatsApp } from "@/lib/whatsapp";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ConfirmationPanel, ConsentGate, Field, YesNo, inputCls } from "./reservation/FormKit";

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(7, "A valid phone number is required").max(20),
  email: z.string().trim().email("Enter a valid email address").max(255),
  partySize: z.number().min(1, "Number of guests is required").max(500),
  arrivalTime: z.string().min(1, "Preferred arrival time is required"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `date` is auto-populated from the event's next occurrence. */
  event: { id?: string; title: string; date?: Date | null } | null;
};

const CELEBRATIONS = ["None", "Birthday", "Anniversary", "Graduation", "Engagement", "Promotion", "Other"];

const emptyForm = {
  name: "", phone: "", email: "", partySize: 2, arrivalTime: "",
  vip: false, bottle: false, celebration: "None", notes: "",
};

const ReserveEventModal = ({ open, onOpenChange, event }: Props) => {
  const [form, setForm] = useState({ ...emptyForm });
  const [accurate, setAccurate] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  const eventDate = event?.date ?? null;

  useEffect(() => {
    if (!open) {
      setCode(null); setForm({ ...emptyForm }); setAccurate(false); setAgreed(false); setBusy(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || busy) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!accurate || !agreed) { toast.error("Please tick both confirmation boxes to continue"); return; }

    setBusy(true);
    try {
      const { data, error } = await supabase.from("event_reservations").insert({
        event_id: event.id ?? null,
        event_title: event.title,
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
        attendee_name: form.name,
        attendee_phone: form.phone,
        attendee_email: form.email,
        party_size: form.partySize,
        arrival_time: form.arrivalTime,
        vip_table: form.vip,
        bottle_reservation: form.bottle,
        celebration_type: form.celebration === "None" ? null : form.celebration,
        notes: form.notes || null,
      }).select("id, reservation_code").single();
      if (error) throw error;

      const resCode = data?.reservation_code ?? null;
      setCode(resCode);
      supabase.functions.invoke("send-booking-sms", { body: { type: "event", id: data?.id } }).catch(() => {});
      sendBookingToWhatsApp([
        "🎉 *New Event Reservation — Blue Top Villa*",
        resCode ? `Reference: ${resCode}` : "",
        `Event: ${event.title}`,
        eventDate ? `Event date: ${format(eventDate, "EEE d MMM yyyy")}` : "",
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        `Guests: ${form.partySize}`,
        `Arrival: ${form.arrivalTime}`,
        `VIP table: ${form.vip ? "Yes" : "No"} · Bottle reservation: ${form.bottle ? "Yes" : "No"}`,
        form.celebration !== "None" ? `Celebration: ${form.celebration}` : "",
        form.notes ? `Special requests: ${form.notes}` : "",
      ]);
      toast.success("Reservation submitted successfully");
    } catch (err: any) {
      console.error("Event reservation failed", err);
      toast.error(err?.message ?? "We couldn't submit your reservation. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        {code ? (
          <ConfirmationPanel
            reference={code}
            whatsappText={`Event reservation ${code} — ${event?.title ?? ""} for ${form.name} (${form.phone})`}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Reserve: {event?.title}</DialogTitle>
              <DialogDescription>Fill in your details and we'll save your spot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Event">
                  <input className={`${inputCls} bg-muted/50`} value={event?.title ?? ""} readOnly aria-readonly="true" />
                </Field>
                <Field label="Event date">
                  <input className={`${inputCls} bg-muted/50`} readOnly aria-readonly="true"
                    value={eventDate ? format(eventDate, "EEE d MMM yyyy") : "To be announced"} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name" required>
                  <input className={inputCls} placeholder="Full name" required maxLength={100}
                    value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="Phone number" required>
                  <input className={inputCls} type="tel" placeholder="055 917 1787" required maxLength={20}
                    value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Email address" required>
                <input className={inputCls} type="email" placeholder="you@example.com" required maxLength={255}
                  value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Number of guests" required>
                  <input className={inputCls} type="number" min={1} max={500} value={form.partySize}
                    onChange={(e) => set({ partySize: Number(e.target.value) })} />
                </Field>
                <Field label="Preferred arrival time" required>
                  <input className={inputCls} type="time" required value={form.arrivalTime}
                    onChange={(e) => set({ arrivalTime: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <YesNo label="VIP table required?" value={form.vip} onChange={(v) => set({ vip: v })} />
                <YesNo label="Bottle reservation?" value={form.bottle} onChange={(v) => set({ bottle: v })} />
              </div>
              <Field label="Celebration type">
                <select className={inputCls} value={form.celebration} onChange={(e) => set({ celebration: e.target.value })}>
                  {CELEBRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Special requests">
                <textarea className={inputCls} rows={2} maxLength={1000} placeholder="Seating preference, dietary needs, surprise setup..."
                  value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </Field>

              <ConsentGate idPrefix="event" accurate={accurate} terms={agreed}
                onAccurate={setAccurate} onTerms={setAgreed} />

              <button type="submit" disabled={busy || !accurate || !agreed} className="btn-gold w-full disabled:opacity-60">
                {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : "Submit Reservation"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReserveEventModal;