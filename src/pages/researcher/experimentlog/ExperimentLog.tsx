/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import axiosInstance from "../../../api/axiosInstance";

/* ─── Types ─────────────────────────────────────────────── */
type ExperimentStatus = "Created" | "Waiting" | "InProcess" | "Done" | "Cancel";

interface Stage {
  id: string; name: string; description?: string;
  dateOfProcessing?: number; step: number; status: boolean; elementDTO?: unknown[];
}
interface Sample { id: string; name: string; description?: string; dob?: string; status?: boolean; }
interface ExperimentLogEntry {
  id: string; name: string; methodName: string; description?: string;
  tissueCultureBatchName: string; createdDate?: string;
  status?: number | string; samples?: Sample[]; stages?: Stage[]; currentStageName?: string;
}
interface ExperimentLogApiResponse { value: ExperimentLogEntry[]; totalCount?: number; }
interface MethodOption { id: string; name: string; }

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
  }),
};

const statCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, delay: 0.1 + (i as number) * 0.08, ease: EASE_OUT },
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

/* ─── Animated Counter (GSAP) ────────────────────────────── */
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });
  useEffect(() => {
    obj.current.val = 0;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value, duration: 1, ease: "power2.out", delay: 0.3,
        onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(obj.current.val).toString(); },
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
    case "Created": return "Created";
    case "WaitingForChangeStage": return "Waiting";
    case "Completed": return "Done";
    case "InProgress": return "InProcess";
    case "Cancelled": case "Destroyed": return "Cancel";
    default: return s;
  }
}

function statusToVietnamese(status?: number | string) {
  switch (normalizeStatus(status)) {
    case "Created": return "Mới tạo";
    case "Waiting": return "Chờ thay đổi giai đoạn";
    case "InProcess": return "Đang trong quá trình thực hiện";
    case "Done": return "Hoàn thành";
    case "Cancel": return "Đã hủy";
    default: return "Không xác định";
  }
}

function getStatusColor(status?: number | string): string {
  switch (normalizeStatus(status)) {
    case "Created": return "bg-[#E6F1FF] text-[#005792]";
    case "Waiting": return "bg-[#FFF2F0] text-[#D1433C]";
    case "InProcess": return "bg-[#E0F7FA] text-[#006D73]";
    case "Done": return "bg-[#E0F7FA] text-[#006D73]";
    case "Cancel": return "bg-[#FFECEA] text-[#D1433C]";
    default: return "bg-gray-100 text-gray-800";
  }
}

function hasValueWithData<T>(obj: unknown, itemGuard: (item: unknown) => item is T): obj is { value: { data: T[] } } {
  return typeof obj === "object" && obj !== null && "value" in obj &&
    typeof (obj as { value: unknown }).value === "object" &&
    (obj as { value: { data?: unknown[] } }).value !== null &&
    "data" in (obj as { value: { data?: unknown[] } }).value &&
    Array.isArray((obj as { value: { data?: unknown[] } }).value.data) &&
    (obj as { value: { data: unknown[] } }).value.data.every(itemGuard);
}

function isExperimentLogEntry(obj: unknown): obj is ExperimentLogEntry {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.methodName === "string" &&
    (typeof o.tissueCultureBatchName === "string" ||
      typeof (o as any).batcheName === "string" || typeof (o as any).batchName === "string");
}

function normalizeRawLog(obj: any): ExperimentLogEntry | null {
  if (!obj?.id || !obj.name) return null;
  return {
    id: String(obj.id), name: String(obj.name),
    methodName: obj.methodName ?? obj.method ?? "",
    description: obj.description ?? "",
    tissueCultureBatchName: obj.tissueCultureBatchName ?? obj.batcheName ?? obj.batchName ?? "",
    createdDate: obj.createdDate ?? obj.createdDateString ?? "",
    status: obj.status, samples: obj.samples, stages: obj.stages,
    currentStageName: obj.currentStageName ?? "",
  };
}

