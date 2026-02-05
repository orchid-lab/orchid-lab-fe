/* eslint-disable react-dom/no-missing-button-type */
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaTasks, FaBook, FaChartBar, FaFlask, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth";

const tabs = [
  { nameKey: "navigation.task", path: "/technician/tasks", icon: FaTasks },
  { nameKey: "navigation.experimentLog", path: "/technician/experiment-log", icon: FaBook },
  { nameKey: "navigation.sample", path: "/technician/samples", icon: FaFlask },
  { nameKey: "navigation.report", path: "/technician/reports", icon: FaChartBar },
];


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

export default function SidebarTechnician() {
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
        console.error('Error fetching user data in Sidebar:', error);
        setUser(authUser);
      }
    };

    void fetchUserData();
  }, [authUser]);

  // Update body data attribute when sidebar collapse state changes
  useEffect(() => {
    document.body.setAttribute('data-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const filteredTabs = tabs.filter(tab =>
    t(tab.nameKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside 
      className={`sidebar-modern ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} h-screen fixed top-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="sidebar-header h-16 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <span className="sidebar-title text-lg font-bold tracking-tight">
              OrchidLab
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle p-2 rounded-lg hover:bg-opacity-10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 overflow-y-auto sidebar-scrollbar">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          
          return (
            <NavLink
              key={tab.nameKey}
              to={tab.path}
              className={({ isActive }) => 
                `sidebar-nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 mb-1 group relative ${
                  isActive ? "sidebar-nav-item-active" : ""
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? t(tab.nameKey) : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`sidebar-nav-icon text-lg ${isActive ? "sidebar-nav-icon-active" : ""}`}>
                    <Icon />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="sidebar-nav-text text-sm font-medium flex-1">{t(tab.nameKey)}</span>
                      {isActive && (
                        <span className="sidebar-nav-indicator"></span>
                      )}
                    </>
                  )}
                  {isCollapsed && isActive && (
                    <div className="sidebar-nav-tooltip">
                      {t(tab.nameKey)}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom border-t">
        {/* User Profile */}
        <div className={`sidebar-profile px-3 py-3 border-t ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="sidebar-avatar w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="sidebar-avatar-placeholder w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
              )}
              <div className={`sidebar-status-dot ${getRoleBadgeColor(user?.role)}`}></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="sidebar-profile-name text-sm font-semibold truncate">
                  {user?.name ?? t('common.loading')}
                </p>
                <p className="sidebar-profile-email text-xs truncate opacity-60">
                  {user?.email ?? 'brooklyn@simmons.com'}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={logout}
                className="sidebar-logout-btn p-1.5 rounded-md transition-colors"
                title="Logout"
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