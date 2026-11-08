"use client";
import type { Product } from "./page";

type Props = {
  cat: string; setCat: (v:string)=>void;
  q: string; setQ: (v:string)=>void;
  categories: string[]; filtered: Product[];
  selected: Product|null; setSelected: (v:any)=>void; openProduct: (p:Product)=>void;
  selSize: string; setSelSize: (v:string)=>void;
  selColor: string; setSelColor: (v:string)=>void;
  qty: number; setQty: (v:number)=>void;
  cart: any[]; total: number; addToCart: ()=>void; removeFromCart: (i:number)=>void;
  wishlist: string[]; toggleWishlist: (id:string)=>void;
  showCart: boolean; setShowCart: (v:boolean)=>void;
};

export default function SwiftMartUI(p: Props) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="text-2xl font-black">🛒 <span className="text-amber-400">Swift</span>Mart</div>
        <input value={p.q} onChange={e=>p.setQ(e.target.value)} placeholder="Search shoes, cars, TV, generator..." className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm outline-none placeholder:text-white/50" />
        <button onClick={()=>p.setShowCart(true)} className="relative bg-amber-400 text-black font-bold px-4 py-2 rounded-full">Cart 🛒 {p.cart.length>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{p.cart.length}</span>}</button>
      </header>

      {/* HERO */}
      <div className="mx-4 mt-4 rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 text-black p-5 md:p-8 flex justify-between items-center">
        <div><p className="text-xs font-bold tracking-widest">FLASH SALE • TODAY ONLY</p><h1 className="text-3xl md:text-5xl font-black leading-tight">Everything You Need.<br/>One Swift Store.</h1><p className="mt-2 text-sm font-medium">Shoes • Clothes • Cars • TVs • Generators • Freezers</p><button onClick={()=>p.setCat("All")} className="mt-4 bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm">Shop Now →</button></div>
        <div className="text-6xl md:text-8xl">🛍️</div>
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {p.categories.map(c=>(
          <button key={c} onClick={()=>p.setCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold ${p.cat===c?"bg-amber-400 text-black":"bg-white/10"}`}>{c}</button>
        ))}
      </div>

      {/* GRID */}
      <div className="px-4 pb-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {p.filtered.map(prod=>(
          <div key={prod.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div onClick={()=>p.openProduct(prod)} className="cursor-pointer">
              <div className="text-6xl md:text-7xl h-32 md:h-40 flex items-center justify-center bg-white/5">{prod.img}</div>
              <div className="p-3">
                <p className="text-[11px] text-amber-400 font-bold">{prod.category}</p>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[36px]">{prod.name}</h3>
                <p className="text-xs text-white/60">⭐ {prod.rating} • {prod.stock} in stock • Sizes: {prod.sizes.slice(0,3).join(", ")}...</p>
                <div className="flex items-center gap-2 mt-1"><span className="font-black text-amber-400">₦{prod.price.toLocaleString()}</span>{prod.oldPrice && <span className="text-xs line-through text-white/40">₦{prod.oldPrice.toLocaleString()}</span>}</div>
              </div>
            </div>
            <div className="px-3 pb-3 flex gap-2">
              <button onClick={()=>p.openProduct(prod)} className="flex-1 bg-amber-400 text-black py-2 rounded-full text-xs font-black">VIEW + CHOOSE SIZE</button>
              <button onClick={()=>p.toggleWishlist(prod.id)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">{p.wishlist.includes(prod.id)?"❤️":"🤍"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT MODAL - SIZE & COLOR */}
      {p.selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4" onClick={()=>p.setSelected(null)}>
          <div className="bg-[#1E293B] w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between"><h2 className="font-black text-xl">{p.selected.name}</h2><button onClick={()=>p.setSelected(null)}>✕</button></div>
            <div className="text-7xl text-center py-4 bg-white/5 rounded-2xl my-3">{p.selected.img}</div>
            <p className="text-sm text-white/70">{p.selected.desc}</p>
            <p className="mt-2 font-black text-2xl text-amber-400">₦{p.selected.price.toLocaleString()} {p.selected.oldPrice && <span className="text-sm line-through text-white/40">₦{p.selected.oldPrice.toLocaleString()}</span>}</p>

            <p className="mt-4 font-bold text-sm">Select Size {p.selected.category==="Cars"?"(Year)":p.selected.category==="TVs"?"(Inches)":""} <span className="text-red-400">*</span></p>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.selected.sizes.map(s=>(
                <button key={s} onClick={()=>p.setSelSize(s)} className={`px-4 py-2 rounded-full border text-sm font-bold ${p.selSize===s?"bg-amber-400 text-black border-amber-400":"border-white/20 bg-white/5"}`}>{s}</button>
              ))}
            </div>

            <p className="mt-4 font-bold text-sm">Select Color <span className="text-red-400">*</span> {p.selColor && <span className="text-amber-400">— {p.selColor}</span>}</p>
            <div className="flex gap-3 mt-2">
              {p.selected.colors.map(c=>(
                <button key={c} onClick={()=>p.setSelColor(c)} className="flex flex-col items-center gap-1">
                  <span className={`w-9 h-9 rounded-full border-2 ${p.selColor===c?"border-amber-400 scale-110":"border-white/20"}`} style={{background: p.selected!.colorHex[c]||"#333"}} />
                  <span className="text-[11px]">{c}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-5">
              <span className="text-sm font-bold">Qty:</span>
              <button onClick={()=>p.setQty(Math.max(1,p.qty-1))} className="w-8 h-8 bg-white/10 rounded-full">-</button>
              <span className="font-black">{p.qty}</span>
              <button onClick={()=>p.setQty(p.qty+1)} className="w-8 h-8 bg-white/10 rounded-full">+</button>
              <span className="ml-auto text-sm text-white/60">Stock: {p.selected.stock}</span>
            </div>

            <button onClick={p.addToCart} className="w-full mt-5 bg-amber-400 text-black py-3.5 rounded-full font-black">ADD TO CART — ₦{(p.selected.price*p.qty).toLocaleString()} • {p.selSize||"Choose Size"} • {p.selColor}</button>
            <p className="text-center text-xs text-white/50 mt-2">You must choose Size + Color before adding</p>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {p.showCart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-end" onClick={()=>p.setShowCart(false)}>
          <div className="bg-[#1E293B] w-full max-w-md h-full p-5 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between"><h2 className="font-black text-xl">Your Cart ({p.cart.length})</h2><button onClick={()=>p.setShowCart(false)}>✕</button></div>
            {p.cart.length===0 && <p className="mt-6 text-white/60 text-center">Cart is empty. Tap a product → Choose Size + Color → Add.</p>}
            {p.cart.map((c,i)=>(
              <div key={i} className="flex gap-3 bg-white/5 rounded-2xl p-3 mt-3">
                <div className="text-4xl">{c.img}</div>
                <div className="flex-1"><p className="font-bold text-sm">{c.name}</p><p className="text-xs text-amber-400">Size: {c.size} • Color: {c.color} • Qty: {c.qty}</p><p className="font-black">₦{(c.price*c.qty).toLocaleString()}</p></div>
                <button onClick={()=>p.removeFromCart(i)} className="text-red-400">🗑️</button>
              </div>
            ))}
            {p.cart.length>0 && <><div className="flex justify-between mt-5 font-black text-lg"><span>Total</span><span className="text-amber-400">₦{p.total.toLocaleString()}</span></div><button className="w-full mt-3 bg-amber-400 text-black py-3 rounded-full font-black">CHECKOUT →</button></>}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0F172A] border-t border-white/10 flex justify-around py-3 text-xs">
        <button className="text-amber-400 font-bold">🏠 Home</button><button onClick={()=>p.setCat("Cars")}>🚗 Cars</button><button onClick={()=>p.setCat("TVs")}>📺 TVs</button><button onClick={()=>p.setShowCart(true)}>🛒 Cart ({p.cart.length})</button><button>👤 Account</button>
      </div>
    </div>
  );
} 