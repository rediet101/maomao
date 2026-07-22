import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import type { CustomerUser } from "../App";
import MapPicker from "./MapPicker";

interface MenuItemPreview {
  id: number;
  title: string;
  price: string;
  image_url: string;
}

interface OrderResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  pickup_delivery_date: string;
  size: string;
  allergies: string;
  additional_notes: string;
  total_price: string;
  created_at: string;
  delivery_type: string;
  delivery_address?: string;
  latitude?: number;
  longitude?: number;
  menu_item: {
    id: number;
    title: string;
    price: string;
    image_url: string;
    description: string;
    is_available: boolean;
  };
}

interface Props {
  item: MenuItemPreview | null;
  customer: CustomerUser | null;
  onClose: () => void;
}

const OrderModal = ({ item, customer, onClose }: Props) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [allergyOther, setAllergyOther] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    email: "",
    phone: customer?.phone ?? "",
    date: "", size: "", allergy: "", notes: "",
    delivery_type: "",
    delivery_address: "",
  });

  const isOpen = !!item;

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
        setOrderData(null);
        setError(null);
        setLoading(false);
        setQuantity(1);
        setAllergyOther(false);
        setForm({ name: customer?.name ?? "", email: "", phone: customer?.phone ?? "", date: "", size: "", allergy: "", notes: "", delivery_type: "", delivery_address: "" });
      },
    });
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
      const body: Record<string, unknown> = {
        menu_item_id: item?.id,
        quantity,
        name: form.name,
        email: form.email,
        phone: form.phone,
        pickup_delivery_date: form.date,
        size: form.size,
        allergies: form.allergy || "none",
        additional_notes: form.notes,
        delivery_type: form.delivery_type === "pickup" ? "self_pickup" : form.delivery_type,
      };

      if (form.delivery_type === "driver") {
        body.delivery_address = form.delivery_address;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/menu-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Something went wrong.");
      setOrderData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
          {orderData ? (
            /* ── Success ── */
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <span className="text-4xl">🎂</span>
                <h3 className="mt-2 text-2xl font-extrabold text-[#3E2723]">Order Confirmed!</h3>
                <p className="text-[#795548] text-sm mt-1">Order #{orderData.id}</p>
              </div>

              <div className="flex items-center gap-4 bg-[#EAD7C3]/40 rounded-2xl p-4">
                <img src={orderData.menu_item.image_url} alt={orderData.menu_item.title} className="w-16 h-16 rounded-xl object-cover shadow" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#E57373] font-bold mb-0.5">Item</p>
                  <h4 className="text-base font-extrabold text-[#3E2723] capitalize">{orderData.menu_item.title}</h4>
                  <p className="text-sm font-bold text-[#5D4037]">ETB {orderData.menu_item.price}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  { label: "Name", value: orderData.name },
                  { label: "Email", value: orderData.email },
                  { label: "Phone", value: orderData.phone },
                  { label: "Size", value: orderData.size },
                  { label: "Delivery Date", value: formatDate(orderData.pickup_delivery_date) },
                  { label: "Delivery Type", value: orderData.delivery_type },
                  { label: "Allergies", value: orderData.allergies },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">{label}</p>
                    <p className="text-[#3E2723] font-semibold capitalize">{value}</p>
                  </div>
                ))}

                {orderData.delivery_address && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">Delivery Address</p>
                    <p className="text-[#3E2723] font-semibold">{orderData.delivery_address}</p>
                  </div>
                )}

                {orderData.latitude && orderData.longitude && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">Coordinates</p>
                    <p className="text-[#3E2723] font-semibold text-xs">{orderData.latitude}, {orderData.longitude}</p>
                  </div>
                )}

                {orderData.additional_notes && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#c9b49a] font-bold mb-0.5">Notes</p>
                    <p className="text-[#3E2723] font-semibold">{orderData.additional_notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-[#3E2723] rounded-2xl px-6 py-4">
                <span className="text-white text-sm font-bold uppercase tracking-widest">Total</span>
                <span className="text-white text-2xl font-extrabold">ETB {orderData.total_price}</span>
              </div>

              <p className="text-center text-xs text-[#c9b49a]">
                Placed on {formatDate(orderData.created_at)} · We'll be in touch at {orderData.email}
              </p>

              <button onClick={handleClose}
                className="w-full bg-[#E57373] hover:bg-[#C62828] text-white font-bold text-xs tracking-widest uppercase py-4 rounded-full transition-colors">
                Done
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="flex items-center gap-4 mb-6 bg-[#EAD7C3]/40 rounded-2xl p-4">
                <img src={item?.image_url} alt={item?.title} className="w-16 h-16 rounded-xl object-cover shadow" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#E57373] font-bold mb-0.5">Your Order</p>
                  <h4 className="text-base font-extrabold text-[#3E2723] capitalize">{item?.title}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm font-bold text-[#5D4037]">ETB {item?.price} each</p>
                    {quantity > 1 && (
                      <p className="text-sm font-extrabold text-[#3E2723]">= ETB {(parseFloat((item?.price ?? "0").replace(/,/g, "")) * quantity).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </div>

              <span className="text-[10px] uppercase tracking-widest text-[#E57373] font-bold">Order Details</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#3E2723] leading-tight mb-1">
                Complete Your <span className="text-[#E57373]">Order</span>
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
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Delivery / Pickup Date</label>
                  <input type="date" name="date" required value={form.date} onChange={handleChange}
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors" />
                </div>

                {/* Quantity */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-[#c9b49a] text-[#3E2723] font-bold text-lg flex items-center justify-center hover:border-[#E57373] transition-colors">
                      −
                    </button>
                    <span className="w-10 text-center text-base font-extrabold text-[#3E2723]">{quantity}</span>
                    <button type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 rounded-xl bg-white border border-[#c9b49a] text-[#3E2723] font-bold text-lg flex items-center justify-center hover:border-[#E57373] transition-colors">
                      +
                    </button>
                    {item && (
                      <span className="text-sm text-[#795548] font-medium">
                        Total: <strong className="text-[#3E2723]">ETB {(parseFloat(item.price.replace(/,/g, "")) * quantity).toFixed(2)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Size */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Size</label>
                  <select name="size" required value={form.size} onChange={handleChange}
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] focus:outline-none focus:border-[#E57373] transition-colors">
                    <option value="">Select a size…</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra large">Extra Large</option>
                  </select>
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
                        onClick={() => setForm((prev) => ({ ...prev, delivery_type: opt.value, delivery_address: "", latitude: "", longitude: "" }))}
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

                {/* Pickup map — static bakery location */}
                {form.delivery_type === "pickup" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#5D4037] uppercase tracking-wider">Our Bakery Location</label>
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=Wolosefer,Bole,Addis+Ababa,Ethiopia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#E57373] hover:text-[#C62828] uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        📍 Get Directions
                      </a>
                    </div>
                    <div className="rounded-2xl overflow-hidden h-52 shadow-sm">
                      <iframe
                        title="Bakery location"
                        className="w-full h-full border-0"
                        loading="lazy"
                        allowFullScreen
                        src="https://maps.google.com/maps?q=Wolosefer,Bole,Addis+Ababa,Ethiopia&output=embed&z=16"
                      />
                    </div>
                    <p className="text-xs text-[#795548] bg-[#EAD7C3]/50 rounded-xl px-4 py-2">
                      📍 <strong>Maomao Bakery</strong> — Wolosefer, Bole, Addis Ababa · Mon–Sat 8am–8pm, Sun 9am–6pm
                    </p>
                  </div>
                )}

                {/* Driver delivery fields */}
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
                    placeholder="Message on cake, special requests…"
                    className="bg-white border border-[#c9b49a] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#c9b49a] focus:outline-none focus:border-[#E57373] transition-colors resize-none" />
                </div>

                {error && (
                  <p className="text-xs text-[#C62828] bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="mt-2 w-full bg-[#3E2723] hover:bg-[#E57373] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs tracking-widest uppercase py-4 rounded-full transition-colors duration-300">
                  {loading ? "Placing Order…" : "Place Order 🎂"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
