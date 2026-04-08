/* eslint-disable react-x/no-array-index-key */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import "./Tasks.css";
import gsap from "gsap";

/* ─── Types ─────────────────────────────────────────────── */
interface Task {
  id: string;
  name?: string;
  description?: string;
  stageId?: string | number | null;
  taskTargetType?: string | null;
  targetId?: string | null;
  researcherId?: string | null;
  researcher?: string | null;
  technicianId?: string | null;
  experimentLogName?: string;
  end_date?: string;
  create_at?: string;
  status: string;
  expectedEndDate?: string | null;
}

type StatusType = "Assigned" | "Taken" | "InProcess" | "DoneInTime" | "DoneInLate" | "Cancel";

interface ApiTaskResponse {
  value?: { totalCount?: number; pageCount?: number; pageSize?: number; pageNumber?: number; data?: Task[] };
}

function isApiTaskResponse(obj: unknown): obj is ApiTaskResponse {
  return (
    typeof obj === "object" && obj !== null && "value" in obj &&
    typeof (obj as { value: unknown }).value === "object" &&
    Array.isArray((obj as { value: { data?: unknown } }).value?.data)
  );
}

const STATUS_NORMALIZE_MAP: Record<string, StatusType> = {
  Assigned: "Assigned", Taken: "Taken", InProcess: "InProcess", InProgress: "InProcess",
  DoneInTime: "DoneInTime", CompletedInTime: "DoneInTime", DoneInLate: "DoneInLate",
  CompletedLate: "DoneInLate", CompletedInLate: "DoneInLate",
  Cancel: "Cancel", Cancelled: "Cancel", Canceled: "Cancel",
};

function normalizeStatus(status: string): StatusType | null {
  return STATUS_NORMALIZE_MAP[status] ?? null;
}

const STATUS_UI: Record<StatusType, { labelKey: string; badgeClasses: string }> = {
  Assigned:   { labelKey: "status.assigned",   badgeClasses: "bg-blue-50 text-blue-700 border border-blue-100" },
  Taken:      { labelKey: "status.taken",       badgeClasses: "bg-indigo-50 text-indigo-700 border border-indigo-100" },
  InProcess:  { labelKey: "status.inProcess",   badgeClasses: "bg-cyan-50 text-cyan-700 border border-cyan-100" },
  DoneInTime: { labelKey: "status.doneInTime",  badgeClasses: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  DoneInLate: { labelKey: "status.doneInLate",  badgeClasses: "bg-orange-50 text-orange-700 border border-orange-100" },
  Cancel:     { labelKey: "status.cancel",      badgeClasses: "bg-red-50 text-red-700 border border-red-100" },
};

const STATUS_UI_FALLBACK: Record<string, { labelKey: string; badgeClasses: string }> = {
  InProgress:           { labelKey: "status.inProgress",           badgeClasses: "bg-cyan-50 text-cyan-700 border border-cyan-100" },
  WaitingForApproval:   { labelKey: "status.waitingForApproval",   badgeClasses: "bg-amber-50 text-amber-700 border border-amber-100" },
  DeclinedByTechnician: { labelKey: "status.declinedByTechnician", badgeClasses: "bg-red-50 text-red-700 border border-red-100" },
  CompletedInTime:      { labelKey: "status.completedInTime",      badgeClasses: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  CompletedOutTime:     { labelKey: "status.completedOutTime",     badgeClasses: "bg-orange-50 text-orange-700 border border-orange-100" },
  ReworkRequired:       { labelKey: "status.reworkRequired",       badgeClasses: "bg-rose-50 text-rose-700 border border-rose-100" },
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  Assigned: "text-[#005792]", Taken: "text-indigo-700", InProcess: "text-yellow-700",
  DoneInTime: "text-green-700", DoneInLate: "text-orange-700", Cancel: "text-red-700",
};

function getStatusLabel(status: StatusType, t: (key: string) => string): string {
  const statusKey = STATUS_UI[status]?.labelKey;
  return statusKey ? t(statusKey) : status;
}

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.07, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.32, delay: (i as number) * 0.045, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

const statCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, delay: 0.1 + (i as number) * 0.07, ease: EASE_OUT },
  }),
};

