import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  checkin: z.string().min(1),
  checkout: z.string().min(1),
});

const BookingSection = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    checkin: "",
    checkout: "",
    eventType: "",
  });
  const [busy, setBusy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (new Date(form.checkin) > new Date(form.checkout)) {
      toast.error("Check-out must be after check-in"); return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      check_in: form.checkin,
      check_out: form.checkout,
      event_type: form.eventType || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Reservation request sent! We'll contact you shortly.");
    setForm({ name: "", phone: "", email: "", checkin: "", checkout: "", eventType: "" });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all";

  return (
    <section id="booking" className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-16">
          <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Reservations</p>
          <h2 className="heading-section text-foreground mb-4">Book Your Stay</h2>
          <div className="gold-divider" />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-card rounded-2xl p-8 md:p-10 shadow-xl border border-border/50"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="059 554 3157" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Email (Optional)</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Check-in Date</label>
              <input type="date" name="checkin" value={form.checkin} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Check-out Date</label>
              <input type="date" name="checkout" value={form.checkout} onChange={handleChange} required className={inputClass} />
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-sm font-medium text-foreground mb-1.5">Event Type (Optional)</label>
            <select name="eventType" value={form.eventType} onChange={handleChange} className={inputClass}>
              <option value="">No event — Room only</option>
              <option value="wedding">Wedding</option>
              <option value="party">Party</option>
              <option value="corporate">Corporate Event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="btn-gold w-full mt-8 text-base disabled:opacity-60">
            {busy ? "Sending..." : "Make a Reservation"}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default BookingSection;
