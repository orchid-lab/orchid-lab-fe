import { NavLink } from "react-router-dom";
import {
  FaTasks,
  FaClipboardList,
  FaChartBar,
  FaFlask,
  FaSeedling,
  FaVials,
  FaUser,
} from "react-icons/fa";
import { PiBlueprintFill } from "react-icons/pi";
import { GiMicroscope } from "react-icons/gi";

export default function SidebarAdmin() {
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
        <NavLink
          to="/admin/user"
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
                <FaUser />
              </span>
              <span>Người dùng</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/tasks"
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
                <FaTasks />
              </span>
              <span>Nhiệm vụ</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/experiment-log"
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
                <FaClipboardList />
              </span>
              <span>Nhật ký thí nghiệm</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/labroom"
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
                <GiMicroscope />
              </span>
              <span>Phòng thực nghiệm</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/tissue-culture-batches"
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
                <FaVials />
              </span>
              <span>Lô cấy mô</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/report"
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
                <FaChartBar />
              </span>
              <span>Báo cáo</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/method"
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
                <PiBlueprintFill />
              </span>
              <span>Phương pháp lai</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/seedling"
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
                <FaSeedling />
              </span>
              <span>Cây giống</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/admin/element"
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
                <FaFlask />
              </span>
              <span>Nguyên vật liệu</span>
            </>
          )}
        </NavLink>
      </nav>

    </aside>
  );
}