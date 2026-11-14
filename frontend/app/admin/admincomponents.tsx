"use client";
import type { Product } from "../../lib/categories";
import type { Order } from "./page";

export type AdminProductForm = {
  name:string; price:string; oldPrice:string; category:string; brand:string;
  img:string; desc:string; stock:string; rating:string;
  sizes:string; colors:string; colorHexText:string;
};

type Props = {
  token:string; email:string; setEmail:(v:string)=>void; password:string; setPassword:(v:string)=>void;
  login:()=>void; loading:boolean; msg:string; setMsg:(v:string)=>void;
  tab:"products"|"orders"|"add"; setTab:(v:any)=>void;
  stats:any; products:Product[]; filteredProducts:Product[]; orders:Order[];
  categories:string[]; catFilter:string; setCatFilter:(v:string)=>void;
  search:string; setSearch:(v:string)=>void;
  form:AdminProductForm; setField:(k:keyof AdminProductForm,v:string)=>void; brandsForForm:string[];
  editingId:string|null; saveProduct:()=>void; cancelEdit:()=>void;
  editProduct:(p:Product)=>void; deleteProduct:(id:string)=>void;
  updateOrderStatus:(id:string,status:string)=>void; fetchProducts:()=>void;
};

const ORDER_STATUSES = ["Ordered","Processing","Shipped","Delivered","Cancelled"];

// ✅ Is this a real photo URL or just an emoji?
const isPhoto = (img:string) => img?.startsWith("http") || img?.startsWith("data:image") || img?.startsWith("/");

function ProductImage({ img, name, size = "w-16 h-16" }: { img:string; name:string; size?:string }) {
  if (isPhoto(img)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img} alt={name} className={`${size} object-cover rounded-2xl bg-white/10 shrink-0`} />;
  }
  return <div className={`${size} flex items-center justify-center text-4xl bg-white/10 rounded-2xl shrink-0`}>{img || "📦"}</div>;
}

