import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  { Icon: MapPin, label: "Address", value: "Bole Road, Addis Ababa, Ethiopia" },
  { Icon: Phone, label: "Phone", value: "+251 911 000 000" },
  { Icon: Mail, label: "Email", value: "hello@maomao.et" },
  { Icon: Clock, label: "Hours", value: "Mon – Sat: 8am – 8pm\nSun: 9am – 6pm" },
];

interface ContactResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

const Contact = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [responseData, setResponseData] = useState<ContactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gsap.fromTo(leftRef.current,
      { x: -60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
    );
    gsap.fromTo(rightRef.current,
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Something went wrong.");
      setResponseData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative z-10 bg-[#FDF6F0] py-24 px-6 md:px-16 pb-28 md:pb-24"
    >
      {/* Heading */}
      <div className="text-center mb-16">
        <span className="text-xs font-semibold tracking-[0.2em] text-[#E57373] uppercase">
          Get In Touch
        </span>
        <h2 className="mt-3 text-5xl md:text-6xl font-extrabold text-[#3E2723]">
          Contact <span className="text-[#E57373]">Us</span>
        </h2>
        <div className="mt-4 w-14 h-1 bg-[#E57373] rounded-full mx-auto" />
        <p className="mt-5 text-[#795548] max-w-xl mx-auto text-sm leading-relaxed">
          Have a question, a custom order request, or just want to say hello? We'd love to hear from you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* Left — contact info */}
        <div ref={leftRef} className="flex flex-col gap-8">
          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactInfo.map(({ Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                <div className="bg-[#EAD7C3] rounded-xl p-3 flex-shrink-0">
                  <Icon size={20} className="text-[#E57373]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-1">{label}</p>
                  <p className="text-[#3E2723] text-sm font-semibold whitespace-pre-line">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div className="rounded-3xl overflow-hidden shadow-lg h-64 bg-[#EAD7C3] flex items-center justify-center relative">
            <iframe
              title="Maomao Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5!2d38.7968!3d9.0107!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDAnMzguNiJOIDM4wrA0NycxNC42IkU!5e0!3m2!1sen!2set!4v1"
              className="w-full h-full border-0 grayscale"
              loading="lazy"
              allowFullScreen
            />
            {/* Overlay label */}
            <div className="absolute bottom-3 left-3 bg-[#3E2723]/80 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full">
              📍 Maomao Bakery — Bole, Addis Ababa
            </div>
          </div>
        </div>

        {/* Right — contact form */}
        <div ref={rightRef} className="bg-white rounded-3xl shadow-sm p-8">
          {responseData ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <span className="text-5xl">💌</span>
              <h3 className="text-2xl font-extrabold text-[#3E2723]">Message Sent!</h3>
              <p className="text-[#795548] text-sm">Message #{responseData.id} · {new Date(responseData.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

              {/* Summary card */}
              <div className="w-full bg-[#FDF6F0] rounded-2xl p-5 text-left grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
                {[
                  { label: "Name", value: responseData.name },
                  { label: "Email", value: responseData.email },
                  { label: "Subject", value: responseData.subject },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">{label}</p>
                    <p className="text-[#3E2723] text-sm font-semibold">{value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">Message</p>
                  <p className="text-[#3E2723] text-sm font-semibold">{responseData.message}</p>
                </div>
              </div>

              <p className="text-xs text-[#c9b49a]">We'll reply to <strong>{responseData.email}</strong> as soon as possible.</p>

              <button
                onClick={() => { setResponseData(null); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-2 bg-[#3E2723] text-white text-xs font-bold tracking-widest uppercase px-8 py-3 rounded-full hover:bg-[#E57373] transition-colors"
              >
                Send Another
              </button>
            </div>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-widest text-[#E57373] font-bold">Send a Message</span>
              <h3 className="mt-2 text-2xl font-extrabold text-[#3E2723] mb-1">
                We're <span className="text-[#E57373]">listening</span>
              </h3>
              <div className="mt-3 mb-6 w-10 h-1 bg-[#E57373] rounded-full" />

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Name</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Jane Doe"
                      className="bg-[#FDF6F0] border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Email</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="jane@email.com"
                      className="bg-[#FDF6F0] border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Subject</label>
                  <input type="text" name="subject" value={form.subject} onChange={handleChange}
                    placeholder="Order inquiry, feedback, partnership…"
                    className="bg-[#FDF6F0] border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Message</label>
                  <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                    placeholder="Tell us how we can help you…"
                    className="bg-[#FDF6F0] border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors resize-none" />
                </div>

                {error && (
                  <p className="text-xs text-[#C62828] bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="mt-2 w-full bg-[#3E2723] hover:bg-[#E57373] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs tracking-widest uppercase py-4 rounded-full transition-colors duration-300">
                  {loading ? "Sending…" : "Send Message 💌"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;
