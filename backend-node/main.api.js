// SwiftMart Backend - Multi-Branch
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "swiftmart-secret-2026";
const ADMIN_EMAIL = "admin@swiftmart.com";
const ADMIN_PASS = bcrypt.hashSync("admin123", 10);

// --- DB (in-memory - replace with Mongo later) ---
let PRODUCTS = [];
let ORDERS = [];
let USERS = [{ id:"U1", name:"Admin", email:ADMIN_EMAIL, phone:"08012345678", password:ADMIN_PASS, role:"admin" }];

// ✅ BRANCHES - Backend only. Frontend never sees this list hardcoded, it calls /api/branches
const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT - Abuja"];
let BRANCHES = [
  { id:"B-LAGOS-IKEJA", state:"Lagos", city:"Ikeja", name:"SwiftMart Ikeja", address:"12 Allen Avenue, Ikeja, Lagos", phone:"08012345678", managerId:null, isActive:true },
  { id:"B-LAGOS-LEKKI", state:"Lagos", city:"Lekki", name:"SwiftMart Lekki", address:"Chevron Drive, Lekki, Lagos", phone:"08012345678", managerId:null, isActive:true },
  { id:"B-FCT-WUSE", state:"FCT - Abuja", city:"Wuse 2", name:"SwiftMart Abuja", address:"Aminu Kano Crescent, Wuse 2, Abuja", phone:"08012345678", managerId:null, isActive:true },
];

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
// ✅ Branch Manager can only see his branch. Super Admin sees all.
function canSeeBranch(req, branchId){
  if(req.user?.role==="admin") return true;
  if(req.user?.role==="branch-manager" && req.user?.branchId===branchId) return true;
  return false;
}
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
function cleanUser(u){ return { id:u.id, name:u.name, email:u.email, phone:u.phone||"", role:u.role, branchId:u.branchId||null }; }
function getBranchStock(p, branchId){
  if(p.stockByBranch && branchId && p.stockByBranch[branchId] !== undefined) return Number(p.stockByBranch[branchId]) || 0;
  return Number(p.stock) || 0;
}
function cleanProduct(p, branchId){
  const stock = branchId ? getBranchStock(p, branchId) : (Number(p.stock) || 0);
  return {
    ...p,
    img: p.img || p.image || "",
    image: p.image || p.img || "",
    sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["One Size"],
    colors: Array.isArray(p.colors) && p.colors.length ? p.colors : ["Black"],
    colorHex: p.colorHex && typeof p.colorHex === "object" ? p.colorHex : { Black:"#111" },
    brand: p.brand || "Generic",
    rating: Number(p.rating) || 4.5,
    stock,
    stockByBranch: p.stockByBranch || {},
  };
}

// ================= AUTH =================
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
  if(USERS.find(u=>u.email===cleanEmail)) return res.status(400).json({error:"Email exists"});
  if(cleanPhone && USERS.find(u=>u.phone===cleanPhone)) return res.status(400).json({error:"Phone exists"});
  const hash = await bcrypt.hash(password,10);
  const user = { id:"U"+Date.now(), name:cleanName, email:cleanEmail, phone:cleanPhone, password:hash, role:"customer", branchId:null };
  USERS.push(user);
  const token = jwt.sign({ id:user.id, email:cleanEmail, role:"customer", branchId:null }, SECRET, { expiresIn:"7d" });
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
  const token = jwt.sign({ id:user.id, email:cleanEmail, role:user.role, branchId:user.branchId||null }, SECRET, { expiresIn:"7d" });
  res.json({ token, user: cleanUser(user) });
});

router.get("/auth/me", auth, (req,res)=>{
  const user = USERS.find(u=>u.id===req.user.id || u.email===req.user.email);
  if(!user) return res.status(404).json({error:"User not found"});
  res.json({ user: cleanUser(user) });
});

