"use client";
import { useState, useMemo } from "react";
import SwiftMartUI from "./components";

export type Product = {
  id: string; name: string; price: number; oldPrice?: number; category: string;
  img: string; rating: number; stock: number; desc: string;
  sizes: string[]; colors: string[]; colorHex: Record<string,string>;
};

export const CATEGORIES = [
  "All", "Men Shoes", "Women Shoes", "Men Clothes", "Women Clothes",
  "Children Clothes", "Children Shoes", "Cars", "TVs", "Freezers",
  "Kitchen Utensils", "Generators", "Home Appliances"
];

export const PRODUCTS: Product[] = [
  { id:"MS1", name:"Men Leather Oxford Shoes", price:45000, oldPrice:65000, category:"Men Shoes", img:"👞", rating:4.8, stock:12, desc:"Premium leather, comfortable for office & events.", sizes:["40","41","42","43","44","45"], colors:["Black","Brown","Tan"], colorHex:{Black:"#111",Brown:"#6B4226",Tan:"#C19A6B"} },
  { id:"MS2", name:"Men Running Sneakers", price:38000, oldPrice:52000, category:"Men Shoes", img:"👟", rating:4.7, stock:20, desc:"Lightweight, breathable, for gym & daily wear.", sizes:["39","40","41","42","43","44","45"], colors:["Black","White","Blue","Red"], colorHex:{Black:"#111",White:"#eee",Blue:"#2563eb",Red:"#dc2626"} },
  { id:"WS1", name:"Women Block Heels", price:32000, oldPrice:45000, category:"Women Shoes", img:"👠", rating:4.9, stock:15, desc:"Elegant heels, stable block, perfect for parties.", sizes:["36","37","38","39","40","41"], colors:["Black","Nude","Red","White"], colorHex:{Black:"#111",Nude:"#E8C39E",Red:"#dc2626",White:"#eee"} },
  { id:"WS2", name:"Women White Sneakers", price:28000, category:"Women Shoes", img:"👟", rating:4.6, stock:25, desc:"Clean white sneakers, goes with everything.", sizes:["36","37","38","39","40"], colors:["White","Pink","Black"], colorHex:{White:"#eee",Pink:"#f9a8d4",Black:"#111"} },
  { id:"MC1", name:"Men Premium T-Shirt Pack (3)", price:18000, oldPrice:25000, category:"Men Clothes", img:"👕", rating:4.7, stock:40, desc:"100% cotton, pack of 3, no fading.", sizes:["S","M","L","XL","XXL"], colors:["Black","White","Blue","Grey"], colorHex:{Black:"#111",White:"#eee",Blue:"#2563eb",Grey:"#9ca3af"} },
  { id:"MC2", name:"Men Senator Wear", price:55000, category:"Men Clothes", img:"👔", rating:4.9, stock:8, desc:"Tailored senator set, premium fabric.", sizes:["M","L","XL","XXL"], colors:["Black","Navy","Wine","White"], colorHex:{Black:"#111",Navy:"#1e3a8a",Wine:"#7f1d1d",White:"#eee"} },
  { id:"WC1", name:"Women Ankara Gown", price:48000, oldPrice:62000, category:"Women Clothes", img:"👗", rating:4.8, stock:10, desc:"Beautiful Ankara, fitted, for weddings & events.", sizes:["S","M","L","XL"], colors:["Multi","Red","Blue","Green"], colorHex:{Multi:"#f59e0b",Red:"#dc2626",Blue:"#2563eb",Green:"#16a34a"} },
  { id:"WC2", name:"Women 2-Piece Set", price:35000, category:"Women Clothes", img:"👚", rating:4.6, stock:18, desc:"Trendy 2-piece, soft fabric.", sizes:["S","M","L","XL"], colors:["Pink","Black","White","Lilac"], colorHex:{Pink:"#f9a8d4",Black:"#111",White:"#eee",Lilac:"#c4b5fd"} },
  { id:"CC1", name:"Kids Boys Set (3pcs)", price:15000, category:"Children Clothes", img:"🧒", rating:4.8, stock:30, desc:"Soft cotton set for boys 2-8 years.", sizes:["2Y","4Y","6Y","8Y","10Y"], colors:["Blue","Green","Black"], colorHex:{Blue:"#2563eb",Green:"#16a34a",Black:"#111"} },
  { id:"CC2", name:"Kids Girls Dress", price:16000, category:"Children Clothes", img:"👧", rating:4.9, stock:22, desc:"Cute princess dress, birthday ready.", sizes:["2Y","4Y","6Y","8Y"], colors:["Pink","Red","White","Purple"], colorHex:{Pink:"#f9a8d4",Red:"#dc2626",White:"#eee",Purple:"#9333ea"} },
  { id:"CS1", name:"Kids Light-Up Sneakers", price:22000, category:"Children Shoes", img:"👟", rating:4.7, stock:25, desc:"Light-up sole, kids love it.", sizes:["26","28","30","32","34"], colors:["Blue","Pink","Black"], colorHex:{Blue:"#2563eb",Pink:"#f9a8d4",Black:"#111"} },
  { id:"CAR1", name:"Toyota Camry 2022", price:18500000, oldPrice:21000000, category:"Cars", img:"🚗", rating:4.9, stock:3, desc:"Full option, leather, reverse camera, Lagos cleared.", sizes:["2022","2023","2024"], colors:["Black","White","Silver","Red"], colorHex:{Black:"#111",White:"#eee",Silver:"#c0c0c0",Red:"#dc2626"} },
  { id:"CAR2", name:"Lexus RX 350 2021", price:32500000, category:"Cars", img:"🚙", rating:5.0, stock:2, desc:"Luxury SUV, sunroof, accident free.", sizes:["2021","2022"], colors:["Black","White","Grey"], colorHex:{Black:"#111",White:"#eee",Grey:"#9ca3af"} },
  { id:"TV1", name:"Samsung Smart TV", price:385000, oldPrice:480000, category:"TVs", img:"📺", rating:4.8, stock:14, desc:"4K Ultra HD, Netflix, YouTube, WiFi.", sizes:['32"','43"','55"','65"'], colors:["Black"], colorHex:{Black:"#111"} },
  { id:"TV2", name:"LG Smart TV", price:295000, category:"TVs", img:"📺", rating:4.7, stock:9, desc:"Full HD, Magic Remote, 2yr warranty.", sizes:['32"','43"','55"'], colors:["Black"], colorHex:{Black:"#111"} },
  { id:"FR1", name:"Hisense Chest Freezer", price:285000, category:"Freezers", img:"🧊", rating:4.8, stock:11, desc:"Fast freezing, low energy, 1yr warranty.", sizes:["150L","250L","350L"], colors:["Silver","White"], colorHex:{Silver:"#c0c0c0",White:"#eee"} },
  { id:"KT1", name:"Non-Stick Pot Set (12pcs)", price:45000, oldPrice:60000, category:"Kitchen Utensils", img:"🍳", rating:4.9, stock:35, desc:"Complete set, non-stick, easy wash.", sizes:["12pcs","16pcs","20pcs"], colors:["Black","Red","Grey"], colorHex:{Black:"#111",Red:"#dc2626",Grey:"#9ca3af"} },
  { id:"KT2", name:"Blender + Grinder", price:32000, category:"Kitchen Utensils", img:"🥤", rating:4.6, stock:28, desc:"2-in-1, crushes beans, pepper, fruits.", sizes:["1.5L","2L"], colors:["Black","White"], colorHex:{Black:"#111",White:"#eee"} },
  { id:"GN1", name:"Firman Generator 5.5KVA", price:485000, oldPrice:560000, category:"Generators", img:"⚡", rating:4.8, stock:7, desc:"Key starter, copper coil, low fuel.", sizes:["2.5KVA","5.5KVA","7.5KVA"], colors:["Blue","Black"], colorHex:{Blue:"#2563eb",Black:"#111"} },
  { id:"HA1", name:"Standing Fan + Rechargeable", price:55000, category:"Home Appliances", img:"🌀", rating:4.7, stock:20, desc:"Rechargeable, 12hr battery, remote.", sizes:["16 inch","18 inch"], colors:["White","Black"], colorHex:{White:"#eee",Black:"#111"} },
  { id:"HA2", name:"Washing Machine 7kg", price:265000, category:"Home Appliances", img:"🧺", rating:4.8, stock:6, desc:"Front load, quiet, energy saving.", sizes:["7kg","9kg"], colors:["White","Silver"], colorHex:{White:"#eee",Silver:"#c0c0c0"} },
];

