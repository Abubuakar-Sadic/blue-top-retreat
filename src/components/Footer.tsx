import { Phone, MapPin, Mail } from "lucide-react";

const Footer = () => (
  <footer className="bg-navy-dark text-white/70 pt-16 pb-8">
    <div className="section-container px-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <h3 className="font-display text-2xl font-bold text-white mb-4">
            Blue Top <span className="text-gold">Villa</span>
          </h3>
          <p className="text-sm leading-relaxed">
            Your premier destination for luxury accommodation and world-class event hosting in Kasoa, Ghana.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {["Home", "Rooms", "Events", "Gallery", "Contact"].map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`} className="hover:text-gold transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold" />
              <a href="tel:+233541737326" className="hover:text-gold transition-colors">054 173 7326</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <span>GHCC+G2, Kasoa, Ghana</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              <span>info@bluetopvilla.com</span>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-white font-semibold mb-4">Follow Us</h4>
          <div className="flex gap-3">
            {["Facebook", "Instagram", "Twitter"].map((s) => (
              <a
                key={s}
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold/20 transition-colors text-sm font-medium text-white hover:text-gold"
                aria-label={s}
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Blue Top Villa. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
