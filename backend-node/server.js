// backend-node/server.js - Entry point only
const express = require('express');
const cors = require('cors');
const http = require('http');

const { router, setEmitter } = require('./main.api');
const { initRealtime, emit } = require('./realtime');

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get("/health", (req,res)=> res.json({ status:"SwiftMart Node API running", time: new Date().toISOString() }));
app.get("/", (req,res)=> res.json({ message:"SwiftMart API - use /api/products" }));

// Main API
app.use("/api", router);

// HTTP server + Realtime
const server = http.createServer(app);
initRealtime(server);

// Connect Main API -> Realtime
setEmitter(emit);

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`✅ SwiftMart API on port ${PORT}`)); 