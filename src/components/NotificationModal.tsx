import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axiosInstance from "../api/axiosInstance";
import { markNotificationAsRead } from "../api/notificationService";
import type { Notification } from "../types/Notification";
import { useSnackbar } from "notistack";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<Notification[]>("/api/notification");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      enqueueSnackbar(t('notification.fetchError') || "Lỗi tải thông báo", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      enqueueSnackbar(t('notification.markedAsRead') || "Đánh dấu đã đọc", {
        variant: "success",
        autoHideDuration: 2000,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      enqueueSnackbar(t('notification.markAsReadError') || "Lỗi đánh dấu thông báo", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    try {
      for (const id of unreadIds) {
        await markNotificationAsRead(id);
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      enqueueSnackbar(t('notification.allMarkedAsRead') || "Tất cả đánh dấu đã đọc", {
        variant: "success",
        autoHideDuration: 2000,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      enqueueSnackbar(t('notification.markAllAsReadError') || "Lỗi đánh dấu tất cả thông báo", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationTypeColor = (type?: string) => {
    switch (type) {
      case "success":
        return "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10";
      case "error":
        return "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      default:
        return "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10";
    }
  };

  const getNotificationTypeIcon = (type?: string) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed right-8 top-20 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 max-h-96 flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {t('notification.title') || 'Thông báo'}
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount} {t('notification.unread') || 'chưa đọc'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <p>{t('notification.empty') || 'Không có thông báo'}</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg transition-all ${getNotificationTypeColor(
                    notification.type
                  )} ${!notification.isRead ? "ring-1 ring-blue-300 dark:ring-blue-600" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 hover:bg-white/40 dark:hover:bg-gray-700/40 rounded transition-colors flex-shrink-0"
                        title={t('notification.markAsRead') || "Đánh dấu đã đọc"}
                      >
                        <FaCheck className="text-blue-600 dark:text-blue-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <FaCheckDouble className="text-sm" />
              {t('notification.markAllAsRead') || 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
