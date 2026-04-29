/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
  type Variants,
  type Transition,
} from "framer-motion";
import axiosInstance from "../../../../api/axiosInstance";

// Map stageId → tên giai đoạn
const STAGE_NAME_MAP: Record<number, string> = {
  1: "Chuẩn bị mẫu",
  2: "Khử trùng",
  3: "Nuôi cấy khởi động",
  4: "Nhân nhanh",
  5: "Tạo rễ",
  6: "Ra giá thể",
};

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  stageId: number | null;
  status: string;
  taskTargetType: string | null;
  targetId: string | null;
  researcherId: string | null;
  technicianId: string | null;
  expectedEndDate: string | null;
  createdDate: string;
}

interface ApiTaskResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: TaskTemplate[];
}

function isApiTaskResponse(obj: unknown): obj is ApiTaskResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj &&
    Array.isArray((obj as { data: unknown }).data)
  );
}

const SKELETON_ROWS = 6;

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [value, inView]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toString();
    });
  }, [spring]);

  return <span ref={ref}>0</span>;
}

// ── Easing & Variants ─────────────────────────────────────────────────────────
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 } as Transition,
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT_EXPO } as Transition,
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.055, duration: 0.4, ease: EASE_OUT_EXPO },
  }),
  exit: { opacity: 0, x: 16, transition: { duration: 0.22 } as Transition },
};

const skeletonVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskTemplateList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageNumber: "1", pageSize: "100" });
      const res = await axiosInstance.get(`/api/tasks?${params.toString()}`);
      if (isApiTaskResponse(res.data)) {
        const templateOnly = res.data.data.filter((t) => t.status === "Template");
        setTemplates(templateOnly);
        setTotalCount(templateOnly.length);
      }
    } catch (err) {
      const apiError = err as { response?: { data?: string }; message?: string };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? "Không thể tải danh sách mẫu nhiệm vụ",
        { variant: "error" }
      );
      setTemplates([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  // Danh sách stageId duy nhất
  const stageIds = useMemo(() => {
    return [
      ...new Set(
        templates.map((t) => t.stageId).filter((id): id is number => id !== null)
      ),
    ].sort((a, b) => a - b);
  }, [templates]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return templates
      .filter((t) => {
        const matchSearch =
          !keyword ||
          t.name.toLowerCase().includes(keyword) ||
          t.description?.toLowerCase().includes(keyword);
        const matchStage =
          !stageFilter || String(t.stageId) === stageFilter;
        return matchSearch && matchStage;
      })
      .sort((a, b) => (a.stageId ?? 999) - (b.stageId ?? 999));
  }, [templates, searchTerm, stageFilter]);

  return (
    <main className="task-template-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
      <motion.div
        className="space-y-6 px-6 pb-10"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
                Danh sách mẫu nhiệm vụ
              </h1>
              <p className="mt-1 text-sm text-blue-900/70">
                Quản lý các mẫu nhiệm vụ theo từng giai đoạn nuôi cấy
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="text-sm font-medium text-blue-700 mb-1">
            Tổng số mẫu nhiệm vụ
          </div>
          <div className="text-3xl font-semibold text-blue-950">
            <AnimatedCounter value={totalCount} />
          </div>
        </motion.div>

        {/* ── Search & Filter ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <motion.div
              className="relative flex-1"
              animate={searchFocused ? { scale: 1.015 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <motion.span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#005792]"
                animate={searchFocused ? { scale: 1.15, color: "#003f60" } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
              <input
                type="text"
                className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 pl-11 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200"
                placeholder="Tìm kiếm mẫu nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    key="clear"
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-blue-100 bg-white/90 rounded-xl px-3 py-2 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200 min-w-[180px]"
            >
              <option value="">Tất cả giai đoạn</option>
              {stageIds.map((id) => (
                <option key={id} value={String(id)}>
                  {STAGE_NAME_MAP[id] ?? `Giai đoạn ${id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter badges */}
          <AnimatePresence>
            {(searchTerm || stageFilter) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-50 text-yellow-700 border border-yellow-100">
                    Từ khóa: {searchTerm}
                    <button type="button" onClick={() => setSearchTerm("")} className="ml-0.5 hover:text-yellow-900">×</button>
                  </span>
                )}
                {stageFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700 border border-cyan-100">
                    {STAGE_NAME_MAP[Number(stageFilter)] ?? `Giai đoạn ${stageFilter}`}
                    <button type="button" onClick={() => setStageFilter("")} className="ml-0.5 hover:text-cyan-900">×</button>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                {["Tên mẫu nhiệm vụ", "Giai đoạn", "Mô tả", "Thao tác"].map((label, i) => (
                  <motion.th
                    key={label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60"
                  >
                    {label}
                  </motion.th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <>
                    {Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
                      <motion.tr
                        key={`skeleton-${idx}`}
                        variants={skeletonVariants}
                        initial="hidden"
                        animate="visible"
                        custom={idx}
                        className="border-b border-blue-50"
                      >
                        {[3 / 4, 1 / 3, 1, 1 / 4].map((w, ci) => (
                          <td key={ci} className="py-4 px-6">
                            <motion.div
                              className="h-4 bg-blue-100 rounded"
                              style={{ width: `${w * 100}%` }}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                delay: idx * 0.08 + ci * 0.05,
                                ease: "easeInOut",
                              }}
                            />
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </>
                ) : filteredData.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <td colSpan={4} className="text-center py-14 text-blue-900/40">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="text-4xl mb-3"
                      >
                        🔍
                      </motion.div>
                      Không có mẫu nhiệm vụ nào
                    </td>
                  </motion.tr>
                ) : (
                  filteredData.map((template, idx) => (
                    <motion.tr
                      key={template.id}
                      custom={idx}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      onClick={() => void navigate(`/researcher/task-templates/${template.id}`)}
                      className="border-b border-blue-50 cursor-pointer"
                    >
                      <td className="py-4 px-6 font-medium text-blue-950">
                        {template.name}
                      </td>
                      <td className="py-4 px-6">
                        {template.stageId !== null ? (
                          <motion.span
                            className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-100"
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          >
                            {STAGE_NAME_MAP[template.stageId] ?? `Giai đoạn ${template.stageId}`}
                          </motion.span>
                        ) : (
                          <span className="text-blue-900/40">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-blue-900 max-w-[400px]">
                        <div className="line-clamp-2" title={template.description}>
                          {template.description || <span className="text-blue-900/30 italic">Không có mô tả</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <ActionButton
                            label="Xem chi tiết"
                            onClick={(e) => {
                              e.stopPropagation();
                              void navigate(`/researcher/task-templates/${template.id}`);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </ActionButton>

                          {/* Edit */}
                          <ActionButton
                            label="Chỉnh sửa"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </ActionButton>

                          {/* Delete */}
                          <ActionButton
                            label="Xóa"
                            onClick={(e) => e.stopPropagation()}
                            danger
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <path d="M3 6h18" />
                              <path d="M8 6v14h8V6" />
                              <path d="M10 10v6" />
                              <path d="M14 10v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </ActionButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </main>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────
function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200 ${
        danger
          ? "text-[#005792] hover:bg-red-50 hover:text-red-500"
          : "text-[#005792] hover:bg-blue-50 hover:text-[#003f60]"
      }`}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.85, rotate: danger ? -10 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
    >
      {children}
    </motion.button>
  );
}