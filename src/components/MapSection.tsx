const MapSection = () => (
  <section className="w-full h-[400px] relative">
    <iframe
      title="Blue Top Villa Location"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31768.43!2d-0.4167!3d5.5333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdfb73bfbfbfbfb%3A0x0!2sKasoa%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="grayscale hover:grayscale-0 transition-all duration-700"
    />
  </section>
);

export default MapSection;
