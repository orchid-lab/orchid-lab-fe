/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { useState, useMemo, useEffect, useRef } from "react";
import axiosInstance from "../../../api/axiosInstance";
import type { ReportApiResponse, Report } from "../../../types/Report";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronDown,
  Filter,
  Search,
  Eye,
} from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend);

const PAGE_SIZE = 10;

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

const filterPanelVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.96, y: -8 },
  visible: {
    opacity: 1, scaleY: 1, y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const dropdownVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.88, y: -6 },
  visible: {
    opacity: 1, scaleY: 1, y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0, scaleY: 0.9, y: -4,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const dropdownItemVariant: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.18, delay: i * 0.03, ease: "easeOut" as const },
  }),
};

// ─── Status config ────────────────────────────────────────────────────────────

type ReportStatus = "Seen" | "NotSeen";

const STATUS_COLORS: Record<ReportStatus, string> = {
  Seen:    "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
  NotSeen: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]",
};

const STATUS_ICON_COLORS: Record<ReportStatus, string> = {
  Seen:    "text-[#991B1B]",
  NotSeen: "text-[#C2410C]",
};

const getStatusIcon = (status: ReportStatus) => {
  const cls = `w-4 h-4 ${STATUS_ICON_COLORS[status]}`;
  return status === "Seen"
    ? <CheckCircle2 className={cls} />
    : <Clock className={cls} />;
};

// ─── AnimatedSelect ───────────────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface AnimatedSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
}

function AnimatedSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: AnimatedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm bg-white
          transition-all duration-150 whitespace-nowrap
          ${open
            ? "border-[#991B1B] ring-2 ring-[#991B1B]/20 text-[#991B1B]"
            : "border-red-100 text-gray-700 hover:border-[#991B1B]/50"
          }
        `}
      >
        <span>{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          className="flex items-center"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            key="dropdown"
            variants={dropdownVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top center" }}
            className="
              absolute z-50 top-[calc(100%+6px)] left-0 min-w-full
              bg-white border border-red-100 rounded-xl
              shadow-[0_8px_32px_rgba(153,27,27,0.14)]
              overflow-hidden py-1
            "
          >
            {options.map((opt, i) => (
              <motion.li
                key={opt.value}
                custom={i}
                variants={dropdownItemVariant}
                initial="hidden"
                animate="visible"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap
                  transition-colors duration-75
                  ${opt.value === value
                    ? "bg-[#FEE2E2] text-[#991B1B] font-medium"
                    : "text-gray-700 hover:bg-[#FFF5F5] hover:text-[#991B1B]"
                  }
                `}
              >
                {opt.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  dotColor: string;
  label: string;
  value: number;
  valueColor: string;
  borderColor: string;
}

