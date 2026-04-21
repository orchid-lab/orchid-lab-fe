/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search, X, ClipboardList, CheckCircle2,
  XCircle, AlertTriangle, PlayCircle, Circle,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
} from "chart.js";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import "./AdminTasks.css";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

/* ─── Types ───────────────────────────────────────────── */
interface ApiTask {
  id: string;
  name: string;
  description?: string;
  stageId: number | null;
  taskTargetType: string | null;
  targetId: string | null;
  researcherId: string | null;
  technicianId: string | null;
  status: string;
  expectedEndDate: string | null;
  createdDate: string;
}

interface ApiTaskListResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: ApiTask[];
}

interface Task {
  id: string;
  name: string;
  description: string;
  researcherId: string | null;
  technicianId: string | null;
  targetId: string | null;
  taskTargetType: string | null;
  status: StatusType;
  expectedEndDate: string | null;
  createdDate: string;
}

type StatusType =
  | "Template" | "InProgress" | "Completed" | "Deleted"
  | "Assigned" | "Taken" | "InProcess"
  | "DoneInTime" | "DoneInLate" | "Cancel";

/* ─── Status config ───────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  textClass: string; bgClass: string; borderClass: string;
  icon: React.ElementType; label: string;
}> = {
  Template:   { textClass: "text-slate-600",  bgClass: "bg-slate-50",  borderClass: "border-slate-200",  icon: Circle,        label: "Template" },
  InProgress: { textClass: "text-amber-700",  bgClass: "bg-amber-50",  borderClass: "border-amber-200",  icon: PlayCircle,    label: "Đang thực hiện" },
  Completed:  { textClass: "text-emerald-700",bgClass: "bg-emerald-50",borderClass: "border-emerald-200",icon: CheckCircle2,  label: "Hoàn thành" },
  Deleted:    { textClass: "text-rose-700",   bgClass: "bg-rose-50",   borderClass: "border-rose-200",   icon: XCircle,       label: "Đã xóa" },
  Assigned:   { textClass: "text-blue-700",   bgClass: "bg-blue-50",   borderClass: "border-blue-200",   icon: Circle,        label: "Được giao" },
  Taken:      { textClass: "text-purple-700", bgClass: "bg-purple-50", borderClass: "border-purple-200", icon: ClipboardList, label: "Đã nhận" },
  InProcess:  { textClass: "text-amber-700",  bgClass: "bg-amber-50",  borderClass: "border-amber-200",  icon: PlayCircle,    label: "Đang xử lý" },
  DoneInTime: { textClass: "text-emerald-700",bgClass: "bg-emerald-50",borderClass: "border-emerald-200",icon: CheckCircle2,  label: "Xong đúng hạn" },
  DoneInLate: { textClass: "text-orange-700", bgClass: "bg-orange-50", borderClass: "border-orange-200", icon: AlertTriangle, label: "Xong trễ hạn" },
  Cancel:     { textClass: "text-rose-700",   bgClass: "bg-rose-50",   borderClass: "border-rose-200",   icon: XCircle,       label: "Đã hủy" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? {
    textClass: "text-slate-600", bgClass: "bg-slate-50", borderClass: "border-slate-200",
    icon: Circle, label: status,
  };
}

function getStatusLabel(status: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    Template:   "Template",
    InProgress: t("status.taskInProcess") || "Đang thực hiện",
    Completed:  t("status.taskDoneInTime") || "Hoàn thành",
    Deleted:    t("status.taskCancelled") || "Đã xóa",
    Assigned:   t("status.taskAssigned") || "Được giao",
    Taken:      t("status.taskTaken") || "Đã nhận",
    InProcess:  t("status.taskInProcess") || "Đang xử lý",
    DoneInTime: t("status.taskDoneInTime") || "Xong đúng hạn",
    DoneInLate: t("status.taskDoneInLate") || "Xong trễ hạn",
    Cancel:     t("status.taskCancelled") || "Đã hủy",
  };
  return map[status] ?? status;
}

/* ─── Animation variants ──────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.32, delay: (i as number) * 0.04, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

const TASKS_PER_PAGE = 20;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // <-- Tắt tự động giữ tỷ lệ
  plugins: {
    legend: { labels: { font: { size: 12 }, color: "#64748b" } },
    tooltip: {
      backgroundColor: "rgba(15,23,42,0.85)",
      padding: 10,
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
    },
  },
  scales: {
    x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748b" } },
    y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { color: "#64748b" } },
  },
};

/* ─── Main Page ───────────────────────────────────────── */
export default function AdminTasks() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [timeMode, setTimeMode] = useState<"day" | "week" | "month">("day");
  const [filterMode, setFilterMode] = useState<"day" | "week" | "month">("day");
  const [filterDate, setFilterDate] = useState<string>("");

  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => { runProgress(); }, []);

  /* ── Fetch ── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axiosInstance.get<ApiTaskListResponse>("/api/tasks?pageNumber=1&pageSize=1000");
        const raw = res.data;

        // Support both { data: [...] } and { value: { data: [...] } } shapes
        let arr: ApiTask[] = [];
        if (Array.isArray(raw.data)) {
          arr = raw.data;
        } else if ((raw as unknown as { value?: { data?: ApiTask[] } }).value?.data) {
          arr = (raw as unknown as { value: { data: ApiTask[] } }).value.data;
        }

        // Filter out Template tasks for the main task list display
        const mapped: Task[] = arr.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          researcherId: t.researcherId,
          technicianId: t.technicianId,
          targetId: t.targetId,
          taskTargetType: t.taskTargetType,
          status: t.status as StatusType,
          expectedEndDate: t.expectedEndDate,
          createdDate: t.createdDate,
        }));

        setAllTasks(mapped);

        const counts: Record<string, number> = {};
        mapped.forEach((task) => {
          counts[task.status] = (counts[task.status] ?? 0) + 1;
        });
        setStatusCounts(counts);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };
    void loadData();
  }, []);

  /* ── Filter ── */
  useEffect(() => {
    setLoading(true);
    let filtered = [...allTasks];

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(q) ||
        (task.researcherId ?? "").toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );

    setTotalCount(filtered.length);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    setTasks(filtered.slice(start, start + TASKS_PER_PAGE));
    setLoading(false);
  }, [statusFilter, searchTerm, currentPage, allTasks]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / TASKS_PER_PAGE);
  const hasFilter = statusFilter !== "all" || searchTerm.trim();

  /* ── Chart data ── */
  const chartStats = useMemo(() => {
    const grouped: Record<string, { total: number; completedOnTime: number }> = {};
    allTasks.forEach((task) => {
      if (!task.createdDate || task.createdDate.startsWith("0001")) return;
      const date = new Date(task.createdDate);
      let key = "";
      if (timeMode === "day") key = date.toLocaleDateString("vi-VN");
      else if (timeMode === "week") {
        const s = new Date(date); s.setDate(date.getDate() - date.getDay() + 1);
        key = `Tuần ${s.toLocaleDateString("vi-VN")}`;
      } else key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = { total: 0, completedOnTime: 0 };
      grouped[key].total += 1;
      if (task.status === "Completed" || task.status === "DoneInTime") grouped[key].completedOnTime += 1;
    });
    return Object.entries(grouped).map(([label, v]) => ({ label, ...v }));
  }, [allTasks, timeMode]);

  const chartData = {
    labels: chartStats.map((i) => i.label),
    datasets: [
      { label: t("task.totalTasksCreated") || "Tổng task tạo", data: chartStats.map((i) => i.total), backgroundColor: "#f43f5e", borderRadius: 6 },
      { label: t("task.tasksCompletedOnTime") || "Hoàn thành đúng hạn", data: chartStats.map((i) => i.completedOnTime), backgroundColor: "#10b981", borderRadius: 6 },
    ],
  };

  const filteredChartStats = useMemo(() => {
    if (!filterDate) return [];
    const grouped: Record<string, { created: number; completedOnTime: number }> = {};
    const filteredTasks = allTasks.filter((task) => {
      if (!task.createdDate || task.createdDate.startsWith("0001")) return false;
      const date = new Date(task.createdDate); const sel = new Date(filterDate);
      if (filterMode === "day") return date.toDateString() === sel.toDateString();
      if (filterMode === "week") {
        const ws = new Date(sel); ws.setDate(sel.getDate() - sel.getDay() + 1);
        const we = new Date(ws); we.setDate(ws.getDate() + 6);
        return date >= ws && date <= we;
      }
      return date.getMonth() === sel.getMonth() && date.getFullYear() === sel.getFullYear();
    });
    filteredTasks.forEach((task) => {
      const date = new Date(task.createdDate); let key = "";
      if (filterMode === "day") key = date.toLocaleDateString("vi-VN");
      else if (filterMode === "week") {
        const s = new Date(date); s.setDate(date.getDate() - date.getDay() + 1);
        key = `Tuần ${s.toLocaleDateString("vi-VN")}`;
      } else key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = { created: 0, completedOnTime: 0 };
      grouped[key].created += 1;
      if (task.status === "Completed" || task.status === "DoneInTime") grouped[key].completedOnTime += 1;
    });
    return Object.entries(grouped).map(([label, v]) => ({ label, ...v }));
  }, [allTasks, filterMode, filterDate]);

  const filteredChartData = {
    labels: filteredChartStats.map((i) => i.label),
    datasets: [
      { label: "Được tạo", data: filteredChartStats.map((i) => i.created), backgroundColor: "#f43f5e", borderRadius: 6 },
      { label: "Hoàn thành đúng hạn", data: filteredChartStats.map((i) => i.completedOnTime), backgroundColor: "#10b981", borderRadius: 6 },
    ],
  };

  // Stat cards — only show statuses that exist in the data
  const statCards = Object.entries(statusCounts).map(([key, count]) => ({ key, count }));

  const tableHeaders = [
    "#", t("task.taskName") || "Tên task",
    t("common.status") || "Trạng thái",
    "Loại mục tiêu",
    t("task.deadline") || "Hạn chót",
    "Ngày tạo",
  ];

  return (
    <main className="admin-tasks-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#9f1239] to-[#f43f5e] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
            {t("task.taskStatisticsTitle") || "Thống kê nhiệm vụ"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Thống kê và quản lý nhiệm vụ trong hệ thống
          </p>
        </motion.div>

        {/* GỘP 2 BIỂU ĐỒ VÀO 1 GRID CHIA ĐÔI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Chart 1 ── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#9f1239]">
                {t("task.taskStatisticsTitle") || "Thống kê nhiệm vụ"}
              </h2>
              <select
                value={timeMode}
                onChange={(e) => setTimeMode(e.target.value as "day" | "week" | "month")}
                className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
              >
                <option value="day">{t("common.byDay") || "Theo ngày"}</option>
                <option value="week">{t("common.byWeek") || "Theo tuần"}</option>
                <option value="month">{t("common.byMonth") || "Theo tháng"}</option>
              </select>
            </div>
            {/* Ép chiều cao cứng */}
            <div className="relative w-full h-64 sm:h-72">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* ── Chart 2 ── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6 flex flex-col"
          >
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <h2 className="text-base font-semibold text-[#9f1239] flex-1 min-w-max">
                {t("task.specificTaskStatistics") || "Thống kê theo thời gian cụ thể"}
              </h2>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as "day" | "week" | "month")}
                className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
              >
                <option value="day">{t("common.byDay") || "Theo ngày"}</option>
                <option value="week">{t("common.byWeek") || "Theo tuần"}</option>
                <option value="month">{t("common.byMonth") || "Theo tháng"}</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
              />
            </div>
            {/* Ép chiều cao cứng */}
            <div className="relative w-full h-64 sm:h-72">
              <Bar data={filteredChartData} options={chartOptions} />
            </div>
          </motion.div>
        </div>

        {/* ── Status stat cards ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {statCards.map((s, i) => {
            const cfg = getStatusConfig(s.key);
            const Icon = cfg.icon;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
                className={`${cfg.bgClass} border ${cfg.borderClass} rounded-2xl p-4 flex flex-col items-center cursor-pointer transition-all shadow-sm ${
                  statusFilter === s.key ? "ring-2 ring-offset-1 ring-[#9f1239]" : "hover:shadow-md"
                }`}
              >
                <Icon className={`w-4 h-4 ${cfg.textClass} mb-2`} />
                <span className="text-xs text-slate-500 font-medium text-center mb-1">
                  {getStatusLabel(s.key, t)}
                </span>
                <span className={`text-3xl font-extrabold ${cfg.textClass}`}>
                  {s.count}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Filter card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-base font-semibold text-[#9f1239] mb-4">
            {t("seedling.filterAndSearch") || "Lọc & Tìm kiếm"}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
            >
              <option value="all">{t("common.all") || "Tất cả"}</option>
              {Object.keys(STATUS_CONFIG).map((key) => (
                <option key={key} value={key}>{getStatusLabel(key, t)}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Tìm theo tên task...`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
              />
            </div>

            {hasFilter && (
              <motion.button
                type="button"
                onClick={() => { setStatusFilter("all"); setSearchTerm(""); setCurrentPage(1); }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-rose-100 rounded-xl hover:bg-rose-50 hover:text-[#9f1239] transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                {t("common.clearFilters") || "Xoá bộ lọc"}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#fff1f2] to-[#fffbfb] border-b border-rose-100">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="p-4 font-semibold text-gray-900 text-left whitespace-nowrap"
                    >
                      {h}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-rose-50 animate-pulse">
                      {Array.from({ length: tableHeaders.length }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-rose-100 rounded w-full" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : tasks.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={tableHeaders.length} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <div className="text-lg font-medium">{t("common.noData") || "Không có dữ liệu"}</div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task, idx) => {
                      const cfg = getStatusConfig(task.status);
                      const Icon = cfg.icon;
                      const rowNum = (currentPage - 1) * TASKS_PER_PAGE + idx + 1;
                      return (
                        <motion.tr
                          key={task.id}
                          custom={idx}
                          variants={tableRow}
                          initial="hidden" animate="visible" exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(255,241,242,0.85)", transition: { duration: 0.15 } }}
                          className="border-b border-rose-50 cursor-pointer"
                          onClick={() => void navigate(`/admin/tasks/${task.id}`)}
                        >
                          <td className="p-4 text-gray-500 text-sm">{rowNum}</td>
                          <td className="p-4 font-medium text-gray-900">{task.name}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgClass} ${cfg.textClass} border ${cfg.borderClass}`}>
                              <Icon className="w-3 h-3" />
                              {getStatusLabel(task.status, t)}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 text-sm">
                            {task.taskTargetType ?? <span className="text-slate-300 italic text-xs">—</span>}
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {task.expectedEndDate
                              ? new Date(task.expectedEndDate).toLocaleDateString("vi-VN")
                              : <span className="text-slate-300 italic text-xs">—</span>}
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {task.createdDate && !task.createdDate.startsWith("0001")
                              ? new Date(task.createdDate).toLocaleDateString("vi-VN")
                              : <span className="text-slate-300 italic text-xs">—</span>}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <AnimatePresence>
            {!loading && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-rose-100"
              >
                <span className="font-medium">
                  {t("common.showing") || "Hiển thị"} {tasks.length} / {totalCount}
                </span>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">←</motion.button>
                    )}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pn: number;
                      if (totalPages <= 5) pn = i + 1;
                      else if (currentPage <= 3) pn = i + 1;
                      else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                      else pn = currentPage - 2 + i;
                      return (
                        <motion.button key={pn} type="button"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentPage(pn)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            currentPage === pn ? "bg-[#9f1239] text-white" : "bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300"
                          }`}>{pn}</motion.button>
                      );
                    })}
                    {currentPage < totalPages && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">→</motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </main>
  );
}