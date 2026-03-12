/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

// ─── Types khớp với response thực tế ──────────────────────────────────────────
interface Method {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
}

interface CreateStageDto {
  stageDefinitionId: number;
  order: number;
  durationDays: number;
  createMaterial: number[];
  createChemical: number[];
}

interface CreateMethodPayload {
  name: string;
  description: string;
  createMethodDtos: CreateStageDto[];
}

interface UpdateMethodPayload {
  methodId: number;
  methodName: string;
  methodDescription: string;
}

// ─── Modal: Tạo phương pháp mới ───────────────────────────────────────────────
function CreateMethodModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateMethodPayload>({ name: "", description: "", createMethodDtos: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addStage = () => setForm((prev) => ({
    ...prev,
    createMethodDtos: [...prev.createMethodDtos, { stageDefinitionId: 0, order: prev.createMethodDtos.length + 1, durationDays: 1, createMaterial: [], createChemical: [] }],
  }));

  const removeStage = (idx: number) => setForm((prev) => ({ ...prev, createMethodDtos: prev.createMethodDtos.filter((_, i) => i !== idx) }));

  const updateStage = (idx: number, field: keyof CreateStageDto, value: number) => {
    setForm((prev) => { const stages = [...prev.createMethodDtos]; stages[idx] = { ...stages[idx], [field]: value }; return { ...prev, createMethodDtos: stages }; });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Tên phương pháp không được để trống."); return; }
    setSubmitting(true); setError("");
    try { await axiosInstance.post("/api/methods", form); onSuccess(); onClose(); }
    catch (err) { console.error(err); setError("Tạo phương pháp thất bại. Vui lòng thử lại."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h2 className="text-lg font-bold text-gray-900">Tạo phương pháp mới</h2><p className="text-sm text-gray-500 mt-0.5">Điền đầy đủ thông tin bên dưới</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên phương pháp <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Nhập tên phương pháp..." value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" placeholder="Nhập mô tả phương pháp..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Giai đoạn ({form.createMethodDtos.length})</label>
              <button type="button" onClick={addStage} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Thêm giai đoạn</button>
            </div>
            <AnimatePresence>
              {form.createMethodDtos.map((stage, idx) => (
                <motion.div key={idx} className="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Giai đoạn {idx + 1}</span>
                    <button type="button" onClick={() => removeStage(idx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(["stageDefinitionId", "order", "durationDays"] as const).map((field, fi) => (
                      <div key={field}>
                        <label className="block text-xs text-gray-500 mb-1">{["Stage Definition ID", "Thứ tự", "Số ngày"][fi]}</label>
                        <input type="number" min={fi === 0 ? 0 : 1} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={stage[field]} onChange={(e) => updateStage(idx, field, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {form.createMethodDtos.length === 0 && <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl"><p className="text-sm text-gray-400">Chưa có giai đoạn nào. Nhấn "Thêm giai đoạn" để bắt đầu.</p></div>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}>
            {submitting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang tạo...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Tạo phương pháp</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Chỉnh sửa ─────────────────────────────────────────────────────────
function EditMethodModal({ method, onClose, onSuccess }: { method: Method; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<UpdateMethodPayload>({ methodId: method.id, methodName: method.name ?? "", methodDescription: method.description ?? "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.methodName.trim()) { setError("Tên phương pháp không được để trống."); return; }
    setSubmitting(true); setError("");
    try { await axiosInstance.put("/api/methods", form); onSuccess(); onClose(); }
    catch (err) { console.error(err); setError("Cập nhật thất bại. Vui lòng thử lại."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h2 className="text-lg font-bold text-gray-900">Chỉnh sửa phương pháp</h2><p className="text-sm text-gray-500 mt-0.5">Cập nhật tên và mô tả</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên phương pháp <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.methodName} onChange={(e) => setForm((p) => ({ ...p, methodName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" value={form.methodDescription} onChange={(e) => setForm((p) => ({ ...p, methodDescription: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}>
            {submitting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang lưu...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Lưu thay đổi</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Xác nhận xóa ───────────────────────────────────────────────────────
function DeleteConfirmModal({ method, onClose, onSuccess }: { method: Method; onClose: () => void; onSuccess: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true); setError("");
    try { await axiosInstance.delete(`/api/methods/${method.id}`); onSuccess(); onClose(); }
    catch (err) { console.error(err); setError("Xóa thất bại. Vui lòng thử lại."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </motion.div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Xóa phương pháp?</h2>
          <p className="text-sm text-gray-500 mb-2">Bạn đang xóa phương pháp:</p>
          <p className="text-sm font-semibold text-gray-800 bg-gray-50 rounded-lg px-3 py-2 mb-2">{method.name}</p>
          <p className="text-xs text-red-500">Hành động này không thể hoàn tác.</p>
          {error && <div className="flex items-center gap-2 px-4 py-3 mt-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left"><svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
        </div>
        <div className="flex items-center gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleDelete()} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang xóa...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Xóa</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMethod() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<Method[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Method | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Method | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { PageNumber: page, PageSize: PAGE_SIZE };
      if (debouncedSearch) params.SearchTerm = debouncedSearch;
      const res = await axiosInstance.get("/api/methods", { params });
      const json = res.data;

      let items: Method[] = [];
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
      console.error("Error loading methods:", err);
      setData([]); setTotal(0); setTotalPages(1);
    } finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Stats dựa trên totalDurationDays (không có status trong response thực tế)
  const avgDuration = data.length > 0 ? Math.round(data.reduce((sum, m) => sum + (m.totalDurationDays ?? 0), 0) / data.length) : 0;
  const maxDuration = data.length > 0 ? Math.max(...data.map((m) => m.totalDurationDays ?? 0)) : 0;

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const } }),
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
  };

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateMethodModal onClose={() => setShowCreate(false)} onSuccess={() => void fetchData()} />}
        {editTarget && <EditMethodModal method={editTarget} onClose={() => setEditTarget(null)} onSuccess={() => void fetchData()} />}
        {deleteTarget && <DeleteConfirmModal method={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={() => void fetchData()} />}
      </AnimatePresence>

      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div className="mb-8 flex items-start justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("method.methodManagement")}</h1>
              <p className="text-gray-600">Quản lý và theo dõi các phương pháp sinh sản</p>
            </div>
            <motion.button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-sm shadow-green-200 transition-colors" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tạo phương pháp
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            {[
              { label: "Tổng số phương pháp", value: total, unit: "", color: "text-gray-900", bg: "bg-blue-50", iconColor: "text-blue-600", path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { label: "Trung bình thời gian", value: avgDuration, unit: " ngày", color: "text-green-600", bg: "bg-green-50", iconColor: "text-green-600", path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Thời gian dài nhất", value: maxDuration, unit: " ngày", color: "text-orange-500", bg: "bg-orange-50", iconColor: "text-orange-500", path: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            ].map((stat, i) => (
              <motion.div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <motion.p className={`text-3xl font-bold ${stat.color}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5, type: "spring" }}>
                      {stat.value}<span className="text-lg font-medium">{stat.unit}</span>
                    </motion.p>
                  </div>
                  <motion.div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`} whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                    <svg className={`w-6 h-6 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.path} /></svg>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Search */}
          <motion.div className="bg-white border border-gray-200 rounded-xl p-6 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder={t("method.searchPlaceholder") || "Tìm kiếm theo tên phương pháp..."} value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
          </motion.div>

          {/* Table */}
          <motion.div className="bg-white border border-gray-200 rounded-xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t("method.methodName")}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mô tả</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Tổng ngày</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <motion.tr key={`sk-${idx}`} className="animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-6" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-44" /></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-64" /></td>
                          <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto" /></td>
                          <td className="px-6 py-4"><div className="h-9 bg-gray-200 rounded-lg w-52 mx-auto" /></td>
                        </motion.tr>
                      ))
                    ) : data.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="text-gray-500 font-medium">{t("common.noData")}</p>
                        </td>
                      </motion.tr>
                    ) : (
                      data.map((m, idx) => (
                        <motion.tr key={m.id} className="hover:bg-gray-50 transition-colors" custom={idx} variants={rowVariants} initial="hidden" animate="visible" exit="exit">
                          <td className="px-4 py-4"><span className="text-xs text-gray-400 font-medium">{(page - 1) * PAGE_SIZE + idx + 1}</span></td>
                          <td className="px-6 py-4"><span className="text-sm font-semibold text-gray-900">{m.name}</span></td>
                          <td className="px-6 py-4 max-w-xs"><p className="text-sm text-gray-500 truncate" title={m.description}>{m.description || "—"}</p></td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {m.totalDurationDays ?? 0} ngày
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Sửa — PUT /api/methods */}
                              <motion.button type="button" className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors" onClick={() => setEditTarget(m)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Sửa
                              </motion.button>
                              {/* Chi tiết */}
                              <motion.button type="button" className="inline-flex items-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors" onClick={() => navigate(`/admin/method/${m.id}?page=${page}`)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {t("common.details")}
                              </motion.button>
                              {/* Xóa — DELETE /api/methods/{id} */}
                              <motion.button type="button" className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors" onClick={() => setDeleteTarget(m)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div className="mt-6 flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
              <p className="text-sm text-gray-600">
                Trang <span className="font-medium text-gray-900">{page}</span> / {totalPages} — <span className="font-medium text-gray-900">{total}</span> phương pháp
              </p>
              <div className="flex items-center gap-2">
                <motion.button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: page === 1 ? 1 : 1.05 }} whileTap={{ scale: page === 1 ? 1 : 0.95 }}>Trước</motion.button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <motion.button key={pageNum} type="button" onClick={() => setPage(pageNum)} className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${page === pageNum ? "bg-green-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>{pageNum}</motion.button>
                    );
                  })}
                </div>
                <motion.button type="button" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" whileHover={{ scale: page === totalPages ? 1 : 1.05 }} whileTap={{ scale: page === totalPages ? 1 : 0.95 }}>Sau</motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}