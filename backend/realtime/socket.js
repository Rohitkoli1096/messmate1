const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { setIO } = require("./io");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const role = socket.user?.role;

    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
    if (role === "admin") socket.join("role:admin");

    socket.emit("socket:ready", { userId, role });
  });

  setIO(io);
  return io;
}

module.exports = { initSocket };

