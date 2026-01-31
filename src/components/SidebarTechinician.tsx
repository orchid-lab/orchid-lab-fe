/* eslint-disable react-dom/no-missing-button-type */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaTasks, FaChartBar, FaFlask, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { nameKey: "navigation.task", path: "/technician/tasks", icon: FaTasks },
  { nameKey: "navigation.sample", path: "/technician/samples", icon: FaFlask },
  { nameKey: "navigation.report", path: "/technician/reports", icon: FaChartBar },
];

export default function SidebarTechnician() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTabs = tabs.filter(tab =>
    t(tab.nameKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          
          return (
            <NavLink
              key={tab.nameKey}
              to={tab.path}
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
                  <span className="text-sm font-medium">{t(tab.nameKey)}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="px-4 pt-4 pb-2 border-t border-gray-700/50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
          Account
        </p>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-4">
        <button
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
  );
}