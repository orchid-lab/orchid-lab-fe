/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import type { TissueCultureBatch, ApiListResponse } from "../../../types/Batch";
import CleaningResultBadge from "../../../components/CleaningResultBadge";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Filter,
  ChevronDown,
  FlaskConical,
  CheckCircle2,
  Wrench,
  LayoutGrid,
  Eye,
} from "lucide-react";

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const filterPanelVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.96, y: -8 },
  visible: { opacity: 1, scaleY: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT_EXPO } },
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
  visible: { opacity: 1, scaleY: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scaleY: 0.9, y: -4, transition: { duration: 0.15, ease: "easeIn" as const } },
};

const dropdownItemVariant: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.18, delay: i * 0.03, ease: "easeOut" as const },
  }),
};

// ─── Status config ────────────────────────────────────────────────────────────

type BatchStatus = "Ready" | "InUse" | "Cleaning";

const STATUS_COLORS: Record<BatchStatus, string> = {
  Ready:    "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  InUse:    "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]",
  Cleaning: "bg-[#FEF9C3] text-[#854D0E] border-[#FDE68A]",
};

const STATUS_ICON: Record<BatchStatus, React.ReactNode> = {
  Ready:    <CheckCircle2 className="w-4 h-4 text-[#2D5A27]" />,
  InUse:    <FlaskConical className="w-4 h-4 text-[#1D4ED8]" />,
  Cleaning: <Wrench className="w-4 h-4 text-[#854D0E]" />,
};

// ─── AnimatedSelect ───────────────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

function AnimatedSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm bg-white transition-all duration-150 whitespace-nowrap cursor-pointer
          ${open ? "border-[#2D5A27] ring-2 ring-[#2D5A27]/20 text-[#2D5A27]" : "border-gray-300 text-gray-700 hover:border-[#2D5A27]/50"}`}
      >
        <span>{selectedLabel}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: EASE_OUT_EXPO }} className="flex items-center">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            key="dropdown"
            variants={dropdownVariant}
            initial="hidden" animate="visible" exit="exit"
            style={{ transformOrigin: "top center" }}
            className="absolute z-50 top-[calc(100%+6px)] left-0 min-w-full bg-white border border-[#DDEEE0] rounded-xl shadow-[0_8px_32px_rgba(45,90,39,0.14)] overflow-hidden py-1"
          >
            {options.map((opt, i) => (
              <motion.li
                key={opt.value}
                custom={i}
                variants={dropdownItemVariant}
                initial="hidden" animate="visible"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap transition-colors duration-75
                  ${opt.value === value ? "bg-[#E4F0E8] text-[#2D5A27] font-medium" : "text-gray-700 hover:bg-[#F4F7F4] hover:text-[#2D5A27]"}`}
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

function StatCard({ icon, iconBg, label, value, valueColor, help }: {
  icon: React.ReactNode; iconBg: string; label: string;
  value: number; valueColor: string; help: string;
}) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(45,90,39,0.16)" }}
      className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5 cursor-default"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${iconBg}`}>{icon}</span>
          <span className="text-sm font-medium text-[#2D5A27]">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
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

