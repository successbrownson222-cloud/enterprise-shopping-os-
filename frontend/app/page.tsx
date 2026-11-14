"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import SwiftMartUI from "./components";
import { getToken, getUser, logout, type AuthUser } from "../lib/auth";
import { CATEGORIES, BRANDS_BY_CATEGORY, API_URL, PHP_URL } from '../lib/categories';
import type { Product } from '../lib/categories';

export type CartItem = Product & { brand: string; size: string; color: string; qty: number };
export type ChatMsg = { from: "me" | "support"; text: string };

// ✅ Slideshow data - Shop Now goes to that category
export const SLIDES = [
  { id: 1, tag: "FLASH SALE • UP TO 40% OFF", title: 'Samsung 55" Smart TV', desc: "4K Ultra HD, Netflix, YouTube, WiFi. Free delivery in Lagos.", price: 385000, oldPrice: 480000, img: "📺", cat: "TVs", bg: "from-slate-900 to-amber-600" },
  { id: 2, tag: "NEW ARRIVAL", title: "Firman 5.5KVA Generator", desc: "Key starter, copper coil, low fuel. Power your home 24/7.", price: 485000, oldPrice: 560000, img: "⚡", cat: "Generators", bg: "from-amber-500 to-orange-600" },
  { id: 3, tag: "BEST SELLER", title: "Toyota Camry 2022", desc: "Full option, leather, reverse camera, Lagos cleared.", price: 18500000, oldPrice: 21000000, img: "🚗", cat: "Cars", bg: "from-slate-900 to-blue-700" },
  { id: 4, tag: "HOT DEAL", title: "Men Leather Oxford Shoes", desc: "Premium leather, comfortable for office & events.", price: 45000, oldPrice: 65000, img: "👞", cat: "Men Shoes", bg: "from-emerald-700 to-slate-900" },
];

