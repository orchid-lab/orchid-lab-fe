/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";

Chart.register(ArcElement, Tooltip, Legend);

interface Trait {
  name: string;
  value: number;
  unit: string;
}

interface Seedling {
  id: string;
  localName: string;
  scientificName: string;
  description?: string;
  parentAId?: string;
  parentALocalName?: string;
  parentAScientificName?: string;
  traits?: Trait[];
  createdDate?: string;
  createdBy?: string;
}

interface StageDefinition {
  id: number;
  name: string;
  description?: string;
}

interface Material {
  id: number;
  name: string;
  category?: string;
  description?: string;
  unit?: string;
}

interface StageMaterial {
  id: string;
  material: Material;
}

interface Chemical {
  id: number;
  name: string;
  category?: string;
  description?: string;
  concentrationUnit?: string;
}

interface StageChemical {
  id: string;
  chemical: Chemical;
}

interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  stageDefinition: StageDefinition;
  stageMaterials?: StageMaterial[];
  stageChemicals?: StageChemical[];
}

interface Method {
  id: number;
  name: string;
  description?: string;
  totalDurationDays: number;
  methodStages?: MethodStage[];
}

interface Batch {
  id: number;
  labRoomId: number;
  labRoomName: string;
  batchName: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  status?: string;
}

interface Sample {
  id: string;
  name: string;
  experimentLogId?: string;
  currentSampleStage?: string;
  notes?: string;
  reason?: string;
  executionDate?: string;
  status?: string;
}

interface ExperimentLogDetailType {
  id: string;
  seedling?: Seedling;
  method?: Method;
  batch?: Batch;
  expectedSampleCount?: number;
  currentStageOrder?: number;
  name: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reason?: string;
  status?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
  samples?: Sample[];
  methodName?: string;
  tissueCultureBatchName?: string;
}

// ─── Component ──────────────────────────────────────────────────

const TechnicianExperimentLogDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // ─── Fetch log ────────────────────────────────────────────────

  const fetchLog = () => {
    if (!id) return;
    axiosInstance
      .get(`/api/experiment-logs/${id}`)
      .then((res) => {
        const data = res.data?.value ?? res.data;
        setLog(data as ExperimentLogDetailType);
      })
      .catch(() => setError(t("common.errorLoading")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchLog();
  }, [id, t]);

  // ─── Update status: PUT /api/experiment-logs/{id}/status ──────
  // Status flow (Technician actions):
  //   Created        → "InProgress"            (Bắt đầu thí nghiệm)
  //   InProgress     → "WaitingForChangeStage" (Yêu cầu chuyển giai đoạn)
  //   InProgress     → "Completed"             (Hoàn thành thí nghiệm)
  // WaitingForChangeStage chỉ được xử lý bởi Researcher (ConfirmChangeStage)

  const handleUpdateStatus = (newStatus: string) => {
    if (!id || !log?.batch) return;
    setUpdating(true);
    axiosInstance
      .put(`/api/experiment-logs/${id}/status`, {
        status: newStatus,
        batchId: log.batch.id,
      })
      .then(() => {
        fetchLog(); 
      })
      .catch((err: unknown) => {
        console.error("Update status failed:", err);
        alert("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
      })
      .finally(() => setUpdating(false));
  };

  // ─── Helpers ──────────────────────────────────────────────────

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const val = (v?: string | number | null) => (v != null && v !== "" ? String(v) : "—");

  // ─── Action buttons ───────────────────────────────────────────

  const renderActionButtons = () => {
    if (!log) return null;

    if (log.status === "Created") {
      return (
        <button
          type="button"
          disabled={updating}
          onClick={() => handleUpdateStatus("InProgress")}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
        >
          {updating ? "Đang xử lý..." : "▶ Bắt đầu thí nghiệm"}
        </button>
      );
    }

    if (log.status === "InProgress") {
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={updating}
            onClick={() => handleUpdateStatus("WaitingForChangeStage")}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            {updating ? "Đang xử lý..." : "⏩ Yêu cầu chuyển giai đoạn"}
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => handleUpdateStatus("Completed")}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            {updating ? "Đang xử lý..." : "✅ Hoàn thành thí nghiệm"}
          </button>
        </div>
      );
    }

    if (log.status === "WaitingForChangeStage") {
      return (
        <span className="text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 px-4 py-2 rounded-lg">
          ⏳ Đang chờ researcher xác nhận chuyển giai đoạn
        </span>
      );
    }

    if (log.status === "Completed") {
      return (
        <span className="text-sm text-green-700 bg-green-100 border border-green-300 px-4 py-2 rounded-lg">
          ✅ Thí nghiệm đã hoàn thành
        </span>
      );
    }

    return null;
  };

  // ─── Sub-renders ──────────────────────────────────────────────

  const renderSeedling = () => {
    const s = log?.seedling;
    if (!s) return <p className="text-gray-400 text-sm italic">—</p>;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <p><span className="font-semibold text-gray-600">Tên địa phương:</span> {val(s.localName)}</p>
          <p><span className="font-semibold text-gray-600">Tên khoa học:</span> {val(s.scientificName)}</p>
        </div>
        {s.description && <p className="text-sm"><span className="font-semibold text-gray-600">Mô tả:</span> {s.description}</p>}
        {s.parentALocalName && (
          <p className="text-sm">
            <span className="font-semibold text-gray-600">Cây mẹ:</span> {s.parentALocalName}
            {s.parentAScientificName && <span className="text-gray-500"> ({s.parentAScientificName})</span>}
          </p>
        )}
        {s.traits && s.traits.length > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-gray-600">Đặc tính:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {s.traits.map((trait, i) => (
                <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {trait.name}: {trait.value} {trait.unit}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMethod = () => {
    const m = log?.method;
    if (!m) return <p className="text-gray-400 text-sm italic">—</p>;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <p><span className="font-semibold text-gray-600">Tên phương pháp:</span> {val(m.name)}</p>
          <p><span className="font-semibold text-gray-600">Thời gian tổng:</span> {val(m.totalDurationDays)} ngày</p>
        </div>
        {m.description && <p className="text-sm"><span className="font-semibold text-gray-600">Mô tả:</span> {m.description}</p>}

        {m.methodStages && m.methodStages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">Các giai đoạn:</p>
            {m.methodStages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage, i) => (
                <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Giai đoạn {stage.order}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">{stage.stageDefinition?.name}</span>
                    <span className="text-xs text-gray-400">({stage.durationsDays} ngày)</span>
                  </div>
                  {stage.stageDefinition?.description && (
                    <p className="text-xs text-gray-500">{stage.stageDefinition.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    {stage.stageMaterials && stage.stageMaterials.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Vật tư:</p>
                        <div className="flex flex-wrap gap-1">
                          {stage.stageMaterials.map((sm, j) => (
                            <span key={j} className="bg-white border border-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded">
                              {sm.material.name}{sm.material.unit ? ` (${sm.material.unit})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {stage.stageChemicals && stage.stageChemicals.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Hóa chất:</p>
                        <div className="flex flex-wrap gap-1">
                          {stage.stageChemicals.map((sc, j) => (
                            <span key={j} className="bg-white border border-purple-200 text-purple-700 text-xs px-2 py-0.5 rounded">
                              {sc.chemical.name}{sc.chemical.concentrationUnit ? ` (${sc.chemical.concentrationUnit})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  const renderBatch = () => {
    const b = log?.batch;
    if (!b) return <p className="text-gray-400 text-sm italic">—</p>;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p><span className="font-semibold text-gray-600">Tên lô:</span> {val(b.batchName)}</p>
          <p><span className="font-semibold text-gray-600">Phòng lab:</span> {val(b.labRoomName)}</p>
          <p>
            <span className="font-semibold text-gray-600">Kích thước:</span>{" "}
            {b.batchSizeWidth != null ? `${b.batchSizeWidth} ${b.widthUnit ?? ""}` : "—"}
            {" × "}
            {b.batchSizeHeight != null ? `${b.batchSizeHeight} ${b.heightUnit ?? ""}` : "—"}
          </p>
          <p><span className="font-semibold text-gray-600">Trạng thái:</span> {val(b.status)}</p>
        </div>
      </div>
    );
  };

  const renderSamples = () => {
    const samples = log?.samples;
    if (!samples || samples.length === 0)
      return <p className="text-gray-400 text-sm italic">Không có mẫu nào.</p>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tên mẫu</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Giai đoạn hiện tại</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ngày thực hiện</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{val(sample.name)}</td>
                <td className="px-4 py-2 text-gray-600">{val(sample.currentSampleStage)}</td>
                <td className="px-4 py-2 text-gray-600">{formatDate(sample.executionDate)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    sample.status === "Done" ? "bg-green-100 text-green-800" :
                    sample.status === "Cancel" ? "bg-red-100 text-red-800" :
                    sample.status === "InProcess" || sample.status === "WaitingForChangeStage" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {val(sample.status)}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{val(sample.notes)}</td>
                <td className="px-4 py-2 text-gray-500">{val(sample.reason)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading)
    return <div className="ml-64 mt-16 p-8 text-gray-500">{t("experimentLog.loadingData")}</div>;
  if (error)
    return <div className="ml-64 mt-16 p-8 text-red-500">{error}</div>;
  if (!log)
    return <div className="ml-64 mt-16 p-8">{t("common.noData")}</div>;

  return (
    <main className="ml-64 mt-8 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate("/technician/experiment-log")}
      >
        &larr; {t("experimentLog.backToList")}
      </button>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{log.name}</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              log.status === "Done" || log.status === "Completed" ? "bg-green-100 text-green-800" :
              log.status === "Cancel" ? "bg-red-100 text-red-800" :
              log.status === "WaitingForChangeStage" || log.status === "InProgress" ? "bg-yellow-100 text-yellow-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {val(log.status)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mb-4">
            {renderActionButtons()}
          </div>

          {/* General info grid */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <p><span className="font-semibold text-gray-500">Giai đoạn hiện tại:</span> {log.currentStageOrder != null ? `Giai đoạn ${log.currentStageOrder + 1}` : "—"}</p>
            <p><span className="font-semibold text-gray-500">Số mẫu kỳ vọng:</span> {val(log.expectedSampleCount)}</p>
            <p><span className="font-semibold text-gray-500">Số mẫu thực tế:</span> {log.samples?.length ?? 0}</p>
            <p><span className="font-semibold text-gray-500">Phiên trực tiếp:</span> {val(log.assignedTo)}</p>
            <p><span className="font-semibold text-gray-500">Ngày bắt đầu:</span> {formatDate(log.startDate)}</p>
            <p><span className="font-semibold text-gray-500">Ngày kết thúc:</span> {formatDate(log.endDate)}</p>
            <p><span className="font-semibold text-gray-500">Tạo bởi:</span> {val(log.createdBy)}</p>
            <p><span className="font-semibold text-gray-500">Ngày tạo:</span> {formatDateTime(log.createdDate)}</p>
            <p><span className="font-semibold text-gray-500">Cập nhật lần đầu:</span> {formatDateTime(log.updatedDate)}</p>
          </div>

          {log.notes && (
            <p className="mt-3 text-sm"><span className="font-semibold text-gray-500">Ghi chú:</span> {log.notes}</p>
          )}
          {log.reason && (
            <p className="mt-1 text-sm"><span className="font-semibold text-gray-500">Lý do:</span> {log.reason}</p>
          )}
        </div>

        {/* ── Seedling ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🌱 Cây giống</h2>
          {renderSeedling()}
        </div>

        {/* ── Method ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🔬 Phương pháp</h2>
          {renderMethod()}
        </div>

        {/* ── Batch ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">📦 Lô nuôi cấy mô</h2>
          {renderBatch()}
        </div>

        {/* ── Samples ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🧪 Danh sách mẫu ({log.samples?.length ?? 0})</h2>
          {renderSamples()}
        </div>
      </div>
    </main>
  );
};

export default TechnicianExperimentLogDetail;