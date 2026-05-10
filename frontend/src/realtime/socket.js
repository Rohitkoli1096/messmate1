import { io } from "socket.io-client";

export function createSocket() {
  const token = localStorage.getItem("token");
  const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  const url = base ? base : window.location.origin;

  return io(url, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    autoConnect: true,
  });
}

