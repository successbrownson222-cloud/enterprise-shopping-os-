// backend-node/realtime.js - Realtime with Socket.io
const { Server } = require('socket.io');

let io = null;

function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Join room: "admin" or "customer" or "user-<id>"
    socket.on("join", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined ${room}`);
    });

    // === LIVE CHAT ===
    // Customer -> Admin
    socket.on("chat-message", (msg) => {
      console.log("💬 Chat:", msg);
      // Send to all admins ONLY - do NOT echo back to sender
      // Frontend already shows its own message, echo = duplicate
      io.to("admin").emit("chat-message", {
        text: msg.text,
        from: msg.from || "me",
        name: msg.name || "Guest",
        userEmail: msg.userEmail || "guest",
        at: Date.now(),
      });
    });

    // Admin -> Customer
    socket.on("admin-reply", (msg) => {
      console.log("👨‍💼 Admin reply:", msg);
      const out = {
        text: msg.text,
        from: "support",
        name: "SwiftMart Support",
        at: Date.now(),
      };
      // Send to all customers (or to specific user room if msg.to is set)
      if (msg.to) {
        io.to(msg.to).emit("chat-message", out);
      } else {
        io.to("customer").emit("chat-message", out);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      socket.broadcast.emit("typing", data);
    });

    // Frontend can ask for live products
    socket.on("get-products", () => {
      socket.emit("products-updated", { refresh: true });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}

function emit(event, data) {
  if (io) io.emit(event, data);
}

module.exports = { initRealtime, emit };