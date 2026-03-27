import { motion } from "framer-motion";
import heroImg from "@/assets/hero-hotel.jpg";

const CtaSection = () => (
  <section className="relative py-24 overflow-hidden">
    <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    <div className="absolute inset-0 bg-navy-dark/80" />
    <div className="relative z-10 text-center px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl md:text-5xl font-bold text-white mb-6"
      >
        Book Your Stay or Event <span className="text-gold">Today</span>
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <a href="#contact" className="btn-gold text-lg">
          Contact Us
        </a>
      </motion.div>
    </div>
  </section>
);

export default CtaSection;
