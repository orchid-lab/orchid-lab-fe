/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
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
    <aside className="sidebar-researcher w-full md:w-64 h-screen fixed top-0 left-0 z-30 flex flex-col bg-[#003456] text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-6" style={{ borderBottom: "1px solid rgba(0,206,209,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <GiMicroscope style={{ color: "#ffffff", fontSize: "1.125rem" }} />
          </div>
          <span style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
            OrchidLab
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-2 pt-2 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.nameKey}
              to={tab.path}
            >
              {({ isActive }) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    marginBottom: "0.5rem",
                    transition: "all 0.2s",
                    borderLeft: isActive ? "4px solid #00CED1" : "4px solid transparent",
                    backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                    }
                    // force icon color
                    const icon = e.currentTarget.querySelector(".nav-icon") as HTMLElement;
                    if (icon) icon.style.color = "#00CED1";
                    const text = e.currentTarget.querySelector(".nav-text") as HTMLElement;
                    if (text) text.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                    const icon = e.currentTarget.querySelector(".nav-icon") as HTMLElement;
                    if (icon) icon.style.color = isActive ? "#00CED1" : "rgba(0,206,209,0.7)";
                    const text = e.currentTarget.querySelector(".nav-text") as HTMLElement;
                    if (text) text.style.color = isActive ? "#ffffff" : "rgba(255,255,255,0.6)";
                  }}
                >
                  <span
                    className="nav-icon"
                    style={{
                      fontSize: "1rem",
                      color: isActive ? "#00CED1" : "rgba(0,206,209,0.7)",
                      flexShrink: 0,
                      transition: "color 0.2s",
                    }}
                  >
                    <Icon />
                  </span>
                  <span
                    className="nav-text"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                      transition: "color 0.2s",
                    }}
                  >
                    {t(tab.nameKey)}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(0,206,209,0.2)" }}>
        <div className="flex items-center gap-3 mb-4">
          {displayUser?.avatarUrl ? (
            <img
              src={displayUser.avatarUrl}
              alt={displayUser?.name || "User Avatar"}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: "1px solid rgba(0,206,209,0.3)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}

          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              displayUser?.avatarUrl ? "hidden" : ""
            }`}
            style={{ backgroundColor: "rgba(0,206,209,0.2)", color: "#00CED1" }}
          >
            {userInitials}
          </div>

          <div>
            <p style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600 }}>
              {displayUser?.name || t("common.loading")}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{userRole}</p>
          </div>
        </div>

        <LogoutButton onClick={handleLogout} label={t("common.logout")} />
      </div>
    </aside>
  );
}

function LogoutButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.625rem 0.75rem",
        borderRadius: "0.75rem",
        transition: "all 0.2s",
        width: "100%",
        background: hovered ? "rgba(255,111,97,0.1)" : "transparent",
        color: hovered ? "#FF6F61" : "#ffffff",
        border: "none",
        cursor: "pointer",
      }}
    >
      <FaSignOutAlt style={{ fontSize: "1rem", color: "inherit" }} />
      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</span>
    </button>
  );
}