"use client";
import { useState, useEffect, useRef } from "react";
import type { Product } from "../lib/categories";
import type { CartItem, ChatMsg } from "./page";
import type { AuthUser } from "../lib/auth";

type Slide = { id:number; tag:string; title:string; desc:string; price:number; oldPrice:number; img:string; cat:string; bg:string };

type Props = {
  cat: string; setCat: (v: string) => void;
  q: string; setQ: (v: string) => void;
  categories: string[]; filtered: Product[];
  loading: boolean; productsCount: number;
  brandFilter: string; setBrandFilter: (v: string) => void; availableBrands: string[];
  selected: Product | null; setSelected: (v: any) => void; openProduct: (p: Product) => void;
  selSize: string; setSelSize: (v: string) => void;
  selColor: string; setSelColor: (v: string) => void;
  selBrand: string; setSelBrand: (v: string) => void;
  qty: number; setQty: (v: number) => void;
  cart: CartItem[]; total: number; addToCart: () => void; removeFromCart: (i: number) => void;
  wishlist: string[]; toggleWishlist: (id: string) => void;
  showCart: boolean; setShowCart: (v: boolean) => void;
  user?: AuthUser | null;
  handleLogout?: () => void;
  goToCheckout?: () => void;
  updateQty?: (idx: number, delta: number) => void;
  payWithGateway?: (g: "paystack" | "flutterwave") => void;
  verifyPayment?: (g: "paystack" | "flutterwave", ref: string) => Promise<any>;
  openInvoice?: (orderId: string) => void;
  createNodeOrder?: (address: string, gateway: string) => Promise<any>;
  phpUrl?: string;
  // ✅ NEW - from page.tsx, all optional so old page.tsx still works
  slides?: Slide[]; slide?: number; setSlide?: (v:number)=>void; goToSlide?: (cat:string)=>void;
  smartResults?: Product[]; aiPicks?: Product[];
  chatOpen?: boolean; setChatOpen?: (v:boolean)=>void; chatMsgs?: ChatMsg[]; sendChat?: (text:string)=>void;
};

const WHATSAPP = "2348000000000"; // ← Change to your real WhatsApp number
const isPhoto = (img: string) => img?.startsWith("http") || img?.startsWith("data:image") || img?.startsWith("/");

function PImg({ img, name, cls, emojiCls }: { img: string; name: string; cls: string; emojiCls?: string }) {
  if (isPhoto(img)) return <img src={img} alt={name} className={`${cls} object-cover`} />;
  return <div className={`${cls} ${emojiCls || "text-6xl md:text-7xl"} flex items-center justify-center bg-white/5`}>{img || "📦"}</div>;
}

