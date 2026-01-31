import { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaCheckDouble, FaBell } from "react-icons/fa";
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

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<Notification[]>("/api/notification");
      setNotifications(response.data);
    } catch (error) {
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

  const getNotificationIcon = (type?: string) => {
    const baseClasses = "w-1.5 h-1.5 rounded-full";
    switch (type) {
      case "success":
        return <div className={`${baseClasses} bg-emerald-500`} />;
      case "error":
        return <div className={`${baseClasses} bg-rose-500`} />;
      case "warning":
        return <div className={`${baseClasses} bg-amber-500`} />;
      default:
        return <div className={`${baseClasses} bg-blue-500`} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-16 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-6 top-20 w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-xl dark:shadow-2xl z-50 max-h-[calc(100vh-6rem)] flex flex-col border border-gray-200 dark:border-gray-800 animate-slide-in overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('notification.title') || 'Thông báo'}
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Đóng"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto minimal-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <FaBell className="text-xl text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {t('notification.empty') || 'Không có thông báo'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bạn đã xem hết thông báo
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group px-6 py-4 transition-colors ${
                    !notification.isRead
                      ? "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-850"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Indicator */}
                    <div className="pt-1.5 flex-shrink-0">
                      {!notification.isRead ? (
                        getNotificationIcon(notification.type)
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Đánh dấu đã đọc"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      
                      <time className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(notification.createdAt).toLocaleString("vi-VN", {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FaCheckDouble className="text-xs" />
              {t('notification.markAllAsRead') || 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }

        .minimal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .dark .minimal-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }

        .minimal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .dark .minimal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </>
  );
}