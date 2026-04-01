import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

const RoomsSection = lazy(() => import("@/components/RoomsSection"));
const EventsSection = lazy(() => import("@/components/EventsSection"));
const GallerySection = lazy(() => import("@/components/GallerySection"));
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const BookingSection = lazy(() => import("@/components/BookingSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const CtaSection = lazy(() => import("@/components/CtaSection"));
const Footer = lazy(() => import("@/components/Footer"));
const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton"));

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <WhatsAppButton />
    <Suspense fallback={null}>
      <RoomsSection />
      <EventsSection />
      <GallerySection />
      <WhyChooseUs />
      <TestimonialsSection />
      <BookingSection />
      <ContactSection />
      <CtaSection />
      <Footer />
    </Suspense>
  </div>
);

export default Index;
