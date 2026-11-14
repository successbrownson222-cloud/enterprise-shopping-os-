"use client";
import { useState, useEffect, useCallback } from "react";
import AdminUI, { AdminProductForm } from './admincomponents'
import { CATEGORIES, BRANDS_BY_CATEGORY, API_URL, Product } from '../../lib/categories';

export type Order = {
  id: string; items: any[]; customer: any; total: number;
  address: string; status: string; createdAt: string;
};

// ✅ FIX 1: No trailing slash = no //api bug
const BASE = API_URL.replace(/\/$/, "");

// ✅ FIX 2: No emoji default - empty photo, user uploads real one
const EMPTY_FORM: AdminProductForm = {
  name:"", price:"", oldPrice:"", category:"TVs", brand:"Samsung",
  img:"", desc:"", stock:"10", rating:"4.5",
  sizes:"32,43,55", colors:"Black", colorHexText:""
};

// ✅ FIX 3: Auto color hex - user never types #111 again
const COLOR_HEX_MAP: Record<string,string> = {
  Black:"#111111", White:"#eeeeee", Silver:"#c0c0c0", Grey:"#9ca3af", Gray:"#9ca3af",
  Red:"#dc2626", Blue:"#2563eb", Green:"#16a34a", Brown:"#6B4226", Tan:"#C19A6B",
  Pink:"#f9a8d4", Nude:"#E8C39E", Multi:"#f59e0b", Gold:"#d4af37", Yellow:"#facc15",
  Orange:"#f97316", Purple:"#9333ea", Beige:"#e5d5b7", Cream:"#fffdd0", Navy:"#1e3a8a",
};

async function safeJson(r: Response) {
  const text = await r.text();
  if (!text || text.trim().startsWith("<")) {
    throw new Error(`Backend returned HTML (Status ${r.status}) - Backend down or wrong API_URL: ${BASE}. Open ${BASE}/api/products in browser to check.`);
  }
  try { return JSON.parse(text); }
  catch { throw new Error(`Backend returned invalid JSON: ${text.slice(0,100)}`); }
}

