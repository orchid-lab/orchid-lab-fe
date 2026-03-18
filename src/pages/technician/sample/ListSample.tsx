/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import type { Sample, SampleApiResponse, ExperimentLogApiResponse } from "../../../types/Sample";
import { SampleStatus } from "../../../types/Sample";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search,
  Filter,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Sprout,
  PlusCircle,
} from "lucide-react";

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

const filterPanelVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.96, y: -8 },
  visible: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const progressBarVariant: Variants = {
  hidden: { width: "0%" },
  visible: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.3 },
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatVietnameseDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.Created]: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  [SampleStatus.InProgressed]: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  [SampleStatus.Completed]: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  [SampleStatus.ExecutedBecauseOfDisease]: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  [SampleStatus.ConvertedToSeedling]: "bg-[#FFF0F9] text-[#DA70D6] border-[#F3D4EB]",
};

const STATUS_ICON_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.Created]: "text-[#2D5A27]",
  [SampleStatus.InProgressed]: "text-[#2D5A27]",
  [SampleStatus.Completed]: "text-[#2D5A27]",
  [SampleStatus.ExecutedBecauseOfDisease]: "text-[#B91C1C]",
  [SampleStatus.ConvertedToSeedling]: "text-[#DA70D6]",
};

const getStatusIcon = (status: SampleStatus) => {
  const cls = `w-4 h-4 ${STATUS_ICON_COLORS[status]}`;
  switch (status) {
    case SampleStatus.Created:             return <PlusCircle className={cls} />;
    case SampleStatus.InProgressed:        return <FlaskConical className={cls} />;
    case SampleStatus.Completed:           return <CheckCircle2 className={cls} />;
    case SampleStatus.ExecutedBecauseOfDisease: return <AlertTriangle className={cls} />;
    case SampleStatus.ConvertedToSeedling: return <Sprout className={cls} />;
  }
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  valueColor: string;
  help: string;
}