export default function SwiftMart() {
  const [cat, setCat] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selSize, setSelSize] = useState("");
  const [selColor, setSelColor] = useState("");
  const [selBrand, setSelBrand] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // ✅ NEW: Slideshow
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);
  const goToSlide = (slideCat: string) => {
    setCat(slideCat); setBrandFilter("All Brands"); setQ("");
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ NEW: Live Chat - Socket.io ready, auto-reply fallback until backend chat is wired
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { from: "support", text: "Hi 👋 Welcome to SwiftMart! Ask me about price, delivery, or stock." },
  ]);
  const socketRef = useRef<Socket | null>(null);

  const sendChat = (text: string) => {
    if (!text.trim()) return;
    setChatMsgs(prev => [...prev, { from: "me", text }]);
    // ✅ When you bring backend socket file, backend will emit "chat-reply" - we already listen below
    if (socketRef.current?.connected) {
      socketRef.current.emit("chatMessage", { text, userEmail: getUser()?.email || "guest", name: getUser()?.name || "Guest" });
      return; // wait for real admin reply, don't auto-reply
    }
    setTimeout(() => {
      const low = text.toLowerCase();
      let reply = "Thanks! Support will reply shortly. For urgent orders, tap WhatsApp in the chat 👇";
      if (low.includes("deliver")) reply = "We deliver in Lagos in 24hrs, outside Lagos 2-4 days. Fee depends on location.";
      if (low.includes("price") || low.includes("cost") || low.includes("how much")) reply = "All prices are on the product cards. Tell me which product you want and I'll confirm stock.";
      if (low.includes("stock") || low.includes("available")) reply = "Most items are in stock. Tell me the product name and I'll check it.";
      setChatMsgs(prev => [...prev, { from: "support", text: reply }]);
    }, 800);
  };

  const handleLogout = () => { logout(); setUser(null); setCart([]); localStorage.removeItem("swiftmart_cart"); };

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("swiftmart_cart") || "[]");
      if (Array.isArray(saved) && saved.length) setCart(saved);
      const savedWish = JSON.parse(localStorage.getItem("swiftmart_wishlist") || "[]");
      if (Array.isArray(savedWish)) setWishlist(savedWish);
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("swiftmart_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("swiftmart_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || [];
      if (list.length > 0) setProducts(list);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const s = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.on("products-updated", () => fetchProducts());
    // ✅ Listen for real admin reply when backend is ready
    s.on("chat-reply", (msg: any) => {
      if (msg?.text) setChatMsgs(prev => [...prev, { from: "support", text: msg.text }]);
    });
    s.on("chatMessage", (msg: any) => {
      if (msg?.text && msg?.from !== "me") setChatMsgs(prev => [...prev, { from: "support", text: msg.text }]);
    });
    const interval = setInterval(fetchProducts, 10000);
    return () => { s.disconnect(); clearInterval(interval); };
  }, [fetchProducts]);

  const availableBrands = cat === "All" ? ["All Brands"] : ["All Brands", ...(BRANDS_BY_CATEGORY[cat] || [])];

  // ✅ NEW: Smart Search AI - suggestions + AI picks
  const smartResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return products.filter(p => (p.name + " " + p.category + " " + (p.brand || "") + " " + (p.desc || "")).toLowerCase().includes(query)).slice(0, 6);
  }, [q, products]);

  const aiPicks = useMemo(() => {
    if (q.trim()) return smartResults.slice(0, 4);
    return [...products].sort((a, b) => ((b.oldPrice || 0) - b.price) - ((a.oldPrice || 0) - a.price)).slice(0, 4);
  }, [q, products, smartResults]);

  const filtered = useMemo(() => products.filter(p =>
    (cat === "All" || p.category === cat) &&
    (brandFilter === "All Brands" || p.brand === brandFilter) &&
    (p.name + p.category + (p.brand || "")).toLowerCase().includes(q.toLowerCase())
  ), [cat, brandFilter, q, products]);

  const openProduct = (p: Product) => { setSelected(p); setSelSize(""); setSelColor(p.colors?.[0] || ""); setSelBrand(p.brand || ""); setQty(1); };
  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));
  const updateQty = (idx: number, delta: number) => setCart(prev => prev.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty + delta) } : c));

  const addToCart = () => {
    if (!selected) return;
    if (!selSize) return alert("Please choose SIZE first");
    if (!selColor) return alert("Please choose COLOR");
    if (!selBrand) return alert("Please choose BRAND / TYPE");
    const key = (c: CartItem) => c.id === selected.id && c.brand === selBrand && c.size === selSize && c.color === selColor;
    const exists = cart.find(key);
    if (exists) setCart(prev => prev.map(c => key(c) ? { ...c, qty: c.qty + qty } : c));
    else setCart(prev => [...prev, { ...selected, brand: selBrand, size: selSize, color: selColor, qty }]);
    setSelected(null); setShowCart(true);
  };

  const changeCat = (c: string) => { setCat(c); setBrandFilter("All Brands"); };
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const goToCheckout = () => {
    if (cart.length === 0) return alert("Your cart is empty");
    if (!getToken() || !getUser()) { alert("Please login / signup first to checkout"); window.location.href = "/auth"; return; }
    window.location.href = "/checkout";
  };

  const payWithGateway = async (gateway: "paystack" | "flutterwave") => {
    const u = getUser();
    if (!u) { window.location.href = "/auth"; return; }
    if (cart.length === 0) return alert("Cart is empty");
    const orderId = "ORD-" + Date.now();
    const action = gateway === "paystack" ? "init-paystack" : "init-flutterwave";
    try {
      const r = await fetch(`${PHP_URL}/payments.php?action=${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, amount: total, orderId, customerName: u.name, phone: (u as any).phone || "", items: cart }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Payment init failed");
      const url = data.authorization_url || data.payment_link;
      if (!url) throw new Error("No payment link returned");
      localStorage.setItem("swiftmart_pending_order", JSON.stringify({ orderId, gateway, total, cart }));
      window.location.href = url;
    } catch (e: any) { alert("❌ Payment failed: " + e.message); }
  };

  const verifyPayment = async (gateway: "paystack" | "flutterwave", ref: string) => {
    const action = gateway === "paystack" ? "verify-paystack" : "verify-flutterwave";
    const param = gateway === "paystack" ? `reference=${ref}` : `tx_ref=${ref}`;
    const r = await fetch(`${PHP_URL}/payments.php?action=${action}&${param}`);
    return r.json();
  };

  const openInvoice = (orderId: string) => { window.open(`${PHP_URL}/invoice.php?orderId=${orderId}`, "_blank"); };

  const createNodeOrder = async (address: string, gateway: string) => {
    const u = getUser();
    const r = await fetch(`${API_URL}/api/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, customer: { name: u?.name, email: u?.email, phone: (u as any)?.phone || "" }, total, address, userEmail: u?.email, gateway }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Order failed");
    return d.data;
  };

  return (
    <SwiftMartUI
      cat={cat} setCat={changeCat} q={q} setQ={setQ}
      categories={CATEGORIES} filtered={filtered} loading={loading} productsCount={products.length}
      brandFilter={brandFilter} setBrandFilter={setBrandFilter} availableBrands={availableBrands}
      selected={selected} setSelected={setSelected} openProduct={openProduct}
      selSize={selSize} setSelSize={setSelSize} selColor={selColor} setSelColor={setSelColor}
      selBrand={selBrand} setSelBrand={setSelBrand}
      qty={qty} setQty={setQty} cart={cart} total={total} addToCart={addToCart} removeFromCart={removeFromCart}
      wishlist={wishlist} toggleWishlist={toggleWishlist}
      showCart={showCart} setShowCart={setShowCart}
      user={user} handleLogout={handleLogout}
      goToCheckout={goToCheckout} updateQty={updateQty}
      payWithGateway={payWithGateway} verifyPayment={verifyPayment}
      openInvoice={openInvoice} createNodeOrder={createNodeOrder}
      phpUrl={PHP_URL}
      // ✅ NEW PROPS
      slides={SLIDES} slide={slide} setSlide={setSlide} goToSlide={goToSlide}
      smartResults={smartResults} aiPicks={aiPicks}
      chatOpen={chatOpen} setChatOpen={setChatOpen} chatMsgs={chatMsgs} sendChat={sendChat}
    />
  );
}