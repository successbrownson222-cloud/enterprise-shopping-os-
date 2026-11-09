"use client";
import { useState, useMemo, useEffect } from "react";
import { io } from "socket.io-client";
import SwiftMartUI from "./components";

export type Product = {
  id: string; name: string; price: number; oldPrice?: number; category: string;
  brand: string; // ✅ NEW: Samsung, LG, Hisense, Toyota, Nike...
  img: string; rating: number; stock: number; desc: string;
  sizes: string[]; colors: string[]; colorHex: Record<string,string>;
};

export const CATEGORIES = [
  "All", "Men Shoes", "Women Shoes", "Men Clothes", "Women Clothes",
  "Children Clothes", "Children Shoes", "Cars", "TVs", "Freezers",
  "Kitchen Utensils", "Generators", "Home Appliances"
];

// ✅ BRAND / TYPE per Category
export const BRANDS_BY_CATEGORY: Record<string, string[]> = {
  "Men Shoes": ["Nike","Adidas","Clarks","New Balance","Puma"],
  "Women Shoes": ["Nike","Adidas","Steve Madden","Clarks","Zara"],
  "Men Clothes": ["Nike","Zara","H&M","Polo","Senator"],
  "Women Clothes": ["Zara","H&M","Ankara","Shein","Boutique"],
  "Children Clothes": ["Zara Kids","H&M Kids","Mothercare","Local"],
  "Children Shoes": ["Nike Kids","Adidas Kids","Crocs","Clarks Kids"],
  "Cars": ["Toyota","Lexus","Honda","Mercedes","Hyundai","Kia"],
  "TVs": ["Samsung","LG","Hisense","Sony","TCL"],
  "Freezers": ["Hisense","LG","Thermocool","Samsung","Haier"],
  "Kitchen Utensils": ["Master Chef","Non-Stick Pro","Stainless Steel","Tefal"],
  "Generators": ["Firman","Tiger","Elepaq","Sumec","Honda"],
  "Home Appliances": ["LG","Samsung","Hisense","Binatone","Scanfrost"],
};

const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com";

export default function SwiftMart() {
  const [cat, setCat] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All Brands"); // ✅ NEW
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product|null>(null);
  const [selSize, setSelSize] = useState("");
  const [selColor, setSelColor] = useState("");
  const [selBrand, setSelBrand] = useState(""); // ✅ NEW - user can change brand/type in modal
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const r = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
        const d = await r.json();
        const list = Array.isArray(d) ? d : d.data || [];
        if (list.length > 0) setProducts(list);
      } catch {}
      setLoading(false);
    };
    fetchProducts();
    const s = io(API_URL, { transports: ["websocket", "polling"] });
    s.on("products-updated", () => fetchProducts());
    const interval = setInterval(fetchProducts, 5000);
    return () => { s.disconnect(); clearInterval(interval); };
  }, []);

  // Brands available for current category
  const availableBrands = cat === "All" ? ["All Brands"] : ["All Brands", ...(BRANDS_BY_CATEGORY[cat] || [])];

  const filtered = useMemo(()=> products.filter(p => 
    (cat==="All"||p.category===cat) &&
    (brandFilter==="All Brands"||p.brand===brandFilter) &&
    (p.name+p.category+(p.brand||"")).toLowerCase().includes(q.toLowerCase())
  ), [cat,brandFilter,q,products]);

  const openProduct = (p:Product) => { setSelected(p); setSelSize(""); setSelColor(p.colors?.[0]||""); setSelBrand(p.brand||""); setQty(1); };
  const toggleWishlist = (id:string) => setWishlist(prev=> prev.includes(id)? prev.filter(x=>x!==id):[...prev,id]);
  const removeFromCart = (idx:number) => setCart(prev=>prev.filter((_,i)=>i!==idx));

  const addToCart = () => {
    if(!selected) return;
    if(!selSize) return alert("Please choose SIZE first");
    if(!selColor) return alert("Please choose COLOR");
    if(!selBrand) return alert("Please choose BRAND / TYPE");
    setCart(prev=>[...prev, {...selected, brand: selBrand, size: selSize, color: selColor, qty}]);
    setSelected(null); setShowCart(true);
  };

  // When category changes, reset brand filter
  const changeCat = (c:string) => { setCat(c); setBrandFilter("All Brands"); };

  const total = cart.reduce((s,c)=> s + c.price*c.qty, 0);

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
    />
  );
}