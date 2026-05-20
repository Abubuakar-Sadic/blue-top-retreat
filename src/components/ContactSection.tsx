import { Phone, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(1000),
});

const details = [
  { icon: Phone, label: "Phone", value: "059 554 3157", href: "tel:+233595543157" },
  { icon: MapPin, label: "Location", value: "GHCC+G2, Kasoa, Ghana", href: undefined },
  { icon: Clock, label: "Check-in / Check-out", value: "12:00 PM / 12:00 PM", href: undefined },
];

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name, email: form.email || null, message: form.message,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent! We'll be in touch.");
    setForm({ name: "", email: "", message: "" });
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all";

  return (
  <section id="contact" className="section-padding bg-background">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Get in Touch</p>
        <h2 className="heading-section text-foreground mb-4">Contact Us</h2>
        <div className="gold-divider" />
      </div>

      <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto mb-12">
        {details.map((d, i) => (
          <motion.div
            key={d.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
              <d.icon className="w-6 h-6 text-gold" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{d.label}</p>
            {d.href ? (
              <a href={d.href} className="font-semibold text-foreground hover:text-gold transition-colors">
                {d.value}
              </a>
            ) : (
              <p className="font-semibold text-foreground">{d.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      <form onSubmit={submit} className="max-w-xl mx-auto bg-card rounded-2xl p-8 shadow-xl border border-border/50 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <textarea className={inputClass} rows={4} placeholder="Your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? "Sending..." : "Send Message"}</button>
      </form>
    </div>
  </section>
  );
};

export default ContactSection;
