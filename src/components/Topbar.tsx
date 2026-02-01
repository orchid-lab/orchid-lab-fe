/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef, useState as useStateReact } from "react";
import { FaBell, FaEnvelope } from "react-icons/fa";
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
      return "bg-blue-500";
    case "technician":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

export default function Topbar() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;

      try {
        const response = await axiosInstance.get<User>(
          `/api/user/${authUser.id}`,
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data in Topbar:", error);
        // Fallback to authUser if API fails
        setUser(authUser);
      }
    };

    fetchUserData();
  }, [authUser]);

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  return (
    <header className="h-16 fixed top-0 left-64 right-0 z-20 bg-gradient-to-r from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-gray-900/30 dark:to-gray-800 shadow-md backdrop-blur-sm flex items-center justify-between px-8 border-b border-blue-100 dark:border-gray-700">
      {/* Left side - Decorative elements */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Right side - User section */}
      <div className="flex items-center gap-4">
        {/* Notification bell with dropdown */}
        <div style={{ position: "relative" }}>
          <NotificationBell />
        </div>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-blue-50/40 dark:hover:bg-gray-700 transition-all duration-300 group">
          <FaEnvelope className="text-gray-400 dark:text-gray-200 text-xl group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Selector */}
        <LanguageSelector />

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

        {/* User section */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 px-4 py-2 rounded-lg group"
          onClick={handleAvatarClick}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md transition-transform duration-300 group-hover:scale-110 object-cover"
              />
            ) : (
              <div className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-semibold transition-transform duration-300 group-hover:scale-110">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-white dark:border-gray-700`}
            ></div>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
              {user?.name || t("common.loading")}
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
