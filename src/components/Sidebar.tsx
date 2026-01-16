import { NavLink } from "react-router-dom";
import { FaTasks, FaBook, FaSeedling, FaChartBar, FaSignOutAlt } from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const tabs = [
  { nameKey: "navigation.method", path: "/method", icon: <PiBlueprintFill /> },
  { nameKey: "navigation.task", path: "/tasks", icon: <FaTasks /> },
  { nameKey: "navigation.experimentLog", path: "/experiment-log", icon: <FaBook /> },
  { nameKey: "navigation.seedling", path: "/seedlings", icon: <FaSeedling /> },
  { nameKey: "navigation.report", path: "/reports", icon: <FaChartBar /> },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/authentication/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        
        logout();
      } else {
        console.error('Logout failed:', await response.text());
        // Vẫn logout ở client side ngay cả khi API fail
        logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn logout ở client side ngay cả khi có lỗi
      logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 z-30 shadow-2xl flex flex-col bg-gradient-to-b from-green-800 via-green-800 to-green-900 overflow-hidden">
      <div className="absolute top-10 -left-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 -right-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="h-16 flex items-center justify-center font-bold text-2xl text-white border-b border-white/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <GiMicroscope className="text-white text-xl" />
          </div>
          <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
            OrchidLab
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 text-white relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {tabs.map((tab) => (
          <NavLink
            key={tab.nameKey}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl hover:bg-white/15 hover:translate-x-1 transition-all duration-300 mb-1 group relative overflow-hidden ${
                isActive ? "bg-white/25 font-semibold shadow-lg" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                )}
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                  {tab.icon}
                </span>
                <span>{t(tab.nameKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-white/20 relative z-10">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl hover:bg-red-500/20 hover:translate-x-1 transition-all duration-300 w-full text-left group text-white ${
            isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-lg group-hover:scale-110 transition-transform duration-300">
            <FaSignOutAlt className={isLoggingOut ? 'animate-spin' : ''} />
          </span>
          <span>{isLoggingOut ? t('common.loggingOut') || 'Đang đăng xuất...' : t('common.logout')}</span>
        </button>
      </div>
    </aside>
  );
}