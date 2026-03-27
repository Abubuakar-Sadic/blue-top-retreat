import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const BookingSection = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    checkin: "",
    checkout: "",
    eventType: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Reservation request sent! We'll contact you shortly.");
    setForm({ name: "", phone: "", checkin: "", checkout: "", eventType: "" });
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
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="054 173 7326" className={inputClass} />
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
          <button type="submit" className="btn-gold w-full mt-8 text-base">
            Make a Reservation
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default BookingSection;
