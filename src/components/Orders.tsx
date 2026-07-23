import { useEffect, useState } from "react";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  MapPin, Phone, Package, Loader2, ArrowLeft, CalendarDays, Truck,
  Store, RefreshCw, Star,
} from "lucide-react";
import type { CustomerUser } from "../App";

interface OrderItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  pickup_delivery_date: string;
  size: string;
  allergies: string;
  additional_notes: string;
  price: number;
  total_price: string;
  created_at: string;
  delivery_type: string;
  status?: string;
  rating?: number;
  feedback?: string;
  order_type?: string;
  delivery_address?: string;
  flavour?: string;
  design_inspiration?: string;
  menu_item?: {
    id: number;
    title: string;
    price: string;
    image_url: string;
    description: string;
    is_available: boolean;
  };
}

const STATUS: Record<string, { label: string; color: string; bg: string; bar: string; icon: React.ReactNode; step: number }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    bar: "bg-amber-400",
    icon: <Clock size={13} />,
    step: 1,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    bar: "bg-blue-500",
    icon: <CheckCircle size={13} />,
    step: 2,
  },
  preparing: {
    label: "Being Prepared",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    bar: "bg-purple-500",
    icon: <Package size={13} />,
    step: 3,
  },
  ready: {
    label: "Ready",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    bar: "bg-teal-500",
    icon: <CheckCircle size={13} />,
    step: 4,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
    icon: <CheckCircle size={13} />,
    step: 5,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-400",
    icon: <XCircle size={13} />,
    step: 0,
  },
};

const STEPS = ["Pending", "Confirmed", "Being Prepared", "Ready", "Completed"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

/** Safely parse a price that may be a pre-formatted string like "1,500.00" or an empty string. */
const parsePrice = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  return parseFloat(val.replace(/,/g, "")) || 0;
};