function StatCard({ dotColor, label, value, valueColor, borderColor }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(153,27,27,0.14)" }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_14px_32px_rgba(153,27,27,0.10)] border ${borderColor} p-5 cursor-default`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block h-3 w-3 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium text-[#991B1B] leading-tight">{label}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`text-3xl font-bold ${valueColor}`}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "All">("All");
  const [data, setData] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<ReportApiResponse>("/api/report", {
          params: { pageNumber: page, pageSize: PAGE_SIZE },
        });
        const json = res.data;
        setData(json.value.data || []);
        setTotal(json.value.totalCount || 0);
        setTotalPages(json.value.pageCount || 1);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [page]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filteredReports = useMemo(() => {
    return data.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.technician.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const seenCount    = data.filter((r) => r.status === "Seen").length;
  const notSeenCount = data.filter((r) => r.status !== "Seen").length;

  const chartData = useMemo(() => ({
    labels: [t("report.seen"), t("report.notSeen")],
    datasets: [{
      data: [seenCount, notSeenCount],
      backgroundColor: ["#991B1B", "#C2410C"],
      borderWidth: 0,
      spacing: 2,
    }],
  }), [seenCount, notSeenCount, t]);

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<"doughnut">) {
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
    cutout: "68%",
  };

  const statusOptions: SelectOption<ReportStatus | "All">[] = [
    { value: "All",    label: t("common.status") },
    { value: "Seen",    label: t("report.seen") },
    { value: "NotSeen", label: t("report.notSeen") },
  ];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#FFF5F5] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-[#991B1B] mb-1">
              {t("report.reportManagement")}
            </h1>
            <p className="text-red-900/70 text-sm">
              {t("report.subtitle", { defaultValue: "Quản lý và theo dõi báo cáo kỹ thuật viên" })}
            </p>
          </div>
        </motion.div>

        {/* ── Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut card */}
          <motion.div
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(153,27,27,0.18)" }}
            className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_18px_40px_rgba(153,27,27,0.10)] border border-red-100 p-6"
          >
            <h3 className="text-lg font-semibold text-[#991B1B] mb-1">
              {t("report.totalReports")}
            </h3>
            <p className="text-sm text-red-900/60 mb-6">
              {t("report.reportDistribution", { defaultValue: "Phân bổ theo trạng thái" })}
            </p>
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <motion.div
                  key={total}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-5xl font-bold text-[#991B1B]"
                >
                  {total}
                </motion.div>
                <div className="text-sm text-red-900/60 mt-1">{t("report.totalReports")}</div>
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: t("report.seen"),    color: "bg-[#991B1B]", value: seenCount },
                    { label: t("report.notSeen"), color: "bg-[#C2410C]", value: notSeenCount },
                  ].map(({ label, color, value }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-red-900/60">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto font-semibold text-[#991B1B]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-36 w-36 flex-shrink-0">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              dotColor="bg-[#991B1B]"
              label={t("report.totalReports")}
              value={total}
              valueColor="text-[#991B1B]"
              borderColor="border-red-100"
            />
            <StatCard
              dotColor="bg-green-600"
              label={t("report.seen")}
              value={seenCount}
              valueColor="text-green-700"
              borderColor="border-green-100"
            />
            <StatCard
              dotColor="bg-[#C2410C]"
              label={t("report.notSeen")}
              value={notSeenCount}
              valueColor="text-[#C2410C]"
              borderColor="border-orange-100"
            />
          </motion.div>
        </div>

        {/* ── Filter panel ── */}
        <motion.div
          variants={filterPanelVariant}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_20px_rgba(153,27,27,0.08)] border border-red-100 p-6 origin-top"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#991B1B]" />
              <AnimatedSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as ReportStatus | "All")}
                options={statusOptions}
                placeholder={t("common.status")}
              />
            </div>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("report.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-red-100 bg-white/90 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#991B1B]/30 focus:border-[#991B1B] transition-shadow"
              />
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSearch(""); setStatusFilter("All"); setPage(1); }}
              className="px-4 py-2.5 text-sm text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FEE2E2] border border-red-100 rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Table ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <motion.div
                className="w-10 h-10 border-4 border-red-100 border-t-[#991B1B] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <span className="text-red-900/50 text-sm">{t("common.loadingData")}</span>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_18px_40px_rgba(153,27,27,0.08)] border border-red-100 overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-white/60 border-b border-red-100">
                  <tr>
                    {[
                      t("report.taskName"),
                      t("report.description"),
                      t("report.writer"),
                      t("common.status"),
                      t("common.action"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-6 py-4 font-semibold text-[#991B1B] text-xs uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-red-50">
                  <AnimatePresence>
                    {filteredReports.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="p-12 text-center text-red-900/40">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-10 h-10 text-red-200" />
                            <span className="text-base font-medium">{t("report.noReports")}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ) : (
                      filteredReports.map((r, i) => (
                        <motion.tr
                          key={r.id}
                          custom={i}
                          variants={tableRowVariant}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(254,242,242,0.85)" }}
                          className="cursor-default transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-red-950">{r.name}</td>
                          <td className="px-6 py-4 text-red-900/70 max-w-xs truncate">{r.description}</td>
                          <td className="px-6 py-4 text-red-900/60">{r.technician}</td>

                          {/* Status badge */}
                          <td className="px-6 py-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 + 0.1, type: "spring", stiffness: 280, damping: 22 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                                STATUS_COLORS[r.status as ReportStatus] ?? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                              }`}
                            >
                              {getStatusIcon(r.status as ReportStatus)}
                              {r.status === "Seen" ? t("report.seen") : t("report.notSeen")}
                            </motion.span>
                          </td>

                          {/* Action */}
                          <td className="px-6 py-4">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => void navigate(`/admin/report/${r.id}?page=${page}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#991B1B] text-[#991B1B] hover:bg-[#991B1B] hover:text-white transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t("report.details")}
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-4 bg-white/70 border-t border-red-100 flex justify-between items-center"
                >
                  <span className="text-sm text-red-900/60 font-medium">
                    {t("common.showing")}{" "}
                    <span className="font-bold text-[#991B1B]">{filteredReports.length}</span>{" "}
                    {t("report.reportsOutOf")}{" "}
                    <span className="font-bold text-[#991B1B]">{total}</span>{" "}
                    {t("report.reports")}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-red-100 hover:bg-[#FEE2E2] hover:border-red-300 text-sm font-medium shadow-sm"
                      >
                        ←
                      </motion.button>
                    )}

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5)             pageNum = i + 1;
                      else if (page <= 3)              pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else                             pageNum = page - 2 + i;
                      return (
                        <motion.button
                          key={pageNum}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${
                            page === pageNum
                              ? "bg-[#991B1B] text-white"
                              : "bg-white border border-red-100 hover:bg-[#FEE2E2] hover:border-red-300"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}

                    {page < totalPages && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-red-100 hover:bg-[#FEE2E2] hover:border-red-300 text-sm font-medium shadow-sm"
                      >
                        →
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}