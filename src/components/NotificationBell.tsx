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
    <div ref={bellRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={t("notification.title")}
      >
        <FaBell
          size={22}
          color={open ? "#2D5A27" : "#6B7280"}
          className={open ? "drop-shadow-[0_0_6px_rgba(45,90,39,0.4)]" : ""}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ef4444] text-[11px] text-white font-semibold shadow-sm border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[420px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
            {t("notification.title")}
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {sortedNotifications.length === 0 && (
              <li className="p-4 text-sm text-gray-600">
                {t("notification.empty")}
              </li>
            )}
            {sortedNotifications.map((n) => (
              <li
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 p-4 border-b border-gray-100 transition-colors duration-200 ${
                  n.isRead ? "bg-white" : "bg-[#F4F7F4]"
                } hover:bg-gray-50 cursor-pointer`}
              >
                {!n.isRead && (
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2D5A27] flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={`truncate ${
                      n.isRead ? "text-gray-900" : "text-[#2D5A27] font-semibold"
                    }`}
                  >
                    {n.title}
                  </div>
                  <div className="text-gray-600 text-sm mt-1 truncate">
                    {n.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("vi-VN")}
                  </div>
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