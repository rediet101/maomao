import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    // As the About section scrolls up over the pinned Hero,
    // zoom the content from 1.18 → 1 (starts big, settles to normal)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",  // begins when About's top enters the viewport bottom
        end: "top top",       // ends when About's top reaches the viewport top
        scrub: 1.2,
      },
    });

    tl.fromTo(
      content,
      { scale: 1.18, borderRadius: "24px" },
      { scale: 1,    borderRadius: "0px",  ease: "none" }
    );

    return () => {
      tl.scrollTrigger?.kill();
    };
  }, []);

  return (
    // z-10 so it stacks above the sticky Hero (z-0) as it scrolls over
    <section
      ref={sectionRef}
      id="about"
      className="relative z-10 min-h-screen flex flex-col md:flex-row overflow-hidden"
      style={{ boxShadow: "0 -20px 60px rgba(62,39,35,0.35)" }}
    >
      {/* Inner content — this is what zooms */}
      <div
        ref={contentRef}
        className="w-full flex flex-col md:flex-row origin-center overflow-hidden"
        style={{ willChange: "transform" }}
      >
        {/* Left — image */}
        <div className="relative w-full md:w-1/2 min-h-[50vh] md:min-h-screen overflow-hidden bg-[#F5EDE3]">
          <img
            src="/home/about3.png"
            alt="About Maomao"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="hidden md:block absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-[#F5EDE3]" />
        </div>

        {/* Right — solid warm bg with text */}
        <div className="w-full md:w-1/2 bg-[#F5EDE3] flex items-center px-8 md:px-16 py-16 md:py-24">
          <div className="max-w-lg">

            {/* Eyebrow */}
            <span className="text-xs font-semibold tracking-[0.2em] text-[#E57373] uppercase">
              Our Story
            </span>

            {/* Heading */}
            <h2 className="mt-4 text-5xl md:text-6xl font-extrabold text-[#3E2723] leading-[1.1]">
              Made with<br />
              <span className="text-[#E57373]">love</span> &<br />
              warm hands
            </h2>

            {/* Divider */}
            <div className="mt-6 w-14 h-1 bg-[#E57373] rounded-full" />

            {/* Body */}
            <p className="mt-6 text-[#5D4037] text-base leading-relaxed">
              Maomao was born from a simple idea — that every bite should feel
              like a warm hug. We bake everything fresh daily, using traditional
              recipes passed down through generations and the finest local
              ingredients.
            </p>

            <p className="mt-4 text-[#5D4037] text-base leading-relaxed">
              From fluffy mochi to buttery croissants, our pastries carry a
              little piece of heart in every layer. We believe good food brings
              people together, and that's exactly what we set out to do.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { value: "5+", label: "Years Baking" },
                { value: "120+", label: "Recipes" },
                { value: "10k+", label: "Happy Customers" },
              ].map(({ value, label }) => (
                <div key={label} className="border-l-2 border-[#E57373] pl-4">
                  <p className="text-3xl font-extrabold text-[#3E2723]">{value}</p>
                  <p className="text-xs text-[#8d6e63] mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#menu"
              className="mt-10 inline-block bg-[#3E2723] text-white text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#1a0f0a] transition-colors"
            >
              See Our Menu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
