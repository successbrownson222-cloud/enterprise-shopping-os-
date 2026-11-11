// backend-node/main.api.js - MAIN API ONLY. No express app, no server, no socket init.
// Matches: frontend/app/page.tsx + frontend/lib/auth.ts + frontend/app/auth + frontend/app/admin + backend-php/payments.php
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "swiftmart-secret-2026";
const ADMIN_EMAIL = "admin@swiftmart.com";
const ADMIN_PASS = bcrypt.hashSync("admin123", 10);

// --- DB (in-memory, same as before - replace with Mongo later) ---
let PRODUCTS = [
  { id:"MS1", name:"Men Leather Oxford Shoes", price:45000, oldPrice:65000, category:"Men Shoes", brand:"Clarks", img:"👞", rating:4.8, stock:12, desc:"Premium leather, comfortable for office & events.", sizes:["40","41","42","43","44","45"], colors:["Black","Brown","Tan"], colorHex:{Black:"#111",Brown:"#6B4226",Tan:"#C19A6B"} },
  { id:"MS2", name:"Men Running Sneakers", price:38000, oldPrice:52000, category:"Men Shoes", brand:"Nike", img:"👟", rating:4.7, stock:20, desc:"Lightweight, breathable, for gym & daily wear.", sizes:["39","40","41","42","43","44","45"], colors:["Black","White","Blue","Red"], colorHex:{Black:"#111",White:"#eee",Blue:"#2563eb",Red:"#dc2626"} },
  { id:"WS1", name:"Women Block Heels", price:32000, oldPrice:45000, category:"Women Shoes", brand:"Zara", img:"👠", rating:4.9, stock:15, desc:"Elegant heels, stable block, perfect for parties.", sizes:["36","37","38","39","40","41"], colors:["Black","Nude","Red","White"], colorHex:{Black:"#111",Nude:"#E8C39E",Red:"#dc2626",White:"#eee"} },
  { id:"MC1", name:"Men Premium T-Shirt Pack (3)", price:18000, oldPrice:25000, category:"Men Clothes", brand:"Polo", img:"👕", rating:4.7, stock:40, desc:"100% cotton, pack of 3, no fading.", sizes:["S","M","L","XL","XXL"], colors:["Black","White","Blue","Grey"], colorHex:{Black:"#111",White:"#eee",Blue:"#2563eb",Grey:"#9ca3af"} },
  { id:"WC1", name:"Women Ankara Gown", price:48000, oldPrice:62000, category:"Women Clothes", brand:"Ankara", img:"👗", rating:4.8, stock:10, desc:"Beautiful Ankara, fitted, for weddings & events.", sizes:["S","M","L","XL"], colors:["Multi","Red","Blue","Green"], colorHex:{Multi:"#f59e0b",Red:"#dc2626",Blue:"#2563eb",Green:"#16a34a"} },
  { id:"CC1", name:"Kids Boys Set (3pcs)", price:15000, category:"Children Clothes", brand:"Mothercare", img:"🧒", rating:4.8, stock:30, desc:"Soft cotton set for boys 2-8 years.", sizes:["2Y","4Y","6Y","8Y","10Y"], colors:["Blue","Green","Black"], colorHex:{Blue:"#2563eb",Green:"#16a34a",Black:"#111"} },
  { id:"CS1", name:"Kids Light-Up Sneakers", price:22000, category:"Children Shoes", brand:"Nike Kids", img:"👟", rating:4.7, stock:25, desc:"Light-up sole, kids love it.", sizes:["26","28","30","32","34"], colors:["Blue","Pink","Black"], colorHex:{Blue:"#2563eb",Pink:"#f9a8d4",Black:"#111"} },
  { id:"CAR1", name:"Toyota Camry 2022", price:18500000, oldPrice:21000000, category:"Cars", brand:"Toyota", img:"🚗", rating:4.9, stock:3, desc:"Full option, leather, reverse camera, Lagos cleared.", sizes:["2022","2023","2024"], colors:["Black","White","Silver","Red"], colorHex:{Black:"#111",White:"#eee",Silver:"#c0c0c0",Red:"#dc2626"} },
  { id:"CAR2", name:"Lexus RX 350 2021", price:32500000, category:"Cars", brand:"Lexus", img:"🚙", rating:5.0, stock:2, desc:"Luxury SUV, sunroof, accident free.", sizes:["2021","2022"], colors:["Black","White","Grey"], colorHex:{Black:"#111",White:"#eee",Grey:"#9ca3af"} },
  { id:"TV1", name:"Samsung Smart TV", price:385000, oldPrice:480000, category:"TVs", brand:"Samsung", img:"📺", rating:4.8, stock:14, desc:"4K Ultra HD, Netflix, YouTube, WiFi.", sizes:['32"','43"','55"','65"'], colors:["Black"], colorHex:{Black:"#111"} },
  { id:"TV2", name:"LG Smart TV", price:295000, category:"TVs", brand:"LG", img:"📺", rating:4.7, stock:9, desc:"Full HD, Magic Remote, 2yr warranty.", sizes:['32"','43"','55"'], colors:["Black"], colorHex:{Black:"#111"} },
  { id:"TV3", name:"Hisense Smart TV", price:245000, category:"TVs", brand:"Hisense", img:"📺", rating:4.6, stock:18, desc:"4K, Bluetooth, 1yr warranty.", sizes:['32"','43"','55"'], colors:["Black"], colorHex:{Black:"#111"} },
  { id:"FR1", name:"Hisense Chest Freezer", price:285000, category:"Freezers", brand:"Hisense", img:"🧊", rating:4.8, stock:11, desc:"Fast freezing, low energy, 1yr warranty.", sizes:["150L","250L","350L"], colors:["Silver","White"], colorHex:{Silver:"#c0c0c0",White:"#eee"} },
  { id:"FR2", name:"Thermocool Freezer", price:310000, category:"Freezers", brand:"Thermocool", img:"🧊", rating:4.7, stock:8, desc:"Double door, super freeze.", sizes:["200L","300L"], colors:["Silver","White"], colorHex:{Silver:"#c0c0c0",White:"#eee"} },
  { id:"FR3", name:"LG Freezer", price:420000, category:"Freezers", brand:"LG", img:"🧊", rating:4.9, stock:5, desc:"Inverter, quiet.", sizes:["250L","350L"], colors:["Silver"], colorHex:{Silver:"#c0c0c0"} },
  { id:"KT1", name:"Non-Stick Pot Set (12pcs)", price:45000, oldPrice:60000, category:"Kitchen Utensils", brand:"Master Chef", img:"🍳", rating:4.9, stock:35, desc:"Complete set, non-stick, easy wash.", sizes:["12pcs","16pcs","20pcs"], colors:["Black","Red","Grey"], colorHex:{Black:"#111",Red:"#dc2626",Grey:"#9ca3af"} },
  { id:"GN1", name:"Firman Generator 5.5KVA", price:485000, oldPrice:560000, category:"Generators", brand:"Firman", img:"⚡", rating:4.8, stock:7, desc:"Key starter, copper coil, low fuel.", sizes:["2.5KVA","5.5KVA","7.5KVA"], colors:["Blue","Black"], colorHex:{Blue:"#2563eb",Black:"#111"} },
  { id:"GN2", name:"Tiger Generator 5KVA", price:365000, category:"Generators", brand:"Tiger", img:"⚡", rating:4.6, stock:10, desc:"Manual start, durable.", sizes:["2.5KVA","5KVA"], colors:["Red","Black"], colorHex:{Red:"#dc2626",Black:"#111"} },
  { id:"HA1", name:"Standing Fan + Rechargeable", price:55000, category:"Home Appliances", brand:"Binatone", img:"🌀", rating:4.7, stock:20, desc:"Rechargeable, 12hr battery, remote.", sizes:["16 inch","18 inch"], colors:["White","Black"], colorHex:{White:"#eee",Black:"#111"} },
];

