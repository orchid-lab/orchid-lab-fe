/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import axiosInstance from "../../../api/axiosInstance";

/* ─── Types ─────────────────────────────────────────────── */
interface MethodSuccessRate {
  id: number;
  name: string;
  description?: string;
  totalDurationDays: number;
  completedExperimentLog: number;
  failedExperimentLog: number;
  successRate: number;
}

interface FailedExperiment {
  experimentLogId: string;
  experimentLogName: string;
  failedAtStageOrder: number;
  failedAtStageName: string;
  seedlingLocalName: string;
  seedlingScientificName: string;
  status: string;
  reason: string;
  issues: string;
  recommendations: string;
  failedDate: string;
}

interface FailedExperimentsResponse {
  totalCount: number;
  items: FailedExperiment[];
  skip: number;
  take: number;
}

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const statCard: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, delay: 0.1 + (i as number) * 0.09, ease: EASE_OUT },
  }),
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: (i as number) * 0.06, ease: EASE_OUT },
  }),
};

const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    opacity: 0, scale: 0.96, y: 8,
    transition: { duration: 0.2 },
  },
};

/* ─── Animated Counter ───────────────────────────────────── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });
  useEffect(() => {
    obj.current.val = 0;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value, duration: 0.9, ease: "power2.out", delay: 0.25,
        onUpdate: () => {
          if (ref.current) ref.current.textContent = Math.round(obj.current.val).toString() + suffix;
        },
      });
    });
    return () => ctx.revert();
  }, [value]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Animated Progress Bar ──────────────────────────────── */
