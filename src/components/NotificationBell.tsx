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

  const getNavigationPath = (notification: typeof notifications[0]): string => {
    const { notificationTargetType, targetId } = notification;

    if (user?.role === "technician" || user?.role === "Lab Technician") {
      switch (notificationTargetType) {
        case "Task":
          return `/technician/tasks/${targetId}`;
        case "ExperimentLog":
          return `/technician/experiment-log/${targetId}`;
        case "Report":
          return `/reports/${targetId}`;
        case "MonitoringLog":
          return `/monitoring-logs/${targetId}`;
        default:
          return "/technician/experiment-log";
      }
    }

    if (user?.role === "researcher" || user?.role === "Researcher") {
      switch (notificationTargetType) {
        case "Task":
          return `/researcher/tasks/${targetId}`;
        case "ExperimentLog":
          return `/researcher/experiment-log/${targetId}`;
        case "Report":
          return `/reports/${targetId}`;
        case "MonitoringLog":
          return `/monitoring-logs/${targetId}`;
        default:
          return "/researcher/experiment-log";
      }
    }

    return "/";
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    console.log("clicked!", notification);
    console.log("user:", user);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    navigate(getNavigationPath(notification));
    setOpen(false);
  };

  return (
    <div ref={bellRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-blue-50 transition-colors"
        aria-label={t("notification.title")}
      >
        <FaBell
          size={22}
          color={open ? "#2563eb" : "#6B7280"}
          className={open ? "drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]" : ""}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ef4444] text-[11px] text-white font-semibold shadow-sm border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[600px] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
          {/* Header */}
          <div className="px-4 py-3 border-b border-blue-100 bg-blue-600 rounded-none">
            <span className="font-semibold text-white text-[15px]">
              {t("notification.title")}
            </span>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-white text-blue-600 text-[11px] font-bold">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

          {/* List */}
          <ul className="max-h-[540px] overflow-y-auto divide-y divide-gray-100">
            {sortedNotifications.length === 0 && (
              <li className="p-5 text-sm text-gray-500 text-center">
                {t("notification.empty")}
              </li>
            )}
            {sortedNotifications.map((n) => (
              <li
                key={n.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(n);
                }}
                className="flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="mt-1 flex-shrink-0 w-2.5">
                  {!n.isRead && (
                    <span className="block h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm leading-snug ${
                      n.isRead
                        ? "text-gray-700 font-normal"
                        : "text-blue-700 font-semibold"
                    }`}
                  >
                    {n.title}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                    {n.content}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
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