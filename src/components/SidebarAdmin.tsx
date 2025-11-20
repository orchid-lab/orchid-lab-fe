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
    <aside className="w-64 h-screen fixed top-0 left-0 z-30 shadow flex flex-col bg-green-800">
      <div className="h-16 flex items-center justify-center font-bold text-xl text-white border-b border-white/40">
        OrchidLab
      </div>
      <nav className="flex-1 py-4 text-white">
        <NavLink
          to="/admin/user"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaUser />
          </span>
          <span>Người dùng</span>
        </NavLink>
        <NavLink
          to="/admin/tasks"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaTasks />
          </span>
          <span>Nhiệm vụ</span>
        </NavLink>
        <NavLink
          to="/admin/experiment-log"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaClipboardList />
          </span>
          <span>Nhật ký thí nghiệm</span>
        </NavLink>
        <NavLink
          to="/admin/labroom"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <GiMicroscope />
          </span>
          <span>Phòng thực nghiệm</span>
        </NavLink>
        <NavLink
          to="/admin/tissue-culture-batches"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaVials />
          </span>
          <span>Lô cấy mô</span>
        </NavLink>
        <NavLink
          to="/admin/report"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaChartBar />
          </span>
          <span>Báo cáo</span>
        </NavLink>
        <NavLink
          to="/admin/method"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <PiBlueprintFill />
          </span>
          <span>Phương pháp lai</span>
        </NavLink>
        <NavLink
          to="/admin/seedling"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaSeedling />
          </span>
          <span>Cây giống</span>
        </NavLink>
        <NavLink
          to="/admin/element"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3 hover:bg-white/10 transition ${
              isActive ? "bg-white/20 font-semibold" : ""
            }`
          }
        >
          <span className="text-lg">
            <FaFlask />
          </span>
          <span>Nguyên vật liệu</span>
        </NavLink>
      </nav>
    </aside>
  );
}
