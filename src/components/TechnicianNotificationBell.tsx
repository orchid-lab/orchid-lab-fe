/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useRef, useState, useMemo } from "react";
import { useNotification } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const TechnicianNotificationBell: React.FC = () => {
  const { notifications, markAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
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
        className="relative p-2 rounded-full hover:bg-green-50 transition-colors"
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
        <div className="absolute right-0 mt-2 w-[340px] max-h-[600px] overflow-hidden rounded-xl border border-green-100 bg-white shadow-lg">
          <div className="px-4 py-3 border-b border-green-100 bg-[#2D5A27] rounded-none">
            <span className="font-semibold text-white text-[15px]">
              {t("notification.title")}
            </span>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-white text-[#2D5A27] text-[11px] font-bold">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

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
                className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 cursor-pointer ${
                  n.isRead
                    ? "bg-white hover:bg-gray-50"
                    : "bg-[#F4F7F4] hover:bg-green-100"
                }`}
              >
                <div className="mt-1 flex-shrink-0 w-2.5">
                  {!n.isRead && (
                    <span className="block h-2.5 w-2.5 rounded-full bg-[#2D5A27]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm leading-snug ${
                      n.isRead
                        ? "text-gray-700 font-normal"
                        : "text-[#2D5A27] font-semibold"
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

export default TechnicianNotificationBell;