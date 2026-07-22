import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Cake, Cookie, Croissant, Coffee, Dessert, ShoppingBag, LogOut, User, ChevronDown } from "lucide-react";
import type { CustomerUser } from "../App";

const navLinks = [
  { href: "#home", label: "Home", Icon: Dessert },
  { href: "#about", label: "About", Icon: Croissant },
  { href: "#menu", label: "Menu", Icon: Cookie },
  { href: "#testimonials", label: "Testimonials", Icon: Cake },
  { href: "#contact", label: "Contact Us", Icon: Coffee },
];

/* Animated SVG oval */
const ActiveOval = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
    viewBox="0 0 100 32"
    preserveAspectRatio="none"
  >
    <ellipse
      className="active-oval"
      cx="50" cy="16" rx="48" ry="13"
      fill="none"
      stroke="#E57373"
      strokeWidth="2"
      strokeLinecap="round"
      pathLength="100"
      strokeDasharray="88 12"
      strokeDashoffset="100"
    />
  </svg>
);

interface NavbarProps {
  customer: CustomerUser | null;
  onOrdersClick: () => void;
  onLogout: () => void;
  onNavClick?: (href: string) => void;
  forceSolid?: boolean;
  activePage?: "home" | "orders";
}

const Navbar = ({ customer, onOrdersClick, onLogout, onNavClick, forceSolid, activePage = "home" }: NavbarProps) => {
  const [active, setActive] = useState("#home");
  const prevActive = useRef("#home");
  const [atHero, setAtHero] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  /* Solid bg once scrolled past hero */
  useEffect(() => {
    const onScroll = () => setAtHero(window.scrollY < 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close profile dropdown when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Animate oval */
  useEffect(() => {
    const ovals = document.querySelectorAll(".active-oval");
    gsap.set(ovals, { strokeDashoffset: 100 });
    const activeOval = document.querySelector(`[data-nav="${active}"] .active-oval`);
    if (activeOval) {
      gsap.fromTo(activeOval,
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }
      );
    }
    prevActive.current = active;
  }, [active]);

  const isSolid = forceSolid || !atHero;
  const navBg = isSolid ? "bg-[#F5EDE3]/95 backdrop-blur-sm shadow-sm" : "bg-transparent";
  const linkColor = isSolid ? "text-[#3E2723]" : "text-white";

  /* First letter of name for avatar */
  const initials = customer?.name?.charAt(0).toUpperCase() ?? "";

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setActive(href);
    onNavClick?.(href);
    if (href === "#home") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, "", "#home");
    }
  };

  return (
    <>
      {/* ── Desktop ── */}
      <div className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <nav className="flex items-center justify-between h-16 px-10">

          <img src="/logo/maologo4.png" alt="Logo" className="h-20 w-20" />

          <ul className={`flex items-center gap-1 font-bold text-[13px] tracking-[0.15em] uppercase ${linkColor}`}>
            {navLinks.map(({ href, label }) => {
              const isActive = active === href && activePage !== "orders";
              return (
                <li key={href} data-nav={href} className="relative">
                  <a
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className={`relative block px-5 py-2 transition-colors duration-200 hover:text-[#E57373] ${isActive ? "text-[#E57373]" : ""}`}
                  >
                    {isActive && <ActiveOval />}
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {customer ? (
              /* ── Profile dropdown ── */
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    activePage === "orders"
                      ? "border-transparent text-[#E57373] bg-transparent hover:bg-transparent"
                      : !isSolid
                      ? "border-white/50 text-white hover:bg-white/15"
                      : "border-[#3E2723]/30 text-[#3E2723] hover:bg-[#3E2723]/10"
                  }`}
                >
                  {activePage === "orders" && <ActiveOval />}
                  {/* Avatar circle */}
                  <span className="w-7 h-7 rounded-full bg-[#E57373] flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                    {initials}
                  </span>
                  <span className="text-[13px] font-bold tracking-wide max-w-[100px] truncate">
                    {customer.name}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#ecddd3] overflow-hidden z-50">
                    {/* Profile info */}
                    <div className="px-4 py-4 bg-[#fdf8f4] border-b border-[#ecddd3]">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-[#E57373] flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#3E2723] truncate">{customer.name}</p>
                          <p className="text-xs text-[#8d6e63] truncate">{customer.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => { setProfileOpen(false); onOrdersClick(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#3E2723] hover:bg-[#fdf8f4] transition-colors"
                    >
                      <ShoppingBag size={15} className="text-[#E57373]" />
                      My Orders
                    </button>

                    <div className="border-t border-[#ecddd3]" />

                    <button
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Sign In button ── */
              <button
                onClick={onOrdersClick}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold tracking-[0.1em] uppercase transition-all duration-200 border ${
                  !isSolid
                    ? "border-white/60 text-white hover:bg-white/20"
                    : "border-[#3E2723] text-[#3E2723] hover:bg-[#3E2723] hover:text-white"
                }`}
              >
                <User size={14} />
                Sign In
              </button>
            )}
          </div>
        </nav>

        {isSolid && (
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#E57373] to-transparent opacity-40" />
        )}
      </div>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#EAD7C3]/80 backdrop-blur-sm flex items-center justify-between px-4 h-14 border-b border-[#c9b49a]">
        <div className="w-10" />
        <img src="/logo/maologo4.png" alt="Logo" className="h-10 w-10" />
        {customer ? (
          <button
            onClick={onOrdersClick}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full font-extrabold text-sm ${
              activePage === "orders"
                ? "bg-transparent text-[#E57373]"
                : "bg-[#E57373] text-white"
            }`}
            aria-label="Profile"
          >
            {activePage === "orders" && <ActiveOval />}
            {initials}
          </button>
        ) : (
          <button
            onClick={onOrdersClick}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3E2723]/10 text-[#3E2723] hover:bg-[#3E2723] hover:text-white transition-all"
            aria-label="Sign In"
          >
            <User size={17} />
          </button>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#EAD7C3]/90 backdrop-blur-md border-t border-[#c9b49a]">
        <nav className="flex items-center justify-around h-16 px-2">
          {navLinks.map(({ href, label, Icon }) => {
            const isActive = active === href && activePage !== "orders";
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all"
              >
                <span className={`flex items-center justify-center w-10 h-6 rounded-full transition-all duration-300 ${isActive ? "bg-[#5D4037]" : ""}`}>
                  <Icon size={18} className={isActive ? "text-[#EAD7C3]" : "text-[#5D4037]"} />
                </span>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-[#3E2723]" : "text-[#8d6e63]"}`}>
                  {label}
                </span>
              </a>
            );
          })}
          {/* Mobile logout if logged in */}
          {customer && (
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all"
            >
              <span className="flex items-center justify-center w-10 h-6">
                <LogOut size={18} className="text-red-400" />
              </span>
              <span className="text-[10px] font-medium text-red-400">Logout</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
