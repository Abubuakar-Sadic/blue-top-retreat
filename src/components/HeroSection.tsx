import { motion } from "framer-motion";
import heroImage from "@/assets/hero-hotel.jpg";

const HeroSection = () => (
  <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
    <img
      src={heroImage}
      alt="Blue Top Villa luxury hotel and pool"
      className="absolute inset-0 w-full h-full object-cover"
      width={1920}
      height={1080}
      fetchPriority="high"
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/70 via-navy-dark/50 to-navy-dark/80" />

    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-gold font-medium tracking-[0.3em] uppercase text-sm md:text-base mb-4"
      >
        Welcome to Blue Top Villa
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
      >
        Blue Top Villa — Luxury Hotel
        <br />
        <span className="text-gold">&amp; Event Venue in Kasoa</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10"
      >
        Hotel stays and premium event hosting in Kasoa, Ghana
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <a href="#booking" className="btn-gold text-base">
          Book a Room
        </a>
        <a href="#events" className="btn-outline-light text-base">
          Plan an Event
        </a>
      </motion.div>
    </div>

  </section>
);

export default HeroSection;
