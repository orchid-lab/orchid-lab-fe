import { NavLink } from "react-router-dom";
import { FaTasks, FaBook, FaSeedling, FaChartBar } from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";

const tabs = [
  { name: "Phương pháp lai", path: "/method", icon: <PiBlueprintFill /> },
  { name: "Nhiệm vụ", path: "/tasks", icon: <FaTasks /> },
  { name: "Nhật ký thí nghiệm", path: "/experiment-log", icon: <FaBook /> },
  { name: "Cây giống", path: "/seedlings", icon: <FaSeedling /> },
  { name: "Báo cáo", path: "/reports", icon: <FaChartBar /> },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen fixed top-0 left-0 z-30 shadow flex flex-col bg-green-800">
      <div className="h-16 flex items-center justify-center font-bold text-xl text-white border-b border-white/40">
        OrchidLab
      </div>
      <nav className="flex-1 py-4 text-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
                isActive ? "bg-white/20 font-semibold" : ""
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
