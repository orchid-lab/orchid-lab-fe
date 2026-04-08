/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import "./Method.css";
import axiosInstance from "../../../api/axiosInstance";

interface MethodListItem {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
}

interface MethodApiResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  data?: MethodListItem[];
}

const SKELETON_ROWS = 8;

// ── Animated counter ────────────────────────────────────────────────────────
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

// ── Shared easing ─────────────────────────────────────────────────────────────
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

// ── Variants ─────────────────────────────────────────────────────────────────
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
    transition: {
      delay: i * 0.055,
      duration: 0.4,
      ease: EASE_OUT_EXPO,
    },
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
export default function MethodList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MethodListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        PageNumber: "1",
        PageSize: "1000",
      });
      const res = await axiosInstance.get(`/api/methods?${params.toString()}`);
      const json = res.data as MethodApiResponse;
      const items = json.data ?? [];
      setData(items);
      setTotalCount(json.totalCount ?? items.length);
    } catch (error) {
      const apiError = error as { response?: { data?: string }; message?: string };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("method.fetchFailed"),
        { variant: "error" }
      );
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return [...data].sort((a, b) => a.name.localeCompare(b.name));
    }
    return data
      .filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, searchTerm]);

  return (
    <main className="method-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
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
                {t("method.methodsManagement")}
              </h1>
              <p className="mt-1 text-sm text-blue-900/70">
                {t("method.methodSubtitle")}
              </p>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => void navigate("/researcher/method/new")}
              className="method-create-button inline-flex items-center gap-2 rounded-xl bg-blue-900/70 px-5 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005792]/60 hover:bg-[#002233] transition-colors duration-200"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              <motion.span
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.25 }}
                className="flex"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
              {t("method.createMethod")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="text-sm font-medium text-blue-700 mb-1">
            {t("method.totalMethods")}
          </div>
          <div className="text-3xl font-semibold text-blue-950">
            <AnimatedCounter value={totalCount} />
          </div>
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <motion.div
            className="relative max-w-xl"
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
              placeholder={t("method.searchPlaceholder")}
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
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                {["method.methodName", "common.description", "common.duration", "common.action"].map(
                  (key, i) => (
                    <motion.th
                      key={key}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60"
                    >
                      {t(key)}
                    </motion.th>
                  )
                )}
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
                        {[3 / 4, 1, 1 / 3, 1 / 2].map((w, ci) => (
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
                      {t("common.noData")}
                    </td>
                  </motion.tr>
                ) : (
                  filteredData.map((method, idx) => (
                    <motion.tr
                      key={method.id}
                      custom={idx}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      onClick={() => void navigate(`/researcher/method/${method.id}`)}
                      className="border-b border-blue-50 cursor-pointer"
                    >
                      <td className="py-4 px-6 font-medium text-blue-950">
                        {method.name}
                      </td>
                      <td className="py-4 px-6 text-blue-900 max-w-[440px]">
                        <div className="line-clamp-2" title={method.description}>
                          {method.description}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <motion.span
                          className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-100"
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        >
                          {method.totalDurationDays} {t("common.days")}
                        </motion.span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <ActionButton
                            label={t("common.view")}
                            onClick={(e) => {
                              e.stopPropagation();
                              void navigate(`/researcher/method/${method.id}`);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </ActionButton>

                          {/* Edit */}
                          <ActionButton
                            label={t("common.edit")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </ActionButton>

                          {/* Delete */}
                          <ActionButton
                            label={t("common.delete")}
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
          ? "text-[#005792] !hover:bg-red-50 !hover:text-red-500"
          : "text-[#005792] !hover:bg-blue-50 !hover:text-[#003f60]"
      }`}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.85, rotate: danger ? -10 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
    >
      {children}
    </motion.button>
  );
}