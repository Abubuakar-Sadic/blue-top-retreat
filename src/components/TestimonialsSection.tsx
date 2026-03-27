import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Akosua Mensah",
    role: "Wedding Guest",
    text: "Our wedding at Blue Top Villa was absolutely magical. The team went above and beyond to make everything perfect. Highly recommended!",
  },
  {
    name: "Kwame Asante",
    role: "Business Traveler",
    text: "Clean, comfortable rooms and excellent service. The location is very convenient and the staff is incredibly welcoming. My go-to hotel in Kasoa.",
  },
  {
    name: "Ama Boateng",
    role: "Event Planner",
    text: "I've hosted multiple corporate events here. The facilities are top-notch and the coordination team is professional and responsive.",
  },
];

const TestimonialsSection = () => (
  <section className="section-padding bg-navy-dark">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Testimonials</p>
        <h2 className="heading-section text-white mb-4">What Our Guests Say</h2>
        <div className="gold-divider" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 relative"
          >
            <Quote className="w-8 h-8 text-gold/30 absolute top-6 right-6" />
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="text-white/80 text-sm leading-relaxed mb-6">{t.text}</p>
            <div>
              <p className="font-display font-semibold text-white">{t.name}</p>
              <p className="text-gold/70 text-sm">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
