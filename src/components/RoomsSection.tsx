import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import roomFallback from "@/assets/room-deluxe.jpg";
import RoomDetailModal from "./RoomDetailModal";
import BookRoomModal from "./BookRoomModal";

type Room = {
  id: string;
  room_name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  featured_image: string | null;
  is_available: boolean;
  amenities: string[];
  gallery_images: string[];
};

const RoomsSection = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_name, description, price_per_night, capacity, featured_image, is_available, amenities, gallery_images")
        .eq("is_available", true)
        .order("price_per_night", { ascending: true });
      setRooms((data ?? []) as Room[]);
    };
    load();
    const channel = supabase
      .channel("public-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
  <section id="rooms" className="section-padding bg-background">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Accommodation</p>
        <h2 className="heading-section text-foreground mb-4">Rooms &amp; Suites</h2>
        <div className="gold-divider" />
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Each room is designed for ultimate comfort, blending modern style with warm Ghanaian hospitality.
        </p>
      </div>

      {rooms.length === 0 ? (
        <p className="text-center text-muted-foreground">No rooms available right now. Please check back soon.</p>
      ) : (
      <div className="grid md:grid-cols-3 gap-8">
        {rooms.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="card-luxury group"
          >
            <div className="overflow-hidden aspect-[4/3]">
              <img
                src={room.featured_image || roomFallback}
                alt={room.room_name}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{room.room_name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{room.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gold font-semibold">GHS {Number(room.price_per_night).toLocaleString()} / night</span>
                <button
                  onClick={() => setSelectedRoom(room)}
                  className="text-sm font-medium text-navy hover:text-gold transition-colors"
                >
                  View Details →
                </button>
              </div>
              <button onClick={() => setBookingRoom(room)} className="btn-gold w-full text-sm py-2">
                Book Room
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      )}
      <RoomDetailModal
        open={!!selectedRoom}
        onOpenChange={(open) => !open && setSelectedRoom(null)}
        room={selectedRoom}
        onBook={() => {
          if (selectedRoom) {
            setBookingRoom(selectedRoom);
            setSelectedRoom(null);
          }
        }}
      />
      <BookRoomModal
        open={!!bookingRoom}
        onOpenChange={(open) => !open && setBookingRoom(null)}
        room={bookingRoom}
      />
    </div>
  </section>
  );
};

export default RoomsSection;
