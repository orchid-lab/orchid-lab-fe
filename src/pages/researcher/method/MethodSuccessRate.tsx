/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo } from "react";
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

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.48, delay: (i as number) * 0.07, ease: EASE_OUT },
  }),
};

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
    <div className="w-full bg-blue-50 rounded-full h-2.5 overflow-hidden">
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
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#dbeafe" strokeWidth="12" />
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
              stroke="#ef4444" strokeWidth="12"
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
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill="#005792">{rate}%</text>
        <text x="50" y="60" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#94a3b8">success</text>
      </svg>
    </div>
  );
}

/* ─── Method Card ────────────────────────────────────────── */
function MethodCard({ method, index }: { method: MethodSuccessRate; index: number }) {
  const { t } = useTranslation();
  const total = method.completedExperimentLog + method.failedExperimentLog;
  const rate = method.successRate;

  const rateColor =
    rate >= 80 ? "text-green-600" :
    rate >= 50 ? "text-yellow-600" :
    rate > 0   ? "text-red-500"   :
                 "text-slate-400";

  const barColor =
    rate >= 80 ? "bg-green-400" :
    rate >= 50 ? "bg-yellow-400" :
    rate > 0   ? "bg-red-400"   :
                 "bg-slate-200";

  const badgeBg =
    rate >= 80 ? "bg-green-50 text-green-700 border-green-200" :
    rate >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
    rate > 0   ? "bg-red-50 text-red-600 border-red-200" :
                 "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 16px 32px -8px rgba(0,87,146,0.12)", transition: { duration: 0.2 } }}
      className="bg-white border border-blue-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#005792] flex-shrink-0" />
            <h3 className="font-semibold text-[#005792] text-sm leading-snug truncate">{method.name}</h3>
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
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {t("status.cancelled")}
            </span>
            <span className="font-semibold text-red-500">{method.failedExperimentLog}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              {t("experimentLog.experiments")}
            </span>
            <span className="font-semibold text-[#005792]">{total}</span>
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
      <div className="flex items-center justify-between pt-1 border-t border-blue-50">
        <span className="text-xs text-slate-500">{t("experimentLog.totalDuration")}</span>
        <span className="text-xs font-semibold text-[#005792]">{method.totalDurationDays} {t("common.days", "ngày")}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function ResearcherMethodSuccessRate() {
  const { t } = useTranslation();
  const [data, setData] = useState<MethodSuccessRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"successRate" | "name" | "total">("successRate");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");

  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(progressRef.current, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.9, ease: "power3.out" });
      gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
    });
    return () => ctx.revert();
  }, []);

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

        // Deduplicate by id, merge stats
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

        // Recalculate success rate after merge
        const result = Object.values(merged).map((m) => {
          const total = m.completedExperimentLog + m.failedExperimentLog;
          return {
            ...m,
            successRate: total > 0 ? Math.round((m.completedExperimentLog / total) * 100) : 0,
          };
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

  /* ── Aggregate stats ── */
  const avgRate = data.length
    ? Math.round(data.reduce((s, m) => s + m.successRate, 0) / data.length)
    : 0;
  const bestMethod = data.length
    ? data.reduce((a, b) => (a.successRate >= b.successRate ? a : b))
    : null;
  const totalExp = data.reduce((s, m) => s + m.completedExperimentLog + m.failedExperimentLog, 0);

  const statItems = [
    {
      label: t("experimentLog.method"),
      value: data.length,
      suffix: "",
      valueClass: "text-[#005792]",
      icon: (
        <svg className="w-6 h-6 text-[#005792]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: t("seedling.successRateAnalysis"),
      value: avgRate,
      suffix: "%",
      valueClass: avgRate >= 70 ? "text-green-600" : avgRate >= 40 ? "text-yellow-600" : "text-red-500",
      icon: (
        <svg className="w-6 h-6 text-[#005792]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: t("experimentLog.experiments"),
      value: totalExp,
      suffix: "",
      valueClass: "text-[#005792]",
      icon: (
        <svg className="w-6 h-6 text-[#005792]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* GSAP progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-0 sm:left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((item, idx) => (
          <motion.div
            key={item.label}
            custom={idx}
            variants={statCard}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(0,0,0,0.12)", transition: { duration: 0.2 } }}
            className="bg-white border border-blue-100 rounded-2xl p-6 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">{item.label}</p>
              <p className={`text-3xl font-semibold ${item.valueClass}`}>
                <AnimatedCounter value={item.value} suffix={item.suffix} />
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
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
            className="relative overflow-hidden bg-gradient-to-r from-[#005792] to-[#00CED1] rounded-2xl p-5 shadow-md"
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
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="bg-white border border-blue-100 rounded-2xl shadow-sm p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005792]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z" />
            </svg>
            <input
              type="text"
              placeholder={t("common.search") + "..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-blue-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium whitespace-nowrap">{t("common.sortBy", "Sắp xếp")}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-blue-100 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
            >
              <option value="successRate">{t("seedling.successRateAnalysis")}</option>
              <option value="name">{t("experimentLog.method")}</option>
              <option value="total">{t("experimentLog.experiments")}</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="w-9 h-9 flex items-center justify-center border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors text-[#005792]"
              title={sortDir === "desc" ? "Giảm dần" : "Tăng dần"}
            >
              <motion.svg
                className="w-4 h-4"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                animate={{ rotate: sortDir === "asc" ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
          </div>

          <span className="text-xs text-slate-400 ml-auto">{sorted.length} {t("common.items", "mục")}</span>
        </div>
      </motion.div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-blue-100 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-4 bg-blue-100 rounded w-3/4" />
              <div className="h-3 bg-blue-50 rounded w-full" />
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-blue-50 rounded-full" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-3 bg-blue-50 rounded" />
                  <div className="h-3 bg-blue-50 rounded w-4/5" />
                  <div className="h-3 bg-blue-50 rounded w-3/5" />
                </div>
              </div>
              <div className="h-2.5 bg-blue-50 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-red-500 bg-white border border-blue-100 rounded-2xl"
        >
          <p className="text-lg font-medium">{error}</p>
        </motion.div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 bg-white border border-blue-100 rounded-2xl"
        >
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-500">{t("common.noData")}</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((method, idx) => (
              <MethodCard key={method.id} method={method} index={idx} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}