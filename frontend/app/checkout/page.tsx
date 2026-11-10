"use client";
import { useState, useEffect } from "react";
import { getUser, getToken, type AuthUser } from "../../lib/auth";

const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com";
const PHP_URL = (process.env as any).NEXT_PUBLIC_PHP_API_URL || "https://swiftmart-php.onrender.com";

type CartItem = { id: string; name: string; price: number; brand: string; size: string; color: string; qty: number; img: string; category: string };

export default function CheckoutPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gateway, setGateway] = useState<"paystack" | "flutterwave" | "cod">("paystack");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!getToken() || !u) { window.location.href = "/auth"; return; }
    setUser(u);
    setPhone((u as any).phone || "");
    try {
      const saved = JSON.parse(localStorage.getItem("swiftmart_cart") || "[]");
      if (!saved.length) { alert("Cart is empty"); window.location.href = "/"; return; }
      setCart(saved);
    } catch { window.location.href = "/"; }
  }, []);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const delivery = subtotal > 100000 ? 0 : 3000;
  const total = subtotal + delivery;

  // ✅ PAY ON DELIVERY - Node only, no PHP
  const payOnDelivery = async () => {
    if (!address.trim()) return alert("Enter delivery address");
    if (!phone.trim()) return alert("Enter phone number");
    setLoading(true);
    try {
      const orderId = "ORD-" + Date.now();
      const r = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, items: cart,
          customer: { name: user?.name, email: user?.email, phone },
          total, address, userEmail: user?.email, gateway: "Pay on Delivery",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Order failed");
      localStorage.removeItem("swiftmart_cart");
      localStorage.setItem("swiftmart_last_order", JSON.stringify({ ...d.data, gateway: "Pay on Delivery" }));
      window.location.href = `/checkout/success?orderId=${orderId}&gateway=cod`;
    } catch (e: any) { alert("❌ " + e.message); }
    setLoading(false);
  };

  // ✅ PAYSTACK / FLUTTERWAVE - PHP only, Node order created AFTER verify on success page
  const payOnline = async () => {
    if (!address.trim()) return alert("Enter delivery address");
    if (!phone.trim()) return alert("Enter phone number");
    setLoading(true);
    try {
      const orderId = "ORD-" + Date.now();
      // Save checkout info so success page can create Node order after verify
      localStorage.setItem("swiftmart_pending_order", JSON.stringify({ orderId, gateway, total, address, phone, cart, customer: { name: user?.name, email: user?.email, phone } }));
      const action = gateway === "paystack" ? "init-paystack" : "init-flutterwave";
      const r = await fetch(`${PHP_URL}/payments.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, amount: total, orderId, customerName: user?.name, phone, items: cart }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Payment init failed");
      const url = data.authorization_url || data.payment_link;
      if (!url) throw new Error("No payment link returned");
      window.location.href = url;
    } catch (e: any) { alert("❌ Payment failed: " + e.message); setLoading(false); }
  };

  const handlePay = () => gateway === "cod" ? payOnDelivery() : payOnline();

  if (!user) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Redirecting to login... ⏳</div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-4">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-amber-400 text-sm font-bold">← Back to Shop</a>
        <h1 className="text-3xl font-black mt-3">Checkout 🛒</h1>
        <p className="text-white/60 text-sm">Logged in as <b>{user.email}</b></p>

        {/* CART SUMMARY */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4">
          <h2 className="font-bold">Order Summary ({cart.length} items)</h2>
          {cart.map((c, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-white/5 text-sm">
              <span>{c.img} {c.name} <span className="text-amber-400">• {c.brand} • {c.size} • {c.color} • x{c.qty}</span></span>
              <b>₦{(c.price * c.qty).toLocaleString()}</b>
            </div>
          ))}
          <div className="flex justify-between mt-3 text-sm text-white/60"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm text-white/60"><span>Delivery {subtotal > 100000 ? "(FREE over ₦100k)" : ""}</span><span>{delivery === 0 ? "FREE" : "₦" + delivery.toLocaleString()}</span></div>
          <div className="flex justify-between mt-2 font-black text-lg"><span>Total</span><span className="text-amber-400">₦{total.toLocaleString()}</span></div>
        </div>

        {/* DELIVERY */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 space-y-3">
          <h2 className="font-bold">Delivery Details</h2>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address e.g. 12 Allen Avenue, Ikeja, Lagos" className="w-full bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/40" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone e.g. 08012345678" className="w-full bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/40" />
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4">
          <h2 className="font-bold">Payment Method</h2>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button onClick={() => setGateway("paystack")} className={`py-3 rounded-2xl font-bold text-sm border ${gateway === "paystack" ? "bg-[#011C33] border-amber-400" : "bg-white/5 border-white/10"}`}>Paystack 💳<br /><span className="text-[11px] font-normal opacity-70">Card • Transfer</span></button>
            <button onClick={() => setGateway("flutterwave")} className={`py-3 rounded-2xl font-bold text-sm border ${gateway === "flutterwave" ? "bg-[#F5A623] text-black border-amber-400" : "bg-white/5 border-white/10"}`}>Flutterwave 🟡<br /><span className="text-[11px] font-normal opacity-70">Card • USSD</span></button>
            <button onClick={() => setGateway("cod")} className={`py-3 rounded-2xl font-bold text-sm border ${gateway === "cod" ? "bg-green-600 border-amber-400" : "bg-white/5 border-white/10"}`}>Pay on Delivery 💵<br /><span className="text-[11px] font-normal opacity-70">Cash on arrival</span></button>
          </div>
        </div>

        <button onClick={handlePay} disabled={loading} className="w-full mt-4 bg-amber-400 text-black py-4 rounded-full font-black text-lg disabled:opacity-50">
          {loading ? "Processing... ⏳" : gateway === "cod" ? `PLACE ORDER • ₦${total.toLocaleString()} (Pay on Delivery)` : `PAY ₦${total.toLocaleString()} WITH ${gateway === "paystack" ? "PAYSTACK" : "FLUTTERWAVE"} →`}
        </button>
        <p className="text-center text-xs text-white/40 mt-2">🔒 Secure payment via PHP • You will be redirected to Paystack / Flutterwave to complete payment</p>
      </div>
    </div>
  );
}