function StatCard({ icon, iconBg, label, value, valueColor, help }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(45,90,39,0.16)" }}
      className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5 cursor-default"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${iconBg}`}>
            {icon}
          </span>
          <span className="text-sm font-medium text-[#2D5A27]">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`text-2xl font-semibold ${valueColor}`}
        >
          {value}
        </motion.span>
      </div>
      <p className="text-xs text-[#4B6C54]">{help}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ListSample() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [samples, setSamples] = useState<Sample[]>([]);
  const [allSamples, setAllSamples] = useState<Sample[]>([]);
  const [experimentLogMap, setExperimentLogMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Fetch experiment logs for name mapping
  useEffect(() => {
    const fetchExperimentLogs = async () => {
      try {
        const params = new URLSearchParams({ PageNo: "1", PageSize: "1000" });
        const response = await axiosInstance.get<ExperimentLogApiResponse>(
          `/api/experiment-logs?${params.toString()}`
        );
        const logMap: Record<string, string> = {};
        response.data.data.forEach((log) => { logMap[log.id] = log.name; });
        setExperimentLogMap(logMap);
      } catch (err) {
        console.error("Error fetching experiment logs:", err);
      }
    };
    fetchExperimentLogs();
  }, []);

  // Fetch all samples for summary counts
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const params = new URLSearchParams({ pageNo: "1", pageSize: "1000" });
        const response = await axiosInstance.get<SampleApiResponse>(`/api/samples?${params.toString()}`);
        setAllSamples(response.data.data || []);
      } catch (err) {
        console.error("Error fetching summary samples:", err);
      }
    };
    fetchAll();
  }, []);

  // Fetch filtered & paginated samples
  useEffect(() => {
    const fetchSamples = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ pageNo: "1", pageSize: "1000" });
        const response = await axiosInstance.get<SampleApiResponse>(`/api/samples?${params.toString()}`);

        let filtered = response.data.data || [];

        if (searchTerm.trim())
          filtered = filtered.filter((s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

        if (statusFilter)
          filtered = filtered.filter((s) => s.status === statusFilter);

        filtered.sort(
          (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );

        setTotalCount(filtered.length);
        const start = (currentPage - 1) * itemsPerPage;
        setSamples(filtered.slice(start, start + itemsPerPage));
      } catch (err) {
        setError(t("sample.fetchError") || "Không thể tải danh sách mẫu thí nghiệm");
        enqueueSnackbar(t("common.error"), { variant: "error" });
        console.error("Error fetching samples:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSamples, searchTerm ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [searchTerm, statusFilter, currentPage, enqueueSnackbar, t]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getStatusLabel = (status: SampleStatus): string => {
    const statusMap: Record<SampleStatus, string> = {
      [SampleStatus.Created]: t("sample.statusCreated"),
      [SampleStatus.InProgressed]: t("sample.statusInProgressed"),
      [SampleStatus.Completed]: t("sample.statusCompleted"),
      [SampleStatus.ExecutedBecauseOfDisease]: t("sample.statusExecutedBecauseOfDisease"),
      [SampleStatus.ConvertedToSeedling]: t("sample.statusConvertedToSeedling"),
    };
    return statusMap[status] || status;
  };

  // Summary counts
  const totalSamples = allSamples.length;
  const inProgressCount  = allSamples.filter((s) => s.status === SampleStatus.InProgressed).length;
  const completedCount   = allSamples.filter((s) => s.status === SampleStatus.Completed).length;
  const diseaseCount     = allSamples.filter((s) => s.status === SampleStatus.ExecutedBecauseOfDisease).length;
  const seedlingCount    = allSamples.filter((s) => s.status === SampleStatus.ConvertedToSeedling).length;
  const completedPercent = Math.round((completedCount / Math.max(totalSamples, 1)) * 100);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          className="mb-8"
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl font-bold text-[#2D5A27] mb-2">
            {t("sample.sampleList")}
          </h1>
          <p className="text-[#4B6C54] text-lg">
            {t("sample.sampleManagement")}
          </p>
        </motion.div>

        {/* ── Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress card */}
          <motion.div
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(45,90,39,0.18)" }}
            className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.12)] border border-[#DDEEE0] p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#2D5A27] mb-1">
                  {t("sample.overallDistribution", { defaultValue: "Tổng quan mẫu thí nghiệm" })}
                </h3>
                <p className="text-sm text-[#4B6C54]">
                  {t("sample.overallSummary", { defaultValue: "Tổng hợp trạng thái toàn bộ mẫu" })}
                </p>
              </div>
              <div className="text-right">
                <motion.div
                  key={totalSamples}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-3xl font-bold text-[#2D5A27]"
                >
                  {totalSamples}
                </motion.div>
                <div className="text-xs text-[#4B6C54] mt-1">
                  {t("sample.totalSamples", { defaultValue: "mẫu" })}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-[#4B6C54] mb-2">
                <span>{t("sample.completedRate", { defaultValue: "Tỉ lệ hoàn thành" })}</span>
                <motion.span
                  key={completedPercent}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-[#2D5A27]"
                >
                  {completedPercent}%
                </motion.span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E4F0E8] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#2D5A27]"
                  variants={progressBarVariant}
                  initial="hidden"
                  animate="visible"
                  custom={completedPercent}
                />
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            className="grid grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={<FlaskConical className="w-5 h-5" />}
              iconBg="bg-[#DDEEE0] text-[#2D5A27]"
              label={t("sample.statusInProgressed", { defaultValue: "Đang thực hiện" })}
              value={inProgressCount}
              valueColor="text-[#2D5A27]"
              help={t("sample.inProgressHelp", { defaultValue: "Mẫu đang trong quá trình thí nghiệm." })}
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBg="bg-[#E5E7EB] text-[#4B5563]"
              label={t("sample.statusCompleted", { defaultValue: "Hoàn thành" })}
              value={completedCount}
              valueColor="text-[#4B5563]"
              help={t("sample.completedHelp", { defaultValue: "Mẫu đã hoàn thành thí nghiệm." })}
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              iconBg="bg-[#FEE2E2] text-[#B91C1C]"
              label={t("sample.statusExecutedBecauseOfDisease", { defaultValue: "Xử lý bệnh" })}
              value={diseaseCount}
              valueColor="text-[#B91C1C]"
              help={t("sample.diseaseHelp", { defaultValue: "Mẫu bị xử lý do bệnh." })}
            />
            <StatCard
              icon={<Sprout className="w-5 h-5" />}
              iconBg="bg-[#FFF0F9] text-[#DA70D6]"
              label={t("sample.statusConvertedToSeedling", { defaultValue: "Chuyển cây giống" })}
              value={seedlingCount}
              valueColor="text-[#DA70D6]"
              help={t("sample.seedlingHelp", { defaultValue: "Mẫu đã được chuyển thành cây giống." })}
            />
          </motion.div>
        </div>

        {/* ── Filter panel ── */}
        <motion.div
          variants={filterPanelVariant}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(45,90,39,0.08)] border border-[#DDEEE0] p-6 origin-top"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#2D5A27]" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
              >
                <option value="">{t("sample.allStatus")}</option>
                <option value={SampleStatus.Created}>{t("sample.statusCreated")}</option>
                <option value={SampleStatus.InProgressed}>{t("sample.statusInProgressed")}</option>
                <option value={SampleStatus.Completed}>{t("sample.statusCompleted")}</option>
                <option value={SampleStatus.ExecutedBecauseOfDisease}>{t("sample.statusExecutedBecauseOfDisease")}</option>
                <option value={SampleStatus.ConvertedToSeedling}>{t("sample.statusConvertedToSeedling")}</option>
              </select>
            </div>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("sample.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              />
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSearchTerm(""); setStatusFilter(""); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm text-[#2D5A27] hover:text-[#1e3e1c] hover:bg-[#E4F0E8] rounded-lg transition-colors font-medium"
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
                className="w-10 h-10 border-4 border-[#DDEEE0] border-t-[#2D5A27] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <span className="text-gray-500 text-sm">{t("common.loadingData")}</span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-center py-12"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
                  <tr>
                    {[
                      t("sample.number"),
                      t("common.name"),
                      t("sample.experimentLog"),
                      t("sample.currentStage"),
                      t("sample.notes"),
                      t("common.status"),
                      t("sample.executionDate"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {samples.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={7} className="p-12 text-center text-gray-500">
                          {t("common.noData")}
                        </td>
                      </motion.tr>
                    ) : (
                      samples.map((sample, i) => {
                        const rowNumber = (currentPage - 1) * itemsPerPage + i + 1;
                        return (
                          <motion.tr
                            key={sample.id}
                            custom={i}
                            variants={tableRowVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            whileHover={{ backgroundColor: "#EBF7EE" }}
                            className="cursor-pointer transition-colors"
                            onClick={() =>
                              navigate(`/technician/samples/${sample.id}`, {
                                state: { from: "sampleList" },
                              })
                            }
                          >
                            <td className="px-6 py-4 font-medium text-gray-900">{rowNumber}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{sample.name}</td>
                            <td className="px-6 py-4 text-gray-600 text-sm">
                              {experimentLogMap[sample.experimentLogId] ||
                                sample.experimentLogId.substring(0, 8) + "..."}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {sample.currentSampleStage ?? "-"}
                            </td>
                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                              {sample.notes ?? "-"}
                            </td>
                            <td className="px-6 py-4">
                              <motion.span
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  delay: i * 0.03 + 0.1,
                                  type: "spring",
                                  stiffness: 280,
                                  damping: 22,
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                                  STATUS_COLORS[sample.status] ?? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                                }`}
                              >
                                {getStatusIcon(sample.status)}
                                {getStatusLabel(sample.status)}
                              </motion.span>
                            </td>
                            <td className="px-6 py-4 text-[#4B6C54]">
                              {formatVietnameseDate(sample.executionDate)}
                            </td>
                          </motion.tr>
                        );
                      })
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
                  className="px-6 py-4 bg-[#F4F7F4] border-t border-[#DDEEE0] flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600">
                    {t("sample.showing")} {samples.length} {t("sample.outOf")} {totalCount}{" "}
                    {t("sample.samples")}
                  </span>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
                      >
                        ←
                      </motion.button>
                    )}

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5)            pageNum = i + 1;
                      else if (currentPage <= 3)      pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else                            pageNum = currentPage - 2 + i;
                      return (
                        <motion.button
                          key={pageNum}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            currentPage === pageNum
                              ? "bg-[#2D5A27] text-white"
                              : "bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8]"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}

                    {currentPage < totalPages && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
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