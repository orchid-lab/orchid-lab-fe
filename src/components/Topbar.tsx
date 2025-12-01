import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaUserCircle, FaBell, FaEnvelope } from "react-icons/fa";

function getRoleName(roleID: number) {
  switch (roleID) {
    case 1:
      return "Admin";
    case 2:
      return "Researcher";
    case 3:
      return "Technician";
    default:
      return "Khác";
  }
}

function getRoleBadgeColor(roleID: number) {
  switch (roleID) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-blue-500";
    case 3:
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="h-16 fixed top-0 left-64 right-0 z-20 bg-gradient-to-r from-white via-green-50/30 to-white shadow-md backdrop-blur-sm flex items-center justify-between px-8 border-b border-green-100">
      {/* Left side - Decorative elements */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
        <span className="text-gray-500 text-sm font-medium">
          {new Date().toLocaleDateString("vi-VN", { 
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
        <button className="relative p-2 rounded-lg hover:bg-green-100/50 transition-all duration-300 group">
          <FaBell className="text-gray-600 text-xl group-hover:text-green-600 transition-colors duration-300 group-hover:rotate-12 transform" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-green-100/50 transition-all duration-300 group">
          <FaEnvelope className="text-gray-600 text-xl group-hover:text-green-600 transition-colors duration-300" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            <img
              src={user?.avatarUrl ?? "https://i.pravatar.cc/40"}
              alt="User avatar"
              className="relative w-10 h-10 rounded-full border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-110"
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${getRoleBadgeColor(user?.roleID ?? 0)} rounded-full border-2 border-white`}></div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              className="flex flex-col cursor-pointer hover:bg-green-50 transition-all duration-300 px-4 py-2 rounded-lg group"
              onClick={() => setOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium group-hover:text-green-700 transition-colors duration-300">
                  {user?.name}
                </span>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="text-gray-500 text-xs">
                {getRoleName(user?.roleID ?? 0)}
              </span>
            </div>

            {/* Dropdown menu with animation */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 origin-top-right ${
                open 
                  ? "opacity-100 scale-100 translate-y-0" 
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="p-2">
                <button
                  type="button"
                  className="flex items-center w-full text-left px-4 py-2.5 hover:bg-green-50 rounded-lg transition-all duration-200 group"
                  onClick={() => {
                    setOpen(false);
                    void navigate("/profile");
                  }}
                >
                  <FaUserCircle className="text-gray-600 mr-3 group-hover:text-green-600 transition-colors duration-200" />
                  <span className="text-gray-700 group-hover:text-green-700 font-medium">Profile</span>
                </button>
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <button
                  type="button"
                  className="flex items-center w-full text-left px-4 py-2.5 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  <FaSignOutAlt className="text-red-500 mr-3 group-hover:text-red-600 transition-colors duration-200" />
                  <span className="text-red-600 group-hover:text-red-700 font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}