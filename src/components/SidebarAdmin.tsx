import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTasks,
  FaClipboardList,
  FaChartBar,
  FaFlask,
  FaSeedling,
  FaVials,
  FaUser,
  FaSignOutAlt,
  FaSearch,
  FaCog,
  FaVirus,
} from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth";
import './SidebarAdmin.css';

function getRoleBadgeColor(role: string | undefined) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-600";
    case "researcher":
      return "bg-red-400";
    case "technician":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

export default function SidebarAdmin() {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;
      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data in Sidebar:", error);
        setUser(authUser);
      }
    };
    void fetchUserData();
  }, [authUser]);

  useEffect(() => {
    document.body.setAttribute("data-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const menuItems = [
    { path: "/admin/user", icon: FaUser, labelKey: "user.userManagement" },
    { path: "/admin/tasks", icon: FaTasks, labelKey: "navigation.task" },
    { path: "/admin/experiment-log", icon: FaClipboardList, labelKey: "navigation.experimentLog" },
    { path: "/admin/tissue-culture-batches", icon: FaVials, labelKey: "navigation.tissueCultureBatch" },
    { path: "/admin/report", icon: FaChartBar, labelKey: "navigation.report" },
    { path: "/admin/method", icon: PiBlueprintFill, labelKey: "navigation.method" },
    { path: "/admin/disease", icon: FaVirus, labelKey: "navigation.disease" },
    { path: "/admin/seedling", icon: FaSeedling, labelKey: "navigation.seedling" },
    { path: "/admin/element", icon: FaFlask, labelKey: "navigation.element" },
    { path: "/admin/config", icon: FaCog, labelKey: "navigation.config" },
  ];

  const filteredItems = menuItems.filter((item) =>
    t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <aside
        className={`sidebar-modern sidebar-admin ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"} h-screen fixed top-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out border-r border-red-100 dark:border-gray-800 bg-white dark:bg-gray-900`}
      >
      {/* Header */}
      <div className="sidebar-header h-16 flex items-center justify-between px-4 border-b border-red-50 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-200 dark:shadow-none">
            <GiMicroscope className="text-white text-lg" />
          </div>
          {!isCollapsed && (
            <span className="sidebar-title text-lg font-bold tracking-tight text-gray-800 dark:text-white">
              Orchid<span className="text-red-600">Lab</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle p-2 rounded-lg text-gray-500 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-3 py-4">
          <div className="sidebar-search relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-red-400 opacity-70" />
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border-0 outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 overflow-y-auto sidebar-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 mb-1 group relative ${
                  isActive
                    ? "active text-red-700 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                } ${isCollapsed ? "justify-center" : ""}`
              }
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`sidebar-nav-icon text-lg transition-colors ${
                      isActive ? "text-red-600" : ""
                    }`}
                  >
                    <Icon />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="sidebar-nav-text text-sm font-medium flex-1">
                        {t(item.labelKey)}
                      </span>
                      {isActive && (
                        <span className="absolute right-2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom border-t border-red-50 dark:border-gray-800">
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest px-2 text-gray-400">
              User Account
            </p>
          </div>
        )}

        {/* User Profile */}
        <div className={`sidebar-profile px-3 py-3 ${isCollapsed ? "flex justify-center" : ""}`}>
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-red-100 dark:border-gray-700 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-white dark:border-gray-900 shadow-sm`}
              ></div>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                  {user?.name ?? "Loading..."}
                </p>
                <p className="text-xs text-gray-500 truncate uppercase font-medium">
                  {user?.role ?? "User"}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="sidebar-logout-btn p-2 rounded-lg transition-all"
                title={t("common.logout")}
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}