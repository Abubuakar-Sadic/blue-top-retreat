import { motion } from "framer-motion";
import weddingImg from "@/assets/event-wedding.jpg";
import partyImg from "@/assets/event-party.jpg";
import corporateImg from "@/assets/event-corporate.jpg";

const events = [
  { title: "Weddings", alt: "Luxury wedding celebration setup", subtitle: "Your dream celebration begins here", image: weddingImg },
  { title: "Parties", alt: "Elegant party reception venue", subtitle: "Unforgettable moments, perfectly hosted", image: partyImg },
  { title: "Corporate Events", alt: "Corporate conference and event hall", subtitle: "Professional spaces for business success", image: corporateImg },
];

const EventsSection = () => (
  <section id="events" className="section-padding bg-navy-dark">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Events</p>
        <h2 className="heading-section text-white mb-4">Host Your Perfect Event</h2>
        <div className="gold-divider" />
        <p className="text-white/60 mt-4 max-w-2xl mx-auto">
          From intimate gatherings to grand celebrations, Blue Top Villa provides the ideal setting for every occasion.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {events.map((ev, i) => (
          <motion.div
            key={ev.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="relative group rounded-xl overflow-hidden aspect-[3/4] cursor-pointer"
          >
            <img
              src={ev.image}
              alt={ev.alt}
              loading="lazy"
              width={800}
              height={600}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-display text-2xl font-bold text-white mb-1">{ev.title}</h3>
              <p className="text-white/70 text-sm">{ev.subtitle}</p>
              <a href="#booking" className="inline-block mt-3 text-gold text-sm font-medium hover:underline">
                Plan Your Event →
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EventsSection;
