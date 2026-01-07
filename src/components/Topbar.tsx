import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaUserCircle, FaBell, FaEnvelope } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth";
import { useTranslation } from 'react-i18next';

function getRoleName(role: string | undefined) {
  return role || "Khác";
}

function getRoleBadgeColor(role: string | undefined) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-500";
    case "researcher":
      return "bg-blue-500";
    case "technician":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

export default function Topbar() {
  const { user: authUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;

      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data in Topbar:', error);
        // Fallback to authUser if API fails
        setUser(authUser);
      }
    };

    fetchUserData();
  }, [authUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <header className="h-16 fixed top-0 left-64 right-0 z-20 bg-gradient-to-r from-white via-green-50/30 to-white dark:from-gray-800 dark:via-gray-900/30 dark:to-gray-800 shadow-md backdrop-blur-sm flex items-center justify-between px-8 border-b border-green-100 dark:border-gray-700">
      {/* Left side - Decorative elements */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </span>
      </div>

      {/* Right side - User section */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-green-50/40 dark:hover:bg-gray-700 transition-all duration-300 group">
          <FaBell className="text-gray-400 dark:text-gray-200 text-xl group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors duration-300 group-hover:rotate-12 transform" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-green-50/40 dark:hover:bg-gray-700 transition-all duration-300 group">
          <FaEnvelope className="text-gray-400 dark:text-gray-200 text-xl group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors duration-300" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Selector */}
        <LanguageSelector />

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md transition-transform duration-300 group-hover:scale-110 object-cover"
              />
            ) : (
              <div className="relative w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-md bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-green-700 font-semibold transition-transform duration-300 group-hover:scale-110">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-white dark:border-gray-700`}></div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              className="flex flex-col cursor-pointer hover:bg-green-50 dark:hover:bg-gray-700 transition-all duration-300 px-4 py-2 rounded-lg group"
              onClick={() => setOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors duration-300">
                  {user?.name || 'Loading...'}
                </span>
                <svg 
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {getRoleName(user?.role)}
              </span>
            </div>

            {/* Dropdown menu with animation */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 origin-top-right ${
                open 
                  ? "opacity-100 scale-100 translate-y-0" 
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="p-2">
                <button
                  type="button"
                  className="flex items-center w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                  onClick={() => {
                    setOpen(false);
                    void navigate("/profile");
                  }}
                >
                  <FaUserCircle className="text-gray-600 dark:text-gray-300 mr-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200" />
                  <span className="text-gray-700 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400 font-medium">{t('common.profile')}</span>
                </button>
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
                <button
                  type="button"
                  className="flex items-center w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  <FaSignOutAlt className="text-red-500 mr-3 group-hover:text-red-600 transition-colors duration-200" />
                  <span className="text-red-600 group-hover:text-red-700 font-medium">{t('common.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}