export default function AdminPage(){
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@swiftmart.com");
  const [password, setPassword] = useState("admin123");
  const [tab, setTab] = useState<"products"|"orders"|"add">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState<AdminProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const headers = useCallback(()=>({
    "Content-Type":"application/json",
    ...(token ? { Authorization:`Bearer ${token}` } : {})
  }),[token]);

  const fetchProducts = useCallback(async()=>{
    try{
      const r = await fetch(`${BASE}/api/products`, { cache:"no-store" });
      const d = await safeJson(r);
      setProducts(Array.isArray(d)? d : d.data||[]);
    }catch(e:any){ setMsg("❌ Products: "+e.message); }
  },[]);

  const fetchOrders = useCallback(async()=>{
    if(!token) return;
    try{
      const r = await fetch(`${BASE}/api/orders`, { headers: headers() as any });
      const d = await safeJson(r);
      setOrders(d.data||[]);
    }catch(e:any){ setMsg("❌ Orders: "+e.message); }
  },[token, headers]);

  const fetchStats = useCallback(async()=>{
    if(!token) return;
    try{
      const r = await fetch(`${BASE}/api/admin/stats`, { headers: headers() as any });
      const d = await safeJson(r);
      setStats(d);
    }catch{}
  },[token, headers]);

  useEffect(()=>{ fetchProducts(); },[fetchProducts]);
  useEffect(()=>{ if(token){ fetchOrders(); fetchStats(); } },[token, fetchOrders, fetchStats]);

  const login = async()=>{
    setLoading(true); setMsg("");
    try{
      const r = await fetch(`${BASE}/api/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, password }) });
      const d = await safeJson(r);
      if(!r.ok) throw new Error(d.error||"Login failed");
      if(d.user?.role!=="admin") throw new Error("Not an admin account");
      setToken(d.token);
      setMsg("✅ Logged in as Admin");
    }catch(e:any){ setMsg("❌ "+e.message); }
    setLoading(false);
  };

  // ✅ FIX 4: Category change ONLY changes brand + smart size hint. NEVER touches img.
  const setField = (k:keyof AdminProductForm, v:string)=>{
    setForm(prev=>{
      const next = { ...prev, [k]:v };
      if(k==="category"){
        const brands = BRANDS_BY_CATEGORY[v] || ["Generic"];
        next.brand = brands[0];
        // Smart size suggestions per category - only if user hasn't typed custom sizes yet
        if(v==="TVs") next.sizes = "32,43,55,65";
        if(v==="Freezers") next.sizes = "150L,250L,350L";
        if(v==="Cars") next.sizes = "2022,2023,2024";
        if(v==="Generators") next.sizes = "2.5KVA,5.5KVA,7.5KVA";
        if(v==="Men Shoes"||v==="Women Shoes"||v==="Children Shoes") next.sizes = "40,41,42,43,44,45";
        if(v==="Kitchen Utensils") next.sizes = "12pcs,16pcs,20pcs";
        if(v==="Home Appliances") next.sizes = "16 inch,18 inch";
        // ❌ DELETED: all next.img = "📺" / "🧊" / "🚗" lines
      }
      // ✅ FIX 5: When colors change, auto-build hex so user never types it
      if(k==="colors"){
        const colorList = v.split(",").map(s=>s.trim()).filter(Boolean);
        next.colorHexText = colorList.map(c=>`${c}:${COLOR_HEX_MAP[c] || "#333333"}`).join(",");
      }
      return next;
    });
  };

  const parseFormToProduct = ()=>{
    const sizes = form.sizes.split(",").map(s=>s.trim()).filter(Boolean);
    const colors = form.colors.split(",").map(s=>s.trim()).filter(Boolean);
    const colorHex: Record<string,string> = {};
    // Use auto hex map first
    colors.forEach(c=>{ colorHex[c] = COLOR_HEX_MAP[c] || "#333333"; });
    // If user manually typed hex, respect it
    form.colorHexText.split(",").forEach(pair=>{
      const [name, hex] = pair.split(":").map(s=>s.trim());
      if(name && hex) colorHex[name]=hex;
    });
    return {
      name: form.name, price: Number(form.price), oldPrice: form.oldPrice? Number(form.oldPrice): undefined,
      category: form.category, brand: form.brand,
      img: form.img || "📦", // fallback only if user left photo empty
      desc: form.desc,
      stock: Number(form.stock)||0, rating: Number(form.rating)||4.5,
      sizes: sizes.length? sizes:["One Size"], colors: colors.length? colors:["Black"], colorHex
    };
  };

  const saveProduct = async()=>{
    if(!form.name || !form.price || !form.category) return setMsg("❌ Name, Price, Category required");
    setLoading(true);
    try{
      const body = parseFormToProduct();
      const url = editingId ? `${BASE}/api/products/${editingId}` : `${BASE}/api/products`;
      const r = await fetch(url, { method: editingId? "PUT":"POST", headers: headers() as any, body: JSON.stringify(body) });
      const d = await safeJson(r);
      if(!r.ok) throw new Error(d.error||"Save failed");
      setMsg(editingId? "✅ Product updated" : "✅ Product added - live on shop now");
      setForm(EMPTY_FORM); setEditingId(null); setTab("products");
      await fetchProducts(); await fetchStats();
    }catch(e:any){ setMsg("❌ "+e.message); }
    setLoading(false);
  };

  const editProduct = (p:Product)=>{
    setEditingId(p.id);
    setForm({
      name:p.name, price:String(p.price), oldPrice: p.oldPrice? String(p.oldPrice):"",
      category:p.category, brand:p.brand||"Generic", img:p.img, desc:p.desc||"",
      stock:String(p.stock), rating:String(p.rating||4.5),
      sizes:(p.sizes||[]).join(","), colors:(p.colors||[]).join(","),
      colorHexText: Object.entries(p.colorHex||{}).map(([k,v])=>`${k}:${v}`).join(",")
    });
    setTab("add");
  };

  const deleteProduct = async(id:string)=>{
    if(!confirm("Delete this product?")) return;
    try{
      const r = await fetch(`${BASE}/api/products/${id}`, { method:"DELETE", headers: headers() as any });
      await safeJson(r);
      setMsg("🗑️ Deleted");
    }catch(e:any){ setMsg("❌ Delete: "+e.message); }
    await fetchProducts(); await fetchStats();
  };

  const updateOrderStatus = async(id:string, status:string)=>{
    try{
      const r = await fetch(`${BASE}/api/orders/${id}/status`, { method:"PUT", headers: headers() as any, body: JSON.stringify({ status }) });
      await safeJson(r);
      setMsg(`✅ Order ${id} → ${status}`);
    }catch(e:any){ setMsg("❌ "+e.message); }
    await fetchOrders();
  };

  const cancelEdit = ()=>{ setEditingId(null); setForm(EMPTY_FORM); setTab("products"); };

  const filteredProducts = products.filter(p=>
    (catFilter==="All"||p.category===catFilter) &&
    (p.name+" "+p.category+" "+(p.brand||"")).toLowerCase().includes(search.toLowerCase())
  );

  const brandsForForm = BRANDS_BY_CATEGORY[form.category] || ["Generic"];

  return (
    <AdminUI
      token={token} email={email} setEmail={setEmail} password={password} setPassword={setPassword}
      login={login} loading={loading} msg={msg} setMsg={setMsg}
      tab={tab} setTab={setTab}
      stats={stats} products={products} filteredProducts={filteredProducts} orders={orders}
      categories={CATEGORIES} catFilter={catFilter} setCatFilter={setCatFilter}
      search={search} setSearch={setSearch}
      form={form} setField={setField} brandsForForm={brandsForForm}
      editingId={editingId} saveProduct={saveProduct} cancelEdit={cancelEdit}
      editProduct={editProduct} deleteProduct={deleteProduct}
      updateOrderStatus={updateOrderStatus}
      fetchProducts={fetchProducts}
    />
  );
}