let ORDERS = [];
let USERS = [{ id:"U1", name:"Admin", email:ADMIN_EMAIL, phone:"08012345678", password:ADMIN_PASS, role:"admin" }];

// ✅ Emitter injected from server.js -> realtime.js. No direct io here.
let emit = () => {};
function setEmitter(fn){ emit = fn; }

function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({error:"No token"});
  try{ req.user = jwt.verify(h.replace("Bearer ",""), SECRET); next(); }
  catch{ return res.status(401).json({error:"Invalid token"}); }
}
function adminOnly(req,res,next){
  if(req.user?.role!=="admin") return res.status(403).json({error:"Admin only"});
  next();
}

// ✅ HELPERS - match frontend/lib/auth.ts validation on backend too (never trust frontend alone)
function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e||""); }
function isValidPhone(p){ return /^(\+234|0)(70|80|81|90|91)\d{8}$/.test((p||"").replace(/[\s-]/g,"")); }
function isStrongPassword(pw){
  if(!pw || pw.length < 8) return false;
  if(!/[A-Z]/.test(pw)) return false;
  if(!/[a-z]/.test(pw)) return false;
  if(!/[0-9]/.test(pw)) return false;
  if(!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
}
function cleanUser(u){ return { id:u.id, name:u.name, email:u.email, phone:u.phone||"", role:u.role }; }
function cleanProduct(p){
  // ✅ Ensure shape matches frontend Product type: sizes[], colors[], colorHex{}
  return {
    ...p,
    sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["One Size"],
    colors: Array.isArray(p.colors) && p.colors.length ? p.colors : ["Black"],
    colorHex: p.colorHex && typeof p.colorHex === "object" ? p.colorHex : { Black:"#111" },
    brand: p.brand || "Generic",
    rating: Number(p.rating) || 4.5,
    stock: Number(p.stock) || 0,
  };
}

// ================= AUTH - matches lib/auth.ts + app/auth/page.tsx =================
router.post("/auth/register", async (req,res)=>{
  const { name, email, password, phone } = req.body;
  const cleanEmail = (email||"").trim().toLowerCase();
  const cleanPhone = (phone||"").trim();
  const cleanName = (name||"").trim();

  if(!cleanName || !cleanEmail || !password) return res.status(400).json({error:"Missing fields: name, email, password required"});
  if(cleanName.length < 3) return res.status(400).json({error:"Name must be at least 3 characters"});
  if(!isValidEmail(cleanEmail)) return res.status(400).json({error:"Enter a valid email"});
  if(cleanPhone && !isValidPhone(cleanPhone)) return res.status(400).json({error:"Enter valid Nigerian number e.g. 08012345678"});
  if(!isStrongPassword(password)) return res.status(400).json({error:"Password must be 8+ chars with A-Z, a-z, 0-9, symbol"});

  // ✅ UNIQUE - email + phone (frontend shows "Email already registered")
  if(USERS.find(u=>u.email===cleanEmail)) return res.status(400).json({error:"Email exists"});
  if(cleanPhone && USERS.find(u=>u.phone===cleanPhone)) return res.status(400).json({error:"Phone exists"});

  const hash = await bcrypt.hash(password,10);
  const user = { id:"U"+Date.now(), name:cleanName, email:cleanEmail, phone:cleanPhone, password:hash, role:"customer" };
  USERS.push(user);
  const token = jwt.sign({ id:user.id, email:cleanEmail, role:"customer" }, SECRET, { expiresIn:"7d" });
  res.json({ token, user: cleanUser(user) });
});

router.post("/auth/login", async (req,res)=>{
  const { email, password } = req.body;
  const cleanEmail = (email||"").trim().toLowerCase();
  if(!cleanEmail || !password) return res.status(400).json({error:"Email + password required"});
  const user = USERS.find(u=>u.email===cleanEmail);
  if(!user) return res.status(400).json({error:"User not found"});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({error:"Wrong password"});
  const token = jwt.sign({ id:user.id, email:cleanEmail, role:user.role }, SECRET, { expiresIn:"7d" });
  res.json({ token, user: cleanUser(user) });
});

// ✅ Who am I? Used by frontend to restore session / check role for admin
router.get("/auth/me", auth, (req,res)=>{
  const user = USERS.find(u=>u.id===req.user.id || u.email===req.user.email);
  if(!user) return res.status(404).json({error:"User not found"});
  res.json({ user: cleanUser(user) });
});

// ================= PRODUCTS - matches page.tsx Product + admin/page.tsx =================
router.get("/products", (req,res)=>{
  const { category, brand, q } = req.query;
  let list = PRODUCTS.map(cleanProduct);
  if(category && category!=="All") list = list.filter(p=>p.category===category);
  if(brand && brand!=="All Brands" && brand!=="All") list = list.filter(p=>p.brand===brand);
  if(q) list = list.filter(p=> (p.name+" "+p.category+" "+(p.brand||"")).toLowerCase().includes(q.toLowerCase()));
  res.json({ data:list, count:list.length });
});

router.get("/products/:id", (req,res)=>{
  const p = PRODUCTS.find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:"Not found"});
  res.json({ data: cleanProduct(p) });
});

