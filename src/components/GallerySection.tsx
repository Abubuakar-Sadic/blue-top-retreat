import { motion } from "framer-motion";
import heroImg from "@/assets/hero-hotel.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomSuite from "@/assets/room-suite.jpg";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryDining from "@/assets/gallery-dining.jpg";
import galleryLobby from "@/assets/gallery-lobby.jpg";

const images = [
  { src: heroImg, alt: "Blue Top Villa hotel exterior at dusk", label: "Hotel Exterior", span: "md:col-span-2 md:row-span-2" },
  { src: roomDeluxe, alt: "Deluxe Room with king-size bed", label: "Deluxe Room", span: "" },
  { src: galleryPool, alt: "Outdoor swimming pool and sun loungers", label: "Swimming Pool", span: "" },
  { src: galleryDining, alt: "Gourmet dining restaurant interior", label: "Restaurant", span: "md:col-span-2" },
  { src: roomSuite, alt: "Executive Suite with separate living area", label: "Executive Suite", span: "" },
  { src: galleryLobby, alt: "Elegant hotel lobby with seating area", label: "Hotel Lobby", span: "" },
];

const GallerySection = () => (
  <section id="gallery" className="section-padding bg-background">
    <div className="section-container">
      <div className="text-center mb-16">
        <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-3">Gallery</p>
        <h2 className="heading-section text-foreground mb-4">A Glimpse Inside</h2>
        <div className="gold-divider" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {images.map((img, i) => (
          <motion.div
            key={img.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-lg group aspect-square ${img.span}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-navy-dark/0 group-hover:bg-navy-dark/40 transition-colors duration-500 flex items-center justify-center">
              <span className="text-white font-display text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {img.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default GallerySection;
