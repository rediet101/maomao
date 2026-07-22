import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
}

const testimonials: Testimonial[] = [
  { id: 1, name: "Sara M.", role: "Birthday Celebration", avatar: "S", rating: 5, text: "The chocolate fudge cake was absolutely divine. Every layer melted in my mouth and the frosting was perfectly balanced. Everyone at the party couldn't stop asking where I got it from!" },
  { id: 2, name: "Liya T.", role: "Wedding Client", avatar: "L", rating: 5, text: "Maomao made our wedding cake and it was breathtaking. The almond vanilla flavour was exactly what we wanted, and the design exceeded our expectations. Guests are still talking about it." },
  { id: 3, name: "Dawit A.", role: "Regular Customer", avatar: "D", rating: 5, text: "I order the mini cupcakes almost every weekend for my kids. They're always fresh, beautifully decorated, and the flavours rotate so there's always something new to try." },
  { id: 4, name: "Hana B.", role: "Custom Order", avatar: "H", rating: 5, text: "I had a very specific vision for my daughter's birthday cake and Maomao brought it to life perfectly. The team was responsive, patient, and the final result was even better than I imagined." },
  { id: 5, name: "Yonas K.", role: "Corporate Event", avatar: "Y", rating: 4, text: "We ordered a custom cake for our office event and it was a massive hit. Professional service from start to finish, great communication, and the cake looked stunning on the table." },
  { id: 6, name: "Meron F.", role: "Anniversary", avatar: "M", rating: 5, text: "The rustic naked cake with fresh flowers was romantic and delicious. My partner was moved to tears — not by me, by the cake. I can't blame them honestly, it was phenomenal." },
];

const CARD_W = 380; // px — must match card width below
const GAP = 24;    // px — gap-6

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} className={s <= rating ? "fill-[#E57373] text-[#E57373]" : "text-[#c9b49a]"} />
    ))}
  </div>
);

const Testimonials = () => {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const headingRef  = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const indexRef    = useRef(0);           // real index (0 … total-1)
  const posRef      = useRef(0);           // current translateX in px
  const animating   = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [current, setCurrent]   = useState(0);
  const total = testimonials.length;

  // Build infinite list: clone tail + real + clone head
  // [last, ...all, first]  so we can scroll both ways forever
  const cloneCount = 3;
  const loopItems = [
    ...testimonials.slice(-cloneCount),
    ...testimonials,
    ...testimonials.slice(0, cloneCount),
  ];
  const offset = cloneCount; // real items start at index `offset`

  // Initialise position to show first real card
  useEffect(() => {
    const startX = -offset * (CARD_W + GAP);
    posRef.current = startX;
    if (trackRef.current) gsap.set(trackRef.current, { x: startX });
  }, [offset]);

  const slide = useCallback((dir: 1 | -1) => {
    if (animating.current) return;
    animating.current = true;

    const newPos = posRef.current - dir * (CARD_W + GAP);
    posRef.current = newPos;

    const newRealIndex = ((indexRef.current + dir) % total + total) % total;
    indexRef.current = newRealIndex;
    setCurrent(newRealIndex);

    gsap.to(trackRef.current, {
      x: newPos,
      duration: 0.65,
      ease: "power3.inOut",
      onComplete: () => {
        animating.current = false;
        // Silent jump: if we've gone into clone zone, reset to real zone
        const stepSize = CARD_W + GAP;
        const realStart = -offset * stepSize;
        const realEnd   = realStart - (total - 1) * stepSize;
        const track = trackRef.current;
        if (!track) return;
        if (posRef.current < realEnd - stepSize * 0.5) {
          const resetPos = realStart - (((posRef.current - realStart) % (total * stepSize)) + total * stepSize) % (total * stepSize);
          posRef.current = resetPos;
          gsap.set(track, { x: resetPos });
        } else if (posRef.current > realStart + stepSize * 0.5) {
          const resetPos = realEnd + (((realStart - posRef.current) % (total * stepSize)) + total * stepSize) % (total * stepSize);
          posRef.current = resetPos;
          gsap.set(track, { x: resetPos });
        }
      },
    });
  }, [total, offset]);

  const goTo = useCallback((targetIndex: number) => {
    if (animating.current) return;
    const t = ((targetIndex % total) + total) % total;
    const diff = t - indexRef.current;
    // pick shortest path
    const steps = diff > total / 2 ? diff - total : diff < -total / 2 ? diff + total : diff;
    if (steps === 0) return;
    const dir = steps > 0 ? 1 : -1;
    let remaining = Math.abs(steps);
    const step = () => {
      if (remaining === 0) return;
      remaining--;
      slide(dir);
      if (remaining > 0) setTimeout(step, 220);
    };
    step();
    restartLoop();
  }, [slide, total]);

  const restartLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => slide(1), 4000);
  };

  // Heading entrance
  useEffect(() => {
    gsap.fromTo(headingRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" } }
    );
  }, []);

  // Auto-play when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) restartLoop();
        else if (intervalRef.current) clearInterval(intervalRef.current);
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative z-20 bg-[#3E2723] py-24 px-6 md:px-16 pb-28 md:pb-24 overflow-hidden isolate"
    >
      {/* Heading */}
      <div ref={headingRef} className="text-center mb-16">
        <span className="text-xs font-semibold tracking-[0.2em] text-[#E57373] uppercase">
          What People Say
        </span>
        <h2 className="mt-3 text-5xl md:text-6xl font-extrabold text-white leading-tight">
          Sweet <span className="text-[#E57373]">Words</span>
        </h2>
        <div className="mt-4 w-14 h-1 bg-[#E57373] rounded-full mx-auto" />
        <p className="mt-5 text-[#c9b49a] max-w-xl mx-auto text-sm leading-relaxed">
          Every cake tells a story. Here's what our customers say about theirs.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative max-w-6xl mx-auto">
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{ gap: `${GAP}px` }}
          >
            {loopItems.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className="bg-[#FDF6F0] rounded-3xl p-7 flex flex-col gap-4 flex-shrink-0"
                style={{ width: `${CARD_W}px` }}
              >
                <StarRating rating={t.rating} />
                <p className="text-[#5D4037] text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#EAD7C3]">
                  <div className="w-10 h-10 rounded-full bg-[#E57373] flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[#3E2723] font-extrabold text-sm">{t.name}</p>
                    <p className="text-[#c9b49a] text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={() => { slide(-1); restartLoop(); }}
          className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 bg-[#EAD7C3] hover:bg-[#E57373] hover:text-white text-[#3E2723] rounded-full p-3 shadow-lg transition-colors duration-200 z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => { slide(1); restartLoop(); }}
          className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 bg-[#EAD7C3] hover:bg-[#E57373] hover:text-white text-[#3E2723] rounded-full p-3 shadow-lg transition-colors duration-200 z-10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              current === i ? "w-6 h-2 bg-[#E57373]" : "w-2 h-2 bg-[#795548]"
            }`}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
        {[
          { value: "500+", label: "Happy Customers" },
          { value: "4.9★", label: "Average Rating" },
          { value: "100%", label: "Made Fresh Daily" },
        ].map(({ value, label }) => (
          <div key={label}>
            <p className="text-3xl font-extrabold text-white">{value}</p>
            <p className="text-xs text-[#c9b49a] mt-1 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
