import { Phone, MapPin, Mail, Facebook, Instagram } from "lucide-react";

// TikTok glyph (lucide doesn't ship one)
const TikTokIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.6 6.3a5.5 5.5 0 0 1-3.4-1.2 5.5 5.5 0 0 1-2-3.6h-3.4v13.2a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V8.7a6 6 0 0 0-.8-.1 6 6 0 1 0 6 6V9.3a8.9 8.9 0 0 0 5.4 1.8V7.7c-.6 0-1.3-.5-2-1.4Z"/>
  </svg>
);

const socials = [
  { name: "Instagram", href: "https://www.instagram.com/bluetopvillahotel?igsh=Y3ZnZXdkaTltZ2xj", Icon: Instagram },
  { name: "TikTok", href: "https://www.tiktok.com/@bluetopvillahotel?_r=1&_t=ZS-97JTdDcORgy", Icon: TikTokIcon },
];

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
              <a href="tel:+233595543157" className="hover:text-gold transition-colors">059 554 3157</a>
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
            {socials.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold/20 transition-colors text-white hover:text-gold"
                aria-label={name}
              >
                <Icon className="w-4 h-4" />
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
