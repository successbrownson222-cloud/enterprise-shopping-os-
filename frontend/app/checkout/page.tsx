"use client";
import { useState, useEffect } from "react";
import { getUser, getToken, type AuthUser } from "../../lib/auth";

const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com";
const PHP_URL = (process.env as any).NEXT_PUBLIC_PHP_API_URL || "https://swiftmart-php.onrender.com";

type CartItem = { id: string; name: string; price: number; brand: string; size: string; color: string; qty: number; img: string; category: string };
type Branch = { id: string; state: string; city: string; name: string; address: string; phone: string; isActive: boolean };

export default function CheckoutPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gateway, setGateway] = useState<"paystack" | "flutterwave" | "cod">("paystack");
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedState, setSelectedState] = useState("Lagos");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchLoading, setBranchLoading] = useState(true);

  useEffect(() => {
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#0F172A";
    document.documentElement.style.backgroundColor = "#0F172A";
    document.body.style.overflowX = "hidden";
    return () => { document.body.style.backgroundColor = prevBody; document.documentElement.style.backgroundColor = prevHtml; document.body.style.overflowX = ""; };
  }, []);

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

  useEffect(() => {
    fetch(`${API_URL}/api/branches/states`, { cache: "no-store" })
      .then(r => r.json()).then(d => { if (Array.isArray(d.data) && d.data.length) setStates(d.data); })
      .catch(() => setStates(["Lagos"]));
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    setBranchLoading(true);
    setSelectedBranchId("");
    fetch(`${API_URL}/api/branches?state=${encodeURIComponent(selectedState)}`, { cache: "no-store" })
      .then(r => r.json()).then(d => {
        const list = Array.isArray(d.data) ? d.data : [];
        setBranches(list);
        if (list.length === 1) setSelectedBranchId(list[0].id);
      }).catch(() => setBranches([]))
      .finally(() => setBranchLoading(false));
  }, [selectedState]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const delivery = subtotal > 100000 ? 0 : 3000;
  const total = subtotal + delivery;

  const validate = () => {
    if (!address.trim()) { alert("Enter delivery address"); return false; }
    if (!phone.trim()) { alert("Enter phone number"); return false; }
    if (!selectedBranchId) { alert("Please select a branch to fulfil your order"); return false; }
    return true;
  };

  const payOnDelivery = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const orderId = "ORD-" + Date.now();
      const r = await fetch(`${API_URL}/api/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, items: cart, customer: { name: user?.name, email: user?.email, phone }, total, address, userEmail: user?.email, gateway: "Pay on Delivery", branchId: selectedBranchId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Order failed");
      localStorage.removeItem("swiftmart_cart");
      localStorage.setItem("swiftmart_last_order", JSON.stringify({ ...d.data, gateway: "Pay on Delivery" }));
      window.location.href = `/checkout/success?orderId=${orderId}&gateway=cod`;
    } catch (e: any) { alert("❌ " + e.message); }
    setLoading(false);
  };

  const payOnline = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const orderId = "ORD-" + Date.now();
      localStorage.setItem("swiftmart_pending_order", JSON.stringify({ orderId, gateway, total, address, phone, cart, branchId: selectedBranchId, customer: { name: user?.name, email: user?.email, phone } }));
      const action = gateway === "paystack" ? "init-paystack" : "init-flutterwave";
      const r = await fetch(`${PHP_URL}/payments.php?action=${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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

  if (!user) return <div className="min-h-[100dvh] bg-[#0F172A] text-white flex items-center justify-center px-4 text-center">Redirecting to login... ⏳</div>;

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#0F172A] text-white font-sans">
      <div className="max-w-3xl mx-auto p-4 pb-10 min-w-0 w-full overflow-hidden">
        <a href="/" className="text-amber-400 text-sm font-bold">← Back to Shop</a>
        <h1 className="text-3xl font-black mt-3 break-words">Checkout 🛒</h1>
        {/* ✅ FIXED: Email truncates, never pushes card wider */}
        <p className="text-white/60 text-sm truncate min-w-0">Logged in as <b className="break-all">{user.email}</b></p>

        {/* ✅ CART SUMMARY - FIXED OVERFLOW */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 min-w-0 w-full overflow-hidden">
          <h2 className="font-bold break-words">Order Summary ({cart.length} items)</h2>
          {cart.map((c, i) => (
            <div key={i} className="flex justify-between gap-3 py-2 border-b border-white/5 text-sm min-w-0">
              {/* ✅ Left: can shrink + wrap, Right: never shrinks */}
              <span className="min-w-0 flex-1 break-words leading-snug">
                <span className="block truncate">{c.img} {c.name}</span>
                <span className="block text-amber-400 text-xs break-words">• {c.brand} • {c.size} • {c.color} • x{c.qty}</span>
              </span>
              <b className="shrink-0 whitespace-nowrap">₦{(c.price * c.qty).toLocaleString()}</b>
            </div>
          ))}
          <div className="flex justify-between gap-3 mt-3 text-sm text-white/60"><span className="break-words">Subtotal</span><span className="shrink-0 whitespace-nowrap">₦{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between gap-3 text-sm text-white/60"><span className="break-words">Delivery {subtotal > 100000 ? "(FREE over ₦100k)" : ""}</span><span className="shrink-0 whitespace-nowrap">{delivery === 0 ? "FREE" : "₦" + delivery.toLocaleString()}</span></div>
          <div className="flex justify-between gap-3 mt-2 font-black text-lg"><span className="break-words">Total</span><span className="text-amber-400 shrink-0 whitespace-nowrap break-words">₦{total.toLocaleString()}</span></div>
        </div>

        {/* ✅ BRANCH SELECTOR - FIXED OVERFLOW */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 space-y-3 min-w-0 w-full overflow-hidden">
          <h2 className="font-bold break-words">🏪 Select Branch <span className="text-red-400">*</span></h2>
          <p className="text-xs text-white/50 break-words">Your order will be fulfilled from this branch. Stock is checked per branch.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div className="min-w-0">
              <label className="text-xs font-bold text-white/60">State</label>
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full mt-1 bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none text-white [&>option]:text-black truncate">
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="min-w-0">
              <label className="text-xs font-bold text-white/60">Branch in {selectedState}</label>
              <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} disabled={branchLoading || branches.length === 0} className="w-full mt-1 bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none text-white disabled:opacity-50 [&>option]:text-black truncate">
                <option value="">{branchLoading ? "Loading branches..." : branches.length === 0 ? "No branch in this state yet" : "Select branch..."}</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
              </select>
            </div>
          </div>
          {selectedBranch && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 text-sm min-w-0 overflow-hidden">
              <span className="break-words">✅ Fulfilling from <b>{selectedBranch.name}</b></span>
              <span className="block text-white/60 text-xs break-words mt-1">{selectedBranch.address}</span>
            </div>
          )}
          {branches.length === 0 && !branchLoading && <p className="text-xs text-amber-400 break-words">No active branch in {selectedState} yet. Admin needs to add one in Admin → Branches.</p>}
        </div>

        {/* ✅ DELIVERY */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 space-y-3 min-w-0 w-full overflow-hidden">
          <h2 className="font-bold break-words">Delivery Details</h2>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address e.g. 12 Allen Avenue, Ikeja, Lagos" className="w-full min-w-0 bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/40 break-words" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone e.g. 08012345678" className="w-full min-w-0 bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/40" />
        </div>

        {/* ✅ PAYMENT - FIXED: Buttons now wrap, 1 column on small phones */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mt-4 min-w-0 w-full overflow-hidden">
          <h2 className="font-bold break-words">Payment Method</h2>
          <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2 mt-3 min-w-0">
            <button onClick={() => setGateway("paystack")} className={`py-3 px-2 rounded-2xl font-bold text-sm border break-words min-w-0 ${gateway === "paystack" ? "bg-[#011C33] border-amber-400" : "bg-white/5 border-white/10"}`}>Paystack 💳<br /><span className="text-[11px] font-normal opacity-70 break-words">Card • Transfer</span></button>
            <button onClick={() => setGateway("flutterwave")} className={`py-3 px-2 rounded-2xl font-bold text-sm border break-words min-w-0 ${gateway === "flutterwave" ? "bg-[#F5A623] text-black border-amber-400" : "bg-white/5 border-white/10"}`}>Flutterwave 🟡<br /><span className="text-[11px] font-normal opacity-70 break-words">Card • USSD</span></button>
            <button onClick={() => setGateway("cod")} className={`py-3 px-2 rounded-2xl font-bold text-sm border break-words min-w-0 ${gateway === "cod" ? "bg-green-600 border-amber-400" : "bg-white/5 border-white/10"}`}>Pay on Delivery 💵<br /><span className="text-[11px] font-normal opacity-70 break-words">Cash on arrival</span></button>
          </div>
        </div>

        {/* ✅ PAY BUTTON - FIXED: Short text on mobile, full text on desktop */}
        <button onClick={handlePay} disabled={loading || !selectedBranchId} className="w-full mt-4 bg-amber-400 text-black py-4 px-4 rounded-full font-black text-base sm:text-lg disabled:opacity-50 break-words whitespace-normal leading-snug min-w-0 overflow-hidden">
          {loading ? "Processing... ⏳" : !selectedBranchId ? "Select a branch to continue" : gateway === "cod" ? `PLACE ORDER • ₦${total.toLocaleString()}` : `PAY ₦${total.toLocaleString()} →`}
        </button>
        <p className="text-center text-xs text-white/40 mt-2 break-words px-2">🔒 Secure payment via PHP • You will be redirected to Paystack / Flutterwave to complete payment</p>
      </div>
    </div>
  );
}