/* ─── Animated counter (GSAP) ────────────────────────────── */
function AnimatedCounter({ value, textColor }: { value: number; textColor: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    obj.current.val = 0;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value, duration: 0.9, ease: "power2.out", delay: 0.3,
        onUpdate: () => {
          if (ref.current) ref.current.textContent = Math.round(obj.current.val).toString();
        },
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <span ref={ref} className={`mt-2 text-3xl font-semibold ${textColor}`}>0</span>;
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Tasks() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusType | "Tất cả">("Tất cả");
  const [researcherFilter, setResearcherFilter] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0, Taken: 0, InProcess: 0, DoneInTime: 0, DoneInLate: 0, Cancel: 0,
  });
  const [allResearchers, setAllResearchers] = useState<string[]>([]);
  const [technicianNames, setTechnicianNames] = useState<Record<string, string>>({});

  const tasksPerPage = 8;

  /* GSAP progress bar */
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || !progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(progressRef.current, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.8, ease: "power3.out" });
      gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1 });
    });
    return () => ctx.revert();
  }, [loading]);

  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.append("pageNumber", "1");
    params.append("pageSize", "1000");
    if (researcherFilter !== "Tất cả") params.append("researcher", researcherFilter);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    return params.toString();
  }, [researcherFilter, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(true);
      setError(null);

      axiosInstance.get(`/api/tasks?${buildApiQuery}`)
        .then(async (res) => {
          let data: Task[] = [];
          if (isApiTaskResponse(res.data)) {
            data = Array.isArray(res.data.value?.data) ? res.data.value.data : [];
          } else if (Array.isArray((res.data as { data?: Task[] }).data)) {
            data = (res.data as { data: Task[] }).data;
          }

          const counts: Record<StatusType, number> = { Assigned: 0, Taken: 0, InProcess: 0, DoneInTime: 0, DoneInLate: 0, Cancel: 0 };
          const researcherSet = new Set<string>();
          data.forEach((task) => {
            const normalized = normalizeStatus(task.status);
            if (normalized) counts[normalized] = (counts[normalized] ?? 0) + 1;
            if (task.researcher) researcherSet.add(task.researcher);
          });
          setStatusCounts(counts);
          setAllResearchers(Array.from(researcherSet));

          const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.expectedEndDate ?? a.end_date ?? a.create_at ?? 0);
            const dateB = new Date(b.expectedEndDate ?? b.end_date ?? b.create_at ?? 0);
            return dateB.getTime() - dateA.getTime();
          });

          let filteredData = sortedData;
          if (statusFilter !== "Tất cả") filteredData = filteredData.filter((task) => normalizeStatus(task.status) === statusFilter);
          if (researcherFilter !== "Tất cả") filteredData = filteredData.filter((task) => (task.researcherId ?? "") === researcherFilter);
          if (searchTerm.trim()) {
            filteredData = filteredData.filter((task) =>
              (task.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
              (task.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
            );
          }

          const startIndex = (currentPage - 1) * tasksPerPage;
          const paginatedData = filteredData.slice(startIndex, startIndex + tasksPerPage);
          setTasks(paginatedData);
          setTotalCount(filteredData.length);

          const uniqueTechIds = Array.from(new Set(paginatedData.map((t) => t.technicianId).filter((id): id is string => !!id)));
          const techNameMap: Record<string, string> = {};
          await Promise.all(uniqueTechIds.map(async (id) => {
            try {
              const userRes = await axiosInstance.get(`/api/user/${id}`);
              const userData = userRes.data as { value?: { name?: string }; name?: string };
              techNameMap[id] = userData?.value?.name ?? userData?.name ?? id;
            } catch { techNameMap[id] = id; }
          }));
          setTechnicianNames(techNameMap);
        })
        .catch(() => {
          setError(t("task.cannotLoadList"));
          enqueueSnackbar(t("common.errorLoading"), { variant: "error" });
        })
        .finally(() => setLoading(false));
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [buildApiQuery, statusFilter, researcherFilter, searchTerm, currentPage, enqueueSnackbar, t]);

  useEffect(() => {
    if (statusFilter !== "Tất cả" || researcherFilter !== "Tất cả" || searchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [statusFilter, researcherFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const statEntries = Object.entries({
    Assigned: t("status.taskAssigned"), Taken: t("status.taskTaken"),
    InProcess: t("status.taskInProcess"), DoneInTime: t("status.taskDoneInTime"),
    DoneInLate: t("status.taskDoneInLate"), Cancel: t("status.taskCancelled"),
  });

  return (
    <main className="tasks-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">

      {/* GSAP progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="space-y-6">

        {/* ── Header card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
                {t("task.researchTaskManagement")}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{t("task.researchTaskSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                onClick={() => void navigate("/researcher/task-templates")}
                className="inline-flex items-center gap-2 rounded-full border border-[#005792] bg-white px-5 py-2 text-sm font-medium text-[#005792] shadow-sm hover:bg-[#E9F4FF] focus:outline-none focus:ring-2 focus:ring-[#005792]/30"
              >
                {t("task.taskTemplates")}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                onClick={() => void navigate("/create-task/step-1")}
                className="inline-flex items-center gap-2 rounded-full bg-[#005792] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#004d73] active:bg-[#003f5a] focus:outline-none focus:ring-2 focus:ring-[#005792]/60"
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth={2} className="h-5 w-5"
                  whileHover={{ rotate: 90 }} transition={{ duration: 0.25 }}
                >
                  <path d="M10 4v12m-6-6h12" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
                {t("task.createResearchTask")}
              </motion.button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statEntries.map(([key, label], idx) => (
              <motion.div
                key={key}
                custom={idx}
                variants={statCard}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(0,0,0,0.13)", transition: { duration: 0.2 } }}
                className="rounded-2xl border border-blue-100 bg-white/70 p-5 flex flex-col items-center"
              >
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
                <AnimatedCounter value={statusCounts[key as StatusType]} textColor={STATUS_TEXT_COLORS[key] ?? "text-[#005792]"} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Filter card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-4 mb-3">
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900/70 font-medium">{t("common.status")}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusType | "Tất cả")}
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="Tất cả">{t("common.all")}</option>
                {Object.entries({ Assigned: t("status.assigned"), Taken: t("status.taken"), InProcess: t("status.inProcess"), DoneInTime: t("status.doneInTime"), DoneInLate: t("status.doneInLate"), Cancel: t("status.cancel") })
                  .map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            {/* Researcher filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900/70 font-medium">{t("task.researcher")}:</span>
              <select
                value={researcherFilter}
                onChange={(e) => setResearcherFilter(e.target.value)}
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="Tất cả">{t("common.all")}</option>
                {allResearchers.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#005792" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t("common.searchPlaceholder") ?? "Tìm kiếm nhiệm vụ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-blue-100 bg-white/90 rounded-xl px-10 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
                />
              </div>
            </div>
            {/* Clear */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setStatusFilter("Tất cả"); setResearcherFilter("Tất cả"); setSearchTerm(""); }}
              className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-blue-950 shadow-sm hover:bg-white"
            >
              <span className="text-lg leading-none" aria-hidden>✕</span>
              {t("common.clear")} {t("common.filter").toLowerCase()}
            </motion.button>
          </div>

          {/* Active filter tags */}
          <AnimatePresence>
            {(statusFilter !== "Tất cả" || researcherFilter !== "Tất cả" || searchTerm.trim()) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 overflow-hidden"
              >
                <span className="text-xs text-gray-500">{t("common.filter")} {t("common.selected").toLowerCase()}:</span>
                {statusFilter !== "Tất cả" && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700">
                    {t("common.status")}: {getStatusLabel(statusFilter, t)}
                  </motion.span>
                )}
                {researcherFilter !== "Tất cả" && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                    {t("task.researcher")}: {researcherFilter}
                  </motion.span>
                )}
                {searchTerm.trim() && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                    {t("common.search")}: "{searchTerm}"
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                <tr>
                  {[t("task.taskName"), t("common.status"), t("task.deadline"), t("task.technician"), ""].map((header, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className={`text-left p-4 font-semibold text-gray-900 ${i === 4 ? "sr-only" : ""}`}
                    >
                      {header}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  /* Skeleton rows */
                  Array.from({ length: 6 }).map((_, idx) => (
                    <motion.tr
                      key={`sk-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-blue-50 animate-pulse"
                    >
                      <td className="p-4"><div className="h-4 bg-blue-100 rounded w-3/4" /></td>
                      <td className="p-4"><div className="h-6 bg-blue-100 rounded-full w-24" /></td>
                      <td className="p-4"><div className="h-4 bg-blue-100 rounded w-28" /></td>
                      <td className="p-4"><div className="h-4 bg-blue-100 rounded w-32" /></td>
                      <td className="p-4"><div className="h-8 w-8 bg-blue-100 rounded-xl ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={5} className="text-center py-8 text-red-500">{error}</td>
                  </motion.tr>
                ) : tasks.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={5} className="text-center py-8 text-gray-500">{t("task.noTasks")}</td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task, i) => {
                      const normalizedStatus = normalizeStatus(task.status);
                      const statusLabel = normalizedStatus
                        ? getStatusLabel(normalizedStatus, t)
                        : STATUS_UI_FALLBACK[task.status]?.labelKey
                          ? t(STATUS_UI_FALLBACK[task.status].labelKey)
                          : task.status || "-";
                      const statusClasses = normalizedStatus
                        ? STATUS_UI[normalizedStatus].badgeClasses
                        : STATUS_UI_FALLBACK[task.status]?.badgeClasses ?? "bg-gray-100 text-gray-700 border border-gray-200";

                      const dateStr = task.expectedEndDate ?? task.end_date ?? task.create_at;
                      const displayDate = dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "-";

                      return (
                        <motion.tr
                          key={task.id}
                          custom={i}
                          variants={tableRow}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(239,246,255,0.85)", transition: { duration: 0.15 } }}
                          className="border-b border-blue-50 cursor-pointer"
                          onClick={() => void navigate(`/researcher/tasks/${task.id}`)}
                        >
                          <td className="p-4 font-medium text-gray-900">{task.name ?? "-"}</td>
                          <td className="p-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.045 + 0.1, duration: 0.28, ease: EASE_OUT }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusClasses}`}
                            >
                              {statusLabel}
                            </motion.span>
                          </td>
                          <td className="p-4 text-gray-700 font-medium">{displayDate}</td>
                          <td className="p-4 text-gray-700 font-medium">
                            {task.technicianId ? technicianNames[task.technicianId] || task.technicianId : "-"}
                          </td>
                          <td className="p-4 text-right">
                            <motion.span
                              whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,1)" }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-blue-100 cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#005792" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M15 12H9" /><path d="M12 15l-3-3 3-3" />
                              </svg>
                            </motion.span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <AnimatePresence>
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-slate-600 p-6 bg-white/70 border-t border-blue-100"
              >
                <span className="font-medium">
                  {t("common.showing")} {tasks.length > 0 ? (currentPage - 1) * tasksPerPage + 1 : 0}-
                  {Math.min(currentPage * tasksPerPage, totalCount)} {t("common.of")} {totalCount}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                      onClick={() => paginate(currentPage - 1)}
                      className="px-4 py-2 rounded-lg bg-white/80 border border-blue-100 text-blue-950 shadow-sm hover:bg-white">←</motion.button>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <motion.button
                        key={pageNum} type="button"
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => paginate(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#005792] text-white"
                            : "bg-white/80 border border-blue-100 text-blue-950 hover:bg-white"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                  {currentPage < totalPages && (
                    <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                      onClick={() => paginate(currentPage + 1)}
                      className="px-4 py-2 rounded-lg bg-white/80 border border-blue-100 text-blue-950 shadow-sm hover:bg-white">→</motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}