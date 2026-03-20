/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import axiosInstance from "../../../api/axiosInstance";

/* ─── Types ─────────────────────────────────────────────── */
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

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.07, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: (i as number) * 0.04, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

/* ─── Animated counter (GSAP) ────────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    if (value === 0) return;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value,
        duration: 1,
        ease: "power2.out",
        delay: 0.4,
        onUpdate: () => {
          if (ref.current) ref.current.textContent = Math.round(obj.current.val).toString();
        },
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <span ref={ref}>0</span>;
}

/* ─── Main Component ─────────────────────────────────────── */
export default function MethodList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MethodListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* GSAP: top progress bar */
  const progressRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ PageNumber: "1", PageSize: "1000" });
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

  /* Animate progress bar when data loads */
  useEffect(() => {
    if (loading || !progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.to(progressRef.current, {
        opacity: 0,
        duration: 0.4,
        delay: 1,
        ease: "power1.in",
      });
    });
    return () => ctx.revert();
  }, [loading]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return [...data].sort((a, b) => a.name.localeCompare(b.name));
    return data
      .filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, searchTerm]);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">

      {/* GSAP top progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 1 }}
      />

      <div className="space-y-6 px-6 pb-10">

        {/* ── Header card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
                {t("method.methodsManagement")}
              </h1>
              <p className="mt-1 text-sm text-blue-900/70">{t("method.methodSubtitle")}</p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, backgroundColor: "#004d73" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => void navigate("/researcher/method/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005792] px-5 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005792]/60"
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.25 }}
              >
                <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              {t("method.createMethod")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          whileHover={{ boxShadow: "0 8px 28px rgba(0,87,146,0.1)" }}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="text-sm font-medium text-blue-700 mb-1">{t("method.totalMethods")}</div>
          <div className="text-3xl font-semibold text-blue-950">
            <AnimatedCounter value={totalCount} />
          </div>
        </motion.div>

        {/* ── Search card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#005792]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="text"
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 pl-11 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200"
              placeholder={t("method.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                {[t("method.methodName"), t("common.description"), t("common.duration"), t("common.action")].map(
                  (header, i) => (
                    <motion.th
                      key={header}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60"
                    >
                      {header}
                    </motion.th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
                  <motion.tr
                    key={`skeleton-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-blue-50 animate-pulse"
                  >
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-3/4" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-full" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-1/3" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-1/2" /></td>
                  </motion.tr>
                ))
              ) : filteredData.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <td colSpan={4} className="text-center py-10 text-blue-900/40">
                    {t("common.noData")}
                  </td>
                </motion.tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredData.map((method, i) => (
                    <motion.tr
                      key={method.id}
                      custom={i}
                      variants={tableRow}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      whileHover={{
                        backgroundColor: "rgba(239,246,255,0.8)",
                        transition: { duration: 0.15 },
                      }}
                      className="border-b border-blue-50 cursor-pointer"
                      onClick={() => void navigate(`/researcher/method/${method.id}`)}
                    >
                      <td className="py-4 px-6 font-medium text-blue-950">{method.name}</td>
                      <td className="py-4 px-6 text-blue-900 max-w-[440px]">
                        <div className="line-clamp-2" title={method.description}>
                          {method.description}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 + 0.1, duration: 0.3, ease: EASE_OUT }}
                          className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-100"
                        >
                          {method.totalDurationDays} {t("common.days")}
                        </motion.span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <ActionButton
                            label={t("common.view")}
                            onClick={(e) => { e.stopPropagation(); void navigate(`/researcher/method/${method.id}`); }}
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </ActionButton>
                          {/* Edit */}
                          <ActionButton label={t("common.edit")} onClick={(e) => e.stopPropagation()}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </ActionButton>
                          {/* Delete */}
                          <ActionButton label={t("common.delete")} onClick={(e) => e.stopPropagation()}>
                            <path d="M3 6h18" />
                            <path d="M8 6v14h8V6" />
                            <path d="M10 10v6" />
                            <path d="M14 10v6" />
                            <path d="M9 6V4h6v2" />
                          </ActionButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </main>
  );
}

/* ─── Reusable icon button with hover animation ──────────── */
function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.2, backgroundColor: "rgba(239,246,255,1)" }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="inline-flex items-center justify-center rounded-lg p-2 text-[#005792]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
        {children}
      </svg>
    </motion.button>
  );
}