/* ─── Main Component ─────────────────────────────────────── */
const ExperimentLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [stats, setStats] = useState({ total: 0, Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;
  const navigate = useNavigate();

  /* GSAP progress bar */
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0, opacity: 1 },
        { scaleX: 1, duration: 1, ease: "power3.out" }
      );
      gsap.to(progressRef.current, { opacity: 0, duration: 0.5, delay: 1.2 });
    });
    return () => ctx.revert();
  }, []); // fires once on mount

  /* Re-animate progress bar on each page fetch */
  useEffect(() => {
    if (loading && progressRef.current) {
      gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
      gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
      gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
    }
  }, [loading]);

  const activeExperiments = stats.Created + stats.Waiting + stats.InProcess;
  const completedOrFailed = stats.Done + stats.Cancel;
  const successRate = completedOrFailed > 0 ? Math.round((stats.Done / completedOrFailed) * 100) : 0;
  const bottlenecksCount = stats.Waiting;

  const approachingDeadlineCount = logs.filter((log) => {
    const now = Date.now(); const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    return Boolean(log.stages?.some((stage) => {
      if (!stage.dateOfProcessing) return false;
      let ts = stage.dateOfProcessing;
      if (ts < 1e12) ts = ts * 1000;
      return ts >= now && ts <= in7Days;
    }));
  }).length;

  const priorityLogs = logs.filter((log) => normalizeStatus(log.status) === "Waiting").slice(0, 5);

  const fetchSampleCount = async (experimentLogId: string): Promise<number> => {
    try {
      const resp = await axiosInstance.get("/api/samples", { params: { pageNo: 1, pageSize: 1000, experimentLogId } });
      const data: unknown = resp.data;
      if (typeof data === "object" && data !== null && "value" in data) {
        const value = (data as { value?: unknown }).value;
        if (Array.isArray(value)) return value.length;
        if (value && typeof value === "object" && "data" in (value as { data?: unknown[] })) {
          const inner = (value as { data?: unknown[] }).data;
          return Array.isArray(inner) ? inner.length : 0;
        }
      }
      return Array.isArray(data) ? data.length : 0;
    } catch { return 0; }
  };

  const fetchAllSampleCounts = useCallback(async (experimentLogs: ExperimentLogEntry[]) => {
    const counts: Record<string, number> = {};
    await Promise.all(experimentLogs.map(async (log) => { counts[log.id] = await fetchSampleCount(log.id); }));
    setSampleCounts(counts);
  }, []);

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

  const fetchStatsOnly = useCallback(async () => {
    try {
      let data: unknown;
      try {
        const res = await axiosInstance.get("/api/experiment-logs", { params: { pageNo: 1, pageSize: 1000 } });
        data = res.data;
      } catch (err) {
        const apiErr = err as any;
        const detail = apiErr?.response?.data?.detail ?? apiErr?.response?.data?.message;
        if (typeof detail === "string" && detail.includes("OFFSET")) {
          const retryRes = await axiosInstance.get("/api/experiment-logs");
          data = retryRes.data;
        } else throw new Error("Lỗi khi lấy thống kê");
      }

      let allLogs: ExperimentLogEntry[] = [];
      if (typeof data === "object" && data !== null && "data" in (data as Record<string, unknown>) && Array.isArray((data as any).data)) {
        allLogs = (data as any).data.map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
      } else if (hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)) {
        allLogs = (data.value.data ?? []).map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
      } else if (typeof data === "object" && data !== null && "value" in data) {
        allLogs = ((data as ExperimentLogApiResponse).value ?? []).map(normalizeRawLog).filter((x): x is ExperimentLogEntry => x !== null);
      } else if (Array.isArray(data)) {
        allLogs = data.map(normalizeRawLog).filter((x): x is ExperimentLogEntry => x !== null);
      }

      const counts = { Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 };
      allLogs.forEach((log) => {
        const s = normalizeStatus(log.status);
        if (s in counts) counts[s as keyof typeof counts]++;
      });
      setStats({ total: counts.Created + counts.InProcess + counts.Done + counts.Cancel, ...counts });
    } catch { setStats({ total: 0, Created: 0, Waiting: 0, InProcess: 0, Done: 0, Cancel: 0 }); }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      const selectedMethod = methods.find((m) => m.id === methodFilter);
      const methodName = selectedMethod ? selectedMethod.name : methodFilter;
      try {
        const paramsObj: Record<string, unknown> = { pageNo: currentPage, pageSize: logsPerPage };
        if (methodName) { paramsObj.methodNameSearchTerm = methodName; paramsObj.MethodNameSearchTerm = methodName; }

        let data: unknown;
        try {
          const res = await axiosInstance.get("/api/experiment-logs", { params: paramsObj });
          data = res.data;
        } catch (err) {
          const apiErr = err as any;
          const detail = apiErr?.response?.data?.detail ?? apiErr?.response?.data?.message;
          if (typeof detail === "string" && detail.includes("OFFSET")) {
            const retryRes = await axiosInstance.get("/api/experiment-logs");
            data = retryRes.data;
          } else throw new Error("Lỗi khi lấy dữ liệu");
        }

        let arr: ExperimentLogEntry[] = []; let total = 0;
        if (typeof data === "object" && data !== null && "data" in (data as Record<string, unknown>) && Array.isArray((data as any).data)) {
          arr = (data as any).data.map(normalizeRawLog).filter((x: any): x is ExperimentLogEntry => x !== null);
          total = Number((data as any).totalCount ?? arr.length);
        } else if (hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)) {
          arr = (data.value.data ?? []).map(normalizeRawLog).filter((x): x is ExperimentLogEntry => x !== null);
          total = Number((data as { value: { totalCount?: unknown } })?.value?.totalCount ?? arr.length);
        } else if (typeof data === "object" && data !== null && "value" in data) {
          arr = ((data as ExperimentLogApiResponse).value ?? []).map(normalizeRawLog).filter((x): x is ExperimentLogEntry => x !== null);
          total = (data as ExperimentLogApiResponse).totalCount ?? arr.length;
        } else if (Array.isArray(data)) {
          arr = data.map(normalizeRawLog).filter((x): x is ExperimentLogEntry => x !== null);
          total = arr.length;
        }

        arr = arr.map((log) => ({ ...log, status: normalizeStatus(log.status) }));
        setLogs(arr); setTotalCount(total);
        if (arr.length > 0) await fetchAllSampleCounts(arr);
      } catch {
        setError("Không thể tải dữ liệu."); setLogs([]); setTotalCount(0);
      } finally { setLoading(false); }
    };

    void fetchData();
    void fetchStatsOnly();
  }, [currentPage, logsPerPage, methodFilter, fetchAllSampleCounts, fetchStatsOnly]);

  const statusDistribution = [
    { label: "Mới tạo", value: stats.Created, color: "#005792" },
    { label: "Chờ", value: stats.Waiting, color: "#FF6F61" },
    { label: "Đang thực hiện", value: stats.InProcess, color: "#00CED1" },
    { label: "Hoàn thành", value: stats.Done, color: "#22c55e" },
    { label: "Đã hủy", value: stats.Cancel, color: "#ef4444" },
  ];
  const totalDistribution = statusDistribution.reduce((sum, item) => sum + item.value, 0);
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativeOffset = 0;
  const donutSlices = statusDistribution.filter((item) => item.value > 0).map((item) => {
    const dash = totalDistribution > 0 ? (item.value / totalDistribution) * donutCircumference : 0;
    const slice = { ...item, dash, offset: cumulativeOffset };
    cumulativeOffset += dash;
    return slice;
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !searchTerm ||
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tissueCultureBatchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || normalizeStatus(log.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tableHeaders = ["Tên thí nghiệm", "Phương pháp", "Lô thí nghiệm", "Ngày tạo", "Trạng thái", "Số lượng mẫu"];

  const statItems = [
    { label: "Thí nghiệm hoạt động", value: activeExperiments, valueClass: "text-[#005792]", sub: "Tổng số thí nghiệm đang chạy & chờ xử lý." },
    { label: "Tỷ lệ thành công", value: successRate, valueClass: "text-[#00CED1]", suffix: "%", sub: `(${completedOrFailed} thí nghiệm đã kết thúc)` },
    { label: "Điểm nghẽn / Chờ review", value: bottlenecksCount, valueClass: "text-[#D1433C]", sub: "Số thí nghiệm cần xác nhận hoặc thay đổi giai đoạn." },
    { label: "Dự kiến hoàn thành", value: approachingDeadlineCount, valueClass: "text-[#005792]", sub: "Thí nghiệm có mốc quan trọng trong 7 ngày tới." },
  ];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-slate-900">

      {/* ── GSAP progress bar ── */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      {/* ── Header + stat cards ── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
              Quản lý &amp; Theo dõi Thí nghiệm Orchid Lab
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Bảng điều khiển nghiên cứu viên: theo dõi trạng thái, tiến độ và điểm nghẽn.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 350, damping: 22 }}>
            <Link
              to="/researcher/experiment-log/create"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#005792] text-white font-semibold shadow-sm hover:bg-[#00456a] transition"
            >
              <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.25 }} className="flex">
                <Plus className="w-4 h-4" />
              </motion.span>
              Tạo nhật ký
            </Link>
          </motion.div>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item, idx) => (
            <motion.div
              key={item.label}
              custom={idx}
              variants={statCard}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(0,0,0,0.13)", transition: { duration: 0.2 } }}
              className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <AnimatedCounter value={item.value} className={`text-3xl font-semibold ${item.valueClass}`} />
                {item.suffix && <span className={`text-3xl font-semibold ${item.valueClass}`}>{item.suffix}</span>}
                {item.sub && <span className="text-xs text-slate-500">{item.sub}</span>}
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
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">Phân bổ trạng thái thí nghiệm</h2>
                <p className="mt-1 text-sm text-slate-500">Quan sát nhanh tỷ lệ từng trạng thái để ưu tiên hành động.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                    {donutSlices.map((slice, i) => (
                      <motion.circle
                        key={slice.label}
                        cx="60" cy="60" r="38" fill="transparent"
                        stroke={slice.color} strokeWidth="12"
                        strokeDasharray={`${slice.dash} ${donutCircumference}`}
                        strokeDashoffset={-slice.offset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                      />
                    ))}
                    <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="text-sm font-semibold" fill="#0f172a">
                      {totalDistribution}
                    </text>
                  </svg>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {statusDistribution.filter((item) => item.value > 0).map((item, i) => (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
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
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">Thí nghiệm ưu tiên Review</h2>
                <p className="mt-1 text-sm text-slate-500">Danh sách thí nghiệm đang chờ review hoặc cần xác nhận.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{priorityLogs.length} mục</span>
            </div>
            <ul className="mt-4 space-y-2">
              {priorityLogs.length > 0 ? priorityLogs.map((log, i) => (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
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
                        {statusToVietnamese(log.status)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </motion.li>
              )) : (
                <div className="text-sm text-slate-500">Không có thí nghiệm đang chờ review.</div>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Filter panel */}
        <div className="xl:col-span-1">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#005792]">Bộ lọc</h2>
            <p className="mt-1 text-sm text-slate-500">Lọc thí nghiệm theo trạng thái và phương pháp.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Trạng thái</label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | "all")}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Created">Đã tạo</option>
                  <option value="InProcess">Đang thực hiện</option>
                  <option value="Done">Hoàn thành</option>
                  <option value="Cancel">Đã hủy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Phương pháp</label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1]"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text" placeholder="Tìm kiếm thí nghiệm..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-10 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Table ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mt-3">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-left p-4 font-semibold text-gray-900"
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
                      transition={{ delay: idx * 0.05 }} className="border-b border-blue-50 animate-pulse">
                      {Array.from({ length: 6 }).map((__, ci) => (
                        <td key={ci} className="p-4"><div className={`h-4 bg-blue-100 rounded ${ci === 4 ? "w-24" : ci === 5 ? "w-12" : "w-full"}`} /></td>
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
                      <motion.tr
                        key={log.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        whileHover={{ backgroundColor: "rgba(239,246,255,0.85)", transition: { duration: 0.15 } }}
                        className="border-b cursor-pointer"
                        onClick={() => void navigate(`/researcher/experiment-log/${log.id}`)}
                      >
                        <td className="p-4 font-medium text-gray-900">{log.name}</td>
                        <td className="p-4 text-gray-700">{log.methodName}</td>
                        <td className="p-4 text-gray-700">{log.tissueCultureBatchName}</td>
                        <td className="p-4 text-gray-700">
                          {log.createdDate ? new Date(log.createdDate).toLocaleDateString("vi-VN") : ""}
                        </td>
                        <td className="p-4">
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.045 + 0.1, duration: 0.28, ease: EASE_OUT }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}
                          >
                            {statusToVietnamese(log.status)}
                          </motion.span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">{sampleCounts[log.id] ?? 0}</span>
                            <span className="text-xs text-gray-400">mẫu</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <div className="text-lg font-medium">Không tìm thấy nhật ký nào.</div>
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <AnimatePresence>
            {totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-blue-100"
              >
                <span className="font-medium">
                  Hiển thị {Math.min((currentPage - 1) * logsPerPage + 1, totalCount)}-
                  {Math.min(currentPage * logsPerPage, totalCount)} của {totalCount}
                </span>
                {totalCount > logsPerPage && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm">←</motion.button>
                    )}
                    {Array.from({ length: Math.min(Math.ceil(totalCount / logsPerPage), 5) }, (_, i) => {
                      const totalPages = Math.ceil(totalCount / logsPerPage);
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <motion.button key={pageNum} type="button"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
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
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm">→</motion.button>
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