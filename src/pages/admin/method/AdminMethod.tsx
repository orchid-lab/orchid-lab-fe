/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

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
  materials: StageMaterial[];
  chemicals: StageChemical[];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.22 }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.div className="w-13 h-13 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 w-14 h-14" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </motion.div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-500 mb-1">{description}</p>
          <p className="text-xs text-red-500">Hành động này không thể hoàn tác.</p>
          {error && <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleConfirm()} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors" whileHover={{ scale: deleting ? 1 : 1.02 }} whileTap={{ scale: deleting ? 1 : 0.98 }}>
            {deleting ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang xóa...</> : "Xóa"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Material Modal ───────────────────────────────────────────────────────
// PUT /api/methods/{methodId}/method-stages/{methodStageId}/materials/{stageMaterialId}
function EditMaterialModal({
  methodId, stageId, stageMaterialId, currentMaterialId,
  onClose, onSuccess,
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
      await axiosInstance.put(
        `/api/methods/${methodId}/method-stages/${stageId}/materials/${stageMaterialId}`,
        { materialId }
      );
      onSuccess(); onClose();
    } catch (err) { console.error(err); setError("Cập nhật thất bại."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.22 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Cập nhật vật liệu</h2>
            <p className="text-xs text-gray-500 mt-0.5">Stage Material ID: <span className="font-mono text-gray-700">{stageMaterialId}</span></p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-5">
          {error && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Material ID <span className="text-red-500">*</span></label>
          <input type="number" min={0} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" value={materialId} onChange={(e) => setMaterialId(Number(e.target.value))} />
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSave()} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors" whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
            {saving ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang lưu...</> : "Lưu"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Chemical Modal ───────────────────────────────────────────────────────
// PUT /api/methods/{methodId}/method-stages/{methodStageId}/chemical/{stageChemicalId}
function EditChemicalModal({
  methodId, stageId, stageChemicalId, currentChemicalId,
  onClose, onSuccess,
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
      await axiosInstance.put(
        `/api/methods/${methodId}/method-stages/${stageId}/chemical/${stageChemicalId}`,
        { chemicalId }
      );
      onSuccess(); onClose();
    } catch (err) { console.error(err); setError("Cập nhật thất bại."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.22 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Cập nhật hoá chất</h2>
            <p className="text-xs text-gray-500 mt-0.5">Stage Chemical ID: <span className="font-mono text-gray-700">{stageChemicalId}</span></p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-5">
          {error && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Chemical ID <span className="text-red-500">*</span></label>
          <input type="number" min={0} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={chemicalId} onChange={(e) => setChemicalId(Number(e.target.value))} />
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <motion.button type="button" onClick={() => void handleSave()} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors" whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
            {saving ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Đang lưu...</> : "Lưu"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stage Card ────────────────────────────────────────────────────────────────
function StageCard({
  stage,
  methodId,
  onRefresh,
}: {
  stage: MethodStage;
  methodId: number;
  onRefresh: () => void;
}) {
  const [editMaterial, setEditMaterial] = useState<StageMaterial | null>(null);
  const [editChemical, setEditChemical] = useState<StageChemical | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "material" | "chemical"; id: string; label: string } | null>(null);

  const handleDeleteMaterial = async (materialId: string) => {
    // DELETE /api/methods/{methodId}/method-stages/{methodStageId}/material/{materialId}
    await axiosInstance.delete(`/api/methods/${methodId}/method-stages/${stage.methodStageId}/material/${materialId}`);
    onRefresh();
  };

  const handleDeleteChemical = async (chemicalsId: string) => {
    // DELETE /api/methods/{methodId}/method-stages/{methodStageId}/chemicals/{chemicalsId}
    await axiosInstance.delete(`/api/methods/${methodId}/method-stages/${stage.methodStageId}/chemicals/${chemicalsId}`);
    onRefresh();
  };

  return (
    <>
      <AnimatePresence>
        {editMaterial && (
          <EditMaterialModal
            methodId={methodId}
            stageId={stage.methodStageId}
            stageMaterialId={editMaterial.stageMaterialId}
            currentMaterialId={editMaterial.materialId}
            onClose={() => setEditMaterial(null)}
            onSuccess={onRefresh}
          />
        )}
        {editChemical && (
          <EditChemicalModal
            methodId={methodId}
            stageId={stage.methodStageId}
            stageChemicalId={editChemical.stageChemicalId}
            currentChemicalId={editChemical.chemicalId}
            onClose={() => setEditChemical(null)}
            onSuccess={onRefresh}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            title={`Xóa ${deleteTarget.type === "material" ? "vật liệu" : "hoá chất"}?`}
            description={`ID: ${deleteTarget.label}`}
            onClose={() => setDeleteTarget(null)}
            onConfirm={async () => {
              if (deleteTarget.type === "material") await handleDeleteMaterial(deleteTarget.id);
              else await handleDeleteChemical(deleteTarget.id);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="bg-white border border-gray-200 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Stage Header */}
        <div className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-green-700">{stage.order}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {stage.stageDefinitionName ?? `Giai đoạn ${stage.order}`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Stage ID: {stage.methodStageId}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs font-medium text-blue-700">{stage.durationDays} ngày</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Materials */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Vật liệu ({stage.materials.length})</span>
            </div>

            {stage.materials.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">Chưa có vật liệu nào.</p>
            ) : (
              <div className="space-y-2">
                {stage.materials.map((mat) => (
                  <div key={mat.stageMaterialId} className="flex items-center justify-between gap-2 px-3 py-2 bg-orange-50/60 rounded-lg border border-orange-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{mat.materialName ?? `Material #${mat.materialId}`}</p>
                      <p className="text-xs text-gray-400 font-mono">ID: {mat.stageMaterialId}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {/* PUT material */}
                      <motion.button
                        type="button"
                        title="Cập nhật vật liệu"
                        className="p-1.5 rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200 transition-colors"
                        onClick={() => setEditMaterial(mat)}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </motion.button>
                      {/* DELETE material */}
                      <motion.button
                        type="button"
                        title="Xóa vật liệu"
                        className="p-1.5 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        onClick={() => setDeleteTarget({ type: "material", id: mat.stageMaterialId, label: mat.stageMaterialId })}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chemicals */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Hoá chất ({stage.chemicals.length})</span>
            </div>

            {stage.chemicals.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">Chưa có hoá chất nào.</p>
            ) : (
              <div className="space-y-2">
                {stage.chemicals.map((chem) => (
                  <div key={chem.stageChemicalId} className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50/60 rounded-lg border border-purple-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{chem.chemicalName ?? `Chemical #${chem.chemicalId}`}</p>
                      <p className="text-xs text-gray-400 font-mono">ID: {chem.stageChemicalId}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {/* PUT chemical */}
                      <motion.button
                        type="button"
                        title="Cập nhật hoá chất"
                        className="p-1.5 rounded-md text-purple-600 bg-purple-100 hover:bg-purple-200 transition-colors"
                        onClick={() => setEditChemical(chem)}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </motion.button>
                      {/* DELETE chemical */}
                      <motion.button
                        type="button"
                        title="Xóa hoá chất"
                        className="p-1.5 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        onClick={() => setDeleteTarget({ type: "chemical", id: chem.stageChemicalId, label: chem.stageChemicalId })}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </motion.button>
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backPage = searchParams.get("page") ?? "1";

  const [method, setMethod] = useState<MethodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMethod = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const res = await axiosInstance.get(`/api/methods/${id}`);
      const json = res.data;
      // Handle wrapped or direct response
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
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </main>
    );
  }

  if (error || !method) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-gray-500 font-medium">{error || "Không tìm thấy phương pháp."}</p>
          <button type="button" onClick={() => navigate(`/admin/method?page=${backPage}`)} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Quay lại</button>
        </div>
      </main>
    );
  }

  const stages = method.methodStages ?? [];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Back + Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <button
            type="button"
            onClick={() => navigate(`/admin/method?page=${backPage}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại danh sách
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{method.name}</h1>
              {method.description && <p className="text-gray-500 text-sm max-w-2xl">{method.description}</p>}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-semibold text-blue-700">{method.totalDurationDays} ngày</span>
            </div>
          </div>
        </motion.div>

        {/* Summary bar */}
        <motion.div className="grid grid-cols-3 gap-4 mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          {[
            { label: "Số giai đoạn", value: stages.length, color: "text-green-700", bg: "bg-green-50 border-green-100" },
            { label: "Tổng vật liệu", value: stages.reduce((s, st) => s + st.materials.length, 0), color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
            { label: "Tổng hoá chất", value: stages.reduce((s, st) => s + st.chemicals.length, 0), color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
          ].map((stat, i) => (
            <motion.div key={i} className={`border rounded-xl px-5 py-4 ${stat.bg}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.07 }}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stages */}
        <div className="space-y-4">
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-bold text-gray-800">Các giai đoạn</h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{stages.length}</span>
          </motion.div>

          {stages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm text-gray-400 font-medium">{t("common.noData")}</p>
            </div>
          ) : (
            stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage) => (
                <StageCard
                  key={stage.methodStageId}
                  stage={stage}
                  methodId={method.id}
                  onRefresh={() => void fetchMethod()}
                />
              ))
          )}
        </div>
      </div>
    </main>
  );
}