router.post("/products", auth, adminOnly, (req,res)=>{
  const body = req.body;
  if(!body.name || !body.price || !body.category) return res.status(400).json({error:"name, price, category required"});
  if(!body.brand) return res.status(400).json({error:"brand required"});
  if(!Array.isArray(body.sizes) || !body.sizes.length) return res.status(400).json({error:"sizes required e.g. [\"32\\\", \"43\\\", \"55\\\"\"]"});
  if(!Array.isArray(body.colors) || !body.colors.length) return res.status(400).json({error:"colors required"});
  const p = cleanProduct({
    id:"P"+Date.now(),
    rating:4.5,
    brand:"Generic",
    sizes:["One Size"],
    colors:["Black"],
    colorHex:{Black:"#111"},
    ...body,
    price: Number(body.price),
    oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
    stock: Number(body.stock) || 0,
  });
  PRODUCTS.unshift(p);
  emit("products-updated", p);
  res.json({ data:p, message:"Product added" });
});

router.put("/products/:id", auth, adminOnly, (req,res)=>{
  const idx = PRODUCTS.findIndex(x=>x.id===req.params.id);
  if(idx===-1) return res.status(404).json({error:"Not found"});
  PRODUCTS[idx] = cleanProduct({ ...PRODUCTS[idx], ...req.body, id: PRODUCTS[idx].id });
  emit("products-updated", PRODUCTS[idx]);
  res.json({ data:PRODUCTS[idx] });
});

