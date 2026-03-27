import { motion } from "framer-motion";
import { Bed, DollarSign, PartyPopper, MapPin } from "lucide-react";

const features = [
  { icon: Bed, title: "Comfortable Rooms", desc: "Elegantly furnished rooms with modern amenities for a restful stay." },
  { icon: DollarSign, title: "Affordable Pricing", desc: "Premium hospitality without the premium price tag." },
  { icon: PartyPopper, title: "Event Hosting Expertise", desc: "Professional team to make your events unforgettable." },
  { icon: MapPin, title: "Prime Location", desc: "Conveniently located in Kasoa with easy access from Accra." },
];

const WhyChooseUs = () => (
  <section className="section-padding bg-muted">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Our Advantages</p>
        <h2 className="heading-section text-foreground mb-4">Why Choose Blue Top Villa</h2>
        <div className="gold-divider" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center group"
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <f.icon className="w-7 h-7 text-gold" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
