const Hero = () => {
  return (
    <section
      className="sticky top-0 z-0 min-h-[100svh] md:min-h-screen overflow-hidden flex items-center px-6 md:px-16 pt-16 pb-24 md:pb-12"
      id="home"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover object-center"
        src="/home/hero44.mp4"
        autoPlay
        loop
        muted
        playsInline
        poster="/home/hero23.png"
      />

      {/* Overlay to keep text readable */}
      <div className="absolute inset-0 bg-[#3E2723]/30" />

      {/* Text content */}
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-md text-center mx-auto">
        <span className="text-xs font-semibold tracking-widest text-[#f5dfc8] uppercase">
          Freshly Baked · Made with Love
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-md">
          Soft like mochi<br />
          sweet like<br />
          <span className="text-[#E57373]">Memories</span>
        </h1>

        <p className="text-[#f5dfc8] text-sm leading-relaxed max-w-xs drop-shadow">
          Freshly baked treats made to bring warmth, comfort, and a little
          sweetness to your everyday moments.
        </p>

        <a
          href="#menu"
          className="w-fit bg-[#3E2723] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#1a0f0a] transition-colors"
        >
          See the Menu
        </a>
      </div>
    </section>
  );
};

export default Hero;

