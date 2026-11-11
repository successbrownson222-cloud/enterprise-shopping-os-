// backend-node/realtime.js - Realtime with Socket.io
const { Server } = require('socket.io');

let io = null;

function initRealtime(httpServer){
  io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket)=>{
    console.log("✅ User connected:", socket.id);

    // Client can join a room e.g. "admin" or "customer"
    socket.on("join", (room)=>{
      socket.join(room);
      console.log(`User ${socket.id} joined ${room}`);
    });

    // Frontend can ask for live products
    socket.on("get-products", ()=>{
      socket.emit("products-updated", { refresh: true });
    });

    socket.on("disconnect", ()=>{
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}

function emit(event, data){
  if(io) io.emit(event, data);
}

module.exports = { initRealtime, emit }; 