router.delete("/products/:id", auth, adminOnly, (req,res)=>{
  PRODUCTS = PRODUCTS.filter(x=>x.id!==req.params.id);
  emit("products-updated", { deleted:req.params.id });
  res.json({ message:"Deleted" });
});

// ================= ORDERS - matches page.tsx createNodeOrder + backend-php/payments.php =================
router.get("/orders", auth, (req,res)=>{
  const list = req.user.role==="admin" ? ORDERS : ORDERS.filter(o=>o.userEmail===req.user.email || o.customer?.email===req.user.email);
  res.json({ data:list });
});

router.get("/orders/:id", auth, (req,res)=>{
  const o = ORDERS.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Not found"});
  if(req.user.role!=="admin" && o.userEmail!==req.user.email && o.customer?.email!==req.user.email) return res.status(403).json({error:"Not your order"});
  res.json({ data:o });
});

router.post("/orders", (req,res)=>{
  // Frontend sends: { items: CartItem[], customer:{name,email,phone}, total, address, userEmail, gateway, reference/tx_ref }
  const { items, customer, total, address, userEmail, gateway, reference, tx_ref } = req.body;
  if(!items?.length) return res.status(400).json({error:"Cart empty"});
  if(!customer?.name || !customer?.email) return res.status(400).json({error:"Customer name + email required"});
  if(!total || total <= 0) return res.status(400).json({error:"Total required"});
  if(!address) return res.status(400).json({error:"Delivery address required"});

  // ✅ Validate each cart item has brand/size/color (frontend enforces this)
  for(let it of items){
    if(!it.brand || !it.size || !it.color) return res.status(400).json({error:`Item ${it.name} missing brand/size/color`});
  }

  // ✅ Decrease stock - do NOT go negative
  for(let it of items){
    const prod = PRODUCTS.find(p=>p.id===it.id);
    if(prod){
      if(prod.stock < (it.qty||1)) return res.status(400).json({error:`${prod.name} out of stock (only ${prod.stock} left)`});
      prod.stock = Math.max(0, prod.stock - (it.qty||1));
    }
  }

  const orderId = req.body.orderId || ("ORD-"+Date.now());
  const order = {
    id: orderId,
    items, // each: { id, name, brand, size, color, qty, price, img }
    customer,
    userEmail: userEmail || customer.email,
    total: Number(total),
    address,
    gateway: gateway || "Pay on Delivery", // ✅ paystack | flutterwave | Pay on Delivery
    reference: reference || tx_ref || null, // ✅ from PHP payments.php
    paymentStatus: gateway && gateway !== "Pay on Delivery" ? "Paid" : "Pending",
    status: "Ordered",
    createdAt: new Date().toISOString(),
    timeline: [{ status:"Ordered", time:new Date().toISOString() }],
  };
  ORDERS.unshift(order);
  emit("orders-updated", order);
  emit("products-updated", { stockChanged:true });
  res.json({ data:order });
});

