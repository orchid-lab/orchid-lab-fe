/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-x/no-unstable-context-value */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as signalR from "@microsoft/signalr";
import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notificationApi";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Lấy danh sách notification qua API
  const fetchNotifications = async () => {
    if (user?.id) {
      const res = await getNotifications(user.id);
      setNotifications(res.data?.data ?? []);
    }
  };

  // Đánh dấu đã đọc
  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  // Kết nối SignalR
  useEffect(() => {
    if (!user?.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`https://net-api.tissuex.me/hubs/notifications`, {
        accessTokenFactory: () => localStorage.getItem("token") ?? "",
        withCredentials: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Trace)
      .build();

    connection.start().then(() => {
      connection.on("ReceiveNotification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    });

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [user?.id]);

  // Lấy noti khi login hoặc reload, đồng thời polling mỗi 20s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <NotificationContext.Provider
      value={{ notifications, fetchNotifications, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};
