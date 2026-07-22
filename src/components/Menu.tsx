import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomCakeModal from "./CustomCakeModal";
import OrderModal from "./OrderModal";
import type { CustomerUser } from "../App";

gsap.registerPlugin(ScrollTrigger);

interface MenuItem {
  id: number;
  title: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

/* ── Product Card ── */
const ProductCard = ({
  item,
  index,
  onOrder,
  onHover,
}: {
  item: MenuItem;
  index: number;
  onOrder: (item: MenuItem) => void;
  onHover: (url: string | null) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.7,
        delay: (index % 3) * 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [index]);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      scale: hovered ? 1.02 : 1,
      boxShadow: hovered
        ? "0 24px 60px rgba(42,24,16,0.22)"
        : "0 4px 24px rgba(42,24,16,0.10)",
      duration: 0.2,
      ease: "power2.out",
    });
  }, [hovered]);

  /* Varied card heights for staggered look */
  const heights = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/5]"];
  const aspectClass = heights[index % heights.length];

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => { setHovered(true); onHover(item.image_url); }}
      onMouseLeave={() => { setHovered(false); /* don't clear bg — grid handles it */ }}
      className="relative grain overflow-hidden rounded-2xl cursor-pointer"
    >
      {/* Image */}
      <div className={`relative w-full ${aspectClass} overflow-hidden`}>
        <img
          src={item.image_url}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.08)" : "scale(1)", transition: "transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1810]/90 via-[#2a1810]/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {item.is_available ? (
            <span className="bg-[#d4a574]/90 text-[#2a1810] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
              ● Available
            </span>
          ) : (
            <span className="bg-[#2a1810]/80 text-white/80 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
              Sold Out
            </span>
          )}
        </div>

        {/* Index */}
        <div className="absolute top-4 right-4 z-10 text-white/40 font-lato text-xs tracking-widest">
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 flex flex-col gap-2">
          <h3 className="font-playfair text-white text-xl md:text-2xl font-bold leading-tight capitalize">
            {item.title}
          </h3>

          {/* Description — revealed on hover */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ maxHeight: hovered ? "120px" : "0px", opacity: hovered ? 1 : 0 }}
          >
            <div
              className="font-lato text-white/75 text-xs leading-relaxed tracking-wide
                [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-0.5 [&_*]:break-words line-clamp-4"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>

          {/* Price + CTA row */}
          <div className="flex items-center justify-between mt-1">
            <span className="font-playfair text-[#d4a574] text-lg font-bold">
              ETB {item.price}
            </span>
            {item.is_available ? (
              <button
                onClick={(e) => { e.stopPropagation(); onOrder(item); }}
                className="font-lato text-[10px] font-bold uppercase tracking-widest text-white border border-white/40 hover:bg-white hover:text-[#2a1810] px-4 py-2 rounded-full transition-all duration-200"
              >
                Reserve →
              </button>
            ) : (
              <span className="font-lato text-[10px] uppercase tracking-widest text-white/40">
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Section ── */
const MenuSection = ({
  customer,
  onRequireLogin,
  pendingItemId,
  onPendingConsumed,
}: {
  customer: CustomerUser | null;
  onRequireLogin: (itemId: number) => void;
  pendingItemId: number | null;
  onPendingConsumed: () => void;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [orderItem, setOrderItem] = useState<MenuItem | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<SVGPathElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgNextRef = useRef<HTMLDivElement>(null);
  const currentImageRef = useRef<string | null>(null);

  /* When customer just logged in and there's a pending item, open its modal */
  useEffect(() => {
    if (!customer || pendingItemId === null || items.length === 0) return;
    const found = items.find((i) => i.id === pendingItemId);
    if (found) {
      // Scroll to menu section first, then open modal
      const section = document.getElementById("menu");
      section?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        setOrderItem(found);
        onPendingConsumed();
      }, 600);
    }
  }, [customer, pendingItemId, items]);

  const handleReserve = (item: MenuItem) => {
    if (!customer) {
      onRequireLogin(item.id);
      return;
    }
    setOrderItem(item);
  };

  /* Crossfade bg — no white flash */
  useEffect(() => {
    const bg = bgRef.current;
    const bgNext = bgNextRef.current;
    if (!bg || !bgNext) return;

    if (!hoveredImage) {
      // fade both out
      gsap.to([bg, bgNext], { opacity: 0, duration: 0.6, ease: "power2.out" });
      currentImageRef.current = null;
      return;
    }

    if (hoveredImage === currentImageRef.current) return;

    // Load new image into bgNext, fade it in over the current bg, then swap
    bgNext.style.backgroundImage = `url(${hoveredImage})`;
    gsap.set(bgNext, { opacity: 0 });
    gsap.to(bgNext, {
      opacity: 1,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: () => {
        // swap: make bgNext the "current"
        if (bg && bgNext) {
          bg.style.backgroundImage = bgNext.style.backgroundImage;
          gsap.set(bg, { opacity: 1 });
          gsap.set(bgNext, { opacity: 0 });
        }
      },
    });

    currentImageRef.current = hoveredImage;
  }, [hoveredImage]);

  useEffect(() => {
    gsap.fromTo(headingRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" } }
    );
    if (dividerRef.current) {
      const length = dividerRef.current.getTotalLength();
      gsap.fromTo(dividerRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.2, ease: "power2.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%" } }
      );
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/menu`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
        const json = await res.json();
        setItems(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [loading]);

  return (
    <section id="menu" className="bg-[#f5f1ed] pb-28 md:pb-24 relative z-10 overflow-hidden">

      {/* Full-page blurred bg image on hover — two layers for crossfade */}
      <div
        ref={bgRef}
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-0"
        style={{ filter: "blur(18px) brightness(0.35)", transform: "scale(1.08)" }}
      />
      <div
        ref={bgNextRef}
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-0"
        style={{ filter: "blur(18px) brightness(0.35)", transform: "scale(1.08)" }}
      />

      {/* Heading */}
      <div ref={headingRef} className="relative z-10 text-center pt-24 pb-16 px-6">
        <span className="font-lato text-xs font-bold tracking-[0.3em] uppercase transition-colors duration-500"
          style={{ color: hoveredImage ? "#d4a574" : "#d4a574" }}>
          Handcrafted Daily
        </span>
        <h2 className="mt-4 font-playfair text-5xl md:text-6xl font-bold leading-tight transition-colors duration-500"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
          <span className={hoveredImage ? "text-white" : "text-[#2a1810]"}>Our </span>
          <em className="not-italic text-[#d4a574]">Menu</em>
        </h2>

        {/* Organic SVG divider */}
        <div className="flex justify-center mt-5">
          <svg width="200" height="20" viewBox="0 0 200 20" fill="none">
            <path
              ref={dividerRef}
              d="M 10 12 Q 50 4 100 12 Q 150 20 190 10"
              stroke="#d4a574"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <p className={`mt-5 font-lato text-sm max-w-md mx-auto leading-relaxed font-light tracking-wide transition-colors duration-500 ${hoveredImage ? "text-white/80" : "text-[#5a3e2b]"}`}
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}>
          Where Italian tradition meets modern taste. Every dessert tells a story of passion, precision, and premium ingredients.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-2 border-[#f5f1ed] border-t-[#d4a574] rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-20 px-6">
          <p className="font-playfair text-2xl text-[#2a1810] mb-4">Something went wrong</p>
          <p className="font-lato text-[#5a3e2b] text-sm mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="font-lato text-xs font-bold uppercase tracking-widest bg-[#2a1810] text-white px-8 py-3 rounded-full hover:bg-[#d4a574] hover:text-[#2a1810] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Staggered grid — fade bg out only when mouse leaves the whole grid */}
      {!loading && !error && items.length > 0 && (
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 md:px-16"
          onMouseLeave={() => setHoveredImage(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((item, i) => (
              <div
                key={item.id}
                className={i % 3 === 1 ? "lg:mt-12" : i % 3 === 2 ? "lg:mt-6" : ""}
              >
                <ProductCard item={item} index={i} onOrder={handleReserve} onHover={setHoveredImage} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && (
        <div className="relative z-10 mt-20 text-center px-6">
          {/* Organic divider */}
          <div className="flex justify-center mb-10">
            <svg width="160" height="16" viewBox="0 0 160 16" fill="none">
              <path d="M 8 10 Q 40 3 80 10 Q 120 17 152 8" stroke="#d4a574" strokeWidth="1" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <p className="font-lato text-[#5a3e2b] text-sm mb-6 font-light tracking-wide">
            Don't see what you're dreaming of?
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="font-lato text-xs font-bold uppercase tracking-[0.2em] bg-[#2a1810] hover:bg-[#d4a574] text-white hover:text-[#2a1810] px-12 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Commission Your Dream Dessert
          </button>
        </div>
      )}

      <CustomCakeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <OrderModal item={orderItem} customer={customer} onClose={() => setOrderItem(null)} />
    </section>
  );
};

export default MenuSection;
