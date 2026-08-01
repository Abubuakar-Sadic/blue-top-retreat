import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendBookingToWhatsApp } from "@/lib/whatsapp";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  ConfirmationPanel, ConsentGate, ESTIMATE_DISCLAIMER, Field, YesNo, inputCls,
} from "./reservation/FormKit";

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(7, "A valid phone number is required").max(20),
  email: z.string().trim().email("Enter a valid email address").max(255),
  nationality: z.string().trim().max(60).optional().or(z.literal("")),
  checkin: z.string().min(1, "Check-in date is required"),
  checkout: z.string().min(1, "Check-out date is required"),
  arrivalTime: z.string().min(1, "Expected arrival time is required"),
  adults: z.number().min(1, "At least one adult is required").max(30),
  children: z.number().min(0).max(30),
  roomsCount: z.number().min(1, "At least one room is required").max(20),
  purpose: z.string().trim().min(1, "Select the purpose of your stay"),
  requests: z.string().trim().max(1000).optional().or(z.literal("")),
});

const PURPOSES = ["Business", "Leisure", "Family", "Other"];

const emptyForm = {
  name: "", phone: "", email: "", nationality: "",
  checkin: "", checkout: "", arrivalTime: "14:00",
  adults: 1, children: 0, roomsCount: 1,
  airportPickup: false, purpose: "", requests: "",
};

type Room = { id: string; room_name: string; price_per_night: number; capacity: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
};

const BookRoomModal = ({ open, onOpenChange, room }: Props) => {
  const [form, setForm] = useState({ ...emptyForm });
  const [accurate, setAccurate] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!open) {
      setCode(null); setForm({ ...emptyForm }); setAccurate(false); setAgreed(false); setBusy(false);
    }
  }, [open]);

  const nights = useMemo(() => {
    if (!form.checkin || !form.checkout) return 0;
    const diff = new Date(form.checkout).getTime() - new Date(form.checkin).getTime();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  }, [form.checkin, form.checkout]);

  const estimate = nights * Number(room?.price_per_night ?? 0) * Math.max(1, form.roomsCount);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || busy) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (new Date(form.checkin) >= new Date(form.checkout)) { toast.error("Check-out must be after check-in"); return; }
    if (!accurate || !agreed) { toast.error("Please tick both confirmation boxes to continue"); return; }

    setBusy(true);
    try {
      const { data, error } = await supabase.from("bookings").insert({
        room_id: room.id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        nationality: form.nationality || null,
        check_in: form.checkin,
        check_out: form.checkout,
        arrival_time: form.arrivalTime,
        adults: form.adults,
        children: form.children,
        rooms_count: form.roomsCount,
        nights,
        airport_pickup: form.airportPickup,
        purpose_of_stay: form.purpose,
        total_amount: estimate,
        notes: form.requests || null,
      }).select("id, booking_code").single();
      if (error) throw error;

      const bookingCode = data?.booking_code ?? null;
      setCode(bookingCode);

      supabase.functions.invoke("send-booking-sms", { body: { type: "room", id: data?.id } }).catch(() => {});

      sendBookingToWhatsApp([
        "🏨 *New Room Booking — Blue Top Villa*",
        bookingCode ? `Reference: ${bookingCode}` : "",
        `Room: ${room.room_name} × ${form.roomsCount}`,
        `Estimate: GHS ${estimate.toLocaleString()} (${nights} night${nights > 1 ? "s" : ""})`,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        form.nationality ? `Nationality: ${form.nationality}` : "",
        `Check-in: ${form.checkin} (arriving ${form.arrivalTime})`,
        `Check-out: ${form.checkout}`,
        `Adults: ${form.adults} · Children: ${form.children}`,
        `Airport pickup: ${form.airportPickup ? "Yes" : "No"}`,
        `Purpose: ${form.purpose}`,
        form.requests ? `Special requests: ${form.requests}` : "",
      ]);
      toast.success("Reservation submitted successfully");
    } catch (err: any) {
      console.error("Room booking failed", err);
      toast.error(err?.message ?? "We couldn't submit your booking. Please try again.");
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
            whatsappText={`Room booking ${code} — ${room?.room_name ?? ""} for ${form.name} (${form.phone})`}
            onDone={() => onOpenChange(false)}
          />
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
                <Field label="Full name" required>
                  <input className={inputCls} placeholder="Full name" required maxLength={100}
                    value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="Phone number" required>
                  <input className={inputCls} type="tel" placeholder="055 917 1787" required maxLength={20}
                    value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Email address" required>
                  <input className={inputCls} type="email" placeholder="you@example.com" required maxLength={255}
                    value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </Field>
                <Field label="Nationality (optional)">
                  <input className={inputCls} placeholder="e.g. Ghanaian" maxLength={60}
                    value={form.nationality} onChange={(e) => set({ nationality: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Check-in date" required>
                  <input className={inputCls} type="date" required value={form.checkin}
                    onChange={(e) => set({ checkin: e.target.value })} />
                </Field>
                <Field label="Check-out date" required>
                  <input className={inputCls} type="date" required value={form.checkout}
                    onChange={(e) => set({ checkout: e.target.value })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Expected arrival time" required>
                  <input className={inputCls} type="time" required value={form.arrivalTime}
                    onChange={(e) => set({ arrivalTime: e.target.value })} />
                </Field>
                <Field label="Number of rooms" required>
                  <input className={inputCls} type="number" min={1} max={20} value={form.roomsCount}
                    onChange={(e) => set({ roomsCount: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Adults" required>
                  <input className={inputCls} type="number" min={1} max={30} value={form.adults}
                    onChange={(e) => set({ adults: Number(e.target.value) })} />
                </Field>
                <Field label="Children">
                  <input className={inputCls} type="number" min={0} max={30} value={form.children}
                    onChange={(e) => set({ children: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Purpose of stay" required>
                  <select className={inputCls} required value={form.purpose} onChange={(e) => set({ purpose: e.target.value })}>
                    <option value="">Select purpose</option>
                    {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <YesNo label="Airport pickup required?" value={form.airportPickup} onChange={(v) => set({ airportPickup: v })} />
              </div>
              <Field label="Special requests">
                <textarea className={inputCls} rows={2} maxLength={1000} placeholder="Early check-in, extra bed, dietary needs..."
                  value={form.requests} onChange={(e) => set({ requests: e.target.value })} />
              </Field>

              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium">{nights || "—"}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-display text-lg font-bold text-gold">
                    {nights ? `GHS ${estimate.toLocaleString()}` : "—"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{ESTIMATE_DISCLAIMER}</p>
              </div>

              <ConsentGate idPrefix="room" accurate={accurate} terms={agreed}
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

export default BookRoomModal;