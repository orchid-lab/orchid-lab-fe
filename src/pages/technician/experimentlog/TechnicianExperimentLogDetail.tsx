/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * =============================================================================
 * TECHNICIAN EXPERIMENT LOG DETAIL PAGE
 * =============================================================================
 * 
 * Displays experiment log details for technicians with actions:
 * - View experiment info (method, batch, seedling, stages, samples)
 * - Start experiment (change status to InProgress)
 * - Cancel experiment with reason modal
 * 
 * API Endpoints:
 * - GET /api/experiment-logs/:id - Get experiment log details
 * - PUT /api/experiment-logs/:id/status - Update status (start)
 * - PUT /api/experiment-logs/:id/cancel - Cancel with reason
 * - GET /api/sample - Get samples for experiment
 * - GET /api/user/:id - Get creator info
 * =============================================================================
 */

// =============================================================================
// IMPORTS
// =============================================================================
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
import { FaTimes, FaSeedling } from "react-icons/fa";
import axiosInstance from "../../../api/axiosInstance";
import type { User } from "../../../types/Auth";

Chart.register(ArcElement, Tooltip, Legend);

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Sample - Represents a sample in the experiment
 */
interface Sample {
  id: string;
  name: string;
  experimentLogId?: string;
  currentSampleStage?: string;
  notes?: string;
  reason?: string;
  executionDate?: string;
  status?: string;
  // Legacy fields
  description?: string;
  dob?: string;
  statusEnum?: string;
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

interface Chemical {
  id: number;
  name: string;
  category?: string;
  description?: string;
  concentrationUnit?: string;
}

interface StageMaterial {
  id: string;
  material: Material;
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
  isSampleGenerated?: boolean; // Determines if protocorm creation is allowed at this stage
}

interface Method {
  id: number;
  name: string;
  description?: string;
  totalDurationDays?: number;
  methodStages?: MethodStage[];
}

interface Batch {
  id: number;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  status?: string;
}

interface Trait {
  name: string;
  value: number;
  unit: string;
}

interface Seedling {
  id: string;
  localName: string;
  scientificName?: string;
  description?: string;
  parentAId?: string;
  parentALocalName?: string;
  parentAScientificName?: string;
  traits?: Trait[];
  createdDate?: string;
  createdBy?: string;
}

interface ExperimentLogDetailType {
  id: string;
  name: string;
  seedling?: Seedling;
  method?: Method;
  batch?: Batch;
  expectedSampleCount?: number;
  currentStageOrder?: number;
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
  // Legacy fields for backward compatibility
  methodName?: string;
  tissueCultureBatchName?: string;
  create_date?: string;
  create_by?: string;
}

interface SamplesResponse {
  value?: {
    data?: Sample[];
  };
  data?: Sample[];
}

// =============================================================================
// CANCEL MODAL COMPONENT
// =============================================================================
interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason("");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("experimentLog.cancelExperiment") || "Hủy thí nghiệm"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes />
            </button>
          </div>
          {/* Content */}
          <div className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("experimentLog.cancelReason") || "Lý do hủy thí nghiệm"} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("experimentLog.enterCancelReason") || "Nhập lý do hủy thí nghiệm..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
            />
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              {t("common.cancel") || "Hủy"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!reason.trim() || isLoading}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (t("common.processing") || "Đang xử lý...") : (t("common.confirm") || "Xác nhận")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const TechnicianExperimentLogDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSamplesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labName, setLabName] = useState<string>(t("experimentLog.loadingData"));
  const [creator, setCreator] = useState<string>(t("experimentLog.loadingData"));
  
  // Action states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProtocormPopoverOpen, setIsProtocormPopoverOpen] = useState(false);
  const [isCreatingProtocorm, setIsCreatingProtocorm] = useState(false);
  const [protocormQuantity, setProtocormQuantity] = useState<string>("");

  // ---------------------------------------------------------------------------
  // DATA FETCHING EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    axiosInstance
      .get(`/api/experiment-logs/${id}`)
      .then((res) => {
        const logData = res.data.value ?? res.data;
        const anyLog = logData as Record<string, unknown>;
        const normalized: Partial<ExperimentLogDetailType> = {
          ...(anyLog as unknown as Partial<ExperimentLogDetailType>),
          createdDate: (anyLog.createdDate as string | undefined) ?? (anyLog.create_date as string | undefined),
        };
        setLog(normalized as ExperimentLogDetailType);
      })
      .catch(() => setError(t("common.errorLoading")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleStart = async () => {
    if (!id) return;
    setIsUpdatingStatus(true);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, {
        status: "InProgress",
      });
      setLog((prev) => (prev ? { ...prev, status: "InProgress" } : prev));
    } catch {
      setError(t("common.errorLoading"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/cancel`, {
        id: id,
        reason: reason || null,
      });
      setLog((prev) => (prev ? { ...prev, status: "Failed" } : prev));
      setIsCancelModalOpen(false);
    } catch {
      setError(t("common.errorLoading"));
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Create protocorms using POST /api/samples
   * Body: { experimentLogId: string, quantity: number }
   */
  const handleCreateProtocorm = async () => {
    const qty = parseInt(protocormQuantity, 10);
    if (!id || qty <= 0) return;
    setIsCreatingProtocorm(true);
    try {
      await axiosInstance.post(`/api/samples`, {
        experimentLogId: id,
        quantity: qty,
      });
      // Refresh samples list after creation
      const res = await axiosInstance.get(`/api/sample?pageNo=1&pageSize=100&experimentLogId=${id}`);
      const rawData = res.data;
      let samplesData: Sample[] = [];
      if (rawData?.value?.data) {
        samplesData = rawData.value.data;
      } else if (rawData?.data) {
        samplesData = rawData.data;
      } else if (Array.isArray(rawData)) {
        samplesData = rawData;
      }
      setSamples(samplesData);
      setIsProtocormPopoverOpen(false);
      setProtocormQuantity("");
    } catch {
      setError(t("common.errorLoading"));
    } finally {
      setIsCreatingProtocorm(false);
    }
  };

  useEffect(() => {
    if (!id || !log) return;

    setSamplesLoading(true);
    axiosInstance
      .get(`/api/sample?pageNo=1&pageSize=100&experimentLogId=${id}`)
      .then((res) => {
        const rawData = res.data;
        let data: SamplesResponse;
        if (typeof rawData === "object" && rawData !== null && ("value" in rawData || "data" in rawData)) {
          data = rawData as SamplesResponse;
        } else {
          throw new Error("Invalid samples data");
        }

        let samplesData: Sample[] = [];
        if (data.value?.data) {
          samplesData = data.value.data;
        } else if (data.data) {
          samplesData = data.data;
        } else if (Array.isArray(data)) {
          samplesData = data;
        }

        setSamples(samplesData);
      })
      .catch((err) => {
        console.error("Error fetching samples:", err);
        setSamples([]);
      })
      .finally(() => setSamplesLoading(false));
  }, [id, log]);

  useEffect(() => {
    if (!log) return;
    const tcbId =
      ((log as unknown as Record<string, unknown>)?.tissueCultureBatchId as string) ??
      ((log as unknown as Record<string, unknown>)?.tissueCultureBatchID as string);
    if (tcbId) {
      axiosInstance
        .get(`/api/tissue-culture-batch/${tcbId}`)
        .then((res) => {
          const raw = res.data;
          const name = (raw?.value?.labName as string) ?? (raw?.labName as string);
          setLabName(name ?? t("experimentLog.notAvailable"));
        })
        .catch(() => setLabName(t("experimentLog.notAvailable")));
    }
  }, [log, t]);

  // Fetch creator name using User type from Auth.ts
  useEffect(() => {
    const creatorId = log?.createdBy ?? log?.create_by;
    if (creatorId) {
      axiosInstance
        .get(`/api/user/${creatorId}`)
        .then((res) => {
          const raw = res.data;
          // API returns either { value: User } or User directly
          const userData: User | undefined = raw?.value ?? raw;
          setCreator(userData?.name ?? t("experimentLog.notAvailable"));
        })
        .catch(() => setCreator(t("experimentLog.notAvailable")));
    }
  }, [log, t]);

  if (loading)
    return (
      <div className="ml-64 mt-16 p-8 text-gray-500">{t("experimentLog.loadingData")}</div>
    );
  if (error) return <div className="ml-64 mt-16 p-8 text-red-500">{error}</div>;
  if (!log) return <div className="ml-64 mt-16 p-8">{t("common.noData")}</div>;





  const renderSelectedSeedlings = () => {
    // New API structure: seedling is a single object
    if (log.seedling) {
      return (
        <div className="text-green-800 text-base space-y-1">
          <div>
            • {log.seedling.localName || t("experimentLog.notAvailable")}
            {log.seedling.scientificName && (
              <span className="text-gray-600"> ({log.seedling.scientificName})</span>
            )}
          </div>
          {log.seedling.parentALocalName && (
            <div className="text-sm text-gray-600 ml-4">
              {t("experimentLog.parent") || "Cây mẹ"}: {log.seedling.parentALocalName}
              {log.seedling.parentAScientificName && (
                <span> ({log.seedling.parentAScientificName})</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return <div className="text-gray-500">{t("experimentLog.noSeedlings")}</div>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("experimentLog.notAvailable");
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // ---------------------------------------------------------------------------
  // STATUS HELPERS - Matching TechnicianExperimentLog page
  // ---------------------------------------------------------------------------
  
  /**
   * Normalize status string for consistent comparison
   */
  const normalizeStatus = (status?: number | string): string => {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "Created":
        return "Created";
      case "InProgress":
        return "InProgress";
      case "WaitingForChangeStage":
        return "WaitingForChangeStage";
      case "Completed":
        return "Completed";
      case "Destroyed":
        return "Destroyed";
      default:
        return statusStr;
    }
  };

  /**
   * Convert status to Vietnamese label - matching TechnicianExperimentLog page
   */
  const getStatusDisplay = (status?: string | number): string => {
    switch (normalizeStatus(status)) {
      case "Created":
        return t("status.created");
      case "InProgress":
        return t("experimentLog.inProgress");
      case "WaitingForChangeStage":
        return t("experimentLog.waitingForStageChange");
      case "Completed":
        return t("experimentLog.completed");
      case "Destroyed":
        return t("experimentLog.destroyed");
      default:
        return t("common.none");
    }
  };

  /**
   * Get status badge color classes - matching TechnicianExperimentLog page
   */
  const getStatusColor = (status?: string | number): string => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "bg-blue-100 text-blue-800";
      case "WaitingForChangeStage":
        return "bg-indigo-100 text-indigo-800";
      case "InProgress":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Destroyed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Current stage from log data - get stage name by matching currentStageOrder with method.methodStages
  const getCurrentStageName = (): string => {
    if (!log?.method?.methodStages || log.currentStageOrder === undefined) {
      return t("experimentLog.notAvailable");
    }
    const currentMethodStage = log.method.methodStages.find(
      (stage) => stage.order === log.currentStageOrder
    );
    return currentMethodStage?.stageDefinition?.name || t("experimentLog.notAvailable");
  };
  const currentStage = getCurrentStageName();

  // Get current method stage object for checking isSampleGenerated
  const getCurrentMethodStage = (): MethodStage | undefined => {
    if (!log?.method?.methodStages || log.currentStageOrder === undefined) {
      return undefined;
    }
    return log.method.methodStages.find(
      (stage) => stage.order === log.currentStageOrder
    );
  };

  // Check if current stage allows protocorm creation (isSampleGenerated = true)
  const canCreateProtocorm = (): boolean => {
    const currentMethodStage = getCurrentMethodStage();
    return currentMethodStage?.isSampleGenerated === true;
  };

  // Helper to get method name
  const methodName = log?.method?.name || log?.methodName || t("experimentLog.notAvailable");

  // Helper to get batch/tissue culture batch name
  const batchName = log?.batch?.batchName || log?.tissueCultureBatchName || t("experimentLog.notAvailable");

  // Helper to get lab room name
  const labRoomName = log?.batch?.labRoomName || labName;

  return (
    <main className="ml-64 mt-12 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Cancel Modal */}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="flex items-center gap-2 border cursor-pointer border-green-800 text-green-800 rounded-lg px-4 py-2 hover:bg-green-800 hover:text-white transition font-medium"
            onClick={() => void navigate("/technician/experiment-log")}
          >
            &larr; {t("experimentLog.backToList")}
          </button>
          <h1 className="text-2xl font-bold text-green-900">
            {t("experimentLog.detailTitle")}{" "}
            <span className="font-normal text-gray-700">- {log.name}</span>
          </h1>
          <div className="flex gap-3">
            {/* Start Button */}
            {normalizeStatus(log.status) === "Created" && (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minWidth: 120 }}
              >
                {isUpdatingStatus ? (t("common.processing") || "Đang xử lý...") : (t("common.start") || "Bắt đầu")}
              </button>
            )}
            {/* Create Protocorm Button with Popover - only enabled when current stage has isSampleGenerated = true */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProtocormPopoverOpen(!isProtocormPopoverOpen)}
                disabled={!canCreateProtocorm()}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm ${
                  canCreateProtocorm()
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                style={{ minWidth: 140 }}
                title={
                  canCreateProtocorm()
                    ? (t("experimentLog.createProtocorm") || "Tạo Protocorm")
                    : (t("experimentLog.protocormDisabledHint") || "Chỉ được tạo protocorm khi giai đoạn hiện tại cho phép")
                }
              >
                <FaSeedling />
                {t("experimentLog.createProtocorm") || "Tạo Protocorm"}
              </button>
              
              {/* Popover for creating protocorm */}
              {isProtocormPopoverOpen && (
                <>
                  {/* Invisible backdrop to close popover */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setIsProtocormPopoverOpen(false);
                      setProtocormQuantity("");
                    }} 
                  />
                  {/* Popover content */}
                  <div className="absolute right-0 top-full mt-2 z-50 w-90 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <FaSeedling className="text-emerald-600 text-sm" />
                        <span className="text-sm font-semibold text-gray-900">
                          {t("experimentLog.createProtocorm") || "Tạo Protocorm"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProtocormPopoverOpen(false);
                          setProtocormQuantity("");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="p-3 space-y-3">
                      {/* Info - compact */}
                      <div className="text-xs text-gray-600 flex justify-between">
                        <span>{t("experimentLog.expectedSampleCountLabel") || "Mong muốn"}: <b>{log.expectedSampleCount || 0}</b></span>
                        <span>{t("experimentLog.currentLabel") || "Hiện tại"}: <b>{samples.length}</b></span>
                      </div>
                      {/* Input */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={protocormQuantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^[1-9]\d*$/.test(value)) {
                              setProtocormQuantity(value);
                            }
                          }}
                          placeholder={t("experimentLog.quantity") || "Số lượng"}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => void handleCreateProtocorm()}
                          disabled={(parseInt(protocormQuantity, 10) || 0) <= 0 || isCreatingProtocorm}
                          className="px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isCreatingProtocorm ? (
                            <span className="text-xs">{t("common.processing") || "..."}</span>
                          ) : (
                            <>
                              <FaSeedling className="text-xs" />
                              <span>{t("common.create") || "Tạo"}</span>
                            </>
                          )}
                        </button>
                      </div>
                      {(parseInt(protocormQuantity, 10) || 0) > Math.max(0, (log.expectedSampleCount || 0) - samples.length) && 
                       (log.expectedSampleCount || 0) - samples.length > 0 && (
                        <p className="text-xs text-yellow-600">
                          {t("experimentLog.exceedsExpected") || "Vượt quá số còn lại"}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Cancel Button */}
            {normalizeStatus(log.status)  === "Created" && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-300 hover:bg-red-200 transition shadow-sm"
                style={{ minWidth: 120 }}
              >
                {t("common.cancel") || "Hủy thí nghiệm"}
              </button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <section className="w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
            <div className="flex-1 space-y-3">
              <div className="text-base">
                <b>{t("experimentLog.method")}:</b>{" "}
                <span className="text-green-700">{methodName}</span>
              </div>
              <div className="text-base">
                <b>{t("experimentLog.tissueCultureBatch")}:</b>{" "}
                {batchName}
              </div>
              <div className="text-base">
                <b>{t("experimentLog.labRoom")}:</b> {labRoomName}
              </div>
              <div className="text-base flex items-center gap-2">
                <b>{t("common.status")}:</b>{" "}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                  {getStatusDisplay(log.status)}
                </span>
              </div>
              <div className="text-base">
                <b>{t("experimentLog.expectedSampleCountLabel")}:</b> {log.expectedSampleCount}
              </div>
              <div className="text-base">
                <b>{t("experimentLog.dateCreated")}:</b>{" "}
                {formatDate(log.createdDate)}
              </div>
              <div className="text-base">
                <b>{t("experimentLog.creator")}:</b> {creator}
              </div>
              <div className="text-base flex items-center gap-2">
                <b>{t("experimentLog.currentStage") || "Giai đoạn hiện tại"}:</b>{" "}
                <span className="text-sky-700 font-semibold">
                  {currentStage}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {log.notes && (
                <div className="text-base">
                  <b>{t("common.description")}:</b> {log.notes}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 mt-2">
                <h3 className="font-semibold mb-2 text-green-800">
                  {t("experimentLog.selectedSeedlings")}
                </h3>
                {renderSelectedSeedlings()}
              </div>
            </div>
          </div>
        </section>

        {/* Chemicals and Materials for current stage - mapped from method.methodStages */}
        {(() => {
          const currentMethodStage = log.method?.methodStages?.find(
            (stage) => stage.order === log.currentStageOrder
          );
          const stageChemicals = currentMethodStage?.stageChemicals || [];
          const stageMaterials = currentMethodStage?.stageMaterials || [];
          
          // Group materials by category
          const materialsByCategory = stageMaterials.reduce((acc, sm) => {
            const category = sm.material?.category || (t("common.other") || "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sm.material);
            return acc;
          }, {} as Record<string, Material[]>);

          // Group chemicals by category
          const chemicalsByCategory = stageChemicals.reduce((acc, sc) => {
            const category = sc.chemical?.category || (t("common.other") || "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sc.chemical);
            return acc;
          }, {} as Record<string, Chemical[]>);

          if (stageChemicals.length === 0 && stageMaterials.length === 0) {
            return null;
          }

          return (
            <section className="w-full bg-white rounded-xl shadow-lg p-8">
              <h2 className="font-semibold text-lg mb-4 text-green-800">
                {t("experimentLog.chemicalsAndMaterials") || "Hóa chất và dụng cụ của giai đoạn hiện tại"}
                <span className="text-sm font-normal text-sky-600 ml-2">
                  ({currentMethodStage?.stageDefinition?.name || currentStage})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Chemicals section */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">🧪</span>
                    {t("experimentLog.chemicalsUsed") || "Hóa chất sử dụng"}
                    <span className="text-xs font-normal text-gray-500">({stageChemicals.length})</span>
                  </h3>
                  {stageChemicals.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">{t("experimentLog.noChemicals") || "Không có hóa chất"}</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(chemicalsByCategory).map(([category, chemicals]) => (
                        <div key={category}>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">{category}</p>
                          <ul className="space-y-1">
                            {chemicals.map((chem) => (
                              <li key={chem.id} className="text-sm text-gray-900 flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <div>
                                  <span className="font-medium">{chem.name}</span>
                                  {chem.concentrationUnit && (
                                    <span className="text-xs text-gray-500 ml-1">({chem.concentrationUnit})</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Materials/Equipment section */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">🔧</span>
                    {t("experimentLog.materialsUsed") || "Dụng cụ sử dụng"}
                    <span className="text-xs font-normal text-gray-500">({stageMaterials.length})</span>
                  </h3>
                  {stageMaterials.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">{t("experimentLog.noMaterials") || "Không có dụng cụ"}</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(materialsByCategory).map(([category, materials]) => (
                        <div key={category}>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">{category}</p>
                          <ul className="space-y-1">
                            {materials.map((mat) => (
                              <li key={mat.id} className="text-sm text-gray-900 flex items-start gap-2">
                                <span className="text-amber-500 mt-1">•</span>
                                <div>
                                  <span className="font-medium">{mat.name}</span>
                                  {mat.unit && (
                                    <span className="text-xs text-gray-500 ml-1">({mat.unit})</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* Stages Section - from method.methodStages */}
        {log.method?.methodStages && log.method.methodStages.length > 0 && (
          <section className="w-full bg-white rounded-xl shadow-lg p-8">
            <h2 className="font-semibold text-lg mb-4 text-green-800">
              {t("experimentLog.stages") || "Các giai đoạn"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {log.method.methodStages
                .sort((a, b) => a.order - b.order)
                .map((stage) => {
                  const isCurrentStage = stage.order === log.currentStageOrder;
                  return (
                    <div
                      key={stage.id}
                      className={`border rounded-lg p-4 shadow-sm ${
                        isCurrentStage
                          ? "bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 ring-2 ring-blue-400"
                          : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isCurrentStage
                              ? "bg-blue-600 text-white"
                              : "bg-green-600 text-white"
                          }`}
                        >
                          {stage.order}
                        </span>
                        <span className="font-medium text-gray-900">
                          {stage.stageDefinition?.name || t("experimentLog.notAvailable")}
                        </span>
                        {isCurrentStage && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            {t("experimentLog.currentStage") || "Hiện tại"}
                          </span>
                        )}
                      </div>
                      {stage.stageDefinition?.description && (
                        <p className="text-sm text-gray-600 mb-2">{stage.stageDefinition.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {stage.durationsDays && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {t("experimentLog.duration") || "Thời gian"}: {stage.durationsDays} {t("common.days") || "ngày"}
                          </span>
                        )}
                        {/* isSampleGenerated indicator */}
                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                          stage.isSampleGenerated 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          <FaSeedling className="text-[10px]" />
                          {stage.isSampleGenerated 
                            ? (t("experimentLog.canGenerateSample") || "Sinh chồi")
                            : (t("experimentLog.noSampleGeneration") || "Không sinh chồi")
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Sample list section */}
        <section className="w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="font-semibold text-lg mb-4 text-green-800">
            {t("experimentLog.sampleList") || "Danh sách mẫu vật"}
          </h2>
          {samples.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {t("experimentLog.noSamples") || "Chưa có mẫu vật nào"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="font-medium text-gray-900 mb-1">{sample.name}</div>
                  {sample.description && (
                    <div className="text-sm text-gray-600 mb-2">
                      {sample.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">ID: {sample.id}</div>
                  {sample.dob && (
                    <div className="text-xs text-gray-500">
                      {t("experimentLog.dateCreated") || "Ngày tạo"}: {formatDate(sample.dob)}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sample.status || sample.statusEnum)}`}>
                      {getStatusDisplay(sample.status || sample.statusEnum)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default TechnicianExperimentLogDetail;