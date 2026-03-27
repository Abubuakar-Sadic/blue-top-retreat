import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RoomsSection from "@/components/RoomsSection";
import EventsSection from "@/components/EventsSection";
import GallerySection from "@/components/GallerySection";
import WhyChooseUs from "@/components/WhyChooseUs";
import TestimonialsSection from "@/components/TestimonialsSection";
import BookingSection from "@/components/BookingSection";
import ContactSection from "@/components/ContactSection";
import MapSection from "@/components/MapSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <RoomsSection />
    <EventsSection />
    <GallerySection />
    <WhyChooseUs />
    <TestimonialsSection />
    <BookingSection />
    <ContactSection />
    <MapSection />
    <CtaSection />
    <Footer />
  </div>
);

export default Index;
