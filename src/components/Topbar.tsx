/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth";
import { useTranslation } from "react-i18next";

function getRoleName(role: string | undefined, t: any) {
  return role ?? t("common.other");
}

function getRoleBadgeColor(role: string | undefined) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-500";
    case "researcher":
      return "bg-red-600"; // Đổi sang đỏ
    case "technician":
      return "bg-red-400"; // Đổi sang đỏ nhạt hơn
    default:
      return "bg-gray-500";
  }
}

export default function Topbar() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;
      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data in Topbar:", error);
        setUser(authUser);
      }
    };
    fetchUserData();
  }, [authUser]);

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  return (
    // Thay đổi gradient: blue-50/30 -> red-50/30 và border-blue-100 -> border-red-100
    <header className="topbar-header h-16 fixed top-0 right-0 z-20 bg-gradient-to-r from-white via-red-50/30 to-white dark:from-gray-800 dark:via-gray-900/30 dark:to-gray-800 shadow-md backdrop-blur-sm flex items-center justify-between px-8 border-b border-red-100 dark:border-gray-700">
      
      {/* Left side - Decorative elements (Chuyển chấm tròn sang màu đỏ) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <ThemeToggle />
        <LanguageSelector />

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

        {/* User section - Hover sang màu đỏ */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-300 px-4 py-2 rounded-lg group"
          onClick={handleAvatarClick}
        >
          <div className="relative group">
            {/* Glow effect sang màu đỏ */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md transition-transform duration-300 group-hover:scale-110 object-cover"
              />
            ) : (
              // Placeholder avatar sang màu đỏ
              <div className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-700 font-semibold transition-transform duration-300 group-hover:scale-110">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-white dark:border-gray-700`}></div>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors duration-300">
              {user?.name ?? t("common.loading")}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {getRoleName(user?.role, t)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}