import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

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
    <header className="h-16 fixed top-0 left-64 right-0 z-20 bg-white shadow flex items-center justify-end px-8">
      <div className="flex items-center">
        <img
          src={user?.avatarUrl ?? "https://i.pravatar.cc/40"}
          alt="User avatar"
          className="w-10 h-10 rounded-full border-2 border-gray-300"
        />
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex flex-col cursor-pointer hover:bg-gray-200 transition-opacity duration-300 px-3 py-1 rounded ml-4"
            onClick={() => setOpen((v) => !v)}
          >
            <span className=" text-gray-600">{user?.name}</span>
            <span className=" text-gray-600 text-xs">
              {getRoleName(user?.roleID ?? 0)}
            </span>
          </div>
          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
              <button
                type="button"
                className="block cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  void navigate("/profile");
                }}
              >
                <FaUserCircle className="inline mr-2" />
                Profile
              </button>
              <button
                type="button"
                className="block cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                <FaSignOutAlt className="inline mr-2" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