// ================= BRANCHES =================
router.get("/branches/states", (req,res)=>{ res.json({ data: NIGERIAN_STATES }); });
router.get("/branches", (req,res)=>{
  const { state } = req.query;
  let list = BRANCHES.filter(b=>b.isActive);
  if(state) list = list.filter(b=>b.state===state);
  res.json({ data:list });
});
router.post("/branches", auth, adminOnly, (req,res)=>{
  const { state, city, name, address, phone, managerId } = req.body;
  if(!state || !NIGERIAN_STATES.includes(state)) return res.status(400).json({error:"Valid Nigerian state required"});
  if(!city || !name) return res.status(400).json({error:"city + name required"});
  const branch = { id:"B-"+Date.now(), state, city:city.trim(), name:name.trim(), address:address||"", phone:phone||"", managerId:managerId||null, isActive:true };
  BRANCHES.push(branch);
  emit("branches-updated", branch);
  res.json({ data:branch });
});
router.put("/branches/:id", auth, adminOnly, (req,res)=>{
  const idx = BRANCHES.findIndex(b=>b.id===req.params.id);
  if(idx===-1) return res.status(404).json({error:"Branch not found"});
  BRANCHES[idx] = { ...BRANCHES[idx], ...req.body, id:BRANCHES[idx].id };
  emit("branches-updated", BRANCHES[idx]);
  res.json({ data:BRANCHES[idx] });
});
router.delete("/branches/:id", auth, adminOnly, (req,res)=>{
  const b = BRANCHES.find(x=>x.id===req.params.id);
  if(!b) return res.status(404).json({error:"Branch not found"});
  b.isActive = false;
  emit("branches-updated", b);
  res.json({ message:"Branch deactivated" });
});
// ✅ Move stock between branches
router.post("/branches/transfer-stock", auth, adminOnly, (req,res)=>{
  const { productId, fromBranchId, toBranchId, qty } = req.body;
  const p = PRODUCTS.find(x=>x.id===productId);
  if(!p) return res.status(404).json({error:"Product not found"});
  const n = Number(qty) || 0;
  if(n<=0) return res.status(400).json({error:"qty must be > 0"});
  p.stockByBranch = p.stockByBranch || {};
  if((p.stockByBranch[fromBranchId]||0) < n) return res.status(400).json({error:"Not enough stock in source branch"});
  p.stockByBranch[fromBranchId] -= n;
  p.stockByBranch[toBranchId] = (p.stockByBranch[toBranchId]||0) + n;
  emit("products-updated", p);
  res.json({ data: cleanProduct(p) });
});

