import { Phone, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

const details = [
  { icon: Phone, label: "Phone", value: "054 173 7326", href: "tel:+233541737326" },
  { icon: MapPin, label: "Location", value: "GHCC+G2, Kasoa, Ghana", href: undefined },
  { icon: Clock, label: "Check-in / Check-out", value: "12:00 PM / 12:00 PM", href: undefined },
];

const ContactSection = () => (
  <section id="contact" className="section-padding bg-background">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Get in Touch</p>
        <h2 className="heading-section text-foreground mb-4">Contact Us</h2>
        <div className="gold-divider" />
      </div>

      <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
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
    </div>
  </section>
);

export default ContactSection;