export default function SwiftMart() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Product|null>(null);
  const [selSize, setSelSize] = useState("");
  const [selColor, setSelColor] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filtered = useMemo(()=> PRODUCTS.filter(p => (cat==="All"||p.category===cat) && (p.name+p.category).toLowerCase().includes(q.toLowerCase())), [cat,q]);

  const openProduct = (p:Product) => { setSelected(p); setSelSize(""); setSelColor(p.colors[0]); setQty(1); };
  const toggleWishlist = (id:string) => setWishlist(prev=> prev.includes(id)? prev.filter(x=>x!==id):[...prev,id]);
  const removeFromCart = (idx:number) => setCart(prev=>prev.filter((_,i)=>i!==idx));

  const addToCart = () => {
    if(!selected) return;
    if(!selSize) return alert("Please choose SIZE first");
    if(!selColor) return alert("Please choose COLOR");
    setCart(prev=>[...prev, {...selected, size: selSize, color: selColor, qty}]);
    setSelected(null); setShowCart(true);
  };

  const total = cart.reduce((s,c)=> s + c.price*c.qty, 0);

  return (
    <SwiftMartUI
      cat={cat} setCat={setCat} q={q} setQ={setQ}
      categories={CATEGORIES} filtered={filtered}
      selected={selected} setSelected={setSelected} openProduct={openProduct}
      selSize={selSize} setSelSize={setSelSize} selColor={selColor} setSelColor={setSelColor}
      qty={qty} setQty={setQty} cart={cart} total={total} addToCart={addToCart} removeFromCart={removeFromCart}
      wishlist={wishlist} toggleWishlist={toggleWishlist}
      showCart={showCart} setShowCart={setShowCart}
    />
  );
} 