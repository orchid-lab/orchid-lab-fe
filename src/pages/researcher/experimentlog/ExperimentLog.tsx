/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable prefer-const */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Search, Plus, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import "./ExperimentLog.css";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";

/* ─── Types ─────────────────────────────────────────────── */
type ExperimentStatus = "Created" | "Waiting" | "InProcess" | "Done" | "Cancel";

interface ExperimentLogEntry {
  id: string;
  name: string;
  methodName: string;
  description?: string;
  tissueCultureBatchName: string;
  createdDate?: string;
  status?: number | string;
  currentStageName?: string;
  currentStageOrder?: number;
  expectedSampleCount?: number;
  objective?: string;
}

interface MethodOption {
  id: string;
  name: string;
}

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
  }),
};

const statCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: 0.1 + (i as number) * 0.08,
      ease: EASE_OUT,
    },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      delay: (i as number) * 0.045,
      ease: EASE_OUT,
    },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

/* ─── Animated Counter (GSAP) ────────────────────────────── */
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });
  useEffect(() => {
    obj.current.val = 0;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value,
        duration: 1,
        ease: "power2.out",
        delay: 0.3,
        onUpdate: () => {
          if (ref.current)
            ref.current.textContent = Math.round(obj.current.val).toString();
        },
      });
    });
    return () => ctx.revert();
  }, [value]);
  return <span ref={ref} className={className}>0</span>;
}

/* ─── Helpers ────────────────────────────────────────────── */
function normalizeStatus(status?: number | string): ExperimentStatus | string {
  const s = String(status ?? "");
  switch (s) {
    case "Created":     return "Created";
    case "WaitingForChangeStage": return "Waiting";
    case "Completed":   return "Done";
    case "InProgress":  return "InProcess";
    case "Cancelled":
    case "Destroyed":   return "Cancel";
    default:            return s;
  }
}

function getStatusColor(status?: number | string): string {
  switch (normalizeStatus(status)) {
    case "Created":   return "bg-[#E6F1FF] text-[#005792]";
    case "Waiting":   return "bg-[#FFF2F0] text-[#D1433C]";
    case "InProcess": return "bg-[#E0F7FA] text-[#006D73]";
    case "Done":      return "bg-[#dcfce7] text-[#166534]";
    case "Cancel":    return "bg-[#FFECEA] text-[#D1433C]";
    default:          return "bg-gray-100 text-gray-800";
  }
}

/* ─── Normalize raw API item ─────────────────────────────── */
function normalizeRawLog(obj: any): ExperimentLogEntry | null {
  if (!obj?.id || !obj.name) return null;
  return {
    id: String(obj.id),
    name: String(obj.name),
    methodName: obj.methodName ?? obj.method ?? "",
    description: obj.description ?? obj.objective ?? "",
    tissueCultureBatchName:
      obj.tissueCultureBatchName ?? obj.batcheName ?? obj.batchName ?? "",
    createdDate: obj.createdDate ?? obj.createdDateString ?? "",
    status: obj.status,
    currentStageName: obj.currentStageName ?? "",
    currentStageOrder: obj.currentStageOrder ?? 0,
    expectedSampleCount: obj.expectedSampleCount ?? 0,
    objective: obj.objective ?? "",
  };
}

/* ─── Parse API response ─────────────────────────────────── */
function parseApiResponse(data: unknown): { arr: ExperimentLogEntry[]; total: number } {
  let arr: ExperimentLogEntry[] = [];
  let total = 0;
  if (typeof data !== "object" || data === null) return { arr, total };
  const d = data as any;

  // { totalCount, data: [...] }  ← cấu trúc API thực tế
  if (Array.isArray(d.data)) {
    arr = d.data.map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
    total = Number(d.totalCount ?? arr.length);
    return { arr, total };
  }
  // { value: { data: [...] } }
  if (d.value && Array.isArray(d.value.data)) {
    arr = d.value.data.map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
    total = Number(d.value.totalCount ?? arr.length);
    return { arr, total };
  }
  // { value: [...] }
  if (Array.isArray(d.value)) {
    arr = d.value.map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
    total = Number(d.totalCount ?? arr.length);
    return { arr, total };
  }
  // array trực tiếp
  if (Array.isArray(data)) {
    arr = (data as any[]).map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
    total = arr.length;
    return { arr, total };
  }
  return { arr, total };
}

