import { motion } from "framer-motion";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomSuite from "@/assets/room-suite.jpg";
import roomStandard from "@/assets/room-standard.jpg";

const rooms = [
  {
    name: "Standard Room",
    description: "Comfortable twin beds with modern amenities, perfect for business travelers and short stays.",
    price: "GHS 350 / night",
    image: roomStandard,
  },
  {
    name: "Deluxe Room",
    description: "Spacious king-size bedroom with premium furnishings, city views, and a luxurious en-suite bathroom.",
    price: "GHS 550 / night",
    image: roomDeluxe,
  },
  {
    name: "Executive Suite",
    description: "Our finest accommodation featuring a separate living area, premium décor, and VIP amenities.",
    price: "GHS 850 / night",
    image: roomSuite,
  },
];

const RoomsSection = () => (
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

      <div className="grid md:grid-cols-3 gap-8">
        {rooms.map((room, i) => (
          <motion.div
            key={room.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="card-luxury group"
          >
            <div className="overflow-hidden aspect-[4/3]">
              <img
                src={room.image}
                alt={room.name}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{room.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{room.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-gold font-semibold">{room.price}</span>
                <a href="#booking" className="text-sm font-medium text-navy hover:text-gold transition-colors">
                  View Details →
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default RoomsSection;
