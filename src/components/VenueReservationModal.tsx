import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingToWhatsApp } from "@/lib/whatsapp";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, PartyPopper } from "lucide-react";
import { ConfirmationPanel, ConsentGate, Field, YesNo, inputCls } from "./reservation/FormKit";

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(7, "A valid phone number is required").max(20),
  email: z.string().trim().email("Enter a valid email address").max(255),
  eventType: z.string().trim().min(1, "Select an event type"),
  eventDate: z.string().min(1, "Event date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  guestCount: z.number().min(1, "Expected number of guests is required").max(2000),
  venue: z.string().trim().min(1, "Select a preferred venue"),
  budget: z.string().trim().min(1, "Select a budget range"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional prefill of the event type (e.g. "Weddings") */
  presetType?: string | null;
};

const EVENT_TYPES = [
  "Wedding", "Birthday", "Conference", "Corporate Meeting",
  "Funeral Reception", "Engagement", "Seminar", "Other",
];

const VENUES = ["Main Hall", "Garden / Outdoor Area", "Poolside", "Conference Room", "No preference"];

const BUDGETS = [
  "Under GHS 2,000", "GHS 2,000 – 5,000", "GHS 5,000 – 10,000",
  "GHS 10,000 – 20,000", "Above GHS 20,000", "Not sure yet",
];

const emptyForm = {
  name: "", phone: "", email: "", eventType: "", eventDate: "",
  startTime: "", endTime: "", guestCount: 50, venue: "", budget: "",
  decoration: false, catering: false, sound: false, photography: false, notes: "",
};

const VenueReservationModal = ({ open, onOpenChange, presetType }: Props) => {
  const [form, setForm] = useState({ ...emptyForm });
  const [accurate, setAccurate] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (open) {
      const normalized = presetType ? presetType.replace(/s$/, "") : "";
      const match = EVENT_TYPES.find((t) => t.toLowerCase().startsWith(normalized.toLowerCase())) || "";
      setForm((f) => ({ ...f, eventType: match }));
    } else {
      setCode(null); setForm({ ...emptyForm }); setAccurate(false); setAgreed(false); setBusy(false);
    }
  }, [open, presetType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (form.endTime <= form.startTime) { toast.error("End time must be after the start time"); return; }
    if (!accurate || !agreed) { toast.error("Please tick both confirmation boxes to continue"); return; }

    setBusy(true);
    try {
      const { data, error } = await supabase.from("venue_reservations").insert({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        event_type: form.eventType,
        event_date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
        guest_count: form.guestCount,
        preferred_venue: form.venue,
        decoration_required: form.decoration,
        catering_required: form.catering,
        sound_system_required: form.sound,
        photography_required: form.photography,
        budget_range: form.budget,
        notes: form.notes || null,
      }).select("id, reservation_code").single();
      if (error) throw error;

      const resCode = data?.reservation_code ?? null;
      setCode(resCode);
      supabase.functions.invoke("send-booking-sms", { body: { type: "venue", id: data?.id } }).catch(() => {});
      sendBookingToWhatsApp([
        "🏛️ *New Venue Reservation — Blue Top Villa*",
        resCode ? `Reference: ${resCode}` : "",
        `Event type: ${form.eventType}`,
        `Date: ${form.eventDate} (${form.startTime} – ${form.endTime})`,
        `Preferred venue: ${form.venue}`,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        `Expected guests: ${form.guestCount}`,
        `Decoration: ${form.decoration ? "Yes" : "No"} · Catering: ${form.catering ? "Yes" : "No"}`,
        `Sound system: ${form.sound ? "Yes" : "No"} · Photography: ${form.photography ? "Yes" : "No"}`,
        `Budget: ${form.budget}`,
        form.notes ? `Notes: ${form.notes}` : "",
      ]);
      toast.success("Reservation submitted successfully");
    } catch (err: any) {
      console.error("Venue reservation failed", err);
      toast.error(err?.message ?? "We couldn't submit your request. Please try again.");
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
            whatsappText={`Venue reservation ${code} — ${form.eventType} on ${form.eventDate} for ${form.name} (${form.phone})`}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-gold" /> Reserve the Venue
              </DialogTitle>
              <DialogDescription>Host your event at Blue Top Villa. Tell us about your occasion.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 mt-2">
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
                <Field label="Event type" required>
                  <select className={inputCls} required value={form.eventType} onChange={(e) => set({ eventType: e.target.value })}>
                    <option value="">Select type</option>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Event date" required>
                  <input className={inputCls} type="date" required value={form.eventDate}
                    onChange={(e) => set({ eventDate: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Start time" required>
                  <input className={inputCls} type="time" required value={form.startTime}
                    onChange={(e) => set({ startTime: e.target.value })} />
                </Field>
                <Field label="End time" required>
                  <input className={inputCls} type="time" required value={form.endTime}
                    onChange={(e) => set({ endTime: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Expected number of guests" required>
                  <input className={inputCls} type="number" min={1} max={2000} value={form.guestCount}
                    onChange={(e) => set({ guestCount: Number(e.target.value) })} />
                </Field>
                <Field label="Preferred venue / hall" required>
                  <select className={inputCls} required value={form.venue} onChange={(e) => set({ venue: e.target.value })}>
                    <option value="">Select venue</option>
                    {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <YesNo label="Decoration required?" value={form.decoration} onChange={(v) => set({ decoration: v })} />
                <YesNo label="Catering required?" value={form.catering} onChange={(v) => set({ catering: v })} />
                <YesNo label="Sound system required?" value={form.sound} onChange={(v) => set({ sound: v })} />
                <YesNo label="Photography required?" value={form.photography} onChange={(v) => set({ photography: v })} />
              </div>
              <Field label="Budget range" required>
                <select className={inputCls} required value={form.budget} onChange={(e) => set({ budget: e.target.value })}>
                  <option value="">Select budget range</option>
                  {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Additional notes">
                <textarea className={inputCls} rows={2} maxLength={1000} placeholder="Theme, seating layout, special arrangements..."
                  value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </Field>

              <ConsentGate idPrefix="venue" accurate={accurate} terms={agreed}
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

export default VenueReservationModal;