// ✅ Called by PHP webhook / frontend after verify - mark Paid
router.put("/orders/:id/pay", (req,res)=>{
  const o = ORDERS.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Not found"});
  o.paymentStatus = "Paid";
  o.reference = req.body.reference || req.body.tx_ref || o.reference;
  o.gateway = req.body.gateway || o.gateway;
  o.timeline.push({ status:"Paid", time:new Date().toISOString() });
  emit("orders-updated", o);
  res.json({ data:o });
});

router.put("/orders/:id/status", auth, adminOnly, (req,res)=>{
  const o = ORDERS.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Not found"});
  const allowed = ["Ordered","Processing","Shipped","Delivered","Cancelled"];
  if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
  o.status = req.body.status;
  o.timeline.push({ status:req.body.status, time:new Date().toISOString() });
  emit("orders-updated", o);
  res.json({ data:o });
});

// ================= ADMIN STATS - matches admin/page.tsx =================
router.get("/admin/stats", auth, adminOnly, (req,res)=>{
  const revenue = ORDERS.reduce((s,o)=>s+(o.total||0),0);
  const paidRevenue = ORDERS.filter(o=>o.paymentStatus==="Paid").reduce((s,o)=>s+(o.total||0),0);
  const lowStock = PRODUCTS.filter(p=>p.stock<5);
  // ✅ Orders by gateway for admin chart
  const byGateway = {};
  ORDERS.forEach(o=>{ byGateway[o.gateway||"Unknown"] = (byGateway[o.gateway||"Unknown"]||0)+1; });
  res.json({
    totalProducts: PRODUCTS.length,
    totalOrders: ORDERS.length,
    totalUsers: USERS.length,
    revenue,
    paidRevenue,
    lowStock,
    byGateway,
    recentOrders: ORDERS.slice(0,5)
  });
});

module.exports = { router, setEmitter };