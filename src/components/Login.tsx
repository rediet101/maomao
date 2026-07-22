import { useState } from "react";
import { ArrowLeft, Cake, Phone, User } from "lucide-react";

interface LoginProps {
  onLogin: (name: string, phone: string) => void;
  onBack: () => void;
}

const Login = ({ onLogin, onBack }: LoginProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Something went wrong. Please try again.");
      }
      onLogin(name.trim(), phone.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6EF] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#F5EDE3]/95 backdrop-blur-sm border-b border-[#ecddd3] shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#3E2723] hover:text-[#E57373] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <img src="/logo/maologo4.png" alt="Maomao" className="h-12 w-12" />
          <div className="w-16" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-[#ecddd3] overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-[#3E2723] to-[#6D4C41] px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mb-4">
                <Cake size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Welcome to Maomao</h1>
              <p className="mt-2 text-[#f5dfc8] text-sm">
                Enter your name and phone number to get started
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[#8d6e63]">
                  Your Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c9b49a]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#ecddd3] bg-[#fdf8f4] text-[#3E2723] text-sm placeholder-[#c9b49a] focus:outline-none focus:ring-2 focus:ring-[#E57373] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[#8d6e63]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c9b49a]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#ecddd3] bg-[#fdf8f4] text-[#3E2723] text-sm placeholder-[#c9b49a] focus:outline-none focus:ring-2 focus:ring-[#E57373] focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#3E2723] hover:bg-[#1a0f0a] disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-200"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Cake size={15} />
                )}
                {loading ? "Please wait…" : "Continue"}
              </button>
            </form>

            <div className="px-8 pb-8 text-center">
              <p className="text-xs text-[#c9b49a]">
                We only use your details to process your order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
