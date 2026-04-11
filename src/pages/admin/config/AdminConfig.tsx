/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search, X, Plus, Eye, Trash2, Settings,
  FileCode2, Hash, AlertCircle, Loader2,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import "./AdminConfig.css";

const PAGE_SIZE = 10;

/* ─── Types ───────────────────────────────────────────── */
interface Config {
  id: string;
  configName: string;
  key: string;
  value: number;
}

interface CreateConfigPayload {
  configName: string;
  key: string;
  value: number;
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

/* ─── Create Config Modal ─────────────────────────────── */
function CreateConfigModal({
  onClose, onSuccess,
}: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateConfigPayload>({ configName: "", key: "", value: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.configName.trim()) { setError(t("config.emptyConfigName")); return; }
    if (!form.key.trim()) { setError(t("config.emptyKey")); return; }
    setSubmitting(true); setError("");
    try {
      await axiosInstance.post("/api/config", form);
      onSuccess(); onClose();
    } catch {
      setError(t("config.createFailed"));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ minHeight: "100vh" }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <Plus className="w-4 h-4 text-[#9f1239]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{t("config.createNewTitle")}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">POST /api/config</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("config.configName")} <span className="text-rose-500">*</span>
            </label>
            <input type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder="Nhập config name..."
              value={form.configName}
              onChange={(e) => setForm((p) => ({ ...p, configName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("config.key")} <span className="text-rose-500">*</span>
            </label>
            <input type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder="Nhập key..."
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("config.value")} <span className="text-rose-500">*</span>
            </label>
            <input type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/20 focus:border-[#f43f5e] transition-all"
              placeholder="0"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            {t("common.cancel")}
          </button>
          <motion.button type="button" onClick={() => void handleSubmit()} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#9f1239] rounded-xl hover:bg-[#be123c] shadow-sm disabled:opacity-60 transition-colors"
            whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}>
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t("config.creating")}</>
              : <><Plus className="w-4 h-4" />{t("config.createNew")}</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── View Config Modal ───────────────────────────────── */
function ViewConfigModal({
  configId, onClose,
}: { configId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/api/config/${configId}`);
        const json = res.data;
        setConfig(json?.value ?? json?.data ?? json);
      } catch { setError(t("config.cannotLoadDetails")); }
      finally { setLoading(false); }
    };
    void load();
  }, [configId, t]);

  const rows = config ? [
    { label: t("config.id"), value: config.id, mono: true },
    { label: t("config.configName"), value: config.configName, mono: false },
    { label: t("config.key"), value: config.key, mono: true },
    { label: t("config.value"), value: String(config.value), mono: false },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ minHeight: "100vh" }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
            <Eye className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{t("config.details")}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">GET /api/config/{configId.slice(0, 8)}…</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-rose-50 rounded-xl" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-500 text-center py-4">{error}</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.label} className="flex items-start gap-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className={`text-sm text-slate-800 break-all ${row.mono ? "font-mono" : "font-medium"}`}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 pb-6">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            {t("common.close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────── */
function DeleteConfirmModal({
  config, onClose, onSuccess,
}: { config: Config; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true); setError("");
    try {
      await axiosInstance.delete(`/api/config/${config.id}`);
      onSuccess(); onClose();
    } catch { setError(t("config.deleteFailed")); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ minHeight: "100vh" }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <motion.div
            className="bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 w-16 h-16"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
          >
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("config.deleteQuestion")}</h2>
          <p className="text-sm text-gray-500 mb-3">{t("config.deletingText")}</p>
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-left space-y-2 border border-slate-100 mb-3">
            <p className="text-xs text-slate-500">
              {t("config.configName")}:{" "}
              <span className="font-semibold text-slate-800">{config.configName}</span>
            </p>
            <p className="text-xs text-slate-500">
              {t("config.key")}:{" "}
              <span className="font-mono font-semibold text-slate-800">{config.key}</span>
            </p>
          </div>
          <p className="text-xs font-medium text-rose-500 bg-rose-50 inline-block px-3 py-1 rounded-full">
            {t("config.cannotUndo")}
          </p>
          {error && (
            <p className="mt-3 text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">{error}</p>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 bg-gray-50/50">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            {t("common.cancel")}
          </button>
          <motion.button type="button" onClick={() => void handleDelete()} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm disabled:opacity-60 transition-colors"
            whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t("config.deleting")}</>
              : t("config.delete")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
export default function AdminConfig() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<Config[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [viewTarget, setViewTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Config | null>(null);

  /* ── GSAP progress bar ── */
  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => { runProgress(); }, []);

  /* ── Debounce search ── */
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    runProgress();
    try {
      const params: Record<string, string | number> = { pageNo: page, pageSize: PAGE_SIZE };
      if (debouncedSearch) params.searchTerm = debouncedSearch;
      const res = await axiosInstance.get("/api/config", { params });
      const json = res.data;

      let items: Config[] = [];
      let totalCount = 0;
      let pageCount = 1;

      if (json?.data && Array.isArray(json.data)) {
        items = json.data; totalCount = json.totalCount ?? json.data.length; pageCount = json.pageCount ?? 1;
      } else if (json?.value?.data && Array.isArray(json.value.data)) {
        items = json.value.data; totalCount = json.value.totalCount ?? 0; pageCount = json.value.pageCount ?? 1;
      } else if (Array.isArray(json)) {
        items = json; totalCount = json.length; pageCount = 1;
      }

      setData(items); setTotal(totalCount); setTotalPages(pageCount);
    } catch {
      setData([]); setTotal(0); setTotalPages(1);
    } finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const stats = [
    { label: t("config.stat1"), value: total, icon: Settings, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-[#9f1239]", valColor: "text-[#9f1239]" },
    { label: t("config.stat2"), value: page, icon: Hash, bg: "bg-sky-50", border: "border-sky-100", iconColor: "text-sky-600", valColor: "text-sky-700" },
    { label: t("config.stat3"), value: data.length, icon: FileCode2, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600", valColor: "text-emerald-700" },
  ];

  const tableHeaders = [
    "#",
    t("config.configName"),
    t("config.key"),
    t("config.value"),
    t("config.id"),
    t("common.action"),
  ];

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateConfigModal onClose={() => setShowCreate(false)} onSuccess={() => void fetchData()} />}
        {viewTarget && <ViewConfigModal configId={viewTarget} onClose={() => setViewTarget(null)} />}
        {deleteTarget && <DeleteConfirmModal config={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={() => void fetchData()} />}
      </AnimatePresence>

      <main className="admin-config-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

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
                <Settings className="w-5 h-5 text-[#9f1239]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
                  {t("config.title")}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Quản lý cấu hình hệ thống
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowCreate(true)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9f1239] text-white text-sm font-semibold rounded-xl hover:bg-[#be123c] transition-colors shadow-sm self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              {t("config.createNew")}
            </motion.button>
          </motion.div>

          {/* ── Stats ── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={`${s.bg} border ${s.border} rounded-2xl p-5 shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                  </div>
                  <p className={`text-3xl font-extrabold ${s.valColor}`}>{s.value}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Filter card ── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
          >
            <h2 className="text-base font-semibold text-[#9f1239] mb-4">
              {t("seedling.filterAndSearch") || "Lọc & Tìm kiếm"}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t("config.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-10 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {search.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-rose-50"
                >
                  <span className="text-xs text-slate-400">{t("seedling.appliedFilters") || "Bộ lọc đang áp dụng"}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    {t("common.search")}: "{search}"
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Table card ── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
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
                  <AnimatePresence mode="wait">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }} className="border-b border-rose-50 animate-pulse">
                          {Array.from({ length: 6 }).map((__, ci) => (
                            <td key={ci} className="p-4">
                              <div className="h-4 bg-rose-100 rounded w-full" />
                            </td>
                          ))}
                        </motion.tr>
                      ))
                    ) : data.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={6} className="text-center p-12 text-gray-500">
                          <div className="text-6xl mb-4">⚙️</div>
                          <div className="text-lg font-medium">{t("common.noData")}</div>
                          <p className="text-sm text-slate-400 mt-1">{t("config.noData")}</p>
                        </td>
                      </motion.tr>
                    ) : (
                      data.map((cfg, idx) => (
                        <motion.tr
                          key={cfg.id}
                          custom={idx}
                          variants={tableRow}
                          initial="hidden" animate="visible" exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(255,241,242,0.85)", transition: { duration: 0.15 } }}
                          className="border-b border-rose-50"
                        >
                          {/* # */}
                          <td className="p-4 text-center text-gray-500 text-sm">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </td>

                          {/* Config Name */}
                          <td className="p-4 text-center font-medium text-gray-900 whitespace-nowrap">
                            {cfg.configName}
                          </td>

                          {/* Key */}
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono border border-slate-200">
                              {cfg.key}
                            </span>
                          </td>

                          {/* Value */}
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[40px] px-3 py-1 bg-rose-50 text-[#9f1239] rounded-full text-sm font-bold border border-rose-100">
                              {cfg.value}
                            </span>
                          </td>

                          {/* ID */}
                          <td className="p-4 text-center">
                            <span className="text-xs text-slate-400 font-mono" title={cfg.id}>
                              {cfg.id.slice(0, 8)}…
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                type="button" title={t("config.viewDetails")}
                                onClick={() => setViewTarget(cfg.id)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button
                                type="button" title={t("config.delete")}
                                onClick={() => setDeleteTarget(cfg)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AnimatePresence>
              {!loading && total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                  className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-rose-100"
                >
                  <span className="font-medium">
                    {t("common.page") || "Trang"}{" "}
                    <span className="font-bold text-slate-800">{page}</span> / {totalPages} —{" "}
                    <span className="font-bold text-slate-800">{total}</span>{" "}
                    {t("navigation.config")?.toLowerCase() || "cấu hình"}
                  </span>
                  {totalPages > 1 && (
                    <div className="flex gap-2">
                      <motion.button type="button"
                        onClick={() => setPage(page - 1)} disabled={page === 1}
                        whileHover={{ scale: page === 1 ? 1 : 1.08 }} whileTap={{ scale: page === 1 ? 1 : 0.93 }}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-sm">
                        ←
                      </motion.button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pn: number;
                        if (totalPages <= 5) pn = i + 1;
                        else if (page <= 3) pn = i + 1;
                        else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                        else pn = page - 2 + i;
                        return (
                          <motion.button key={pn} type="button"
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setPage(pn)}
                            className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                              page === pn ? "bg-[#9f1239] text-white" : "bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300"
                            }`}>{pn}</motion.button>
                        );
                      })}
                      <motion.button type="button"
                        onClick={() => setPage(page + 1)} disabled={page === totalPages}
                        whileHover={{ scale: page === totalPages ? 1 : 1.08 }} whileTap={{ scale: page === totalPages ? 1 : 0.93 }}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-sm">
                        →
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>
    </>
  );
}