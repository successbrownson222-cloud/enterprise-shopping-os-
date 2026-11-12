"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import SwiftMartUI from "./components";
import { getToken, getUser, logout, type AuthUser } from "../lib/auth";
import { CATEGORIES } from '../lib/categories';

export type Product = {
  id: string; name: string; price: number; oldPrice?: number; category: string;
  brand: string; img: string; rating: number; stock: number; desc: string;
  sizes: string[]; colors: string[]; colorHex: Record<string, string>;
};

export const BRANDS_BY_CATEGORY: Record<string, string[]> = {
  "Men Shoes": ["Nike", "Adidas", "Clarks", "New Balance", "Puma"],
  "Women Shoes": ["Nike", "Adidas", "Steve Madden", "Clarks", "Zara"],
  "Men Clothes": ["Nike", "Zara", "H&M", "Polo", "Senator"],
  "Women Clothes": ["Zara", "H&M", "Ankara", "Shein", "Boutique"],
  "Children Clothes": ["Zara Kids", "H&M Kids", "Mothercare", "Local"],
  "Children Shoes": ["Nike Kids", "Adidas Kids", "Crocs", "Clarks Kids"],
  "Cars": ["Toyota", "Lexus", "Honda", "Mercedes", "Hyundai", "Kia"],
  "TVs": ["Samsung", "LG", "Hisense", "Sony", "TCL"],
  "Freezers": ["Hisense", "LG", "Thermocool", "Samsung", "Haier"],
  "Kitchen Utensils": ["Master Chef", "Non-Stick Pro", "Stainless Steel", "Tefal"],
  "Generators": ["Firman", "Tiger", "Elepaq", "Sumec", "Honda"],
  "Home Appliances": ["LG", "Samsung", "Hisense", "Binatone", "Scanfrost"],
};

// ✅ URLs - 1 place only, no hardcoding in components
export const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com";
export const PHP_URL = (process.env as any).NEXT_PUBLIC_PHP_API_URL || "https://swiftmart-php.onrender.com";
export const PYTHON_URL = (process.env as any).NEXT_PUBLIC_AI_API_URL || "https://swiftmart-python.onrender.com";

// Cart type shared with checkout - same shape backend-php expects
export type CartItem = Product & { brand: string; size: string; color: string; qty: number };

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

  // ✅ AUTH - from lib/auth.ts, not rewritten here
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => { setUser(getUser()); }, []);
  const handleLogout = () => { logout(); setUser(null); setCart([]); localStorage.removeItem("swiftmart_cart"); };

  // ✅ CART PERSIST - so checkout page can read it
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

  // ✅ PRODUCTS + REALTIME
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
    s.on("products-updated", () => fetchProducts());
    const interval = setInterval(fetchProducts, 10000);
    return () => { s.disconnect(); clearInterval(interval); };
  }, [fetchProducts]);

  const availableBrands = cat === "All" ? ["All Brands"] : ["All Brands", ...(BRANDS_BY_CATEGORY[cat] || [])];

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
    // ✅ Merge same product + same brand/size/color instead of duplicate rows
    const key = (c: CartItem) => c.id === selected.id && c.brand === selBrand && c.size === selSize && c.color === selColor;
    const exists = cart.find(key);
    if (exists) {
      setCart(prev => prev.map(c => key(c) ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart(prev => [...prev, { ...selected, brand: selBrand, size: selSize, color: selColor, qty }]);
    }
    setSelected(null); setShowCart(true);
  };

  const changeCat = (c: string) => { setCat(c); setBrandFilter("All Brands"); };
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  // ✅ CHECKOUT GUARD - uses lib/auth.ts, not rewritten
  const goToCheckout = () => {
    if (cart.length === 0) return alert("Your cart is empty");
    if (!getToken() || !getUser()) {
      alert("Please login / signup first to checkout");
      window.location.href = "/auth";
      return;
    }
    // Cart already in localStorage, checkout reads it
    window.location.href = "/checkout";
  };

  // ✅ PAYMENT - calls backend-php/payments.php ONLY, no Paystack/Flutterwave logic here
  // Used by checkout page via props, or direct Buy Now
  const payWithGateway = async (gateway: "paystack" | "flutterwave") => {
    const u = getUser();
    if (!u) { window.location.href = "/auth"; return; }
    if (cart.length === 0) return alert("Cart is empty");
    const orderId = "ORD-" + Date.now();
    const action = gateway === "paystack" ? "init-paystack" : "init-flutterwave";
    try {
      const r = await fetch(`${PHP_URL}/payments.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: u.email,
          amount: total,
          orderId,
          customerName: u.name,
          phone: (u as any).phone || "",
          items: cart,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Payment init failed");
      // ✅ PHP returns authorization_url / payment_link - redirect
      const url = data.authorization_url || data.payment_link;
      if (!url) throw new Error("No payment link returned");
      localStorage.setItem("swiftmart_pending_order", JSON.stringify({ orderId, gateway, total, cart }));
      window.location.href = url;
    } catch (e: any) {
      alert("❌ Payment failed: " + e.message);
    }
  };

  // ✅ VERIFY PAYMENT - called from /checkout/success page
  const verifyPayment = async (gateway: "paystack" | "flutterwave", ref: string) => {
    const action = gateway === "paystack" ? "verify-paystack" : "verify-flutterwave";
    const param = gateway === "paystack" ? `reference=${ref}` : `tx_ref=${ref}`;
    const r = await fetch(`${PHP_URL}/payments.php?action=${action}&${param}`);
    return r.json();
  };

  // ✅ INVOICE - calls backend-php/invoice.php
  const openInvoice = (orderId: string) => {
    window.open(`${PHP_URL}/invoice.php?orderId=${orderId}`, "_blank");
  };

  // ✅ CREATE ORDER IN NODE - after payment or Pay on Delivery
  const createNodeOrder = async (address: string, gateway: string) => {
    const u = getUser();
    const r = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        customer: { name: u?.name, email: u?.email, phone: (u as any)?.phone || "" },
        total, address,
        userEmail: u?.email,
        gateway,
      }),
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
      // ✅ NEW PROPS - Auth + Payment + Checkout
      user={user} handleLogout={handleLogout}
      goToCheckout={goToCheckout} updateQty={updateQty}
      payWithGateway={payWithGateway} verifyPayment={verifyPayment}
      openInvoice={openInvoice} createNodeOrder={createNodeOrder}
      phpUrl={PHP_URL}
    />
  );
}