/* ─── Main Component ─────────────────────────────────────── */
const ExperimentLog = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]     = useState<ExperimentStatus | "all">("all");
  const [methodFilter, setMethodFilter]     = useState<string>("");
  const [logs, setLogs]                     = useState<ExperimentLogEntry[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [totalCount, setTotalCount]         = useState(0);
  const [methods, setMethods]               = useState<MethodOption[]>([]);
  const [stats, setStats] = useState({ total: 0, Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 });
  const [currentPage, setCurrentPage]       = useState(1);
  const logsPerPage = 5;
  const navigate = useNavigate();

  /* ─── Debounce search ─────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ─── Active filter count ─────────────────────────────── */
  const activeFilterCount = [statusFilter !== "all", methodFilter !== "", searchTerm !== ""].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter("all"); setMethodFilter(""); setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1);
  };

  /* ─── Status label ────────────────────────────────────── */
  const statusToLabel = useCallback((status?: number | string): string => {
    switch (normalizeStatus(status)) {
      case "Created":   return t("status.created");
      case "Waiting":   return t("experimentLog.waitingForStageChange");
      case "InProcess": return t("status.inProgress");
      case "Done":      return t("status.completed");
      case "Cancel":    return t("status.cancelled");
      default:          return t("status.unknown", "—");
    }
  }, [t]);

  const activeExperiments  = stats.Created + stats.Waiting + stats.InProcess;
  const completedOrFailed  = stats.Done + stats.Cancel;
  const successRate        = completedOrFailed > 0 ? Math.round((stats.Done / completedOrFailed) * 100) : 0;
  const bottlenecksCount   = stats.Waiting;
  const priorityLogs       = logs.filter((log) => normalizeStatus(log.status) === "Waiting").slice(0, 5);

  /* ─── Fetch methods ───────────────────────────────────── */
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get("/api/methods", { params: { PageNumber: 1, PageSize: 100 } });
        const raw: any = res.data;
        let arr: { id: any; name: string }[] = [];
        if (Array.isArray(raw?.value?.data)) arr = raw.value.data;
        else if (Array.isArray(raw?.value)) arr = raw.value;
        else if (Array.isArray(raw?.data)) arr = raw.data;
        else if (Array.isArray(raw)) arr = raw;
        setMethods(arr.filter((m) => m?.id != null && m?.name).map((m) => ({ id: String(m.id), name: String(m.name) })));
      } catch { setMethods([]); }
    };
    void fetchMethods();
  }, []);

  /* ─── Fetch stats ─────────────────────────────────────── */
  const fetchStatsOnly = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/experiment-logs", {
        params: { PageNo: 1, PageSize: 1000, ResearcherId: user?.id ?? "" },
      });
      const { arr: allLogs } = parseApiResponse(res.data);
      const counts = { Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 };
      allLogs.forEach((log) => {
        const s = normalizeStatus(log.status);
        if (s in counts) counts[s as keyof typeof counts]++;
      });
      setStats({ total: counts.Created + counts.InProcess + counts.Done + counts.Cancel, ...counts });
    } catch {
      setStats({ total: 0, Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 });
    }
  }, [user?.id]);

  /* ─── Fetch paginated logs ────────────────────────────── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const selectedMethod = methods.find((m) => m.id === methodFilter);
      const methodName = selectedMethod ? selectedMethod.name : methodFilter;
      try {
        const paramsObj: Record<string, unknown> = {
          PageNo: currentPage, PageSize: logsPerPage, ResearcherId: user?.id ?? "",
        };
        if (debouncedSearch) paramsObj.NameSearchTerm = debouncedSearch;
        if (methodName)      paramsObj.MethodNameSearchTerm = methodName;

        const res = await axiosInstance.get("/api/experiment-logs", { params: paramsObj });
        let { arr, total } = parseApiResponse(res.data);
        arr = arr.map((log) => ({ ...log, status: normalizeStatus(log.status) }));
        setLogs(arr);
        setTotalCount(total);
      } catch {
        setError(t("common.errorLoading")); setLogs([]); setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
    void fetchStatsOnly();
  }, [currentPage, logsPerPage, methodFilter, debouncedSearch, fetchStatsOnly, t, user?.id]);

  /* ─── Client-side status filter ──────────────────────── */
  const filteredLogs = statusFilter === "all"
    ? logs
    : logs.filter((log) => normalizeStatus(log.status) === statusFilter);

  /* ─── Donut chart ─────────────────────────────────────── */
  const statusDistribution = [
    { label: t("status.created"),    value: stats.Created,   color: "#005792" },
    { label: t("experimentLog.waiting"), value: stats.Waiting, color: "#FF6F61" },
    { label: t("status.inProgress"), value: stats.InProcess, color: "#00CED1" },
    { label: t("status.completed"),  value: stats.Done,      color: "#22c55e" },
    { label: t("status.cancelled"),  value: stats.Cancel,    color: "#ef4444" },
  ];
  const totalDistribution  = statusDistribution.reduce((sum, item) => sum + item.value, 0);
  const donutRadius        = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativeOffset     = 0;
  const donutSlices = statusDistribution.filter((item) => item.value > 0).map((item) => {
    const dash  = totalDistribution > 0 ? (item.value / totalDistribution) * donutCircumference : 0;
    const slice = { ...item, dash, offset: cumulativeOffset };
    cumulativeOffset += dash;
    return slice;
  });

  /* ─── Status options ──────────────────────────────────── */
  const statusOptions: { value: ExperimentStatus | "all"; labelKey: string; count?: number; dotColor: string }[] = [
    { value: "all",       labelKey: "experimentLog.allStatuses",           dotColor: "#94a3b8" },
    { value: "Created",   labelKey: "status.created",        count: stats.Created,   dotColor: "#005792" },
    { value: "Waiting",   labelKey: "experimentLog.waitingForStageChange", count: stats.Waiting,   dotColor: "#FF6F61" },
    { value: "InProcess", labelKey: "status.inProgress",     count: stats.InProcess, dotColor: "#00CED1" },
    { value: "Done",      labelKey: "status.completed",      count: stats.Done,      dotColor: "#22c55e" },
    { value: "Cancel",    labelKey: "status.cancelled",      count: stats.Cancel,    dotColor: "#ef4444" },
  ];

  const tableHeaders = [
    t("experimentLog.experimentName"),
    t("experimentLog.method"),
    t("experimentLog.tissueCultureBatch"),
    t("experimentLog.dateCreated"),
    t("experimentLog.status"),
    t("experimentLog.sampleCount"),
  ];

  const statItems = [
    { label: t("experimentLog.inProgress"),           value: activeExperiments, valueClass: "text-[#005792]", sub: t("experimentLog.inProgressHelp") },
    { label: t("experimentLog.latestStatusChart"),    value: successRate,        valueClass: "text-[#00CED1]", suffix: "%", sub: `(${completedOrFailed} ${t("experimentLog.experiments")})` },
    { label: t("experimentLog.waitingForStageChange"),value: bottlenecksCount,  valueClass: "text-[#D1433C]", sub: t("experimentLog.waitingHelp") },
    { label: t("experimentLog.completed"),            value: stats.Done,         valueClass: "text-[#005792]", sub: t("experimentLog.completedHelp") },
  ];

  return (
    <main className="experiment-log-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-slate-900">

      {/* ── Header + stat cards ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
              {t("experimentLog.experimentLogManagement")}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t("experimentLog.manageAndTrack")}</p>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            <Link to="/researcher/experiment-log/create"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#005792] text-white font-semibold shadow-sm hover:bg-[#00456a] transition"
            >
              <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.25 }} className="flex">
                <Plus className="w-4 h-4" />
              </motion.span>
              {t("experimentLog.createExperimentLog")}
            </Link>
          </motion.div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item, idx) => (
            <motion.div key={item.label} custom={idx} variants={statCard} initial="hidden" animate="visible"
              whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(0,0,0,0.13)", transition: { duration: 0.2 } }}
              className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <AnimatedCounter value={item.value} className={`text-3xl font-semibold ${item.valueClass}`} />
                {item.suffix && <span className={`text-3xl font-semibold ${item.valueClass}`}>{item.suffix}</span>}
                {item.sub    && <span className="text-xs text-slate-500">{item.sub}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Middle row ── */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 gap-6">

          {/* Donut chart */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">{t("experimentLog.latestStatusChart")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("experimentLog.manageAndTrack")}</p>
              </div>
              <div className="flex items-center gap-3">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                  {donutSlices.map((slice, i) => (
                    <motion.circle key={slice.label} cx="60" cy="60" r="38" fill="transparent"
                      stroke={slice.color} strokeWidth="12"
                      strokeDasharray={`${slice.dash} ${donutCircumference}`}
                      strokeDashoffset={-slice.offset} strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    />
                  ))}
                  <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fill="#0f172a" className="text-sm font-semibold">
                    {totalDistribution}
                  </text>
                </svg>
                <div className="grid grid-cols-1 gap-2">
                  {statusDistribution.filter((item) => item.value > 0).map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08, duration: 0.3, ease: EASE_OUT }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700">{item.label}</span>
                      <span className="ml-auto text-xs text-slate-500">{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Priority list */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">{t("experimentLog.waitingForStageChange")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("experimentLog.waitingHelp")}</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{priorityLogs.length} {t("common.items")}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {priorityLogs.length > 0 ? priorityLogs.map((log, i) => (
                <motion.li key={log.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.3, ease: EASE_OUT }}
                  whileHover={{ backgroundColor: "rgba(239,246,255,0.8)", x: 4, transition: { duration: 0.15 } }}
                  className="rounded-xl p-3 cursor-pointer"
                  onClick={() => void navigate(`/researcher/experiment-log/${log.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{log.name}</div>
                      <div className="text-xs text-slate-500 truncate">{log.methodName} • {log.tissueCultureBatchName}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(log.status)}`}>
                        {statusToLabel(log.status)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </motion.li>
              )) : (
                <div className="text-sm text-slate-500">{t("common.noData")}</div>
              )}
            </ul>
          </motion.div>
        </div>

        {/* ── Filter panel ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6 sticky top-24 h-fit"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#005792]">{t("common.filter")}</h2>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#005792] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition-colors font-medium"
              >
                <X className="w-3 h-3" /> {t("common.clearAll", "Xóa bộ lọc")}
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {t("common.search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input type="text" placeholder={t("experimentLog.searchByName", "Tìm theo tên...")}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl pl-9 pr-9 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005792]/30 focus:border-[#005792] transition"
                />
                {searchTerm && (
                  <button type="button" onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {t("common.status")}
              </label>
              <div className="relative">
                <select
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005792]/30 focus:border-[#005792] appearance-none transition ${
                    statusFilter !== "all" ? "border-[#005792] bg-blue-50 text-[#005792] font-medium" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as ExperimentStatus | "all"); setCurrentPage(1); }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}{opt.count !== undefined ? ` (${opt.count})` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {statusFilter !== "all" && (
                  <button type="button" onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Method dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {t("experimentLog.method")}
              </label>
              <div className="relative">
                <select
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005792]/30 focus:border-[#005792] appearance-none transition ${
                    methodFilter ? "border-[#005792] bg-blue-50 text-[#005792] font-medium" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">{t("experimentLog.allMethods")}</option>
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {methodFilter && (
                  <button type="button" onClick={() => { setMethodFilter(""); setCurrentPage(1); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active filters summary */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                >
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 mt-3 font-medium">
                      {t("common.activeFilters", "Bộ lọc đang áp dụng")}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {statusFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#005792]/10 text-[#005792] px-2 py-1 rounded-lg font-medium">
                          {t(statusOptions.find(o => o.value === statusFilter)?.labelKey ?? "")}
                          <button type="button" onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {methodFilter && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#005792]/10 text-[#005792] px-2 py-1 rounded-lg font-medium">
                          {methods.find(m => m.id === methodFilter)?.name ?? methodFilter}
                          <button type="button" onClick={() => { setMethodFilter(""); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#005792]/10 text-[#005792] px-2 py-1 rounded-lg font-medium">
                          "{searchTerm}"
                          <button type="button" onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Table ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mt-3">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-left px-6 py-4 font-semibold text-[#005792] text-sm"
                    >
                      {header}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }} className="border-b border-blue-50 animate-pulse"
                    >
                      {Array.from({ length: 6 }).map((__, ci) => (
                        <td key={ci} className="py-4 px-6">
                          <div className={`h-4 bg-blue-100 rounded ${ci === 4 ? "w-24" : ci === 5 ? "w-12" : "w-full"}`} />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6} className="text-center py-10 text-red-500 text-lg font-medium">{error}</td>
                  </motion.tr>
                ) : filteredLogs.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log, idx) => (
                      <motion.tr key={log.id} custom={idx} variants={tableRow}
                        initial="hidden" animate="visible" exit="exit" layout
                        whileHover={{ backgroundColor: "rgba(239,246,255,0.85)", transition: { duration: 0.15 } }}
                        className="border-b border-blue-50 cursor-pointer"
                        onClick={() => void navigate(`/researcher/experiment-log/${log.id}`)}
                      >
                        <td className="py-4 px-6 font-medium text-blue-950">{log.name}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{log.methodName}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{log.tissueCultureBatchName}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">
                          {log.createdDate ? new Date(log.createdDate).toLocaleDateString("vi-VN") : ""}
                        </td>
                        <td className="py-4 px-6">
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.045 + 0.1, duration: 0.28, ease: EASE_OUT }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}
                          >
                            {statusToLabel(log.status)}
                          </motion.span>
                        </td>
                        <td className="py-4 px-6 font-medium text-blue-950">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#005792]">{log.expectedSampleCount ?? 0}</span>
                            <span className="text-xs text-blue-900/60">{t("experimentLog.samples")}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6} className="text-center p-8 text-blue-900/40 font-medium">
                      {t("common.noData")}
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <AnimatePresence>
            {totalCount > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-blue-100"
              >
                <span className="font-medium">
                  {t("common.showing")}{" "}
                  {Math.min((currentPage - 1) * logsPerPage + 1, totalCount)}–
                  {Math.min(currentPage * logsPerPage, totalCount)}{" "}
                  {t("common.of")} {totalCount}
                </span>
                {totalCount > logsPerPage && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm"
                      >←</motion.button>
                    )}
                    {Array.from({ length: Math.min(Math.ceil(totalCount / logsPerPage), 5) }, (_, i) => {
                      const totalPages = Math.ceil(totalCount / logsPerPage);
                      let pageNum: number;
                      if (totalPages <= 5)              pageNum = i + 1;
                      else if (currentPage <= 3)        pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else                              pageNum = currentPage - 2 + i;
                      return (
                        <motion.button key={pageNum} type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            currentPage === pageNum ? "bg-[#005792] text-white" : "bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                          }`}
                        >{pageNum}</motion.button>
                      );
                    })}
                    {Math.ceil(totalCount / logsPerPage) > currentPage && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm"
                      >→</motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
};

export default ExperimentLog;