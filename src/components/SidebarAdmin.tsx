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
} from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth";

function getRoleName(role: string | undefined, t: (key: string) => string) {
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

export default function SidebarDemo() {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;

      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data in Sidebar:', error);
        setUser(authUser);
      }
    };

    void fetchUserData();
  }, [authUser]);

  const menuItems = [
    { path: "/admin/user", icon: FaUser, labelKey: "user.userManagement" },
    { path: "/admin/tasks", icon: FaTasks, labelKey: "navigation.task" },
    { path: "/admin/experiment-log", icon: FaClipboardList, labelKey: "navigation.experimentLog" },
    { path: "/admin/tissue-culture-batches", icon: FaVials, labelKey: "navigation.tissueCultureBatch" },
    { path: "/admin/report", icon: FaChartBar, labelKey: "navigation.report" },
    { path: "/admin/method", icon: PiBlueprintFill, labelKey: "navigation.method" },
    { path: "/admin/seedling", icon: FaSeedling, labelKey: "navigation.seedling" },
    { path: "/admin/element", icon: FaFlask, labelKey: "navigation.element" },
  ];

  const filteredItems = menuItems.filter(item =>
    t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 h-screen fixed top-0 left-0 z-30 flex flex-col bg-[#1a1d29] text-gray-300">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <GiMicroscope className="text-white text-lg" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">
              OrchidLab
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              placeholder="What to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#252836] text-gray-300 text-sm rounded-lg pl-9 pr-3 py-2.5 border border-transparent focus:border-gray-600 focus:outline-none placeholder-gray-500"
            />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Navigation
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-0.5 group ${
                    isActive 
                      ? "bg-[#252836] text-white" 
                      : "text-white hover:bg-[#252836] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-base ${isActive ? "text-blue-500" : ""}`}>
                      <Icon />
                    </span>
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Access Controls Section */}
        <div className="px-4 pt-4 pb-2 border-t border-gray-700/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Access Controls
          </p>
        </div>

        {/* User Profile */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#252836] relative">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-[#252836]`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name ?? t('common.loading')}
              </p>
              <p className="text-xs text-gray-500">
                {getRoleName(user?.role, t)}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full group"
          >
            <span className="text-base">
              <FaSignOutAlt />
            </span>
            <span className="text-sm font-medium">{t('common.logout')}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}