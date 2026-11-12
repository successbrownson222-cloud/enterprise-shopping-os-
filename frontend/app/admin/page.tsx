"use client";
import { useState, useEffect, useCallback } from "react";
import AdminUI, { AdminProductForm } from '../components'
import { CATEGORIES,BRANDS_BY_CATEGORY, Product } from '../../lib/categories';

const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com";

export type Order = {
  id: string; items: any[]; customer: any; total: number;
  address: string; status: string; createdAt: string;
};

const EMPTY_FORM: AdminProductForm = {
  name:"", price:"", oldPrice:"", category:"TVs", brand:"Samsung",
  img:"📺", desc:"", stock:"10", rating:"4.5",
  sizes:"32\",43\",55\"", colors:"Black", colorHexText:"Black:#111"
};

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
      const r = await fetch(`${API_URL}/api/products`, { cache:"no-store" });
      const d = await r.json();
      setProducts(Array.isArray(d)? d : d.data||[]);
    }catch{}
  },[]);

  const fetchOrders = useCallback(async()=>{
    if(!token) return;
    try{
      const r = await fetch(`${API_URL}/api/orders`, { headers: headers() as any });
      const d = await r.json();
      setOrders(d.data||[]);
    }catch{}
  },[token, headers]);

  const fetchStats = useCallback(async()=>{
    if(!token) return;
    try{
      const r = await fetch(`${API_URL}/api/admin/stats`, { headers: headers() as any });
      const d = await r.json();
      setStats(d);
    }catch{}
  },[token, headers]);

  useEffect(()=>{ fetchProducts(); },[fetchProducts]);
  useEffect(()=>{ if(token){ fetchOrders(); fetchStats(); } },[token, fetchOrders, fetchStats]);

  const login = async()=>{
    setLoading(true); setMsg("");
    try{
      const r = await fetch(`${API_URL}/api/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||"Login failed");
      if(d.user?.role!=="admin") throw new Error("Not an admin account");
      setToken(d.token);
      setMsg("✅ Logged in as Admin");
    }catch(e:any){ setMsg("❌ "+e.message); }
    setLoading(false);
  };

  const setField = (k:keyof AdminProductForm, v:string)=>{
    setForm(prev=>{
      const next = { ...prev, [k]:v };
      // ✅ When category changes, auto-set first brand + default emoji
      if(k==="category"){
        const brands = BRANDS_BY_CATEGORY[v] || ["Generic"];
        next.brand = brands[0];
        if(v==="TVs") next.img="📺";
        if(v==="Freezers") next.img="🧊";
        if(v==="Cars") next.img="🚗";
        if(v==="Generators") next.img="⚡";
        if(v==="Men Shoes"||v==="Women Shoes"||v==="Children Shoes") next.img="👟";
        if(v==="Kitchen Utensils") next.img="🍳";
        if(v==="Home Appliances") next.img="🌀";
      }
      return next;
    });
  };

  const parseFormToProduct = ()=>{
    const sizes = form.sizes.split(",").map(s=>s.trim()).filter(Boolean);
    const colors = form.colors.split(",").map(s=>s.trim()).filter(Boolean);
    const colorHex: Record<string,string> = {};
    form.colorHexText.split(",").forEach(pair=>{
      const [name, hex] = pair.split(":").map(s=>s.trim());
      if(name && hex) colorHex[name]=hex;
    });
    colors.forEach(c=>{ if(!colorHex[c]) colorHex[c]="#333"; });
    return {
      name: form.name, price: Number(form.price), oldPrice: form.oldPrice? Number(form.oldPrice): undefined,
      category: form.category, brand: form.brand, img: form.img, desc: form.desc,
      stock: Number(form.stock)||0, rating: Number(form.rating)||4.5,
      sizes: sizes.length? sizes:["One Size"], colors: colors.length? colors:["Black"], colorHex
    };
  };

  const saveProduct = async()=>{
    if(!form.name || !form.price || !form.category) return setMsg("❌ Name, Price, Category required");
    setLoading(true);
    try{
      const body = parseFormToProduct();
      const url = editingId ? `${API_URL}/api/products/${editingId}` : `${API_URL}/api/products`;
      const r = await fetch(url, { method: editingId? "PUT":"POST", headers: headers() as any, body: JSON.stringify(body) });
      const d = await r.json();
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
    await fetch(`${API_URL}/api/products/${id}`, { method:"DELETE", headers: headers() as any });
    setMsg("🗑️ Deleted");
    await fetchProducts(); await fetchStats();
  };

  const updateOrderStatus = async(id:string, status:string)=>{
    await fetch(`${API_URL}/api/orders/${id}/status`, { method:"PUT", headers: headers() as any, body: JSON.stringify({ status }) });
    setMsg(`✅ Order ${id} → ${status}`);
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