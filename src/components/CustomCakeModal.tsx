import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { X, ImagePlus } from "lucide-react";
import MapPicker from "./MapPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const flavours = ["Vanilla", "Chocolate", "Red Velvet", "Lemon", "Caramel", "Strawberry"];
const sizes = ["6 inch (6–8 pax)", "8 inch (10–12 pax)", "10 inch (16–20 pax)", "Tiered (custom)"];

const CustomCakeModal = ({ isOpen, onClose }: Props) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>([]);
  const [inspirationPreviews, setInspirationPreviews] = useState<string[]>([]);
  const [allergyOther, setAllergyOther] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", date: "",
    flavour: "", size: "", design: "", allergy: "", notes: "",
    delivery_type: "", delivery_address: "",
  });

  // Always restore scroll on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!overlayRef.current || !cardRef.current) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(cardRef.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)" });
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleClose = () => {
    document.body.style.overflow = "";
    if (!overlayRef.current || !cardRef.current) { onClose(); return; }
    gsap.to(cardRef.current, { y: 40, opacity: 0, scale: 0.95, duration: 0.3, ease: "power2.in" });
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        onClose();
        setSubmitted(false);
        setError(null);
        setLoading(false);
        setInspirationFiles([]);
        setInspirationPreviews([]);
        setAllergyOther(false);
        setForm({ name: "", email: "", phone: "", date: "", flavour: "", size: "", design: "", allergy: "", notes: "", delivery_type: "", delivery_address: "" });
      },
    });
  };

  const handleInspirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setInspirationFiles(files);
    setInspirationPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeInspiration = (idx: number) => {
    setInspirationFiles((prev) => prev.filter((_, i) => i !== idx));
    setInspirationPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapLocation = useCallback((_lat: number, _lng: number, addr: string) => {
    setForm((prev) => ({ ...prev, delivery_address: addr }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("email", form.email);
      body.append("phone", form.phone);
      body.append("pickup_delivery_date", form.date);
      body.append("flavour", form.flavour);
      body.append("size", form.size);
      body.append("design_inspiration", form.design);
      body.append("allergies", form.allergy || "none");
      body.append("additional_notes", form.notes);
      body.append("delivery_type", form.delivery_type);
      if (form.delivery_type === "driver") body.append("delivery_address", form.delivery_address);
      inspirationFiles.forEach((f, i) => body.append(`inspiration_photos[${i}]`, f));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Something went wrong. Please try again.");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-x-0 bottom-0 top-16 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div ref={cardRef} className="relative bg-[#FDF6F0] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <button onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-[#EAD7C3] hover:bg-[#E57373] hover:text-white text-[#3E2723] rounded-full p-2 transition-colors duration-200">
          <X size={18} />
        </button>

        <div className="p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <span className="text-5xl">🎂</span>
              <h3 className="text-2xl font-extrabold text-[#3E2723]">Request Received!</h3>
              <p className="text-[#795548] text-sm leading-relaxed max-w-xs">
                Thanks, <strong>{form.name}</strong>! We'll get back to you at{" "}
                <strong>{form.email}</strong> within 24 hours to talk about your dream cake.
              </p>
              <button onClick={handleClose}
                className="mt-4 bg-[#3E2723] text-white text-xs font-bold tracking-widest uppercase px-8 py-3 rounded-full hover:bg-[#E57373] transition-colors">
                Close
              </button>
            </div>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-widest text-[#E57373] font-bold">Custom Order</span>
              <h2 className="mt-2 text-3xl font-extrabold text-[#3E2723] leading-tight">
                Build Your<br /><span className="text-[#E57373]">Dream Cake</span>
              </h2>
              <div className="mt-3 mb-6 w-10 h-1 bg-[#E57373] rounded-full" />

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Your Name</label>
                  <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe"
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Email</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="jane@email.com"
                      className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Phone</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+251 911 000 000"
                      className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Pickup / Delivery Date</label>
                  <input type="date" name="date" required value={form.date} onChange={handleChange}
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors" />
                </div>

                {/* Flavour + Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Flavour</label>
                    <select name="flavour" required value={form.flavour} onChange={handleChange}
                      className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors">
                      <option value="">Select…</option>
                      {flavours.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Size</label>
                    <select name="size" required value={form.size} onChange={handleChange}
                      className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors">
                      <option value="">Select…</option>
                      {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Design */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Design Inspiration</label>
                  <input type="text" name="design" value={form.design} onChange={handleChange}
                    placeholder="Floral, minimalist, character theme…"
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors" />
                </div>

                {/* Design inspiration photos */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">
                    Inspiration Photos <span className="normal-case text-[#c9b49a] font-normal">(up to 4, optional)</span>
                  </label>
                  <input
                    ref={inspirationInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInspirationChange}
                    className="hidden"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {inspirationPreviews.map((src, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
                        <img src={src} alt={`Inspiration ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeInspiration(idx)}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-[#E57373] text-white rounded-full p-1 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {inspirationPreviews.length < 4 && (
                      <button
                        type="button"
                        onClick={() => inspirationInputRef.current?.click()}
                        className="aspect-square flex flex-col items-center justify-center gap-1 bg-white border-2 border-dashed border-[#c9b49a] hover:border-[#E57373] rounded-xl text-[#c9b49a] hover:text-[#E57373] transition-colors"
                      >
                        <ImagePlus size={18} />
                        <span className="text-[10px] font-semibold">Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Allergies */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Allergies</label>
                  <select
                    value={allergyOther ? "other" : form.allergy}
                    onChange={(e) => {
                      if (e.target.value === "other") {
                        setAllergyOther(true);
                        setForm((prev) => ({ ...prev, allergy: "" }));
                      } else {
                        setAllergyOther(false);
                        setForm((prev) => ({ ...prev, allergy: e.target.value }));
                      }
                    }}
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors"
                  >
                    <option value="">Select an allergy…</option>
                    <option value="none">None</option>
                    <option value="nuts">Nuts</option>
                    <option value="dairy">Dairy</option>
                    <option value="gluten">Gluten</option>
                    <option value="eggs">Eggs</option>
                    <option value="soy">Soy</option>
                    <option value="other">Other…</option>
                  </select>
                  {allergyOther && (
                    <input
                      type="text"
                      value={form.allergy}
                      onChange={(e) => setForm((prev) => ({ ...prev, allergy: e.target.value }))}
                      placeholder="Describe your allergy…"
                      autoFocus
                      className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors"
                    />
                  )}
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Additional Notes</label>
                  <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
                    placeholder="Special requests, message on cake…"
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors resize-none" />
                </div>

                {/* Delivery Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Delivery Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "pickup", label: "🏪 Pickup" },
                      { value: "driver", label: "🚚 Driver Delivery" },
                    ].map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => { setForm((prev) => ({ ...prev, delivery_type: opt.value, delivery_address: "" })); }}
                        className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                          form.delivery_type === opt.value
                            ? "bg-[#3E2723] border-[#3E2723] text-white"
                            : "bg-white border-[#c9b49a] text-[#5D4037] hover:border-[#E57373]"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pickup — bakery map */}
                {form.delivery_type === "pickup" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Our Bakery Location</label>
                      <a href="https://www.google.com/maps/dir/?api=1&destination=Wolosefer,Bole,Addis+Ababa,Ethiopia"
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#E57373] hover:text-[#C62828] uppercase tracking-wider transition-colors">
                        📍 Get Directions
                      </a>
                    </div>
                    <div className="rounded-2xl overflow-hidden h-52 shadow-sm">
                      <iframe title="Bakery location" className="w-full h-full border-0" loading="lazy" allowFullScreen
                        src="https://maps.google.com/maps?q=Wolosefer,Bole,Addis+Ababa,Ethiopia&output=embed&z=16" />
                    </div>
                    <p className="text-xs text-[#795548] bg-[#EAD7C3]/50 rounded-xl px-4 py-2">
                      📍 <strong>Maomao Bakery</strong> — Wolosefer, Bole, Addis Ababa · Mon–Sat 8am–8pm, Sun 9am–6pm
                    </p>
                  </div>
                )}

                {/* Driver — address + live map */}
                {form.delivery_type === "driver" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">
                      Delivery Location
                    </label>
                    <MapPicker
                      initialAddress={form.delivery_address}
                      onLocationChange={handleMapLocation}
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-xs text-[#C62828] bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="mt-2 w-full bg-[#3E2723] hover:bg-[#E57373] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs tracking-widest uppercase py-4 rounded-full transition-colors duration-300">
                  {loading ? "Submitting…" : "Submit Request 🎂"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCakeModal;
