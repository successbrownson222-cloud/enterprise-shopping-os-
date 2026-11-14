// backend-node/main.api.js - MAIN API ONLY. No express app, no server, no socket init.
// Matches: frontend/app/page.tsx + frontend/lib/auth.ts + frontend/app/auth + frontend/app/admin + backend-php/payments.php
// ✅ NO STATIC PRODUCTS - NO EMOJIS - Products only come from Admin
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "swiftmart-secret-2026";
const ADMIN_EMAIL = "admin@swiftmart.com";
const ADMIN_PASS = bcrypt.hashSync("admin123", 10);

// --- DB (in-memory, same as before - replace with Mongo later) ---
// ✅ EMPTY - No static products. Admin adds real products only.
let PRODUCTS = [];

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
  // ✅ NO emoji fallback - use real image URL only, else empty string
  return {
    ...p,
    img: p.img || p.image || "", // admin uploads real image URL, never emoji
    image: p.image || p.img || "",
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
    img: body.img || body.image || "",
    image: body.image || body.img || "",
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
  const { items, customer, total, address, userEmail, gateway, reference, tx_ref } = req.body;
  if(!items?.length) return res.status(400).json({error:"Cart empty"});
  if(!customer?.name || !customer?.email) return res.status(400).json({error:"Customer name + email required"});
  if(!total || total <= 0) return res.status(400).json({error:"Total required"});
  if(!address) return res.status(400).json({error:"Delivery address required"});

  for(let it of items){
    if(!it.brand || !it.size || !it.color) return res.status(400).json({error:`Item ${it.name} missing brand/size/color`});
  }

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
    items,
    customer,
    userEmail: userEmail || customer.email,
    total: Number(total),
    address,
    gateway: gateway || "Pay on Delivery",
    reference: reference || tx_ref || null,
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