/** Format a price value for display: strips commas, parses, then re-formats. */
const displayPrice = (val: string | number | null | undefined): string =>
  parsePrice(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Status tracker bar ── */
const StatusTracker = ({ status }: { status: string }) => {
  const cfg = STATUS[status] ?? STATUS["pending"];
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
        <XCircle size={13} /> Order Cancelled
      </div>
    );
  }
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {STEPS.map((s, i) => {
          const done = cfg.step > i + 1;
          const active = cfg.step === i + 1;
          return (
            <div key={s} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold border-2 transition-all ${
                done ? "bg-[#3E2723] border-[#3E2723] text-white"
                  : active ? `${cfg.bg} ${cfg.color} border-current`
                  : "bg-white border-[#ecddd3] text-[#c9b49a]"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[8px] text-center leading-tight hidden sm:block font-medium ${
                active ? cfg.color : done ? "text-[#3E2723]" : "text-[#c9b49a]"
              }`}>{s}</span>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-[#ecddd3] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
          style={{ width: `${((cfg.step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

/* ── Re-order modal component ── */
const ReorderModal = ({
  order,
  onClose,
  onSuccess,
}: {
  order: OrderItem;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [date, setDate] = useState("");
  const [deliveryType, setDeliveryType] = useState(order.delivery_type || "self_pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(order.delivery_address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const itemTitle = order.menu_item?.title ?? "Custom Cake Order";
  const today = new Date().toISOString().split("T")[0];

  const handleReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please choose a pickup/delivery date.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/orders`;
      let payload: Record<string, unknown> = {};

      if (order.menu_item && order.menu_item.id) {
        url = `${import.meta.env.VITE_API_BASE_URL}/menu-orders`;
        payload = {
          menu_item_id: order.menu_item.id,
          quantity: 1,
          name: order.name,
          email: order.email,
          phone: order.phone,
          pickup_delivery_date: date,
          size: order.size || "Standard",
          allergies: order.allergies || "none",
          additional_notes: order.additional_notes || "",
          delivery_type: deliveryType === "pickup" ? "self_pickup" : deliveryType,
        };
        if (deliveryType === "driver") {
          payload.delivery_address = deliveryAddress;
        }
      } else {
        url = `${import.meta.env.VITE_API_BASE_URL}/orders`;
        payload = {
          name: order.name,
          email: order.email,
          phone: order.phone,
          pickup_delivery_date: date,
          flavour: order.flavour || "Vanilla",
          size: order.size || "8 inch (10–12 pax)",
          design_inspiration: order.design_inspiration || "",
          additional_notes: order.additional_notes || "",
          delivery_type: deliveryType === "pickup" ? "self_pickup" : deliveryType,
        };
        if (deliveryType === "driver") {
          payload.delivery_address = deliveryAddress;
        }
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to place re-order.");

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FDF6F0] rounded-3xl border border-[#EAD7C3] shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#EAD7C3] hover:bg-[#E57373] hover:text-white text-[#3E2723] rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
        >
          ✕
        </button>

        {success ? (
          <div className="text-center py-8">
            <span className="text-5xl">🎉</span>
            <h3 className="text-2xl font-extrabold text-[#3E2723] mt-3">Re-Order Placed!</h3>
            <p className="text-sm text-[#8d6e63] mt-1">Your new order for {itemTitle} has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleReorder} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EAD7C3]">
              <span className="text-3xl">🎂</span>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#E57373]">Re-Order Cake</span>
                <h3 className="font-extrabold text-base text-[#3E2723] leading-snug">{itemTitle}</h3>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#5D4037] uppercase tracking-wider mb-1">
                New Pickup / Delivery Date *
              </label>
              <input
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#EAD7C3] bg-white text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5D4037] uppercase tracking-wider mb-1">
                Delivery Option
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType("self_pickup")}
                  className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                    deliveryType !== "driver"
                      ? "bg-[#5D4037] text-white border-[#5D4037] shadow-xs"
                      : "bg-white text-[#5D4037] border-[#EAD7C3] hover:bg-[#F5EDE3]"
                  }`}
                >
                  🏃 Self Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("driver")}
                  className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                    deliveryType === "driver"
                      ? "bg-[#5D4037] text-white border-[#5D4037] shadow-xs"
                      : "bg-white text-[#5D4037] border-[#EAD7C3] hover:bg-[#F5EDE3]"
                  }`}
                >
                  🚗 Driver Delivery
                </button>
              </div>
            </div>

            {deliveryType === "driver" && (
              <div>
                <label className="block text-[11px] font-bold text-[#5D4037] uppercase tracking-wider mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, Landmark, City..."
                  className="w-full text-xs p-3 rounded-xl border border-[#EAD7C3] bg-white text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-[#8d6e63] hover:bg-[#F5EDE3] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold bg-[#E57373] hover:bg-[#C62828] text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {loading ? "Placing Re-Order..." : "Submit Re-Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ── Order card ── */
const OrderCard = ({ order, onRefresh }: { order: OrderItem; onRefresh?: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status ?? "pending");
  const [rating, setRating] = useState<number>(order.rating ?? 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(order.feedback ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<{ rating: number; feedback?: string } | null>(
    order.rating ? { rating: order.rating, feedback: order.feedback } : null
  );

  const cfg = STATUS[currentStatus] ?? STATUS["pending"];
  const itemTitle = order.menu_item?.title ?? "Cake Order";
  const itemImage = order.menu_item?.image_url ?? "/home/hero23.png";
  const itemPrice = order.menu_item?.price ?? order.total_price;

  const handleConfirmDelivery = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${order.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_type: order.order_type }),
      });
      if (res.ok) {
        setCurrentStatus("completed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${order.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback, order_type: order.order_type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviewSubmitted({ rating: data.rating ?? rating, feedback: data.feedback ?? feedback });
        setCurrentStatus("completed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ecddd3] overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#F5EDE3]">
          <img
            src={itemImage}
            alt={itemTitle}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/home/hero23.png"; }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#3E2723] text-base leading-tight truncate">{itemTitle}</h3>
              <p className="text-xs text-[#8d6e63] mt-0.5">Order #{order.id}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[#E57373] font-extrabold text-lg block">
                {parsePrice(order.total_price) > 0
                  ? `ETB ${displayPrice(order.total_price)}`
                  : <span className="text-sm font-semibold text-[#c9b49a]">Price TBD</span>}
              </span>
              {parsePrice(order.price) > 0 && (
                <span className="text-[10px] text-[#8d6e63]">
                  Price: ETB {displayPrice(order.price)}
                </span>
              )}
              {itemPrice && itemPrice !== order.total_price && parsePrice(itemPrice) > 0 && (
                <span className="text-[10px] text-[#8d6e63]">
                  Item: ETB {displayPrice(itemPrice)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {/* Delivery type */}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5EDE3] text-[#5D4037]">
              {order.delivery_type === "driver" ? <><Truck size={11} /> Delivery</> : <><Store size={11} /> Pickup</>}
            </span>
            {order.size && (
              <span className="text-xs text-[#8d6e63] bg-[#F5EDE3] px-2 py-0.5 rounded-full">{order.size}</span>
            )}
          </div>
        </div>
      </div>

      {/* Customer Status Banner */}
      {currentStatus === "ready" && (
        <div className="mx-5 mb-3 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">🎉</span>
            <div>
              <p className="font-bold text-sm text-teal-900">Your Cake is Ready!</p>
              <p className="mt-0.5 text-teal-700 leading-snug">
                {order.delivery_type === "driver"
                  ? "Your order is freshly baked and out for driver delivery to your address!"
                  : "Your order is ready for pickup! Come collect it at Bole Welo Sefer, Addis Ababa."}
              </p>
            </div>
          </div>
          <button
            onClick={handleConfirmDelivery}
            disabled={isSubmitting}
            className="whitespace-nowrap px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 self-end sm:self-center"
          >
            <CheckCircle size={14} />
            {isSubmitting ? "Updating..." : "I Received My Order"}
          </button>
        </div>
      )}

      {currentStatus === "preparing" && (
        <div className="mx-5 mb-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-start gap-3 shadow-xs">
          <span className="text-2xl leading-none">👩‍🍳</span>
          <div>
            <p className="font-bold text-sm text-purple-900">Order Accepted & Being Prepared!</p>
            <p className="mt-0.5 text-purple-700 leading-snug">
              Our bakers are currently preparing your delicious cake with care. We'll update you as soon as it's ready!
            </p>
          </div>
        </div>
      )}

      {currentStatus === "completed" && (
        <>
          <div className="mx-5 mb-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-3 shadow-xs">
            <span className="text-2xl leading-none">✨</span>
            <div>
              <p className="font-bold text-sm text-emerald-900">Order Completed!</p>
              <p className="mt-0.5 text-emerald-700 leading-snug">
                Thank you for ordering with MaoMao Bakery! We hope you enjoyed your cake.
              </p>
            </div>
          </div>

          {/* Re-order Cake Action Box */}
          <div className="mx-5 mb-3 p-3.5 rounded-xl bg-[#F5EDE3]/70 border border-[#EAD7C3] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🍰</span>
              <div>
                <p className="font-extrabold text-xs text-[#3E2723]">Loved this cake?</p>
                <p className="text-[10px] text-[#8d6e63]">Order it again with your saved preferences!</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReorderModal(true)}
              className="px-3.5 py-2 bg-[#5D4037] hover:bg-[#4a3028] text-[#EAD7C3] font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
            >
              <RefreshCw size={13} />
              Re-order Cake
            </button>
          </div>

          {/* Review section */}
          {reviewSubmitted ? (
            <div className="mx-5 mb-4 p-4 rounded-xl bg-[#FFF8F0] border border-[#EAD7C3] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-[#5D4037] uppercase tracking-wider flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" /> Your Review & Feedback
                </span>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= reviewSubmitted.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
              {reviewSubmitted.feedback ? (
                <p className="text-xs text-[#3E2723] italic mt-1.5 bg-white/80 p-2.5 rounded-lg border border-[#ecddd3]">
                  "{reviewSubmitted.feedback}"
                </p>
              ) : (
                <p className="text-xs text-[#8d6e63] mt-1">Thank you for rating your cake!</p>
              )}
            </div>
          ) : (
            <div className="mx-5 mb-4 p-4 rounded-xl bg-[#FFF8F0] border border-[#EAD7C3] shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🎂</span>
                <div>
                  <p className="font-bold text-sm text-[#3E2723]">How was your cake?</p>
                  <p className="text-xs text-[#8d6e63]">Leave a rating and review to let us know your feedback!</p>
                </div>
              </div>

              {/* 5 Star Selector */}
              <div className="flex items-center gap-1.5 my-3 bg-white p-2.5 rounded-lg border border-[#ecddd3] w-fit">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        size={22}
                        className={active ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-bold text-[#5D4037]">{rating} / 5 Stars</span>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your customer review or feedback here (optional)..."
                className="w-full text-xs p-3 rounded-lg border border-[#EAD7C3] bg-white text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#5D4037] mb-3"
                rows={2}
              />

              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#5D4037] hover:bg-[#4a3020] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Status tracker */}
      <div className="px-5 py-4 bg-[#fdf8f4] border-t border-[#ecddd3]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8d6e63] mb-3">Order Progress</p>
        <StatusTracker status={currentStatus} />
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#fdf8f4] border-t border-[#ecddd3]">
        <div className="flex items-center gap-1.5 text-xs text-[#8d6e63]">
          <CalendarDays size={13} />
          <span>Ordered {formatDate(order.created_at)} at {formatTime(order.created_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#5D4037] font-semibold">
          <Package size={13} />
          <span>{formatDate(order.pickup_delivery_date)}</span>
        </div>
      </div>

      {/* Expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-[#5D4037] hover:bg-[#fdf8f4] transition-colors border-t border-[#ecddd3]"
      >
        <span>{expanded ? "Hide details" : "View details"}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#ecddd3] bg-[#fdf8f4]">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8d6e63]">Contact</p>
            <div className="flex items-center gap-2 text-sm text-[#3E2723]">
              <Phone size={13} className="text-[#E57373]" />
              <span>{order.phone}</span>
            </div>
            {order.delivery_address && (
              <div className="flex items-start gap-2 text-sm text-[#3E2723]">
                <MapPin size={13} className="text-[#E57373] mt-0.5 flex-shrink-0" />
                <span>{order.delivery_address}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8d6e63]">Details</p>
            {order.allergies && order.allergies !== "none" && (
              <p className="text-sm text-[#3E2723]"><span className="font-semibold">Allergies: </span>{order.allergies}</p>
            )}
            {order.additional_notes && (
              <p className="text-sm text-[#3E2723]"><span className="font-semibold">Notes: </span>{order.additional_notes}</p>
            )}
            {parsePrice(order.price) > 0 && (
              <p className="text-sm text-[#3E2723]">
                <span className="font-semibold">Price: </span>ETB {displayPrice(order.price)}
              </p>
            )}
            {itemPrice && parsePrice(itemPrice) > 0 && (
              <p className="text-sm text-[#3E2723]">
                <span className="font-semibold">Item price: </span>ETB {displayPrice(itemPrice)}
              </p>
            )}
            <p className="text-sm font-bold text-[#3E2723]">
              {parsePrice(order.total_price) > 0
                ? `Total: ETB ${displayPrice(order.total_price)}`
                : "Total: Price to be confirmed"}
            </p>
          </div>
        </div>
      )}

      {showReorderModal && (
        <ReorderModal
          order={order}
          onClose={() => setShowReorderModal(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

/* ── Orders page ── */
interface Props {
  onBack: () => void;
  customer?: CustomerUser | null;
}

const Orders = ({ onBack, customer }: Props) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const trackedPhone = customer?.phone ?? "";

  const isCustomerView = !!customer;

  const fetchOrders = (phone?: string) => {
    setLoading(true);
    setError(null);

    const url = phone
      ? `${import.meta.env.VITE_API_BASE_URL}/orders?phone=${encodeURIComponent(phone)}`
      : `${import.meta.env.VITE_API_BASE_URL}/orders`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // handle both { data: [] } and [] shapes
        setOrders(Array.isArray(data) ? data : data.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchOrders(isCustomerView ? trackedPhone : undefined);
  }, []);



  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const name = o.name ?? "";
    const title = o.menu_item?.title ?? "";
    return (
      name.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FDF6EF]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#F5EDE3]/95 backdrop-blur-sm border-b border-[#ecddd3] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#3E2723] hover:text-[#E57373] transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#E57373]" />
            <span className="font-extrabold text-[#3E2723] text-lg tracking-tight">
              {isCustomerView ? "My Orders" : "All Orders"}
            </span>
          </div>
          <button
            onClick={() => fetchOrders(isCustomerView ? trackedPhone : undefined)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5D4037] hover:text-[#E57373] transition-colors"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#3E2723] to-[#6D4C41] text-white py-14 px-6 text-center">
        {isCustomerView ? (
          <>
            <p className="text-xs font-semibold tracking-widest text-[#f5dfc8] uppercase mb-3">
              Hello, {customer.name} 👋
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Your Orders</h1>
            <p className="mt-3 text-[#f5dfc8] text-sm max-w-sm mx-auto">
              Track your orders and see what's baking for you.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest text-[#f5dfc8] uppercase mb-3">Maomao Bakery</p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Order History</h1>
            <p className="mt-3 text-[#f5dfc8] text-sm max-w-sm mx-auto">
              Track all placed orders, view details, and stay up to date on every bake.
            </p>
            <div className="mt-6 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Search by name or item…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-full text-sm text-[#3E2723] bg-white/90 placeholder-[#a07060] focus:outline-none focus:ring-2 focus:ring-[#E57373] shadow"
              />
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#8d6e63]">
            <Loader2 size={36} className="animate-spin text-[#E57373]" />
            <p className="text-sm font-medium">Loading orders…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <XCircle size={40} className="text-[#E57373]" />
            <p className="text-[#3E2723] font-bold text-lg">Couldn't load orders</p>
            <p className="text-sm text-[#8d6e63] max-w-xs">{error}</p>
            <button
              onClick={() => fetchOrders(isCustomerView ? trackedPhone : undefined)}
              className="mt-2 px-6 py-2 bg-[#3E2723] text-white rounded-full text-sm font-semibold hover:bg-[#1a0f0a] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ShoppingBag size={48} className="text-[#ecddd3]" />
            <p className="text-[#3E2723] font-bold text-lg">
              {isCustomerView ? "No orders found for this number" : "No orders yet"}
            </p>
            <p className="text-sm text-[#8d6e63]">
              {isCustomerView
                ? "Make sure the phone number matches what you used when ordering."
                : "Orders placed through the menu will appear here."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: isCustomerView ? "Your Orders" : "Total Orders", value: orders.length, icon: <ShoppingBag size={16} /> },
                { label: "Shown", value: filtered.length, icon: <Package size={16} /> },
                {
                  label: isCustomerView ? "Total Spent" : "Total Revenue",
                  value: `ETB ${displayPrice(orders.reduce((s, o) => s + parsePrice(o.total_price), 0))}`,
                  icon: <CheckCircle size={16} />,
                },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-[#ecddd3] p-4 flex items-center gap-3">
                  <span className="text-[#E57373]">{icon}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8d6e63] font-semibold">{label}</p>
                    <p className="text-lg font-extrabold text-[#3E2723] leading-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order cards */}
            <div className="space-y-4">
              {filtered.map((order) => (
                <OrderCard
                  key={`${order.order_type ?? "order"}-${order.id}`}
                  order={order}
                  onRefresh={() => fetchOrders(isCustomerView ? trackedPhone : undefined)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