function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${percent}%`, duration: 1, ease: "power3.out", delay: 0.3 }
    );
  }, [percent]);
  return (
    <div className="w-full bg-rose-50 rounded-full h-2.5 overflow-hidden border border-rose-100">
      <div ref={barRef} className={`h-full rounded-full ${color}`} style={{ width: "0%" }} />
    </div>
  );
}

/* ─── Donut Chart ────────────────────────────────────────── */
function DonutChart({ completed, failed }: { completed: number; failed: number }) {
  const total = completed + failed;
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const completedDash = total > 0 ? (completed / total) * circ : 0;
  const failedDash = total > 0 ? (failed / total) * circ : 0;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#fecdd3" strokeWidth="12" />
        {total > 0 && (
          <>
            <motion.circle
              cx="50" cy="50" r={radius} fill="transparent"
              stroke="#22c55e" strokeWidth="12"
              strokeDasharray={`${completedDash} ${circ}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${completedDash} ${circ}` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
            <motion.circle
              cx="50" cy="50" r={radius} fill="transparent"
              stroke="#f43f5e" strokeWidth="12"
              strokeDasharray={`${failedDash} ${circ}`}
              strokeDashoffset={-completedDash}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${failedDash} ${circ}` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
          </>
        )}
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill="#9f1239">{rate}%</text>
        <text x="50" y="60" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#94a3b8">success</text>
      </svg>
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Cancelled: "bg-orange-50 text-orange-700 border-orange-200",
    Destroyed: "bg-red-50 text-red-700 border-red-200",
    Failed:    "bg-red-50 text-red-700 border-red-200",
  };
  const cls = cfg[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

/* ─── Failed Experiments Modal ───────────────────────────── */
function FailedExperimentsModal({
  method,
  onClose,
}: {
  method: MethodSuccessRate;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [data, setData] = useState<FailedExperimentsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (skip: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `/api/methods/${method.id}/failed-experiments`,
        { params: { skip, take: PAGE_SIZE } }
      );
      setData(res.data as FailedExperimentsResponse);
    } catch {
      setError(t("common.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [method.id, t]);

  useEffect(() => {
    void fetchPage(page * PAGE_SIZE);
  }, [page, fetchPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  // ✅ Portal — thoát khỏi stacking context của Framer Motion
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        variants={modalVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ border: "1.5px solid #fecdd3" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-50 bg-gradient-to-r from-[#9f1239]/5 to-[#f43f5e]/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">{t("experimentLog.bestMethod", "Phương pháp")}</p>
              <h2 className="font-bold text-[#9f1239] text-base leading-tight truncate">{method.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            {data && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {data.totalCount} {t("status.cancelled", "thất bại")}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-rose-100 rounded-xl p-4 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-rose-100 rounded w-1/2" />
                    <div className="h-5 bg-rose-50 rounded-full w-20" />
                  </div>
                  <div className="h-3 bg-rose-50 rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-3 bg-rose-50 rounded" />
                    <div className="h-3 bg-rose-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-500">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-medium">{error}</p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-slate-500 font-medium">{t("common.noData", "Không có thí nghiệm thất bại")}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {data.items.map((exp, idx) => (
                  <div
                    key={exp.experimentLogId + idx}
                    className="border border-rose-100 rounded-xl p-4 hover:border-rose-300 hover:shadow-sm transition-all bg-white group"
                  >
                    {/* Row 1: Name + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-[#9f1239] text-sm leading-snug group-hover:text-[#7f0f2e] transition-colors">
                        {exp.experimentLogName}
                      </h3>
                      <StatusBadge status={exp.status} />
                    </div>

                    {/* Row 2: Seedling info */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-xs text-slate-700 font-medium">{exp.seedlingLocalName}</span>
                      <span className="text-xs text-slate-400 italic">({exp.seedlingScientificName})</span>
                    </div>

                    {/* Row 3: Grid details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 flex-shrink-0">{t("experimentLog.stage", "Giai đoạn thất bại")}:</span>
                        <span className="font-medium text-orange-600">#{exp.failedAtStageOrder} — {exp.failedAtStageName}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 flex-shrink-0">{t("experimentLog.failedDate", "Ngày thất bại")}:</span>
                        <span className="font-medium text-slate-700">{exp.failedDate}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 flex-shrink-0">{t("experimentLog.reason", "Lý do")}:</span>
                        <span className="font-medium text-slate-700 line-clamp-1">{exp.reason}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-slate-400 flex-shrink-0">{t("experimentLog.issues", "Vấn đề")}:</span>
                        <span className="font-medium text-slate-700 line-clamp-1">{exp.issues}</span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {exp.recommendations && exp.recommendations !== "No recommendations" && (
                      <div className="bg-rose-50 rounded-lg px-3 py-2 flex gap-2 items-start">
                        <svg className="w-3.5 h-3.5 text-[#9f1239] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs text-[#9f1239] leading-relaxed">{exp.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Modal Footer — Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-rose-50 bg-slate-50/50 flex-shrink-0">
            <span className="text-xs text-slate-500">
              {t("common.page", "Trang")} {page + 1} / {totalPages}
              <span className="ml-2 text-slate-400">({data.totalCount} {t("common.items", "mục")})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-100 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#9f1239] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce<(number | "ellipsis")[]>((acc, i, idx, arr) => {
                    if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e-${idx}`} className="text-xs text-slate-400 px-1">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item as number)}
                        className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                          page === item
                            ? "bg-[#9f1239] text-white"
                            : "border border-rose-100 text-[#9f1239] hover:bg-rose-50"
                        }`}
                      >
                        {(item as number) + 1}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-100 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#9f1239] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body // ✅ Portal ra ngoài DOM tree
  );
}

/* ─── Method Card ────────────────────────────────────────── */
function MethodCard({
  method,
  index,
  onViewFailed,
}: {
  method: MethodSuccessRate;
  index: number;
  onViewFailed: (method: MethodSuccessRate) => void;
}) {
  const { t } = useTranslation();
  const total = method.completedExperimentLog + method.failedExperimentLog;
  const rate = method.successRate;

  const rateColor =
    rate >= 80 ? "text-green-600" :
    rate >= 50 ? "text-yellow-600" :
    rate > 0   ? "text-rose-500"  :
                 "text-slate-400";

  const barColor =
    rate >= 80 ? "bg-green-400" :
    rate >= 50 ? "bg-yellow-400" :
    rate > 0   ? "bg-rose-400"  :
                 "bg-slate-200";

  const badgeBg =
    rate >= 80 ? "bg-green-50 text-green-700 border-green-200" :
    rate >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
    rate > 0   ? "bg-rose-50 text-[#9f1239] border-rose-200"   :
                 "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 16px 32px -8px rgba(159,18,57,0.12)", transition: { duration: 0.2 } }}
      className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#9f1239] flex-shrink-0" />
            <h3 className="font-semibold text-[#9f1239] text-sm leading-snug truncate">{method.name}</h3>
          </div>
          {method.description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pl-4">{method.description}</p>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeBg}`}>
          {rate}%
        </span>
      </div>

      {/* Donut + Stats */}
      <div className="flex items-center gap-5">
        <DonutChart completed={method.completedExperimentLog} failed={method.failedExperimentLog} />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {t("experimentLog.completed")}
            </span>
            <span className="font-semibold text-green-600">{method.completedExperimentLog}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {t("status.cancelled")}
            </span>
            <span className="font-semibold text-rose-500">{method.failedExperimentLog}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-200" />
              {t("experimentLog.experiments")}
            </span>
            <span className="font-semibold text-[#9f1239]">{total}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{t("seedling.successRateAnalysis")}</span>
          <span className={`font-semibold ${rateColor}`}>{rate}%</span>
        </div>
        <AnimatedBar percent={rate} color={barColor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-rose-50">
        <span className="text-xs text-slate-500">{t("experimentLog.totalDuration", "Tổng thời gian")}</span>
        <span className="text-xs font-semibold text-[#9f1239]">{method.totalDurationDays} {t("common.days", "ngày")}</span>
      </div>

      {/* ✅ View Failed Button — chỉ hiện khi có dữ liệu thất bại */}
      {method.failedExperimentLog > 0 && (
        <button
          type="button"
          onClick={() => onViewFailed(method)}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl py-2 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t("experimentLog.viewFailed", "Xem thí nghiệm thất bại")} ({method.failedExperimentLog})
        </button>
      )}
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AdminMethodSuccessRate() {
  const { t } = useTranslation();
  const [data, setData] = useState<MethodSuccessRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"successRate" | "name" | "total">("successRate");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<MethodSuccessRate | null>(null); // ✅ state modal

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get("/api/methods/success-rate");
        const raw: any[] = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.value) ? res.data.value
          : Array.isArray(res.data?.data) ? res.data.data
          : [];

        const merged: Record<number, MethodSuccessRate> = {};
        raw.forEach((item: any) => {
          const id = Number(item.id);
          if (!merged[id]) {
            merged[id] = {
              id,
              name: String(item.name ?? ""),
              description: item.description ?? "",
              totalDurationDays: Number(item.totalDurationDays ?? 0),
              completedExperimentLog: Number(item.completedExperimentLog ?? 0),
              failedExperimentLog: Number(item.failedExperimentLog ?? 0),
              successRate: 0,
            };
          } else {
            merged[id].completedExperimentLog += Number(item.completedExperimentLog ?? 0);
            merged[id].failedExperimentLog += Number(item.failedExperimentLog ?? 0);
          }
        });

        const result = Object.values(merged).map((m) => {
          const total = m.completedExperimentLog + m.failedExperimentLog;
          return { ...m, successRate: total > 0 ? Math.round((m.completedExperimentLog / total) * 100) : 0 };
        });

        setData(result);
      } catch {
        setError(t("common.errorLoading"));
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const sorted = useMemo(() => {
    let filtered = data.filter((m) =>
      !search.trim() || m.name.toLowerCase().includes(search.toLowerCase())
    );
    filtered = [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortBy === "successRate") diff = a.successRate - b.successRate;
      else if (sortBy === "name") diff = a.name.localeCompare(b.name);
      else diff = (a.completedExperimentLog + a.failedExperimentLog) - (b.completedExperimentLog + b.failedExperimentLog);
      return sortDir === "desc" ? -diff : diff;
    });
    return filtered;
  }, [data, search, sortBy, sortDir]);

  const avgRate = data.length ? Math.round(data.reduce((s, m) => s + m.successRate, 0) / data.length) : 0;
  const bestMethod = data.length ? data.reduce((a, b) => (a.successRate >= b.successRate ? a : b)) : null;
  const totalExp = data.reduce((s, m) => s + m.completedExperimentLog + m.failedExperimentLog, 0);

  const statItems = [
    {
      label: t("experimentLog.method"),
      value: data.length,
      suffix: "",
      valueClass: "text-[#9f1239]",
      icon: (
        <svg className="w-6 h-6 text-[#9f1239]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: t("seedling.successRateAnalysis"),
      value: avgRate,
      suffix: "%",
      valueClass: avgRate >= 70 ? "text-green-600" : avgRate >= 40 ? "text-yellow-600" : "text-rose-500",
      icon: (
        <svg className="w-6 h-6 text-[#9f1239]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: t("experimentLog.experiments"),
      value: totalExp,
      suffix: "",
      valueClass: "text-[#9f1239]",
      icon: (
        <svg className="w-6 h-6 text-[#9f1239]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((item, idx) => (
          <motion.div
            key={item.label}
            custom={idx}
            variants={statCard}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(159,18,57,0.12)", transition: { duration: 0.2 } }}
            className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl p-6 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-rose-700 mb-1">{item.label}</p>
              <p className={`text-3xl font-semibold ${item.valueClass}`}>
                <AnimatedCounter value={item.value} suffix={item.suffix} />
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
              {item.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Best Method Banner ── */}
      <AnimatePresence>
        {bestMethod && bestMethod.successRate > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="relative overflow-hidden bg-gradient-to-r from-[#9f1239] to-[#f43f5e] rounded-2xl p-5 shadow-md"
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }}
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">{t("experimentLog.bestMethod", "Phương pháp hiệu quả nhất")}</p>
                <p className="text-white font-bold text-base">{bestMethod.name}</p>
              </div>
              <div className="sm:ml-auto flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white font-bold text-2xl">{bestMethod.successRate}%</p>
                  <p className="text-white/70 text-xs">{t("seedling.successRateAnalysis")}</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-2xl">{bestMethod.completedExperimentLog}</p>
                  <p className="text-white/70 text-xs">{t("experimentLog.completed")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search + Sort ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9f1239]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z" />
            </svg>
            <input
              type="text"
              placeholder={t("common.search") + "..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9f1239] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-rose-700 font-medium whitespace-nowrap">{t("common.sortBy", "Sắp xếp")}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-rose-100 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#9f1239]"
            >
              <option value="successRate">{t("seedling.successRateAnalysis")}</option>
              <option value="name">{t("experimentLog.method")}</option>
              <option value="total">{t("experimentLog.experiments")}</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="w-9 h-9 flex items-center justify-center border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors text-[#9f1239]"
            >
              <motion.svg
                className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                animate={{ rotate: sortDir === "asc" ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
          </div>

          <span className="text-xs text-slate-400 ml-auto">{sorted.length} {t("common.items", "mục")}</span>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-4 bg-rose-100 rounded w-3/4" />
              <div className="h-3 bg-rose-50 rounded w-full" />
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-rose-50 rounded-full" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-3 bg-rose-50 rounded" />
                  <div className="h-3 bg-rose-50 rounded w-4/5" />
                  <div className="h-3 bg-rose-50 rounded w-3/5" />
                </div>
              </div>
              <div className="h-2.5 bg-rose-50 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-rose-500 bg-white/80 border border-rose-100 rounded-2xl"
        >
          <p className="text-lg font-medium">{error}</p>
        </motion.div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 bg-white/80 border border-rose-100 rounded-2xl"
        >
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-500">{t("common.noData")}</p>
        </motion.div>
      ) : (
        // ✅ AnimatePresence nằm bên trong div.grid, wrap trực tiếp các MethodCard
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((method, idx) => (
              <MethodCard
                key={method.id}
                method={method}
                index={idx}
                onViewFailed={setSelectedMethod}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ✅ Modal — AnimatePresence ở root level, Portal render ra document.body */}
      <AnimatePresence>
        {selectedMethod && (
          <FailedExperimentsModal
            method={selectedMethod}
            onClose={() => setSelectedMethod(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}