// ================= PRODUCTS =================
router.get("/products", (req,res)=>{
  const { category, brand, q, branchId } = req.query;
  let list = PRODUCTS.map(p=>cleanProduct(p, branchId));
  if(category && category!=="All") list = list.filter(p=>p.category===category);
  if(brand && brand!=="All Brands" && brand!=="All") list = list.filter(p=>p.brand===brand);
  if(q) list = list.filter(p=> (p.name+" "+p.category+" "+(p.brand||"")).toLowerCase().includes(q.toLowerCase()));
  res.json({ data:list, count:list.length });
});
router.get("/products/:id", (req,res)=>{
  const p = PRODUCTS.find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:"Not found"});
  res.json({ data: cleanProduct(p, req.query.branchId) });
});
router.post("/products", auth, adminOnly, (req,res)=>{
  const body = req.body;
  if(!body.name || !body.price || !body.category) return res.status(400).json({error:"name, price, category required"});
  if(!body.brand) return res.status(400).json({error:"brand required"});
  if(!Array.isArray(body.sizes) || !body.sizes.length) return res.status(400).json({error:"sizes required"});
  if(!Array.isArray(body.colors) || !body.colors.length) return res.status(400).json({error:"colors required"});
  // ✅ If admin passes stockByBranch use it, else split stock to all branches or first branch
  let stockByBranch = body.stockByBranch || {};
  if(Object.keys(stockByBranch).length===0 && body.stock){
    stockByBranch = {};
    BRANCHES.forEach(b=>{ stockByBranch[b.id] = Number(body.stock) || 0; });
  }
  const p = cleanProduct({
    id:"P"+Date.now(), rating:4.5, brand:"Generic", sizes:["One Size"], colors:["Black"], colorHex:{Black:"#111"},
    ...body, img: body.img || body.image || "", image: body.image || body.img || "",
    price: Number(body.price), oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
    stock: Number(body.stock) || 0, stockByBranch,
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

// ================= ORDERS =================
router.get("/orders", auth, (req,res)=>{
  let list = ORDERS;
  if(req.user.role==="admin") list = ORDERS;
  else if(req.user.role==="branch-manager") list = ORDERS.filter(o=>o.branchId===req.user.branchId);
  else list = ORDERS.filter(o=>o.userEmail===req.user.email || o.customer?.email===req.user.email);
  if(req.query.branchId && canSeeBranch(req, req.query.branchId)) list = list.filter(o=>o.branchId===req.query.branchId);
  res.json({ data:list });
});
router.get("/orders/:id", auth, (req,res)=>{
  const o = ORDERS.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Not found"});
  if(req.user.role==="branch-manager" && o.branchId!==req.user.branchId) return res.status(403).json({error:"Not your branch order"});
  if(req.user.role!=="admin" && req.user.role!=="branch-manager" && o.userEmail!==req.user.email && o.customer?.email!==req.user.email) return res.status(403).json({error:"Not your order"});
  res.json({ data:o });
});
router.post("/orders", (req,res)=>{
  const { items, customer, total, address, userEmail, gateway, reference, tx_ref, branchId } = req.body;
  if(!items?.length) return res.status(400).json({error:"Cart empty"});
  if(!customer?.name || !customer?.email) return res.status(400).json({error:"Customer name + email required"});
  if(!total || total <= 0) return res.status(400).json({error:"Total required"});
  if(!address) return res.status(400).json({error:"Delivery address required"});
  if(!branchId) return res.status(400).json({error:"branchId required - customer must select a branch"});
  const branch = BRANCHES.find(b=>b.id===branchId && b.isActive);
  if(!branch) return res.status(400).json({error:"Invalid branch"});
  for(let it of items){
    if(!it.brand || !it.size || !it.color) return res.status(400).json({error:`Item ${it.name} missing brand/size/color`});
  }
  // ✅ Stock check PER BRANCH only - not global
  for(let it of items){
    const prod = PRODUCTS.find(p=>p.id===it.id);
    if(prod){
      const available = getBranchStock(prod, branchId);
      if(available < (it.qty||1)) return res.status(400).json({error:`${prod.name} out of stock in ${branch.name} (only ${available} left)`});
    }
  }
  for(let it of items){
    const prod = PRODUCTS.find(p=>p.id===it.id);
    if(prod){
      prod.stockByBranch = prod.stockByBranch || {};
      prod.stockByBranch[branchId] = Math.max(0, (prod.stockByBranch[branchId]||0) - (it.qty||1));
      prod.stock = Math.max(0, (prod.stock||0) - (it.qty||1));
    }
  }
  const orderId = req.body.orderId || ("ORD-"+Date.now());
  const order = {
    id: orderId, items, customer, userEmail: userEmail || customer.email,
    total: Number(total), address, branchId, branchName: branch.name, branchState: branch.state, branchCity: branch.city,
    gateway: gateway || "Pay on Delivery", reference: reference || tx_ref || null,
    paymentStatus: gateway && gateway !== "Pay on Delivery" ? "Paid" : "Pending",
    status: "Ordered", createdAt: new Date().toISOString(),
    timeline: [{ status:"Ordered", time:new Date().toISOString() }],
  };
  ORDERS.unshift(order);
  emit("orders-updated", order);
  emit("products-updated", { stockChanged:true });
  res.json({ data:order });
});
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
router.put("/orders/:id/status", auth, (req,res)=>{
  const o = ORDERS.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Not found"});
  if(req.user.role==="branch-manager" && o.branchId!==req.user.branchId) return res.status(403).json({error:"Not your branch"});
  if(req.user.role!=="admin" && req.user.role!=="branch-manager") return res.status(403).json({error:"Admin only"});
  const allowed = ["Ordered","Processing","Shipped","Delivered","Cancelled"];
  if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
  o.status = req.body.status;
  o.timeline.push({ status:req.body.status, time:new Date().toISOString() });
  emit("orders-updated", o);
  res.json({ data:o });
});

// ================= ADMIN STATS =================
router.get("/admin/stats", auth, adminOnly, (req,res)=>{
  const branchId = req.query.branchId;
  let orders = ORDERS;
  if(branchId) orders = orders.filter(o=>o.branchId===branchId);
  const revenue = orders.reduce((s,o)=>s+(o.total||0),0);
  const paidRevenue = orders.filter(o=>o.paymentStatus==="Paid").reduce((s,o)=>s+(o.total||0),0);
  const lowStock = PRODUCTS.filter(p=>p.stock<5);
  const byGateway = {};
  orders.forEach(o=>{ byGateway[o.gateway||"Unknown"] = (byGateway[o.gateway||"Unknown"]||0)+1; });
  const byBranch = {};
  ORDERS.forEach(o=>{ byBranch[o.branchName||"No Branch"] = (byBranch[o.branchName||"No Branch"]||0)+(o.total||0); });
  res.json({ totalProducts: PRODUCTS.length, totalOrders: orders.length, totalUsers: USERS.length, revenue, paidRevenue, lowStock, byGateway, byBranch, recentOrders: orders.slice(0,5), totalBranches: BRANCHES.filter(b=>b.isActive).length });
});

module.exports = { router, setEmitter };