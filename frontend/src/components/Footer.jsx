import { Link } from "react-router-dom";
import mainLogo from "../assets/baynoore-main-logo.png";

export default function Footer() {
  return (
    <footer className="bg-brown text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <img
              src={mainLogo}
              alt="Baynoore - Modesty with Elegance"
              className="h-10 w-auto object-contain mb-3 brightness-0 invert"
            />
            <p className="text-xs tracking-[0.2em] text-gold-light mb-3 font-medium">
              MODESTY WITH ELEGANCE
            </p>
            <p className="text-ivory/70 text-sm leading-relaxed">
              Premium modest fashion for everyday elegance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-base mb-4 text-gold-light">Quick Links</h4>
            <ul className="space-y-2 text-sm text-ivory/70">
              {[
                { label: "Home", to: "/" },
                { label: "Shop", to: "/category/burka" },
                { label: "Track Order", to: "/track-order" },
                { label: "Exchange Policy", to: "/exchange-policy" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-gold-light transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-base mb-4 text-gold-light">Contact</h4>
            <div className="space-y-3 text-sm text-ivory/70">
              <p>Chattogram, Bangladesh</p>
              <a
                href="https://wa.me/8801794529766"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold-light transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                +8801794529766
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-ivory/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/40">
          <p>© {new Date().getFullYear()} Baynoore. All rights reserved.</p>
          <p>Chattogram, Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
