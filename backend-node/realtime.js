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
      // Send to all admins
      io.to("admin").emit("chat-message", msg);
      // Also echo back to sender so frontend shows it
      socket.emit("chat-message", msg);
    });

    // Admin -> Customer
    socket.on("admin-reply", (msg) => {
      console.log("👨‍💼 Admin reply:", msg);
      // Send to all customers (or to specific user room if msg.to is set)
      if (msg.to) {
        io.to(msg.to).emit("chat-message", msg);
      } else {
        io.to("customer").emit("chat-message", msg);
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