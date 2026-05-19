import { motion } from "framer-motion";
import { Calendar, MapPin, Clock } from "lucide-react";
import partyImg from "@/assets/event-party.jpg";
import weddingImg from "@/assets/event-wedding.jpg";
import corporateImg from "@/assets/event-corporate.jpg";

const upcoming = [
  {
    title: "New Year's Eve Gala",
    date: "Dec 31, 2026",
    time: "8:00 PM",
    location: "Poolside Terrace",
    image: partyImg,
    tag: "Party",
  },
  {
    title: "Valentine's Garden Wedding Showcase",
    date: "Feb 14, 2027",
    time: "4:00 PM",
    location: "Garden Lawn",
    image: weddingImg,
    tag: "Wedding",
  },
  {
    title: "Annual Business Leaders Mixer",
    date: "Mar 15, 2027",
    time: "6:30 PM",
    location: "Grand Hall",
    image: corporateImg,
    tag: "Corporate",
  },
];

const UpcomingEvents = () => (
  <section id="upcoming" className="section-padding bg-background">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">What's On</p>
        <h2 className="heading-section text-foreground mb-4">Upcoming Events</h2>
        <div className="gold-divider" />
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Mark your calendar. Reserve your spot at our most anticipated celebrations of the season.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {upcoming.map((ev, i) => (
          <motion.article
            key={ev.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="bg-card rounded-xl overflow-hidden border border-border/60 shadow-sm hover:shadow-xl transition-shadow group"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={ev.image}
                alt={ev.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-gold text-navy-dark text-xs font-semibold rounded-full uppercase tracking-wider">
                {ev.tag}
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-bold text-foreground mb-3">{ev.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" />{ev.date}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" />{ev.time}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" />{ev.location}</div>
              </div>
              <a href="#booking" className="inline-block mt-5 text-gold text-sm font-semibold hover:underline">
                Reserve Your Spot →
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default UpcomingEvents;