export default function SwiftMartUI(p: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [p.chatMsgs, p.chatOpen]);

  const slide = p.slides?.[p.slide || 0] || p.slides?.[0];
  const chatOpen = p.chatOpen || false;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden">
      {/* ✅ HEADER - with Smart Search dropdown */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-black whitespace-nowrap">🛒 <span className="text-amber-400">Swift</span>Mart</div>
            <div className="flex-1" />
            {p.user ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs hidden md:block">Hi, {p.user.name.split(" ")[0]} 👋</span>
                {p.user.role === "admin" && <a href="/admin" className="bg-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-bold">Admin</a>}
                <button onClick={p.handleLogout} className="bg-white/10 px-3 py-1.5 rounded-full text-xs">Logout</button>
              </div>
            ) : (
              <a href="/auth" className="bg-white text-black px-3 md:px-4 py-2 rounded-full text-xs font-bold shrink-0 whitespace-nowrap">Login / Sign Up</a>
            )}
            <button onClick={() => p.setShowCart(true)} className="relative bg-amber-400 text-black font-bold px-3 py-2 rounded-full shrink-0 text-sm">Cart 🛒 {p.cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{p.cart.reduce((s,c)=>s+c.qty,0)}</span>}</button>
          </div>
          <div className="relative">
            <input value={p.q} onChange={e => { p.setQ(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder="✨ Smart Search — try 'TV', 'shoes', 'generator', 'Samsung'..." className="w-full bg-white/10 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-white/50" />
            {/* ✅ SMART SEARCH DROPDOWN */}
            {showSearch && p.q && p.smartResults && (
              <div className="absolute top-full left-0 right-0 bg-white text-black rounded-2xl shadow-2xl mt-2 overflow-hidden z-50">
                <p className="px-4 pt-3 text-[11px] font-bold text-amber-600">✨ SMART SEARCH • AI PICKS FOR YOU</p>
                {p.smartResults.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No match for “{p.q}” — try TV, shoes, freezer...</p>}
                {p.smartResults.map(prod => (
                  <button key={prod.id} onClick={() => { p.openProduct(prod); setShowSearch(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left">
                    {isPhoto(prod.img) ? <img src={prod.img} alt={prod.name} className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">{prod.img}</span>}
                    <span className="flex-1 min-w-0"><span className="block text-sm font-bold truncate">{prod.name}</span><span className="text-xs text-slate-500">{prod.category} • ₦{prod.price.toLocaleString()}</span></span>
                    <span className="text-amber-500 text-xs font-bold">View →</span>
                  </button>
                ))}
                <button onClick={() => { setShowSearch(false); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full bg-amber-400 py-2.5 text-sm font-black">See all results for “{p.q}” →</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ✅ BIG SLIDESHOW - Replaces static hero, auto-slides */}
      {slide ? (
        <div className="mx-4 mt-4 sm:mx-auto max-w-7xl relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 text-black min-h-[260px] sm:min-h-[300px] flex items-center">
          <div className="p-6 sm:p-8 max-w-lg relative z-10">
            <span className="bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">{slide.tag}</span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mt-3">{slide.title}</h1>
            <p className="mt-2 text-sm font-medium text-black/70">{slide.desc}</p>
            <p className="mt-3 text-2xl font-black">₦{slide.price.toLocaleString()} <span className="line-through text-black/40 text-base font-normal">₦{slide.oldPrice.toLocaleString()}</span></p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button onClick={() => p.goToSlide ? p.goToSlide(slide.cat) : p.setCat(slide.cat)} className="bg-black text-white px-6 py-3 rounded-full font-black text-sm shadow-lg active:scale-95">🛒 Shop Now →</button>
              <button onClick={() => p.setChatOpen?.(true)} className="bg-white/80 backdrop-blur px-5 py-3 rounded-full font-bold text-sm">💬 Ask About This</button>
            </div>
          </div>
          <div className="absolute right-4 sm:right-10 text-[110px] sm:text-[180px] opacity-30 select-none">{slide.img}</div>
          <button onClick={() => p.setSlide?.((p.slide! - 1 + p.slides!.length) % p.slides!.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 text-white w-9 h-9 rounded-full z-10">‹</button>
          <button onClick={() => p.setSlide?.((p.slide! + 1) % p.slides!.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 text-white w-9 h-9 rounded-full z-10">›</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {p.slides!.map((_, i) => (
              <button key={i} onClick={() => p.setSlide?.(i)} className={`h-2 rounded-full transition-all ${i === p.slide ? "w-8 bg-black" : "w-2 bg-black/30"}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 sm:mx-auto max-w-7xl bg-amber-400 text-black rounded-3xl px-5 py-6 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold tracking-widest">FLASH SALE • TODAY ONLY</p><h1 className="text-3xl md:text-5xl font-black leading-tight">Everything You Need.<br />One Swift Store.</h1><p className="mt-2 text-sm font-medium">Shoes • Clothes • Cars • TVs • Generators • Freezers</p><button onClick={() => p.setCat("All")} className="mt-4 bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm">Shop Now →</button></div>
          <div className="text-6xl md:text-8xl">🛍️</div>
        </div>
      )}

      {/* LOGGED-IN / LOGIN BANNER */}
      {p.user && (
        <div className="mx-4 sm:mx-auto max-w-7xl mt-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-2.5 flex justify-between items-center text-sm">
          <span>✅ Logged in as <b>{p.user.email}</b> • {p.user.role === "admin" ? "Admin - you can manage products" : "Checkout is unlocked"}</span>
          {p.user.role === "admin" && <a href="/admin" className="text-amber-400 font-bold text-xs shrink-0 ml-2">Go to Admin →</a>}
        </div>
      )}
      {!p.user && (
        <div className="mx-4 sm:mx-auto max-w-7xl mt-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-2.5 flex justify-between items-center text-sm gap-2">
          <span>🔒 Login to checkout with Paystack / Flutterwave</span>
          <a href="/auth" className="bg-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-bold shrink-0">Login →</a>
        </div>
      )}

      {/* CATEGORIES */}
      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto px-4 py-4">
        {p.categories.map(c => (
          <button key={c} onClick={() => p.setCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold ${p.cat === c ? "bg-amber-400 text-black" : "bg-white/10"}`}>{c}</button>
        ))}
      </div>

      {/* BRAND FILTER */}
      {p.cat !== "All" && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <p className="text-xs font-bold text-white/60 mb-2">Choose Type / Brand in {p.cat}:</p>
          <div className="flex gap-2 overflow-x-auto">
            {p.availableBrands.map(b => (
              <button key={b} onClick={() => p.setBrandFilter(b)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold ${p.brandFilter === b ? "bg-white text-black" : "bg-white/10"}`}>{b}</button>
            ))}
          </div>
        </div>
      )}

      {/* ✅ AI PICKS */}
      {p.aiPicks && p.aiPicks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <h2 className="font-black text-base">✨ {p.q ? `AI Picks for “${p.q}”` : "AI Picks For You"}</h2>
          <p className="text-xs text-white/50">{p.q ? "Matching your search" : "Best discounts & top rated"}</p>
          <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
            {p.aiPicks.map(prod => (
              <button key={prod.id} onClick={() => p.openProduct(prod)} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 shrink-0 text-left min-w-[240px]">
                {isPhoto(prod.img) ? <img src={prod.img} alt={prod.name} className="w-14 h-14 rounded-xl object-cover" /> : <span className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl">{prod.img}</span>}
                <span><span className="block text-sm font-bold leading-tight line-clamp-2">{prod.name}</span><span className="text-xs text-amber-400 font-black">₦{prod.price.toLocaleString()}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LOADING / EMPTY */}
      {p.loading && <p className="px-4 py-10 text-center text-white/60">Loading products from backend... ⏳</p>}
      {!p.loading && p.productsCount === 0 && <p className="px-4 py-10 text-center text-white/60">No products yet. Admin needs to add products.<br />Check if backend-node is running on Render.</p>}
      {!p.loading && p.productsCount > 0 && p.filtered.length === 0 && <p className="px-4 py-10 text-center text-white/60">No {p.brandFilter !== "All Brands" ? p.brandFilter + " " : ""}{p.cat} found. Try All Brands.</p>}

      {/* GRID */}
      <div id="products" className="max-w-7xl mx-auto px-4 pb-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {p.filtered.map(prod => (
          <div key={prod.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div onClick={() => p.openProduct(prod)} className="cursor-pointer">
              <PImg img={prod.img} name={prod.name} cls="h-32 md:h-40 w-full" />
              <div className="p-3">
                <p className="text-[11px] text-amber-400 font-bold">{prod.category} • {prod.brand || "Generic"}</p>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[36px]">{prod.name}</h3>
                <p className="text-xs text-white/60">⭐ {prod.rating} • {prod.stock} in stock • Sizes: {(prod.sizes || []).slice(0, 3).join(", ")}...</p>
                <div className="flex items-center gap-2 mt-1"><span className="font-black text-amber-400">₦{prod.price.toLocaleString()}</span>{prod.oldPrice && <span className="text-xs line-through text-white/40">₦{prod.oldPrice.toLocaleString()}</span>}</div>
              </div>
            </div>
            <div className="px-3 pb-3 flex gap-2">
              <button onClick={() => p.openProduct(prod)} className="flex-1 bg-amber-400 text-black py-2 rounded-full text-xs font-black">VIEW + CHOOSE</button>
              <button onClick={() => p.toggleWishlist(prod.id)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">{p.wishlist.includes(prod.id) ? "❤️" : "🤍"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT MODAL - unchanged logic, + Live Chat button */}
      {p.selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => p.setSelected(null)}>
          <div className="bg-[#1E293B] w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between gap-2"><h2 className="font-black text-xl">{p.selected.name}</h2><button onClick={() => p.setSelected(null)}>✕</button></div>
            {isPhoto(p.selected.img) ? <img src={p.selected.img} alt={p.selected.name} className="w-full h-56 object-cover rounded-2xl my-3" /> : <div className="text-7xl text-center py-4 bg-white/5 rounded-2xl my-3">{p.selected.img}</div>}
            <p className="text-sm text-white/70">{p.selected.desc}</p>
            <p className="mt-2 font-black text-2xl text-amber-400">₦{p.selected.price.toLocaleString()} {p.selected.oldPrice && <span className="text-sm line-through text-white/40">₦{p.selected.oldPrice.toLocaleString()}</span>}</p>
            <p className="mt-4 font-bold text-sm">Select Brand / Type <span className="text-red-400">*</span> {p.selBrand && <span className="text-amber-400">— {p.selBrand}</span>}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(p.availableBrands.filter((b: string) => b !== "All Brands").length > 0 ? p.availableBrands.filter((b: string) => b !== "All Brands") : [p.selected.brand || "Generic"]).map((b: string) => (
                <button key={b} onClick={() => p.setSelBrand(b)} className={`px-4 py-2 rounded-full border text-sm font-bold ${p.selBrand === b ? "bg-white text-black border-white" : "border-white/20 bg-white/5"}`}>{b}</button>
              ))}
            </div>
            <p className="mt-4 font-bold text-sm">Select Size {p.selected.category === "Cars" ? "(Year)" : p.selected.category === "TVs" ? "(Inches)" : p.selected.category === "Freezers" ? "(Litres)" : p.selected.category === "Generators" ? "(KVA)" : ""} <span className="text-red-400">*</span></p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(p.selected.sizes || []).map((s: string) => (
                <button key={s} onClick={() => p.setSelSize(s)} className={`px-4 py-2 rounded-full border text-sm font-bold ${p.selSize === s ? "bg-amber-400 text-black border-amber-400" : "border-white/20 bg-white/5"}`}>{s}</button>
              ))}
            </div>
            <p className="mt-4 font-bold text-sm">Select Color <span className="text-red-400">*</span> {p.selColor && <span className="text-amber-400">— {p.selColor}</span>}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {(p.selected.colors || []).map((c: string) => (
                <button key={c} onClick={() => p.setSelColor(c)} className="flex flex-col items-center gap-1">
                  <span className={`w-9 h-9 rounded-full border-2 ${p.selColor === c ? "border-amber-400 scale-110" : "border-white/20"}`} style={{ background: p.selected!.colorHex?.[c] || "#333" }} />
                  <span className="text-[11px]">{c}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <span className="text-sm font-bold">Qty:</span>
              <button onClick={() => p.setQty(Math.max(1, p.qty - 1))} className="w-8 h-8 bg-white/10 rounded-full">-</button>
              <span className="font-black">{p.qty}</span>
              <button onClick={() => p.setQty(Math.min(p.selected.stock, p.qty + 1))} className="w-8 h-8 bg-white/10 rounded-full">+</button>
              <span className="ml-auto text-sm text-white/60">Stock: {p.selected.stock} • Brand: {p.selBrand}</span>
            </div>
            <button onClick={p.addToCart} className="w-full mt-5 bg-amber-400 text-black py-3.5 rounded-full font-black">ADD TO CART — ₦{(p.selected.price * p.qty).toLocaleString()} • {p.selBrand || "Choose Brand"} • {p.selSize || "Choose Size"} • {p.selColor}</button>
            <button onClick={() => { p.setSelected(null); p.setChatOpen?.(true); }} className="w-full mt-2 bg-white text-black py-3 rounded-full font-bold text-sm">💬 Ask About This Product</button>
            <p className="text-center text-xs text-white/50 mt-2">You must choose Brand + Size + Color before adding</p>
          </div>
        </div>
      )}

      {/* CART DRAWER - unchanged */}
      {p.showCart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-end" onClick={() => p.setShowCart(false)}>
          <div className="bg-[#1E293B] w-full max-w-md h-full p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between"><h2 className="font-black text-xl">Your Cart ({p.cart.length})</h2><button onClick={() => p.setShowCart(false)}>✕</button></div>
            {!p.user ? (
              <div className="mt-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 text-sm">
                🔒 <b>Login required to checkout.</b> Your cart is saved.
                <a href="/auth" className="block mt-2 bg-amber-400 text-black text-center py-2 rounded-full font-bold text-xs">LOGIN / SIGN UP →</a>
              </div>
            ) : (
                         <p className="mt-3 text-xs text-green-400">✅ Logged in as {p.user.email} — checkout unlocked</p>
            )}
            {p.cart.length === 0 && <p className="mt-6 text-white/60 text-center">Cart is empty. Tap a product → Choose Brand + Size + Color → Add.</p>}
            {p.cart.map((c, i) => (
              <div key={i} className="flex gap-3 bg-white/5 rounded-2xl p-3 mt-3">
                {isPhoto(c.img) ? <img src={c.img} alt={c.name} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="text-4xl shrink-0">{c.img}</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="text-xs text-amber-400">Brand: {c.brand} • Size: {c.size} • Color: {c.color}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => p.updateQty?.(i, -1)} className="w-6 h-6 bg-white/10 rounded-full text-xs">-</button>
                    <span className="text-sm font-bold">Qty: {c.qty}</span>
                    <button onClick={() => p.updateQty?.(i, 1)} className="w-6 h-6 bg-white/10 rounded-full text-xs">+</button>
                  </div>
                  <p className="font-black mt-1">₦{(c.price * c.qty).toLocaleString()}</p>
                </div>
                <button onClick={() => p.removeFromCart(i)} className="text-red-400 self-start">🗑️</button>
              </div>
            ))}
            {p.cart.length > 0 && (
              <>
                <div className="flex justify-between mt-5 font-black text-lg"><span>Total</span><span className="text-amber-400">₦{p.total.toLocaleString()}</span></div>
                <p className="text-[11px] text-white/40 text-center mt-1">Delivery fee calculated at checkout</p>
                <button onClick={p.goToCheckout} className="w-full mt-3 bg-amber-400 text-black py-3.5 rounded-full font-black">
                  {p.user ? `CHECKOUT → ₦${p.total.toLocaleString()}` : "LOGIN TO CHECKOUT →"}
                </button>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => p.payWithGateway?.("paystack")} className="flex-1 bg-[#011C33] border border-white/20 text-white py-3 rounded-full text-xs font-bold">Paystack 💳<br /><span className="font-normal opacity-70">Card • Transfer</span></button>
                  <button onClick={() => p.payWithGateway?.("flutterwave")} className="flex-1 bg-[#F5A623] text-black py-3 rounded-full text-xs font-bold">Flutterwave 🟡<br /><span className="font-normal opacity-70">Card • USSD</span></button>
                </div>
                <p className="text-[11px] text-center text-white/40 mt-2">Secure payment via PHP • Or choose Pay on Delivery at checkout</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ LIVE CHAT - Floating button + Window */}
      {!chatOpen && (
        <button onClick={() => p.setChatOpen?.(true)} className="fixed bottom-20 md:bottom-5 right-5 z-50 bg-amber-400 text-black pl-4 pr-5 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 active:scale-95">💬 Live Chat <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span></button>
      )}
      {chatOpen && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white text-black rounded-3xl shadow-2xl overflow-hidden border flex flex-col h-[480px] max-h-[80vh]">
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <div><p className="font-black">💬 SwiftMart Live Chat</p><p className="text-[11px] text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online • Replies instantly</p></div>
            <button onClick={() => p.setChatOpen?.(false)} className="text-2xl leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {(p.chatMsgs || [{ from: "support", text: "Hi 👋 Welcome to SwiftMart! Ask me about price, delivery, or stock." }]).map((m: ChatMsg, i: number) => (
              <div key={i} className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.from === "me" ? "bg-black text-white ml-auto rounded-br-md" : "bg-white border mr-auto rounded-bl-md"}`}>{m.text}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 flex gap-2 border-t bg-white">
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" className="bg-green-500 text-white px-3 py-2.5 rounded-full text-xs font-bold shrink-0">WhatsApp</a>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && p.sendChat) { p.sendChat(chatInput); setChatInput(""); } }} placeholder="Ask about price, delivery..." className="flex-1 border rounded-full px-3 py-2 text-sm outline-none" />
            <button onClick={() => { if (p.sendChat) { p.sendChat(chatInput); setChatInput(""); } }} className="bg-amber-400 px-4 rounded-full font-black text-sm">Send</button>
          </div>
          <p className="text-center text-[10px] text-slate-400 pb-2 bg-white">Powered by SwiftMart Socket.io • Admin will join live soon</p>
        </div>
      )}

      {/* ✅ FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 mt-4 pb-24 md:pb-8 text-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <p className="text-2xl font-black">🛒 Swift<span className="text-amber-400">Mart</span></p>
          <p className="text-sm text-white/60 mt-1">Everything You Need. One Swift Store.</p>
          <p className="text-xs text-white/40 mt-1">Lagos, Nigeria • Fast Delivery • Quality Products • Pay on Delivery Available</p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <a href="/auth" className="bg-amber-400 text-black px-4 py-2 rounded-full text-xs font-bold">Login / Sign Up</a>
            <a href="/admin" className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold">Admin</a>
            <button onClick={() => p.setChatOpen?.(true)} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold">💬 Live Chat</button>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold">WhatsApp Us</a>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-white/40 flex-wrap">
            <button onClick={() => p.setCat("All")}>All Products</button>
            <button onClick={() => p.setCat("Cars")}>Cars</button>
            <button onClick={() => p.setCat("TVs")}>TVs</button>
            <button onClick={() => p.setCat("Generators")}>Generators</button>
            <button onClick={() => p.setCat("Men Shoes")}>Shoes</button>
          </div>
          <p className="text-[11px] text-white/30 mt-4">© 2026 SwiftMart. All rights reserved. • Secure payment via Paystack & Flutterwave</p>
        </div>
      </footer>

      {/* BOTTOM NAV - Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0F172A] border-t border-white/10 flex justify-around py-3 text-xs z-30">
        <button onClick={() => p.setCat("All")} className="text-amber-400 font-bold">🏠 Home</button>
        <button onClick={() => p.setCat("Cars")}>🚗 Cars</button>
        <button onClick={() => p.setCat("TVs")}>📺 TVs</button>
        <button onClick={() => p.setShowCart(true)}>🛒 Cart ({p.cart.reduce((s: number, c: CartItem) => s + c.qty, 0)})</button>
        {p.user ? <button onClick={() => window.location.href = "/admin"}>👤 {p.user.name.split(" ")[0]}</button> : <button onClick={() => window.location.href = "/auth"}>👤 Account</button>}
      </div>
    </div>
  );
}