import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FlaskConical, Plus, CheckCircle2, XCircle } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import "./AdminTissueCultureBatchList.css";

/* ─── Types ───────────────────────────────────────────── */
interface TissueCultureBatch {
  id: string;
  name?: string;
  labName?: string;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  description?: string;
  inUse?: string;
  status?: string | boolean;
  isBatching?: boolean;
}

interface ApiListResponse {
  value?: { data?: TissueCultureBatch[]; totalCount?: number };
  data?: TissueCultureBatch[];
  totalCount?: number;
}

/* ─── Animation variants ──────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
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

/* ─── Status badge ────────────────────────────────────── */
function StatusBadge({ item, t }: { item: TissueCultureBatch; t: (k: string) => string }) {
  const isActive = item.status || item.isBatching;
  const label = typeof item.status === "string"
    ? item.status
    : (isActive ? t("tissueCultureBatch.operating") : t("tissueCultureBatch.notOperating"));

  if (isActive)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> {label}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
      <XCircle className="w-3 h-3" /> {label}
    </span>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
const AdminTissueCultureBatchList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TissueCultureBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── GSAP progress bar ── */
  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => { runProgress(); }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get("/api/batches?pageNo=1&pageSize=100")
      .then((res) => {
        const raw = res.data as ApiListResponse | TissueCultureBatch[];
        let arr: TissueCultureBatch[] = [];
        if ((raw as ApiListResponse)?.value?.data) arr = (raw as ApiListResponse).value!.data!;
        else if ((raw as ApiListResponse)?.data) arr = (raw as ApiListResponse).data!;
        else if (Array.isArray(raw)) arr = raw;
        arr.sort((a, b) => {
          const idA = typeof a.id === "string" ? parseInt(a.id) : Number(a.id);
          const idB = typeof b.id === "string" ? parseInt(b.id) : Number(b.id);
          return idA - idB;
        });
        setItems(arr);
      })
      .catch((err) => {
        console.error("Error loading batches:", err);
        setError(t("tissueCultureBatch.errorLoadingList"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const activeCount = items.filter((i) => i.status || i.isBatching).length;
  const inactiveCount = items.length - activeCount;

  const tableHeaders = [
    "ID",
    t("tissueCultureBatch.labRoomId"),
    t("tissueCultureBatch.labRoom"),
    t("tissueCultureBatch.batchName"),
    t("tissueCultureBatch.batchSize"),
    t("tissueCultureBatch.dimensions"),
    t("common.status"),
    "",
  ];

  return (
    <main className="admin-batch-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#9f1239] to-[#f43f5e] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
              <FlaskConical className="w-5 h-5 text-[#9f1239]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
                {t("tissueCultureBatch.tissueCultureBatchList")}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {t("tissueCultureBatch.manageBatches")}
              </p>
            </div>
          </div>
          <Link
            to="/admin/tissue-culture-batches/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9f1239] text-white text-sm font-semibold rounded-xl hover:bg-[#be123c] transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            {t("tissueCultureBatch.createBatch")}
          </Link>
        </motion.div>

        {/* ── Stats ── */}
        {!loading && !error && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { label: "Tổng lô cấy", value: items.length, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-[#9f1239]", valColor: "text-[#9f1239]", icon: FlaskConical },
              { label: t("tissueCultureBatch.operating"), value: activeCount, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600", valColor: "text-emerald-700", icon: CheckCircle2 },
              { label: t("tissueCultureBatch.notOperating"), value: inactiveCount, bg: "bg-slate-50", border: "border-slate-200", iconColor: "text-slate-500", valColor: "text-slate-700", icon: XCircle },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={`${s.bg} border ${s.border} rounded-2xl p-5 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                  </div>
                  <p className={`text-3xl font-extrabold ${s.valColor}`}>{s.value}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#fff1f2] to-[#fffbfb] border-b border-rose-100">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-center p-4 font-semibold text-gray-900 whitespace-nowrap"
                    >
                      {h}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }} className="border-b border-rose-50 animate-pulse">
                      {Array.from({ length: 8 }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-rose-100 rounded w-full" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={8} className="text-center p-12">
                      <div className="text-6xl mb-4">⚠️</div>
                      <div className="text-rose-500 font-medium">{error}</div>
                    </td>
                  </motion.tr>
                ) : items.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={8} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">🧪</div>
                      <div className="text-lg font-medium">{t("tissueCultureBatch.noBatches")}</div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => (
                      <motion.tr
                        key={item.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden" animate="visible" exit="exit"
                        layout
                        whileHover={{ backgroundColor: "rgba(255,241,242,0.85)", transition: { duration: 0.15 } }}
                        className="border-b border-rose-50"
                      >
                        {/* ID */}
                        <td className="p-4 text-center text-gray-500 text-sm font-mono">{item.id}</td>

                        {/* Lab Room ID */}
                        <td className="p-4 text-center text-gray-600 text-sm">
                          {item.labRoomId ?? "—"}
                        </td>

                        {/* Lab Room */}
                        <td className="p-4 text-center font-medium text-gray-900">
                          {item.labRoomName ?? item.labName ?? "—"}
                        </td>

                        {/* Batch Name */}
                        <td className="p-4 text-center text-gray-700">
                          {item.batchName ?? item.name ?? "—"}
                        </td>

                        {/* Batch Size */}
                        <td className="p-4 text-center text-gray-700 text-sm">
                          {item.batchSizeWidth && item.batchSizeHeight
                            ? <span className="font-mono">{item.batchSizeWidth} × {item.batchSizeHeight}</span>
                            : "—"}
                        </td>

                        {/* Dimensions */}
                        <td className="p-4 text-center text-gray-600 text-sm">
                          {item.widthUnit && item.heightUnit
                            ? `${item.widthUnit} × ${item.heightUnit}`
                            : item.widthUnit ?? item.heightUnit ?? "—"}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <StatusBadge item={item} t={t} />
                        </td>

                        {/* Action */}
                        <td className="p-4 text-center">
                          <Link
                            to={`/admin/tissue-culture-batches/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-[#9f1239] border border-rose-100 hover:bg-rose-100 transition-colors"
                          >
                            {t("tissueCultureBatch.details")}
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </main>
  );
};

export default AdminTissueCultureBatchList;