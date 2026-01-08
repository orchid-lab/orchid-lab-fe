import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaTasks, FaChartBar, FaFlask } from "react-icons/fa";
import { GiMicroscope } from "react-icons/gi";
import { useTranslation } from "react-i18next";

const tabs = [
  { nameKey: "navigation.task", path: "/technician/tasks", icon: <FaTasks /> },
  { nameKey: "navigation.sample", path: "/technician/samples", icon: <FaFlask /> },
  { nameKey: "navigation.report", path: "/technician/reports", icon: <FaChartBar /> },
];

export default function SidebarTechnician() {
  const { t } = useTranslation();
  const [mouseY, setMouseY] = useState(0);

  const handleMouseMove = (e: { currentTarget: { getBoundingClientRect: () => any; }; clientY: number; }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  };

  return (
    <aside 
      className="w-64 h-screen fixed top-0 left-0 z-30 shadow-2xl flex flex-col bg-gradient-to-b from-green-800 via-green-800 to-green-900 overflow-hidden group/sidebar"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight effect theo chuột */}
      <div 
        className="absolute left-1/2 w-64 h-64 bg-green-400/20 rounded-full blur-3xl pointer-events-none opacity-0 group-hover/sidebar:opacity-100 -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${mouseY}px`,
          transition: 'opacity 0.3s'
        }}
      ></div>

      <div className="absolute top-10 -left-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl group-hover/sidebar:bg-green-500/20 transition-all duration-700"></div>
      <div className="absolute bottom-20 -right-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl group-hover/sidebar:bg-green-500/20 transition-all duration-700"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-700"></div>
      
      {/* Header */}
      <div className="h-16 flex items-center justify-center font-bold text-2xl text-white border-b border-white/20 backdrop-blur-sm relative z-10 group/header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover/header:rotate-12 group-hover/header:scale-110 group-hover/header:bg-white/30 transition-all duration-300">
            <GiMicroscope className="text-white text-xl" />
          </div>
          <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent group-hover/header:from-green-50 group-hover/header:to-white transition-all duration-300">
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
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="text-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative z-10">
                  {tab.icon}
                </span>
                <span className="relative z-10">{t(tab.nameKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}