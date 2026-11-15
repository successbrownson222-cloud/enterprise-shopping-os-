"use client";
import { useState, useEffect, useRef } from "react";
import type { Product } from "../lib/categories";
import type { AuthUser } from "../lib/auth";

type CartItem = Product & { brand: string; size: string; color: string; qty: number };
type ChatMsg = { from: "me" | "support"; text: string };
type Slide = { id: number; tag: string; title: string; desc: string; price: number; oldPrice: number; img: string; cat: string; bg: string };
type Props = {
  cat: string; setCat: (v: string) => void; q: string; setQ: (v: string) => void;
  categories: string[]; filtered: Product[]; loading: boolean; productsCount: number;
  brandFilter: string; setBrandFilter: (v: string) => void; availableBrands: string[];
  selected: Product | null; setSelected: (v: any) => void; openProduct: (p: Product) => void;
  selSize: string; setSelSize: (v: string) => void; selColor: string; setSelColor: (v: string) => void;
  selBrand: string; setSelBrand: (v: string) => void; qty: number; setQty: (v: number) => void;
  cart: CartItem[]; total: number; addToCart: () => void; removeFromCart: (i: number) => void;
  wishlist: string[]; toggleWishlist: (id: string) => void;
  showCart: boolean; setShowCart: (v: boolean) => void; user?: AuthUser | null; handleLogout?: () => void;
  goToCheckout?: () => void; updateQty?: (idx: number, delta: number) => void;
  slides?: Slide[]; slide?: number; setSlide?: (v: number) => void; goToSlide?: (cat: string) => void;
  smartResults?: Product[]; aiPicks?: Product[]; chatOpen?: boolean; setChatOpen?: (v: boolean) => void;
  chatMsgs?: ChatMsg[]; sendChat?: (text: string) => void; isAdmin?: boolean;
};
const WHATSAPP = "09125969210";
const isPhoto = (img: string) => img?.startsWith("http") || img?.startsWith("data:image") || img?.startsWith("/");
const naira = (n: number) => `₦${(n || 0).toLocaleString()}`;
function PImg({ img, name, cls }: { img: string; name: string; cls: string }) {
  if (isPhoto(img)) return <img src={img} alt={name} className={`${cls} object-cover`} loading="lazy" />;
  return <div className={`${cls} text-6xl flex items-center justify-center bg-white/5`}>{img || "📦"}</div>;
}

