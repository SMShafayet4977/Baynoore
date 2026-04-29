import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, MessageCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import mainLogo from "../assets/baynoore-main-logo.png";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Burka", to: "/category/burka" },
  { label: "Hijab", to: "/category/hijab" },
  { label: "One Piece", to: "/category/one-piece" },
  { label: "Two Piece", to: "/category/two-piece" },
  { label: "Punjabi", to: "/category/punjabi" },
  { label: "Track Order", to: "/track-order" },
];

export default function Navbar() {
  const { totalItems, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ("");
    }
  }

  return (
    <header
      className={`sticky top-0 z-30 bg-ivory transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "border-b border-beige"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={mainLogo}
              alt="Baynoore - Modesty with Elegance"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-gold-muted ${
                    isActive ? "text-gold-muted" : "text-brown"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-brown hover:text-gold-muted transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Cart */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-brown hover:text-gold-muted transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold-muted text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-brown hover:text-gold-muted transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search products..."
                className="flex-1 border border-beige rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold-muted"
              />
              <button
                type="submit"
                className="bg-brown text-ivory px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-dark transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-ivory border-t border-beige">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-cream text-gold-muted"
                      : "text-brown hover:bg-cream"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href="https://wa.me/8801794529766"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors mt-1"
            >
              <MessageCircle size={16} />
              WhatsApp Support
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
