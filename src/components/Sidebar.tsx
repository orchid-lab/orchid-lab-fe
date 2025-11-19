import { NavLink } from "react-router-dom";
import {
  FaFlask,
  FaTasks,
  FaBook,
  FaSeedling,
  FaChartBar,
} from "react-icons/fa";

const tabs = [
  { name: "Method", path: "/method", icon: <FaFlask /> },
  { name: "Tasks", path: "/tasks", icon: <FaTasks /> },
  { name: "Experiment Log", path: "/experiment-log", icon: <FaBook /> },
  { name: "Seedlings", path: "/seedlings", icon: <FaSeedling /> },
  { name: "Reports", path: "/reports", icon: <FaChartBar /> },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shadow flex flex-col bg-green-800">
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
