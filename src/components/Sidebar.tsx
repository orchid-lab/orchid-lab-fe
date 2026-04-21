/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable react-dom/no-missing-button-type */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaTasks, FaBook, FaSeedling, FaChartBar, FaSignOutAlt } from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/Auth"; 

const tabs = [
  { nameKey: "navigation.method", path: "/researcher/method", icon: PiBlueprintFill },
  { nameKey: "navigation.task", path: "/researcher/tasks", icon: FaTasks },
  { nameKey: "navigation.experimentLog", path: "/researcher/experiment-log", icon: FaBook },
  { nameKey: "navigation.seedling", path: "/researcher/seedlings", icon: FaSeedling },
  { nameKey: "navigation.report", path: "/researcher/reports", icon: FaChartBar },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { logout, user: authUser } = useAuth();
  
  const [fullUser, setFullUser] = useState<User | null>(null);

  // Gọi API lấy dữ liệu chi tiết của user
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) return;
      try {
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        setFullUser(response.data);
      } catch (error) {
        console.error("Error fetching user data in Sidebar:", error);
        setFullUser(authUser as User); 
      }
    };

    void fetchUserData();
  }, [authUser]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
  };

  const filteredTabs = tabs;

  // Dùng fullUser để render UI thay vì authUser
  const displayUser = fullUser || authUser;

  const userInitials = displayUser?.name
    ? displayUser.name
        .split(" ")
        .map((namePart) => namePart[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("")
    : "UL";
  const userRole = displayUser?.role ? displayUser.role : "Quản trị viên";

  return (
    <aside className="w-full md:w-64 h-screen fixed top-0 left-0 z-30 flex flex-col bg-[#003456] text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#00CED1]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <GiMicroscope className="text-white text-lg" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">
            OrchidLab
          </span>
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-2 pt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00CED1]/40 scrollbar-track-transparent">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.nameKey}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                  isActive
                    ? "bg-white/15 text-white font-semibold border-l-4 border-[#00CED1] shadow-sm"
                    : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-base ${isActive ? "text-[#00CED1]" : "text-[#00CED1]/70"}`}>
                    <Icon />
                  </span>
                  <span className="text-sm font-medium">{t(tab.nameKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="mt-auto px-4 py-4 border-t border-[#00CED1]/20">
        <div className="mb-4 flex items-center gap-3">
          {/* Avatar hiển thị ở đây */}
          {displayUser?.avatarUrl ? (
            <img
              src={displayUser.avatarUrl}
              alt={displayUser?.name || "User Avatar"}
              className="w-10 h-10 rounded-full object-cover border border-[#00CED1]/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          <div 
            className={`w-10 h-10 rounded-full bg-[#00CED1]/20 flex items-center justify-center text-[#00CED1] font-bold ${displayUser?.avatarUrl ? 'hidden' : ''}`}
          >
            {userInitials}
          </div>

          <div>
            <p className="text-white text-sm font-semibold leading-tight line-clamp-1">
              {displayUser?.name || t("common.loading")}
            </p>
            <p className="text-blue-100 text-xs">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-white hover:bg-[#FF6F61]/10 hover:text-[#FF6F61]"
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