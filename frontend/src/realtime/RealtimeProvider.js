import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createSocket } from "./socket";
import { notificationsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const RealtimeContext = createContext(null);

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) socketRef.current.disconnect();
      setSocket(null);
      setUnreadCount(0);
      return;
    }

    const s = createSocket();
    socketRef.current = s;
    setSocket(s);

    const refreshUnread = async () => {
      try {
        const res = await notificationsAPI.getUnreadCount();
        setUnreadCount(res.data?.count || 0);
      } catch {}
    };

    refreshUnread();

    s.on("notification:new", () => {
      refreshUnread();
    });

    s.on("payment:updated", () => {
      refreshUnread();
      if (user.role === "admin") toast.success("New payment update received");
    });

    s.on("qr:rotated", () => {
      if (user.role === "admin") toast.success("Payment QR rotated");
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [user?.id, user?.role]);

  const value = useMemo(
    () => ({
      socket,
      unreadCount,
      setUnreadCount,
    }),
    [socket, unreadCount],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

