import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useSocketNotification(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !user.id) return;

    // Use current host for proxy support in both dev and Docker
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      // Join user-specific notification room
      socket.emit("joinUser", user.id);
      if (user.role === "admin") {
        socket.emit("joinAdmin");
      }
    });

    socket.on("statusNotification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
  };
}

export default useSocketNotification;