const TechnicianBatchList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TissueCultureBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompletingCleaning, setIsCompletingCleaning] = useState<Record<string, boolean>>({});
  const [cleaningResult, setCleaningResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "">("");
  const [labFilter, setLabFilter] = useState<string>("");

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/batches?pageNo=1&pageSize=1000");
      const raw = res.data as ApiListResponse | TissueCultureBatch[];
      let arr: TissueCultureBatch[] = [];
      if ((raw as ApiListResponse)?.value?.data)       arr = (raw as ApiListResponse).value!.data!;
      else if ((raw as ApiListResponse)?.data)         arr = (raw as ApiListResponse).data!;
      else if (Array.isArray(raw))                     arr = raw;
      arr.sort((a, b) => {
        const idA = typeof a.id === "string" ? parseInt(a.id) : a.id;
        const idB = typeof b.id === "string" ? parseInt(b.id) : b.id;
        return idA - idB;
      });
      setItems(arr);
    } catch (err) {
      console.error("Error loading batches:", err);
      setError(t("tissueCultureBatch.errorLoadingList"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, [t]);

  useEffect(() => {
    if (cleaningResult) {
      const timer = setTimeout(() => setCleaningResult(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [cleaningResult]);

  const handleCompleteCleaning = async (batchId: string) => {
    setIsCompletingCleaning((prev) => ({ ...prev, [batchId]: true }));
    setCleaningResult(null);
    try {
      const response = await axiosInstance.patch(`/api/batches/${batchId}/complete-cleaning`);
      if (response.status === 200) {
        setCleaningResult({ success: true, message: t("tissueCultureBatch.cleaningCompleteSuccess") });
        await fetchBatches();
      }
    } catch (err: any) {
      setCleaningResult({
        success: false,
        message: err.response?.data?.detail ?? t("tissueCultureBatch.cleaningCompleteFailed"),
      });
    } finally {
      setIsCompletingCleaning((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  // Derived stats
  const totalCount    = items.length;
  const readyCount    = items.filter((i) => i.status === "Ready").length;
  const inUseCount    = items.filter((i) => i.status === "InUse").length;
  const cleaningCount = items.filter((i) => i.status === "Cleaning").length;

  // Unique lab rooms for filter
  const labRooms = Array.from(new Set(items.map((i) => i.labRoomName ?? i.labName ?? "").filter(Boolean)));

  const statusOptions: SelectOption<BatchStatus | "">[] = [
    { value: "", label: t("common.allStatus") || "Tất cả trạng thái" },
    { value: "Ready",    label: "Ready" },
    { value: "InUse",    label: "In Use" },
    { value: "Cleaning", label: "Cleaning" },
  ];

  const labOptions: SelectOption<string>[] = [
    { value: "", label: "Tất cả phòng lab" },
    ...labRooms.map((l) => ({ value: l, label: l })),
  ];

  const filtered = items.filter((item) => {
    const matchStatus = !statusFilter || item.status === statusFilter;
    const matchLab    = !labFilter || (item.labRoomName ?? item.labName ?? "") === labFilter;
    return matchStatus && matchLab;
  });

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8">
      <CleaningResultBadge result={cleaningResult} />
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeInDown} initial="hidden" animate="visible" className="mb-8">
          <h1 className="text-4xl font-bold text-[#2D5A27] mb-2">
            {t("tissueCultureBatch.tissueCultureBatchList")}
          </h1>
          <p className="text-[#4B6C54] text-lg">{t("tissueCultureBatch.viewBatches")}</p>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer} initial="hidden" animate="visible"
        >
          <StatCard
            icon={<LayoutGrid className="w-5 h-5" />} iconBg="bg-[#DDEEE0]"
            label="Tổng lồng" value={totalCount} valueColor="text-[#2D5A27]"
            help="Tổng số lồng nuôi cấy trong hệ thống"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-[#DDEEE0]"
            label="Sẵn sàng" value={readyCount} valueColor="text-[#2D5A27]"
            help="Lồng đang ở trạng thái sẵn sàng sử dụng"
          />
          <StatCard
            icon={<FlaskConical className="w-5 h-5" />} iconBg="bg-[#DBEAFE]"
            label="Đang sử dụng" value={inUseCount} valueColor="text-[#1D4ED8]"
            help="Lồng đang được sử dụng cho thí nghiệm"
          />
          <StatCard
            icon={<Wrench className="w-5 h-5" />} iconBg="bg-[#FEF9C3]"
            label="Đang vệ sinh" value={cleaningCount} valueColor="text-[#854D0E]"
            help="Lồng đang trong quá trình vệ sinh"
          />
        </motion.div>

        {/* ── Filter panel ── */}
        <motion.div
          variants={filterPanelVariant} initial="hidden" animate="visible"
          className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(45,90,39,0.08)] border border-[#DDEEE0] p-6 origin-top"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#2D5A27]" />
              <AnimatedSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as BatchStatus | "")}
                options={statusOptions}
                placeholder="Tất cả trạng thái"
              />
            </div>
            <AnimatedSelect
              value={labFilter}
              onChange={(v) => setLabFilter(v)}
              options={labOptions}
              placeholder="Tất cả phòng lab"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setStatusFilter(""); setLabFilter(""); }}
              className="px-4 py-2.5 text-sm text-[#2D5A27] hover:text-[#1e3e1c] hover:bg-[#E4F0E8] rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters") || "Xóa bộ lọc"}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Table ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-red-500 text-center py-12"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
                  <tr>
                    {[
                      "#",
                      t("tissueCultureBatch.labRoom"),
                      t("tissueCultureBatch.batchName"),
                      t("tissueCultureBatch.batchSize"),
                      t("tissueCultureBatch.dimensions"),
                      t("common.status"),
                      t("common.action"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-xs font-semibold text-[#2D5A27] uppercase tracking-wider text-left"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={7} className="p-12 text-center text-gray-500">{t("common.noData")}</td>
                      </motion.tr>
                    ) : (
                      filtered.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          custom={index}
                          variants={tableRowVariant}
                          initial="hidden" animate="visible" exit="exit"
                          className="hover:bg-[#EBF7EE] transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-gray-700">{item.labRoomName ?? item.labName ?? "-"}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.batchName ?? item.name ?? "-"}</td>
                          <td className="px-6 py-4 text-gray-700">
                            {item.batchSizeWidth && item.batchSizeHeight
                              ? `${item.batchSizeWidth} × ${item.batchSizeHeight}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {item.widthUnit && item.heightUnit
                              ? `${item.widthUnit} × ${item.heightUnit}`
                              : item.widthUnit ?? item.heightUnit ?? "-"}
                          </td>
                          <td className="px-6 py-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 + 0.1, type: "spring", stiffness: 280, damping: 22 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
                                ${STATUS_COLORS[item.status as BatchStatus] ?? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"}`}
                            >
                              {STATUS_ICON[item.status as BatchStatus]}
                              {item.status}
                            </motion.span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {item.status === "Cleaning" && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCompleteCleaning(String(item.id))}
                                  disabled={isCompletingCleaning[String(item.id)]}
                                  className="px-3 py-1.5 rounded-lg bg-[#2D5A27] text-white text-xs font-medium hover:bg-[#1e3e1c] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isCompletingCleaning[String(item.id)]
                                    ? t("common.processing")
                                    : t("tissueCultureBatch.completeCleaningBtn")}
                                </motion.button>
                              )}
                              <Link
                                to={`/technician/batches/${item.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-[#E4F0E8] hover:border-[#2D5A27] hover:text-[#2D5A27] transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {t("tissueCultureBatch.details")}
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
};

export default TechnicianBatchList;