/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Modal: Tạo config mới ─────────────────────────────────────────────────────
function CreateConfigModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateConfigPayload>({ configName: "", key: "", value: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.configName.trim()) { setError("Config Name không được để trống."); return; }
    if (!form.key.trim()) { setError("Key không được để trống."); return; }
    setSubmitting(true); setError("");
    try {
      await axiosInstance.post("/api/config", form);
      onSuccess(); onClose();
    } catch (err) {
      console.error(err);
      setError("Tạo config thất bại. Vui lòng thử lại.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tạo config mới</h2>
            <p className="text-sm text-gray-500 mt-0.5">POST /api/config</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Config Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập config name..." value={form.configName} onChange={(e) => setForm((p) => ({ ...p, configName: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Key <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono" placeholder="Nhập key..." value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Value <span className="text-red-500">*</span></label>
            <input type="number" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="0" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}>
            {submitting ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang tạo...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Tạo config</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Xem chi tiết config ────────────────────────────────────────────────
function ViewConfigModal({ configId, onClose }: { configId: string; onClose: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/api/config/${configId}`);
        const json = res.data;
        setConfig(json?.value ?? json?.data ?? json);
      } catch { setError("Không thể tải thông tin config."); }
      finally { setLoading(false); }
    };
    void fetch();
  }, [configId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.25 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết config</h2>
            <p className="text-sm text-gray-500 mt-0.5">GET /api/config/{configId}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          ) : config ? (
            <div className="space-y-3">
              {[
                { label: "ID", value: config.id, mono: true },
                { label: "Config Name", value: config.configName, mono: false },
                { label: "Key", value: config.key, mono: true },
                { label: "Value", value: String(config.value), mono: false },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className={`text-sm text-gray-800 break-all ${row.mono ? "font-mono" : "font-medium"}`}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Đóng</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Xác nhận xóa ───────────────────────────────────────────────────────
function DeleteConfirmModal({ config, onClose, onSuccess }: { config: Config; onClose: () => void; onSuccess: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true); setError("");
    try {
      await axiosInstance.delete(`/api/config/${config.id}`);
      onSuccess(); onClose();
    } catch { setError("Xóa thất bại. Vui lòng thử lại."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.25 }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </motion.div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Xóa config?</h2>
          <p className="text-sm text-gray-500 mb-2">Bạn đang xóa:</p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-2 text-left space-y-1">
            <p className="text-xs text-gray-500">Config Name: <span className="font-semibold text-gray-800">{config.configName}</span></p>
            <p className="text-xs text-gray-500">Key: <span className="font-mono font-semibold text-gray-800">{config.key}</span></p>
          </div>
          <p className="text-xs text-red-500">Hành động này không thể hoàn tác.</p>
          {error && <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleDelete()} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors" whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang xóa...</> : "Xóa"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      console.error("Error loading configs:", err);
      setData([]); setTotal(0); setTotalPages(1);
    } finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const rowVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
    exit: { opacity: 0, x: 16, transition: { duration: 0.25 } },
  };

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateConfigModal onClose={() => setShowCreate(false)} onSuccess={() => void fetchData()} />}
        {viewTarget && <ViewConfigModal configId={viewTarget} onClose={() => setViewTarget(null)} />}
        {deleteTarget && <DeleteConfirmModal config={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={() => void fetchData()} />}
      </AnimatePresence>

      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">

          {/* ── Header ── */}
          <motion.div className="mb-8 flex items-start justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Quản lý Config</h1>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tạo config
            </motion.button>
          </motion.div>

          {/* ── Stats ── */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          >
            {[
              { label: "Tổng config", value: total, color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100", iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", iconColor: "text-indigo-600" },
              { label: "Trang hiện tại", value: page, color: "text-sky-700", bg: "bg-sky-50 border-sky-100", iconPath: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", iconColor: "text-sky-600" },
              { label: "Kết quả trang này", value: data.length, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", iconColor: "text-emerald-600" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className={`border rounded-xl px-5 py-4 ${stat.bg}`}
                variants={{ hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.45 } } }}
                whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <motion.p className={`text-3xl font-bold ${stat.color}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1, type: "spring" }}>
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div className="w-11 h-11 bg-white/70 rounded-xl flex items-center justify-center" whileHover={{ rotate: 20 }} transition={{ duration: 0.3 }}>
                    <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.iconPath} /></svg>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Search ── */}
          <motion.div className="bg-white border border-gray-200 rounded-xl p-5 mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="Tìm kiếm theo tên config, key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Table ── */}
          <motion.div className="bg-white border border-gray-200 rounded-xl overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10">#</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Config Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Key</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <motion.tr key={`sk-${idx}`} className="animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}>
                          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-6" /></td>
                          <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                          <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-36 font-mono" /></td>
                          <td className="px-5 py-3.5"><div className="h-6 bg-gray-200 rounded-full w-16 mx-auto" /></td>
                          <td className="px-5 py-3.5"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                          <td className="px-5 py-3.5"><div className="h-8 bg-gray-200 rounded-lg w-32 mx-auto" /></td>
                        </motion.tr>
                      ))
                    ) : data.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={6} className="px-5 py-16 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </div>
                          <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                          <p className="text-xs text-gray-400 mt-1">Chưa có config nào. Nhấn "Tạo config" để thêm mới.</p>
                        </td>
                      </motion.tr>
                    ) : (
                      data.map((cfg, idx) => (
                        <motion.tr
                          key={cfg.id}
                          className="hover:bg-gray-50/80 transition-colors"
                          custom={idx}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          {/* STT */}
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-gray-400 font-medium">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                          </td>

                          {/* Config Name */}
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-semibold text-gray-900">{cfg.configName}</span>
                          </td>

                          {/* Key */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-mono">
                              {cfg.key}
                            </span>
                          </td>

                          {/* Value */}
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center min-w-[48px] px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold">
                              {cfg.value}
                            </span>
                          </td>

                          {/* ID */}
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-400 font-mono truncate max-w-[160px] block" title={cfg.id}>{cfg.id}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              {/* Xem chi tiết — GET /api/config/{id} */}
                              <motion.button
                                type="button"
                                title="Xem chi tiết"
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                                onClick={() => setViewTarget(cfg.id)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Chi tiết
                              </motion.button>

                              {/* Xóa — DELETE /api/config/{id} */}
                              <motion.button
                                type="button"
                                title="Xóa config"
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                onClick={() => setDeleteTarget(cfg)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Xóa
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
          </motion.div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <motion.div className="mt-5 flex items-center justify-between" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.45 }}>
              <p className="text-sm text-gray-500">
                Trang <span className="font-semibold text-gray-800">{page}</span> / {totalPages} — <span className="font-semibold text-gray-800">{total}</span> config
              </p>
              <div className="flex items-center gap-2">
                <motion.button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: page === 1 ? 1 : 1.04 }} whileTap={{ scale: page === 1 ? 1 : 0.96 }}>Trước</motion.button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <motion.button key={pageNum} type="button" onClick={() => setPage(pageNum)} className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${page === pageNum ? "bg-indigo-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>{pageNum}</motion.button>
                    );
                  })}
                </div>

                <motion.button type="button" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: page === totalPages ? 1 : 1.04 }} whileTap={{ scale: page === totalPages ? 1 : 0.96 }}>Sau</motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </>
  );
}