export default function SwiftMartUI(p: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [p.chatMsgs, p.chatOpen]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setShowSearch(false); setShowProfile(false); p.setSelected(null); } };
    document.addEventListener("mousedown", onClick); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [p]);
  const slide = p.slides?.[p.slide || 0] || p.slides?.[0];
  const chatOpen = p.chatOpen || false;
  const cartCount = p.cart.reduce((s, c) => s + c.qty, 0);
  const firstName = p.user?.name?.split(" ")[0] || "Account";
  const isAdmin = p.isAdmin === true;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden pb-20 md:pb-0">

      {/* ✅ HEADER FIXED: flex-wrap + Cart can NEVER be hidden now */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-white/10 px-3 sm:px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <button onClick={() => p.setCat("All")} className="text-lg sm:text-2xl font-black whitespace-nowrap shrink-0 min-w-0">🛒 <span className="text-amber-400">Swift</span>Mart</button>
            <div className="flex-1 min-w-0" />
            {p.user ? (
              <div className="relative shrink-0">
                <button onClick={() => setShowProfile(v => !v)} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full text-xs font-bold max-w-[110px] sm:max-w-[150px]">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shrink-0">{firstName[0]}</span>
                  <span className="truncate">Hi, {firstName}</span><span className="shrink-0">▾</span>
                </button>
                {showProfile && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* ✅ NAME + PHOTO ONLY - NO EMAIL */}
                    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shrink-0">{firstName[0]}</span>
                      <p className="text-sm font-bold truncate min-w-0">{p.user.name}</p>
                    </div>
                    {isAdmin && <a href="/admin" className="block px-4 py-3 text-sm font-bold text-amber-400 hover:bg-white/5">⚙️ Admin Console →</a>}
                    <a href="/checkout" className="block px-4 py-3 text-sm hover:bg-white/5">🧾 My Orders</a>
                    <button onClick={() => { setShowProfile(false); p.handleLogout?.(); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5">Logout</button>
                  </div>
                )}
              </div>
            ) : (<a href="/auth" className="bg-white text-black px-3 py-2 rounded-full text-xs font-bold shrink-0 whitespace-nowrap">Login / Sign Up</a>)}
            {/* ✅ CART - ALWAYS VISIBLE: shrink-0 + order-last on tiny phones, badge inside */}
            <button onClick={() => p.setShowCart(true)} className="relative bg-amber-400 text-black font-bold px-3 py-2 rounded-full shrink-0 text-sm whitespace-nowrap flex items-center gap-1">
              <span>Cart 🛒</span>
              {cartCount > 0 && <span className="bg-red-500 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
          <div className="relative min-w-0" ref={searchRef}>
            <input value={p.q} onChange={e => { p.setQ(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder="✨ Search — try 'TV', 'shoes', 'generator'..." className="w-full min-w-0 bg-white/10 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-white/50" />
            {showSearch && p.q && p.smartResults && (
              <div className="absolute top-full left-0 right-0 bg-white text-black rounded-2xl shadow-2xl mt-2 overflow-hidden z-50">
                <p className="px-4 pt-3 text-[11px] font-bold text-amber-600">✨ SMART SEARCH</p>
                {p.smartResults.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No match for “{p.q}”</p>}
                {p.smartResults.map(prod => (
                  <button key={prod.id} onClick={() => { p.openProduct(prod); setShowSearch(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left min-w-0">
                    {isPhoto(prod.img) ? <img src={prod.img} alt={prod.name} className="w-10 h-10 rounded-lg object-cover shrink-0" /> : <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shrink-0">{prod.img}</span>}
                    <span className="flex-1 min-w-0"><span className="block text-sm font-bold truncate">{prod.name}</span><span className="text-xs text-slate-500">{prod.category} • {naira(prod.price)}</span></span>
                    <span className="text-amber-500 text-xs font-bold shrink-0">View →</span>
                  </button>
                ))}
                <button onClick={() => { setShowSearch(false); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full bg-amber-400 py-2.5 text-sm font-black">See all results for “{p.q}” →</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {slide ? (
        <div className="mx-4 mt-4 sm:mx-auto max-w-7xl relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 text-black min-h-[260px] flex items-center">
          <div className="p-6 sm:p-8 max-w-lg relative z-10 min-w-0">
            <span className="bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold">{slide.tag}</span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mt-3 line-clamp-2 break-words">{slide.title}</h1>
            <p className="mt-2 text-sm font-medium text-black/70 line-clamp-2 break-words">{slide.desc}</p>
            <p className="mt-3 text-2xl font-black break-words">{naira(slide.price)} <span className="line-through text-black/40 text-base font-normal">{naira(slide.oldPrice)}</span></p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button onClick={() => p.goToSlide ? p.goToSlide(slide.cat) : p.setCat(slide.cat)} className="bg-black text-white px-6 py-3 rounded-full font-black text-sm">🛒 Shop Now →</button>
              <button onClick={() => p.setChatOpen?.(true)} className="bg-white/80 px-5 py-3 rounded-full font-bold text-sm">💬 Ask About This</button>
            </div>
          </div>
          <div className="absolute right-4 text-[110px] sm:text-[180px] opacity-30 select-none pointer-events-none">{slide.img}</div>
          <button aria-label="Previous slide" onClick={() => p.setSlide?.((p.slide! - 1 + p.slides!.length) % p.slides!.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 text-white w-9 h-9 rounded-full z-10">‹</button>
          <button aria-label="Next slide" onClick={() => p.setSlide?.((p.slide! + 1) % p.slides!.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 text-white w-9 h-9 rounded-full z-10">›</button>
        </div>
      ) : null}

      {/* ✅ LOGIN BANNER - NAME ONLY, NO EMAIL */}
      {p.user ? (
        <div className="mx-4 sm:mx-auto max-w-7xl mt-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-2.5 flex justify-between items-center gap-2 text-sm min-w-0">
          <span className="truncate min-w-0">✅ Logged in as <b>{p.user.name}</b> • {isAdmin ? "Admin - you can manage products" : "Checkout is unlocked"}</span>
          {isAdmin && <a href="/admin" className="text-amber-400 font-bold text-xs shrink-0 whitespace-nowrap">Go to Admin →</a>}
        </div>
      ) : (
        <div className="mx-4 sm:mx-auto max-w-7xl mt-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-2.5 flex justify-between items-center text-sm gap-2 min-w-0">
          <span className="truncate min-w-0">🔒 Login to checkout</span><a href="/auth" className="bg-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-bold shrink-0">Login →</a>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {p.categories.map(c => (<button key={c} onClick={() => p.setCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold shrink-0 ${p.cat === c ? "bg-amber-400 text-black" : "bg-white/10"}`}>{c}</button>))}
      </div>
      {p.cat !== "All" && (
        <div className="max-w-7xl mx-auto px-4 pb-2"><p className="text-xs font-bold text-white/60 mb-2">Choose Type / Brand in {p.cat}:</p>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {p.availableBrands.map(b => (<button key={b} onClick={() => p.setBrandFilter(b)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${p.brandFilter === b ? "bg-white text-black" : "bg-white/10"}`}>{b}</button>))}
          </div></div>
      )}
      {p.aiPicks && p.aiPicks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2"><h2 className="font-black text-base truncate">✨ {p.q ? `AI Picks for “${p.q}”` : "AI Picks For You"}</h2>
          <div className="flex gap-3 overflow-x-auto mt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {p.aiPicks.map(prod => (
              <button key={prod.id} onClick={() => p.openProduct(prod)} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 shrink-0 text-left w-[240px] min-w-[240px]">
                {isPhoto(prod.img) ? <img src={prod.img} alt={prod.name} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <span className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl shrink-0">{prod.img}</span>}
                <span className="min-w-0"><span className="block text-sm font-bold leading-tight line-clamp-2">{prod.name}</span><span className="text-xs text-amber-400 font-black">{naira(prod.price)}</span></span>
              </button>
            ))}
          </div></div>
      )}
      {p.loading && <p className="px-4 py-10 text-center text-white/60">Loading products... ⏳</p>}
      {!p.loading && p.productsCount === 0 && <p className="px-4 py-10 text-center text-white/60">No products yet. Admin needs to add products.</p>}

      <div id="products" className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {p.filtered.map(prod => (
          <article key={prod.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col min-w-0">
            <div onClick={() => p.openProduct(prod)} className="cursor-pointer min-w-0">
              <PImg img={prod.img} name={prod.name} cls="h-32 md:h-40 w-full" />
              <div className="p-3 min-w-0">
                <p className="text-[11px] text-amber-400 font-bold truncate">{prod.category} • {prod.brand || "Generic"}</p>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[36px] break-words">{prod.name}</h3>
                <p className="text-xs text-white/60 truncate">⭐ {prod.rating} • {prod.stock} in stock</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap"><span className="font-black text-amber-400">{naira(prod.price)}</span>{prod.oldPrice ? <span className="text-xs line-through text-white/40">{naira(prod.oldPrice)}</span> : null}</div>
              </div>
            </div>
            <div className="px-3 pb-3 flex gap-2 mt-auto min-w-0">
              <button onClick={() => p.openProduct(prod)} className="flex-1 bg-amber-400 text-black py-2 rounded-full text-xs font-black min-w-0 truncate">VIEW + CHOOSE</button>
              <button aria-label="Toggle wishlist" onClick={() => p.toggleWishlist(prod.id)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">{p.wishlist.includes(prod.id) ? "❤️" : "🤍"}</button>
            </div>
          </article>
        ))}
      </div>

      {p.selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => p.setSelected(null)}>
          <div className="bg-[#1E293B] w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto min-w-0" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between gap-2 min-w-0"><h2 className="font-black text-xl leading-tight break-words min-w-0">{p.selected.name}</h2><button onClick={() => p.setSelected(null)} className="shrink-0 w-8 h-8 rounded-full bg-white/10">✕</button></div>
            {isPhoto(p.selected.img) ? <img src={p.selected.img} alt={p.selected.name} className="w-full h-56 object-cover rounded-2xl my-3" /> : <div className="text-7xl text-center py-4 bg-white/5 rounded-2xl my-3">{p.selected.img}</div>}
            <p className="text-sm text-white/70 break-words">{p.selected.desc}</p>
            <p className="mt-2 font-black text-2xl text-amber-400 break-words">{naira(p.selected.price)}</p>
            <p className="mt-4 font-bold text-sm">Brand * {p.selBrand && <span className="text-amber-400">— {p.selBrand}</span>}</p>
            <div className="flex flex-wrap gap-2 mt-2">{(p.availableBrands.filter((b: string) => b !== "All Brands").length > 0 ? p.availableBrands.filter((b: string) => b !== "All Brands") : [p.selected.brand || "Generic"]).map((b: string) => (<button key={b} onClick={() => p.setSelBrand(b)} className={`px-4 py-2 rounded-full border text-sm font-bold max-w-full truncate ${p.selBrand === b ? "bg-white text-black" : "border-white/20 bg-white/5"}`}>{b}</button>))}</div>
            <p className="mt-4 font-bold text-sm">Size *</p>
            <div className="flex flex-wrap gap-2 mt-2">{(p.selected.sizes || []).map((s: string) => (<button key={s} onClick={() => p.setSelSize(s)} className={`px-4 py-2 rounded-full border text-sm font-bold ${p.selSize === s ? "bg-amber-400 text-black" : "border-white/20 bg-white/5"}`}>{s}</button>))}</div>
            <p className="mt-4 font-bold text-sm">Color * {p.selColor && <span className="text-amber-400">— {p.selColor}</span>}</p>
            <div className="flex flex-wrap gap-3 mt-2">{(p.selected.colors || []).map((c: string) => (<button key={c} onClick={() => p.setSelColor(c)} className="flex flex-col items-center gap-1 max-w-[64px]"><span className={`w-9 h-9 rounded-full border-2 shrink-0 ${p.selColor === c ? "border-amber-400 scale-110" : "border-white/20"}`} style={{ background: p.selected!.colorHex?.[c] || "#333" }} /><span className="text-[11px] text-center leading-tight break-words">{c}</span></button>))}</div>
            <div className="flex items-center gap-3 mt-5 flex-wrap"><span className="text-sm font-bold">Qty:</span><button onClick={() => p.setQty(Math.max(1, p.qty - 1))} className="w-8 h-8 bg-white/10 rounded-full">-</button><span className="font-black">{p.qty}</span><button onClick={() => p.setQty(Math.min(p.selected.stock, p.qty + 1))} className="w-8 h-8 bg-white/10 rounded-full">+</button><span className="ml-auto text-sm text-white/60">Stock: {p.selected.stock}</span></div>
            <button onClick={p.addToCart} className="w-full mt-5 bg-amber-400 text-black py-3.5 rounded-full font-black break-words">ADD TO CART — {naira(p.selected.price * p.qty)}</button>
            <p className="text-center text-xs text-white/50 mt-2">You must choose Brand + Size + Color before adding</p>
          </div>
        </div>
      )}

      {p.showCart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-end" onClick={() => p.setShowCart(false)}>
          <div className="bg-[#1E293B] w-full max-w-md h-full p-5 overflow-y-auto flex flex-col min-w-0" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center gap-2 min-w-0"><h2 className="font-black text-xl truncate">Your Cart ({cartCount})</h2><button onClick={() => p.setShowCart(false)} className="w-8 h-8 rounded-full bg-white/10 shrink-0">✕</button></div>
            {!p.user && <div className="mt-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 text-sm"><span>🔒 <b>Login required to checkout.</b></span><a href="/auth" className="block mt-2 bg-amber-400 text-black px-4 py-2 rounded-full text-xs font-bold text-center">Login / Sign Up</a></div>}
            <div className="mt-4 flex-1 space-y-3 min-w-0">
              {p.cart.length === 0 && <p className="text-white/60 text-sm text-center py-8">Your cart is empty.</p>}
              {p.cart.map((item, idx) => (
                <div key={`${item.id}-${item.brand}-${item.size}-${item.color}-${idx}`} className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 min-w-0">
                  {isPhoto(item.img) ? <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" /> : <span className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-3xl shrink-0">{item.img}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-white/50 truncate">{item.brand} • {item.size} • {item.color}</p>
                    <p className="text-sm font-black text-amber-400 mt-1">{naira(item.price)} × {item.qty} = {naira(item.price * item.qty)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => p.updateQty?.(idx, -1)} className="w-7 h-7 bg-white/10 rounded-full">-</button>
                      <span className="text-sm font-bold">{item.qty}</span>
                      <button onClick={() => p.updateQty?.(idx, 1)} className="w-7 h-7 bg-white/10 rounded-full">+</button>
                      <button onClick={() => p.removeFromCart(idx)} className="ml-auto text-xs text-red-400 shrink-0">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {p.cart.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex justify-between font-black"><span>Total</span><span className="text-amber-400">{naira(p.total)}</span></div>
                <button onClick={() => { p.setShowCart(false); p.goToCheckout?.(); }} className="w-full mt-3 bg-amber-400 text-black py-3.5 rounded-full font-black">Checkout → {naira(p.total)}</button>
                <button onClick={() => p.setChatOpen?.(true)} className="w-full mt-2 bg-white text-black py-3 rounded-full font-bold text-sm">💬 Live Chat</button>
              </div>
            )}
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-[#1E293B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          <div className="bg-amber-400 text-black px-4 py-3 flex justify-between items-center"><span className="font-black text-sm">💬 SwiftMart Support</span><button onClick={() => p.setChatOpen?.(false)} className="w-7 h-7 rounded-full bg-black/10">✕</button></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(p.chatMsgs || []).map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${m.from === "me" ? "ml-auto bg-amber-400 text-black" : "bg-white/10"}`}>{m.text}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="mx-3 mb-2 bg-green-500 text-white py-2.5 rounded-full text-sm font-bold text-center">📱 Continue on WhatsApp</a>
          <form onSubmit={e => { e.preventDefault(); if (chatInput.trim()) { p.sendChat?.(chatInput); setChatInput(""); } }} className="flex gap-2 p-3 border-t border-white/10">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type message..." className="flex-1 min-w-0 bg-white/10 rounded-full px-4 py-2.5 text-sm outline-none" />
            <button type="submit" className="bg-amber-400 text-black px-4 py-2.5 rounded-full text-sm font-black shrink-0">Send</button>
          </form>
        </div>
      )}

      {!chatOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col gap-2 items-end">
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg" aria-label="Chat on WhatsApp">📱</a>
          <button onClick={() => p.setChatOpen?.(true)} className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold shadow-lg">💬 Live Chat</button>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 pb-6 pt-4 border-t border-white/10 mt-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="min-w-0"><p className="font-black text-lg">🛒 SwiftMart</p><p className="text-xs text-white/50 break-words">Everything You Need. One Swift Store.</p></div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => p.setChatOpen?.(true)} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold">💬 Live Chat</button>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold">WhatsApp Us</a>
          </div>
        </div>
        <p className="text-[11px] text-white/30 mt-4 break-words">© 2026 SwiftMart. All rights reserved.</p>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0F172A] border-t border-white/10 flex justify-around py-3 text-xs z-30">
        <button onClick={() => p.setCat("All")} className="text-amber-400 font-bold shrink-0">🏠 Home</button>
        <button onClick={() => p.setCat("Cars")} className="shrink-0">🚗 Cars</button>
        <button onClick={() => p.setCat("TVs")} className="shrink-0">📺 TVs</button>
        <button onClick={() => p.setShowCart(true)} className="shrink-0 whitespace-nowrap">🛒 Cart ({cartCount})</button>
        {p.user ? <button onClick={() => setShowProfile(v => !v)} className="truncate max-w-[80px] shrink-0">👤 {firstName}</button> : <button onClick={() => window.location.href = "/auth"} className="shrink-0">👤 Account</button>}
      </div>
    </div>
  );
}