export default function AdminUI(p:Props){
  if(!p.token){
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full max-w-md">
          <h1 className="text-2xl font-black">🛒 SwiftMart <span className="text-amber-400">Admin</span></h1>
          <p className="text-sm text-white/60 mt-1">Manage products and orders.</p>
          <input value={p.email} onChange={e=>p.setEmail(e.target.value)} placeholder="Admin email" className="w-full mt-4 bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
          <input value={p.password} onChange={e=>p.setPassword(e.target.value)} type="password" placeholder="Password" onKeyDown={e=>{if(e.key==="Enter") p.login()}} className="w-full mt-3 bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
          <button onClick={p.login} disabled={p.loading} className="w-full mt-4 bg-amber-400 text-black py-3 rounded-full font-black">{p.loading?"Logging in...":"LOGIN"}</button>
          {p.msg && <p className="mt-3 text-sm text-center">{p.msg}</p>}
          <p className="text-xs text-white/40 text-center mt-3">Default: admin@swiftmart.com / admin123</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => p.setField("img", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-10">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 border-b border-white/10 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xl font-black">🛒 Swift<span className="text-amber-400">Mart</span> <span className="text-xs bg-amber-400 text-black px-2 py-1 rounded-full ml-2">ADMIN</span></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>p.setTab("products")} className={`px-4 py-2 rounded-full text-sm font-bold ${p.tab==="products"?"bg-amber-400 text-black":"bg-white/10"}`}>Products ({p.products.length})</button>
          <button onClick={()=>p.setTab("orders")} className={`px-4 py-2 rounded-full text-sm font-bold ${p.tab==="orders"?"bg-amber-400 text-black":"bg-white/10"}`}>Orders ({p.orders.length})</button>
          <button onClick={()=>{p.cancelEdit(); p.setTab("add");}} className={`px-4 py-2 rounded-full text-sm font-bold ${p.tab==="add"?"bg-amber-400 text-black":"bg-white/10"}`}>+ Add Product</button>
          <button onClick={()=>window.location.href="/"} className="px-4 py-2 rounded-full text-sm bg-white/10">View Shop →</button>
        </div>
      </header>

      {p.msg && <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm">{p.msg}</div>}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mt-4">
        <div className="bg-white/5 rounded-2xl p-4"><p className="text-xs text-white/60">Total Products</p><p className="text-2xl font-black text-amber-400">{p.stats?.totalProducts ?? p.products.length}</p></div>
        <div className="bg-white/5 rounded-2xl p-4"><p className="text-xs text-white/60">Total Orders</p><p className="text-2xl font-black">{p.stats?.totalOrders ?? p.orders.length}</p></div>
        <div className="bg-white/5 rounded-2xl p-4"><p className="text-xs text-white/60">Revenue</p><p className="text-2xl font-black text-green-400">₦{(p.stats?.revenue ?? 0).toLocaleString()}</p></div>
        <div className="bg-white/5 rounded-2xl p-4"><p className="text-xs text-white/60">Low Stock</p><p className="text-2xl font-black text-red-400">{p.stats?.lowStock?.length ?? p.products.filter(x=>x.stock<5).length}</p></div>
      </div>

      {/* PRODUCTS TAB */}
      {p.tab==="products" && (
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Search name, brand, category..." className="flex-1 min-w-[200px] bg-white/10 rounded-full px-4 py-2 text-sm outline-none" />
            <select value={p.catFilter} onChange={e=>p.setCatFilter(e.target.value)} className="bg-white/10 rounded-full px-4 py-2 text-sm outline-none">
              {p.categories.map(c=><option key={c} value={c} className="text-black">{c}</option>)}
            </select>
            <button onClick={p.fetchProducts} className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold">↻ Refresh</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {p.filteredProducts.map(prod=>(
              <div key={prod.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex gap-3">
                <ProductImage img={prod.img} name={prod.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-amber-400 font-bold">{prod.category} • {prod.brand || "Generic"}</p>
                  <p className="font-bold text-sm leading-tight">{prod.name}</p>
                  <p className="text-xs text-white/60">₦{prod.price.toLocaleString()} • Stock: {prod.stock} • ⭐ {prod.rating}</p>
                  <p className="text-xs text-white/60 truncate">Sizes: {(prod.sizes||[]).join(", ")} | Colors: {(prod.colors||[]).join(", ")}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>p.editProduct(prod)} className="bg-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-bold">Edit</button>
                    <button onClick={()=>p.deleteProduct(prod.id)} className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {p.filteredProducts.length===0 && <p className="text-white/50 py-10 text-center col-span-full">No products found. Click + Add Product.</p>}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {p.tab==="orders" && (
        <div className="px-4 py-4 space-y-3">
          {p.orders.map(o=>(
            <div key={o.id} className="bg-white/5 rounded-3xl p-4">
              <div className="flex justify-between flex-wrap gap-2"><p className="font-bold">{o.id}</p><span className="bg-amber-400 text-black px-3 py-1 rounded-full text-xs font-bold">{o.status}</span></div>
              <p className="text-sm text-white/70 mt-1">{o.customer?.name} • {o.customer?.phone} • {o.address}</p>
              <p className="text-xs text-white/50">{new Date(o.createdAt).toLocaleString()} • Total: <span className="text-amber-400 font-black">₦{o.total.toLocaleString()}</span></p>
              <p className="text-xs text-white/60 mt-1">{o.items.map((it:any)=>`${it.name} (${it.brand||""} / ${it.size||""} / ${it.color||""} x${it.qty})`).join(" • ")}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {ORDER_STATUSES.map(s=>(
                  <button key={s} onClick={()=>p.updateOrderStatus(o.id,s)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${o.status===s?"bg-white text-black":"bg-white/10"}`}>{s}</button>
                ))}
              </div>
            </div>
          ))}
          {p.orders.length===0 && <p className="text-white/50 text-center py-10">No orders yet.</p>}
        </div>
      )}

      {/* ADD / EDIT TAB - CLEANED */}
      {p.tab==="add" && (
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <h2 className="font-black text-xl">{p.editingId? "Edit Product" : "Add New Product"}</h2>
          <p className="text-xs text-white/50 mt-1">Fill all fields — this is exactly what customers will see in the shop.</p>

          {/* 1. BASIC INFO */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
            <p className="font-bold text-sm text-amber-400">1. Basic Info</p>
            <label className="block text-xs font-bold mt-4 mb-1">Product Name *</label>
            <input value={p.form.name} onChange={e=>p.setField("name", e.target.value)} placeholder="e.g. Samsung 55 inch Smart TV" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
            <p className="text-[11px] text-white/40 mt-1">Use the full name customers search for. Include size if needed.</p>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold mt-4 mb-1">Price (₦) *</label><input value={p.form.price} onChange={e=>p.setField("price", e.target.value)} type="number" placeholder="385000" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" /><p className="text-[11px] text-white/40 mt-1">Selling price, no commas.</p></div>
              <div><label className="block text-xs font-bold mt-4 mb-1">Old Price (₦) — Optional</label><input value={p.form.oldPrice} onChange={e=>p.setField("oldPrice", e.target.value)} type="number" placeholder="480000" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" /><p className="text-[11px] text-white/40 mt-1">Leave empty if no discount. Shows as strikethrough.</p></div>
            </div>

            <label className="block text-xs font-bold mt-4 mb-1">Description *</label>
            <textarea value={p.form.desc} onChange={e=>p.setField("desc", e.target.value)} placeholder="e.g. 4K Ultra HD, Netflix & YouTube built-in, WiFi, 1 year warranty. Delivery in Lagos in 24hrs." className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none h-20" />
            <p className="text-[11px] text-white/40 mt-1">Write like you are telling a customer in the shop. Features + warranty + delivery.</p>
          </div>

          {/* 2. CATEGORY & BRAND */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-3">
            <p className="font-bold text-sm text-amber-400">2. Category & Brand</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mt-4 mb-1">Category *</label>
                <select value={p.form.category} onChange={e=>p.setField("category", e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                  {p.categories.filter(c=>c!=="All").map(c=><option key={c} value={c} className="text-black">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mt-4 mb-1">Brand *</label>
                <select value={p.form.brand} onChange={e=>p.setField("brand", e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                  {p.brandsForForm.map(b=><option key={b} value={b} className="text-black">{b}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-2">Brand list changes automatically when you change Category.</p>
          </div>

          {/* 3. PHOTO - NEW, NO EMOJI */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-3">
            <p className="font-bold text-sm text-amber-400">3. Product Photo *</p>
            <div className="flex gap-3 mt-4 items-start">
              <ProductImage img={p.form.img} name="Preview" size="w-24 h-24" />
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Paste Image Link</label>
                <input value={isPhoto(p.form.img) ? p.form.img : ""} onChange={e=>p.setField("img", e.target.value)} placeholder="https://.../your-product-photo.jpg" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
                <p className="text-[11px] text-white/40 mt-1">Tip: Upload photo to your phone gallery → copy link, or use Upload below.</p>
                <label className="inline-block mt-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold cursor-pointer">📸 Upload Photo from Phone
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {p.form.img && !isPhoto(p.form.img) && <p className="text-[11px] text-amber-400 mt-2">Old emoji detected: {p.form.img} — replace it with a real photo above.</p>}
              </div>
            </div>
          </div>

          {/* 4. STOCK / SIZES / COLORS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-3">
            <p className="font-bold text-sm text-amber-400">4. Stock, Sizes & Colors</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold mt-4 mb-1">Stock *</label><input value={p.form.stock} onChange={e=>p.setField("stock", e.target.value)} type="number" placeholder="10" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" /><p className="text-[11px] text-white/40 mt-1">How many you have in store.</p></div>
              <div><label className="block text-xs font-bold mt-4 mb-1">Rating (1 - 5)</label><input value={p.form.rating} onChange={e=>p.setField("rating", e.target.value)} type="number" step="0.1" min="1" max="5" placeholder="4.5" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" /><p className="text-[11px] text-white/40 mt-1">Leave 4.5 if new product.</p></div>
            </div>

            <label className="block text-xs font-bold mt-4 mb-1">Sizes *</label>
            <input value={p.form.sizes} onChange={e=>p.setField("sizes", e.target.value)} placeholder='e.g. 32, 43, 55' className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
            <p className="text-[11px] text-white/40 mt-1">Separate with comma. TVs: 32, 43, 55 • Shoes: 40, 41, 42 • Freezers: 150L, 250L • Cars: 2022, 2023</p>

            <label className="block text-xs font-bold mt-4 mb-1">Colors *</label>
            <input value={p.form.colors} onChange={e=>p.setField("colors", e.target.value)} placeholder="Black, White, Silver" className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
            <p className="text-[11px] text-white/40 mt-1">Separate with comma. Customers will pick from this list. Hex codes are auto-filled.</p>

            {/* Hidden but kept for compatibility - auto from colors */}
            <input type="hidden" value={p.form.colorHexText} readOnly />
          </div>

          {/* LIVE PREVIEW */}
          <div className="bg-white text-black rounded-2xl p-4 mt-3">
            <p className="text-[11px] font-bold text-slate-500">LIVE PREVIEW — What customer will see:</p>
            <div className="flex gap-3 mt-2">
              <ProductImage img={p.form.img} name={p.form.name} />
              <div>
                <p className="font-bold text-sm leading-tight">{p.form.name || "Product Name..."}</p>
                <p className="text-xs text-slate-500">{p.form.category} • {p.form.brand}</p>
                <p className="text-sm font-black text-amber-600">₦{Number(p.form.price||0).toLocaleString()} {p.form.oldPrice && <span className="line-through text-slate-400 text-xs font-normal">₦{Number(p.form.oldPrice).toLocaleString()}</span>}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{p.form.desc || "Your description will show here..."}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={p.saveProduct} disabled={p.loading} className="flex-1 bg-amber-400 text-black py-3.5 rounded-full font-black">{p.loading?"Saving...": p.editingId? "UPDATE PRODUCT" : "ADD PRODUCT → LIVE"}</button>
            <button onClick={p.cancelEdit} className="px-5 py-3.5 bg-white/10 rounded-full font-bold">Cancel</button>
          </div>
          <p className="text-center text-xs text-white/40 mt-2">After save, product appears in the shop instantly.</p>
        </div>
      )}
    </div>
  );
}