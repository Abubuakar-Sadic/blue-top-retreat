import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import partyImg from "@/assets/event-party.jpg";
import ReserveEventModal from "./ReserveEventModal";
import { isEventVisible, eventSortKey, recurrenceLabel, nextOccurrence } from "@/lib/events";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_at: string | null;
  location: string | null;
  image_url: string | null;
  event_type: string;
  recurrence_days: number[];
  recurrence_time: string | null;
};

const UpcomingEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<EventRow | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("is_public", true)
      .order("event_at", { ascending: true });
    const visible = ((data ?? []) as EventRow[])
      .filter((ev) => isEventVisible(ev))
      .sort((a, b) => eventSortKey(a) - eventSortKey(b))
      .slice(0, 6);
    setEvents(visible);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading || events.length === 0) return null;

  return (
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
          {events.map((ev, i) => (
            <motion.article
              key={ev.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-card rounded-xl overflow-hidden border border-border/60 shadow-sm hover:shadow-xl transition-shadow group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={ev.image_url || partyImg}
                  alt={ev.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{ev.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" />{format(new Date(ev.event_at), "MMM d, yyyy")}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" />{format(new Date(ev.event_at), "h:mm a")}</div>
                  {ev.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" />{ev.location}</div>}
                </div>
                {ev.description && <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{ev.description}</p>}
                <button onClick={() => setReserving(ev)} className="inline-block mt-5 text-gold text-sm font-semibold hover:underline">
                  Reserve Your Spot →
                </button>
              </div>
            </motion.article>
          ))}
        </div>
        <ReserveEventModal
          open={!!reserving}
          onOpenChange={(o) => !o && setReserving(null)}
          event={reserving ? { id: reserving.id, title: reserving.title } : null}
        />
      </div>
    </section>
  );
};

export default UpcomingEvents;
