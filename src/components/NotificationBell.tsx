/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useRef, useState, useMemo } from "react";
import { useNotification } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const NotificationBell: React.FC = () => {
  const { notifications, markAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Sắp xếp thông báo từ mới nhất đến cũ nhất
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (user?.role === "technician") {
      navigate("/technician/experiment-log");
    } else if (user?.role === "researcher") {
      navigate("/researcher/experiment-log");
    }

    setOpen(false);
  };

  return (
    <div
      ref={bellRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="notification-bell-btn"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: 0,
          outline: "none",
          paddingTop: 10,
        }}
        aria-label={t("notification.title")}
      >
        <FaBell
          size={22}
          color={open ? "#2563eb" : "#f59e42"}
          style={{
            filter: open ? "drop-shadow(0 0 4px #2563eb88)" : undefined,
            transition: "color 0.2s",
            paddingTop: 1,
            paddingBottom: 2,
          }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              minWidth: 18,
              height: 18,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              boxShadow: "0 1px 4px #0002",
              zIndex: 2,
              border: "2px solid #fff",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown__header">
            {t("notification.title")}
          </div>
          <ul className="notif-dropdown__list">
            {sortedNotifications.length === 0 && (
              <li className="notif-dropdown__empty">
                {t("notification.empty")}
              </li>
            )}
            {sortedNotifications.map((n) => (
              <li
                key={n.id}
                className={`notif-dropdown__item ${n.isRead ? "notif-dropdown__item--read" : "notif-dropdown__item--unread"}`}
                onClick={() => handleNotificationClick(n)}
              >
                {!n.isRead && <span className="notif-dropdown__dot" />}
                <div className="notif-dropdown__title">{n.title}</div>
                <div className="notif-dropdown__content">{n.content}</div>
                <div className="notif-dropdown__time">
                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;