/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft, Trash2, Edit2, Loader2, Info, 
  FlaskConical, TestTube2, Layers, AlertCircle 
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StageMaterial {
  stageMaterialId: string;
  materialId: number;
  materialName?: string;
}

interface StageChemical {
  stageChemicalId: string;
  chemicalId: number;
  chemicalName?: string;
}

interface MethodStage {
  methodStageId: number;
  order: number;
  durationDays: number;
  stageDefinitionId?: number;
  stageDefinitionName?: string;
  materials?: StageMaterial[]; // Sửa type để an toàn
  chemicals?: StageChemical[]; // Sửa type để an toàn
}

interface MethodDetail {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  methodStages: MethodStage[];
}

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({
  title,
  description,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setDeleting(true); setError("");
    try { await onConfirm(); onClose(); }
    catch { setError("Xóa thất bại. Vui lòng thử lại."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        transition={{ duration: 0.2 }}
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <motion.div className="bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 w-16 h-16" 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-2">{description}</p>
          <p className="text-xs font-medium text-rose-500 bg-rose-50 inline-block px-3 py-1 rounded-full">Hành động này không thể hoàn tác.</p>
          {error && <p className="mt-3 text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6 bg-gray-50/50 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleConfirm()} disabled={deleting} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm shadow-rose-200 disabled:opacity-60 transition-colors" 
            whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xóa...</> : "Xóa"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Material Modal ───────────────────────────────────────────────────────
function EditMaterialModal({
  methodId, stageId, stageMaterialId, currentMaterialId, onClose, onSuccess,
}: {
  methodId: number; stageId: number; stageMaterialId: string; currentMaterialId: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [materialId, setMaterialId] = useState(currentMaterialId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await axiosInstance.put(`/api/methods/${methodId}/method-stages/${stageId}/materials/${stageMaterialId}`, { materialId });
      onSuccess(); onClose();
    } catch (err) { console.error(err); setError("Cập nhật thất bại."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Cập nhật Vật liệu</h2>
            <p className="text-xs text-slate-500 mt-1">ID: <span className="font-mono text-slate-600">{stageMaterialId}</span></p>
          </div>
        </div>
        <div className="px-6 py-6">
          {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100">{error}</p>}
          <label className="block text-sm font-semibold text-slate-700 mb-2">Material ID mới <span className="text-rose-500">*</span></label>
          <input type="number" min={0} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
            value={materialId} onChange={(e) => setMaterialId(Number(e.target.value))} />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSave()} disabled={saving} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 disabled:opacity-60 transition-colors" 
            whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : "Lưu thay đổi"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Chemical Modal ───────────────────────────────────────────────────────
function EditChemicalModal({
  methodId, stageId, stageChemicalId, currentChemicalId, onClose, onSuccess,
}: {
  methodId: number; stageId: number; stageChemicalId: string; currentChemicalId: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [chemicalId, setChemicalId] = useState(currentChemicalId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await axiosInstance.put(`/api/methods/${methodId}/method-stages/${stageId}/chemical/${stageChemicalId}`, { chemicalId });
      onSuccess(); onClose();
    } catch (err) { console.error(err); setError("Cập nhật thất bại."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Cập nhật Hoá chất</h2>
            <p className="text-xs text-slate-500 mt-1">ID: <span className="font-mono text-slate-600">{stageChemicalId}</span></p>
          </div>
        </div>
        <div className="px-6 py-6">
          {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100">{error}</p>}
          <label className="block text-sm font-semibold text-slate-700 mb-2">Chemical ID mới <span className="text-rose-500">*</span></label>
          <input type="number" min={0} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
            value={chemicalId} onChange={(e) => setChemicalId(Number(e.target.value))} />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSave()} disabled={saving} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-60 transition-colors" 
            whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : "Lưu thay đổi"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stage Card ────────────────────────────────────────────────────────────────
function StageCard({ stage, methodId, onRefresh }: { stage: MethodStage; methodId: number; onRefresh: () => void; }) {
  const [editMaterial, setEditMaterial] = useState<StageMaterial | null>(null);
  const [editChemical, setEditChemical] = useState<StageChemical | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "material" | "chemical"; id: string; label: string } | null>(null);

  // Bảo hiểm
  const safeMaterials = stage.materials ?? [];
  const safeChemicals = stage.chemicals ?? [];

  const handleDeleteMaterial = async (materialId: string) => {
    await axiosInstance.delete(`/api/methods/${methodId}/method-stages/${stage.methodStageId}/material/${materialId}`);
    onRefresh();
  };

  const handleDeleteChemical = async (chemicalsId: string) => {
    await axiosInstance.delete(`/api/methods/${methodId}/method-stages/${stage.methodStageId}/chemicals/${chemicalsId}`);
    onRefresh();
  };

  return (
    <>
      <AnimatePresence>
        {editMaterial && <EditMaterialModal methodId={methodId} stageId={stage.methodStageId} stageMaterialId={editMaterial.stageMaterialId} currentMaterialId={editMaterial.materialId} onClose={() => setEditMaterial(null)} onSuccess={onRefresh} />}
        {editChemical && <EditChemicalModal methodId={methodId} stageId={stage.methodStageId} stageChemicalId={editChemical.stageChemicalId} currentChemicalId={editChemical.chemicalId} onClose={() => setEditChemical(null)} onSuccess={onRefresh} />}
        {deleteTarget && (
          <ConfirmDeleteModal
            title={`Xóa ${deleteTarget.type === "material" ? "Vật liệu" : "Hoá chất"}?`}
            description={`Bạn sắp xóa ${deleteTarget.type === "material" ? "vật liệu" : "hoá chất"} mang ID: ${deleteTarget.label}`}
            onClose={() => setDeleteTarget(null)}
            onConfirm={async () => {
              if (deleteTarget.type === "material") await handleDeleteMaterial(deleteTarget.id);
              else await handleDeleteChemical(deleteTarget.id);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      >
        {/* Stage Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-sm font-bold text-white">{stage.order}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900">
              {stage.stageDefinitionName ?? `Giai đoạn ${stage.order}`}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Stage ID: <span className="font-mono">{stage.methodStageId}</span></p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100/50 rounded-lg">
            <Info className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-xs font-bold text-rose-700">{stage.durationDays} ngày</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
          {/* Materials (Vật tư - Theme Xanh Ngọc/Emerald) */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100/50">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-800">Vật tư</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{safeMaterials.length} mục</span>
            </div>

            {safeMaterials.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-xs font-medium text-slate-400">Trống</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {safeMaterials.map((mat) => (
                  <div key={mat.stageMaterialId} className="group flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-emerald-50/30 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{mat.materialName ?? `Material #${mat.materialId}`}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {mat.stageMaterialId}</p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button type="button" title="Sửa" onClick={() => setEditMaterial(mat)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" title="Xóa" onClick={() => setDeleteTarget({ type: "material", id: mat.stageMaterialId, label: mat.stageMaterialId })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chemicals (Hoá chất - Theme Xanh Dương/Blue) */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100/50">
                  <TestTube2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-800">Hoá chất</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{safeChemicals.length} mục</span>
            </div>

            {safeChemicals.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-xs font-medium text-slate-400">Trống</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {safeChemicals.map((chem) => (
                  <div key={chem.stageChemicalId} className="group flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-blue-50/30 rounded-xl border border-slate-200 hover:border-blue-200 transition-all">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{chem.chemicalName ?? `Chemical #${chem.chemicalId}`}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {chem.stageChemicalId}</p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button type="button" title="Sửa" onClick={() => setEditChemical(chem)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" title="Xóa" onClick={() => setDeleteTarget({ type: "chemical", id: chem.stageChemicalId, label: chem.stageChemicalId })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMethodDetail() {
  const { t } = useTranslation();
  const { methodId: id } = useParams<{ methodId: string }>(); // BẢO HIỂM ROUTE
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backPage = searchParams.get("page") ?? "1";

  const [method, setMethod] = useState<MethodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMethod = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Không tìm thấy ID phương pháp. Vui lòng kiểm tra lại URL.");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await axiosInstance.get(`/api/methods/${id}`);
      const json = res.data;
      const data = json?.value ?? json?.data ?? json;
      setMethod(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin phương pháp.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchMethod(); }, [fetchMethod]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 bg-rose-50 rounded w-48 mb-8" />
          <div className="h-24 bg-rose-50 rounded-2xl" />
          <div className="h-32 bg-white border border-rose-50 rounded-2xl" />
          {[1, 2].map((i) => <div key={i} className="h-64 bg-white border border-rose-50 rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (error || !method) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold mb-6">{error || "Không tìm thấy phương pháp."}</p>
          <button type="button" onClick={() => navigate(`/admin/method?page=${backPage}`)} className="px-6 py-2.5 font-semibold text-white bg-[#9f1239] rounded-xl hover:bg-[#be123c] transition-colors shadow-sm">
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  const stages = method.methodStages ?? [];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
      <div className="max-w-5xl mx-auto">

        {/* Back + Header */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <button
            type="button"
            onClick={() => navigate(`/admin/method?page=${backPage}`)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#9f1239] mb-6 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Danh sách phương pháp
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold text-[#9f1239] tracking-tight">{method.name}</h1>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-md border border-rose-100">ID: {method.id}</span>
              </div>
              {method.description && <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">{method.description}</p>}
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 bg-white border border-rose-100 rounded-2xl shadow-sm flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <Info className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tổng thời gian</p>
                <p className="text-sm font-bold text-slate-800">{method.totalDurationDays} ngày</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary bar */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          {[
            { label: "Giai đoạn nuôi cấy", value: stages.length, icon: FlaskConical, color: "text-[#9f1239]" },
            { label: "Tổng vật tư sử dụng", value: stages.reduce((s, st) => s + (st.materials?.length ?? 0), 0), icon: Layers, color: "text-emerald-600" },
            { label: "Tổng hoá chất sử dụng", value: stages.reduce((s, st) => s + (st.chemicals?.length ?? 0), 0), icon: TestTube2, color: "text-blue-600" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.07 }}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${stat.color} opacity-80`} />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stages */}
        <div className="space-y-5">
          <motion.div className="flex items-center gap-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-bold text-slate-800">Quy trình thực hiện</h2>
            <span className="flex items-center justify-center text-xs font-bold text-white bg-slate-800 w-6 h-6 rounded-full shadow-sm">{stages.length}</span>
          </motion.div>

          {stages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 border-dashed rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">{t("common.noData") || "Chưa có dữ liệu giai đoạn."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {stages
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <StageCard
                    key={stage.methodStageId}
                    stage={stage}
                    methodId={method.id}
                    onRefresh={() => void fetchMethod()}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}