/* eslint-disable @typescript-eslint/no-misused-promises */
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
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
import { FaTimes, FaSeedling } from "react-icons/fa";
import { Check } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import type { AxiosError } from "axios";
import type { User } from "../../../types/Auth";
import type {
  ExperimentLogDetail,
  MethodStage,
  Material,
  Chemical,
} from "../../../types/ExperimentLog";

import { SampleStatus } from "../../../types/Sample";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./TechnicianExperimentLogDetail.css";
// API error response shape for extracting detailed messages
interface ApiErrorResponse {
  title?: string;
  detail?: string;
  status?: number;
}
  
Chart.register(ArcElement, Tooltip, Legend);
gsap.registerPlugin(ScrollTrigger);

// Status color mapping for samples - matching ListSample
const SAMPLE_STATUS_COLOR_MAP: Record<string, string> = {
  [SampleStatus.Created]: "bg-green-100 text-green-800",
  [SampleStatus.InProgressed]: "bg-yellow-100 text-yellow-800",
  [SampleStatus.Completed]: "bg-green-100 text-green-800",
  [SampleStatus.ExecutedBecauseOfDisease]: "bg-red-100 text-red-800",
  [SampleStatus.ConvertedToSeedling]: "bg-purple-100 text-purple-800",
};

// =============================================================================
// CHANGE STAGE SUCCESS MODAL COMPONENT
// =============================================================================
interface ChangeStageSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeStageSuccessModal: React.FC<ChangeStageSuccessModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        {
          opacity: 0,
          scale: 0.95
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="modal-container">
        <div ref={modalRef} className="modal-content modal-success">
          {/* Header */}
          <div className="modal-header modal-header-success">
            <h3 className="modal-title">
              ✓ {t("experimentLog.changeStageSuccess") || "Chuyển giai đoạn thành công"}
            </h3>
          </div>
          {/* Content */}
          <div className="modal-body modal-body-success">
            <p className="success-message">
              {t("experimentLog.waitingForApprovalDescription") || "Yêu cầu chuyển giai đoạn của bạn đã được gửi thành công. Vui lòng chờ duyệt từ quản lý."}
            </p>
          </div>
          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn-confirm modal-btn-success"
            >
              {t("common.close") || "Đóng"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

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
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && modalRef.current) {
      // Animation đơn giản - chỉ fade in
      gsap.fromTo(modalRef.current,
        {
          opacity: 0
        },
        {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out"
        }
      );
    }
  }, [isOpen]);

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
        className="modal-backdrop"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="modal-container">
        <div ref={modalRef} className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">
              {t("experimentLog.cancelExperiment") || "Hủy thí nghiệm"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
            >
              <FaTimes />
            </button>
          </div>
          {/* Content */}
          <div className="modal-body">
            <label className="modal-label">
              {t("experimentLog.cancelReason") || "Lý do hủy thí nghiệm"} <span className="modal-required">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("experimentLog.enterCancelReason") || "Nhập lý do hủy thí nghiệm..."}
              className="modal-textarea"
              rows={4}
            />
          </div>
          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn-cancel"
              disabled={isLoading}
            >
              {t("common.cancel") || "Hủy"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!reason.trim() || isLoading}
              className="modal-btn-confirm"
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
  const { enqueueSnackbar } = useSnackbar();
  const [log, setLog] = useState<ExperimentLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labName, setLabName] = useState<string>(t("experimentLog.loadingData"));
  const [creator, setCreator] = useState<string>(t("experimentLog.loadingData"));
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProtocormPopoverOpen, setIsProtocormPopoverOpen] = useState(false);
  const [isCreatingProtocorm, setIsCreatingProtocorm] = useState(false);
  const [protocormQuantity, setProtocormQuantity] = useState<string>("");
  const [isChangingStage, setIsChangingStage] = useState(false);
  // New state for completing experiment when at final stage
  const [isCompleting, setIsCompleting] = useState(false);
  const [isChangeStageSuccessModalOpen, setIsChangeStageSuccessModalOpen] = useState(false);

  // Animation refs
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardRef = useRef<HTMLElement>(null);
  const materialsCardRef = useRef<HTMLElement>(null);
  const stagesCardRef = useRef<HTMLElement>(null);
  const samplesCardRef = useRef<HTMLElement>(null);

  const samples = log?.samples ?? [];

  // Get translation for sample status
  const getStatusLabelForSample = (status?: string): string => {
    const statusMap: Record<string, string> = {
      [SampleStatus.Created]: t('sample.statusCreated'),
      [SampleStatus.InProgressed]: t('sample.statusInProgressed'),
      [SampleStatus.Completed]: t('sample.statusCompleted'),
      [SampleStatus.ExecutedBecauseOfDisease]: t('sample.statusExecutedBecauseOfDisease'),
      [SampleStatus.ConvertedToSeedling]: t('sample.statusConvertedToSeedling'),
    };
    return statusMap[status ?? ''] ?? status ?? t('common.none');
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    axiosInstance
      .get(`/api/experiment-logs/${id}`)
      .then((res) => {
        const logData = res.data.value ?? res.data;
        const anyLog = logData as Record<string, unknown>;
        const normalized: Partial<ExperimentLogDetail> = {
          ...(anyLog as unknown as Partial<ExperimentLogDetail>),
          createdDate: (anyLog.createdDate as string | undefined) ?? (anyLog.create_date as string | undefined),
        };
        setLog(normalized as ExperimentLogDetail);
      })
      .catch((e) => {
        const axiosError = e as AxiosError<ApiErrorResponse>;
        const apiDetail = axiosError.response?.data?.detail?.trim();
        const apiTitle = axiosError.response?.data?.title?.trim();
        const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
        enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
        setError(message);
      })
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
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
      setError(message);
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
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChangeStage = async () => {
    if (!id) return;
    setIsChangingStage(true);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, {
        status: "WaitingForChangeStage",
      });
      setLog((prev) => (prev ? { ...prev, status: "WaitingForChangeStage" } : prev));
      setIsChangeStageSuccessModalOpen(true);
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
      setError(message);
    } finally {
      setIsChangingStage(false);
    }
  };

  /**
   * Complete the experiment when the current stage is the final stage of the method.
   */
  const handleCompleteExperiment = async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, {
        status: "Completed",
      });
      // Update local log status to Completed
      setLog((prev) => (prev ? { ...prev, status: "Completed" } : prev));
      enqueueSnackbar(t("experimentLog.completed") || "Hoàn thành thí nghiệm", { variant: "success" });
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      enqueueSnackbar(message, {autoHideDuration: 1000, variant: "warning" });
      setError(message);
    } finally {
      setIsCompleting(false);
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
      // Refetch experiment log to get updated samples
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      const logData = res.data.value ?? res.data;
      const anyLog = logData as Record<string, unknown>;
      const normalized: Partial<ExperimentLogDetail> = {
        ...(anyLog as unknown as Partial<ExperimentLogDetail>),
        createdDate: (anyLog.createdDate as string | undefined) ?? (anyLog.create_date as string | undefined),
      };
      setLog(normalized as ExperimentLogDetail);
      setIsProtocormPopoverOpen(false);
      setProtocormQuantity("");
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
      setError(message);
    } finally {
      setIsCreatingProtocorm(false);
    }
  };

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
        .catch((e) => {
          const axiosError = e as AxiosError<ApiErrorResponse>;
          const apiDetail = axiosError.response?.data?.detail?.trim();
          const apiTitle = axiosError.response?.data?.title?.trim();
          const message = apiDetail ?? apiTitle ?? t("experimentLog.notAvailable");
          enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
          setLabName(message);
        });
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
        .catch((e) => {
          const axiosError = e as AxiosError<ApiErrorResponse>;
          const apiDetail = axiosError.response?.data?.detail?.trim();
          const apiTitle = axiosError.response?.data?.title?.trim();
          const message = apiDetail ?? apiTitle ?? t("experimentLog.notAvailable");
          enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
          setCreator(message);
        });
    }
  }, [log, t]);

  // GSAP Animations - Chạy sau khi component đã render và có data
  useLayoutEffect(() => {
    if (!log || loading) return;

    const ctx = gsap.context(() => {
      // Animation đơn giản chỉ fade in - KHÔNG dùng transform để tránh ẩn content
      gsap.from(headerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      });

      gsap.from(infoCardRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 0.1,
        ease: "power2.out"
      });

      // Materials card - chỉ fade in
      if (materialsCardRef.current) {
        gsap.from(materialsCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.2,
          ease: "power2.out"
        });
      }

      // Stages card - chỉ fade in
      if (stagesCardRef.current) {
        gsap.from(stagesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.3,
          ease: "power2.out"
        });
      }

      // Samples card - chỉ fade in
      if (samplesCardRef.current) {
        gsap.from(samplesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.4,
          ease: "power2.out"
        });
      }

      // Hover animations cho cards - nhẹ nhàng hơn
      const allCards = document.querySelectorAll('.stage-card, .sample-card');
      allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -3,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });
    });

    return () => ctx.revert(); // Cleanup animations
  }, [log, loading]);

  if (loading)
    return (
      <main id="technician-experimentlog-detail">
        <div className="loading-state">{t("experimentLog.loadingData")}</div>
      </main>
    );
  if (error) {
    // Error is already shown via snackbar; keep current page UI unchanged
    // No early return, just continue rendering the existing content
  }
  if (!log) return (
    <main id="technician-experimentlog-detail">
      <div className="no-data-state">{t("common.noData")}</div>
    </main>
  );

  const renderSelectedSeedlings = () => {
    // New API structure: seedling is a single object
    if (log.seedling) {
      return (
        <div className="seedling-content">
          <div>
            • {log.seedling.localName || t("experimentLog.notAvailable")}
            {log.seedling.scientificName && (
              <span style={{ color: '#6b7280' }}> ({log.seedling.scientificName})</span>
            )}
          </div>
          {log.seedling.parentALocalName && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '1rem' }}>
              {t("experimentLog.parent") || "Cây mẹ"}: {log.seedling.parentALocalName}
              {log.seedling.parentAScientificName && (
                <span> ({log.seedling.parentAScientificName})</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return <div style={{ color: '#6b7280' }}>{t("experimentLog.noSeedlings")}</div>;
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
    const normalized = normalizeStatus(status);
    let className = "status-badge ";
    switch (normalized) {
      case "Created":
        className += "created";
        break;
      case "WaitingForChangeStage":
        className += "waiting";
        break;
      case "InProgress":
        className += "in-progress";
        break;
      case "Completed":
        className += "completed";
        break;
      case "Destroyed":
        className += "destroyed";
        break;
      default:
        className += "created";
    }
    return className;
  };

  // Current stage from log data - get stage name by matching currentStageOrder with method.methodStages
  const getCurrentStageName = (): string => {
    if (!log?.method?.methodStages || log.currentStageOrder === undefined) {
      return t("experimentLog.notAvailable");
    }
    const currentMethodStage = log.method.methodStages.find(
      (stage) => stage.order === log.currentStageOrder
    );
    return currentMethodStage?.stageDefinition?.name ?? t("experimentLog.notAvailable");
  };
  const currentStage = getCurrentStageName();

  // Determine the order of the last stage in the method (if available)
  const lastStageOrder = (() => {
    if (!log?.method?.methodStages?.length) return undefined;
    return Math.max(...log.method.methodStages.map((s) => s.order));
  })();

  // Determine if the current stage is the final stage of the method
  const isLastStage =
    log?.currentStageOrder !== undefined &&
    lastStageOrder !== undefined &&
    log.currentStageOrder === lastStageOrder;

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
    // Only allow protocorm creation when:
    // 1. Current stage has isSampleGenerated = true
    // 2. No samples exist yet (samples.length === 0)
    return currentMethodStage?.isSampleGenerated === true && samples.length === 0;
  };

  // Helper to get method name
  const methodName = log?.method?.name ?? log?.methodName ?? t("experimentLog.notAvailable");

  // Helper to get batch/tissue culture batch name
  const batchName = log?.batch?.batchName ?? log?.tissueCultureBatchName ?? t("experimentLog.notAvailable");

  // Helper to get lab room name
  const labRoomName = log?.batch?.labRoomName ?? labName;

  return (
    <main id="technician-experimentlog-detail">
      {/* Cancel Modal */}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      {/* Change Stage Success Modal */}
      <ChangeStageSuccessModal
        isOpen={isChangeStageSuccessModalOpen}
        onClose={() => setIsChangeStageSuccessModalOpen(false)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div ref={headerRef} className="detail-header">
          <button
            type="button"
            className="back-button"
            onClick={() => void navigate("/technician/experiment-log")}
          >
            &larr; {t("experimentLog.backToList")}
          </button>
          <h1 className="detail-title">
            {t("experimentLog.detailTitle")}{" "}
            <span className="experiment-name">- {log.name}</span>
          </h1>
          <div className="action-buttons">
            {/* Start Button */}
            {normalizeStatus(log.status) === "Created" && (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={isUpdatingStatus}
                className="btn-start"
              >
                {isUpdatingStatus ? (t("common.processing") || "Đang xử lý...") : (t("common.start") || "Bắt đầu")}
              </button>
            )}
            {/* Create Protocorm Button with Popover - only enabled when current stage has isSampleGenerated = true */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsProtocormPopoverOpen(!isProtocormPopoverOpen)}
                disabled={!canCreateProtocorm()}
                className={`btn-protocorm ${canCreateProtocorm() ? 'enabled' : 'disabled'}`}
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
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => {
                      setIsProtocormPopoverOpen(false);
                      setProtocormQuantity("");
                    }} 
                  />
                  {/* Popover content */}
                  <div className="protocorm-popover">
                    {/* Header */}
                    <div className="protocorm-popover-header">
                      <div className="header-title">
                        <FaSeedling className="header-icon" />
                        <span className="header-text">
                          {t("experimentLog.createProtocorm") || "Tạo Protocorm"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProtocormPopoverOpen(false);
                          setProtocormQuantity("");
                        }}
                        className="protocorm-popover-close"
                      >
                        <FaTimes style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="protocorm-popover-content">
                      {/* Info - compact */}
                      <div className="protocorm-info">
                        <span>{t("experimentLog.expectedSampleCount") || "Mong muốn"}: <b>{log.expectedSampleCount ?? 0}</b></span>
                        <span>{t("experimentLog.currentLabel") || "Hiện tại"}: <b>{samples.length}</b></span>
                      </div>
                      {/* Input */}
                      <div className="protocorm-input-group">
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
                          className="protocorm-input"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => void handleCreateProtocorm()}
                          disabled={(parseInt(protocormQuantity, 10) || 0) <= 0 || isCreatingProtocorm}
                          className="protocorm-submit"
                        >
                          {isCreatingProtocorm ? (
                            <span style={{ fontSize: '0.75rem' }}>{t("common.processing") || "..."}</span>
                          ) : (
                            <>
                              <FaSeedling style={{ fontSize: '0.75rem' }} />
                              <span>{t("common.create") || "Tạo"}</span>
                            </>
                          )}
                        </button>
                      </div>
                      {(parseInt(protocormQuantity, 10) || 0) > Math.max(0, (log.expectedSampleCount ?? 0) - samples.length) && 
                       (log.expectedSampleCount ?? 0) - samples.length > 0 && (
                        <p className="protocorm-warning">
                          {t("experimentLog.exceedsExpected") || "Vượt quá số còn lại"}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Cancel Button */}
            {normalizeStatus(log.status) === "Created" && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="btn-cancel"
              >
                {t("common.cancel") || "Hủy thí nghiệm"}
              </button>
            )}
            {/* Change Stage / Complete Experiment Button */}
            {normalizeStatus(log.status) === "InProgress" && (
              isLastStage ? (
                <button
                  type="button"
                  onClick={() => void handleCompleteExperiment()}
                  disabled={isCompleting}
                  className="btn-change-stage"
                >
                  {isCompleting ? (t("common.processing") || "Đang xử lý...") : (t("experimentLog.completeExperiment") || "Hoàn thành thí nghiệm")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleChangeStage()}
                  disabled={isChangingStage}
                  className="btn-change-stage"
                >
                  {isChangingStage ? (t("experimentLog.changingStage") || "Đang thay đổi...") : (t("experimentLog.changeStage") || "Chuyển giai đoạn")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Info Card */}
        <section ref={infoCardRef} className="info-card">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">{t("experimentLog.method")}</div>
              <div className="info-value">{methodName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.tissueCultureBatch")}</div>
              <div className="info-value">{batchName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.labRoom")}</div>
              <div className="info-value">{labRoomName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("common.status")}</div>
              <div className={getStatusColor(log.status)}>
                {getStatusDisplay(log.status)}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.expectedSampleCount")}</div>
              <div className="info-value">{log.expectedSampleCount}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.dateCreated")}</div>
              <div className="info-value">{formatDate(log.createdDate)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.creator")}</div>
              <div className="info-value">{creator}</div>
            </div>
            <div className="info-item">
              <div className="info-label">{t("experimentLog.currentStage") || "Giai đoạn hiện tại"}</div>
              <div className="info-value">{currentStage}</div>
            </div>

            <div className="info-item md:col-span-2">
              {log.notes && (
                <div>
                  <div className="info-label">{t("common.description")}</div>
                  <div className="info-value">{log.notes}</div>
                </div>
              )}
              <div className="seedling-box">
                <h3 className="seedling-title">
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
          const stageChemicals = currentMethodStage?.stageChemicals ?? [];
          const stageMaterials = currentMethodStage?.stageMaterials ?? [];
          
          // Debug logging
          console.log('Current Stage Order:', log.currentStageOrder);
          console.log('Current Method Stage:', currentMethodStage);
          console.log('Stage Chemicals:', stageChemicals);
          console.log('Stage Materials:', stageMaterials);
          
          // Group chemicals by category
          const chemicalsByCategory = stageChemicals.reduce((acc, sc) => {
            const category = sc.chemical?.category ?? (t("common.other") ?? "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sc.chemical);
            return acc;
          }, {} as Record<string, Chemical[]>);

          const chemicalGroups = Object.entries(chemicalsByCategory);

          // Group materials by category
          const materialsByCategory = stageMaterials.reduce((acc, sm) => {
            const category = sm.material?.category ?? (t("common.other") ?? "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sm.material);
            return acc;
          }, {} as Record<string, Material[]>);

          const materialGroups = Object.entries(materialsByCategory);

          // LUÔN LUÔN hiển thị section này, kể cả khi trống
          return (
            <section ref={materialsCardRef} className="materials-card">
              <h2 className="materials-title">
                {t("experimentLog.chemicalsAndMaterials") || "Hóa chất và dụng cụ của giai đoạn hiện tại"}
                <span className="stage-indicator">
                  ({currentMethodStage?.stageDefinition?.name ?? currentStage})
                </span>
              </h2>
              <div className="materials-grid">
                {/* Chemicals section */}
                <div>
                  <h3 className="material-section-title">
                    <span className="material-icon chemical-icon">🧪</span>
                    {t("experimentLog.chemicalsUsed") || "Hóa chất sử dụng"}
                    <span className="material-count">({stageChemicals.length})</span>
                  </h3>
                  {stageChemicals.length === 0 ? (
                    <p className="no-materials">{t("experimentLog.noChemicals") || "Không có hóa chất"}</p>
                  ) : (
                    <div className="space-y-4">
                      {chemicalGroups.map(([category, chemicals], idx) => (
                        <div
                          key={category}
                          className={
                            "pb-4 " +
                            (idx < chemicalGroups.length - 1
                              ? "border-b border-gray-100" 
                              : "")
                          }
                        >
                          <p className="category-name">{category}</p>
                          <div className="space-y-2">
                            {chemicals.map((chem) => (
                              <div key={chem.id} className="flex items-start gap-2">
                                <span className="mt-1 text-[#2D5A27]">
                                  <Check className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{chem.name}</div>
                                  {chem.concentrationUnit && (
                                    <div className="text-xs text-gray-500">{chem.concentrationUnit}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Materials/Equipment section */}
                <div>
                  <h3 className="material-section-title">
                    <span className="material-icon equipment-icon">🔧</span>
                    {t("experimentLog.materialsUsed") || "Dụng cụ sử dụng"}
                    <span className="material-count">({stageMaterials.length})</span>
                  </h3>
                  {stageMaterials.length === 0 ? (
                    <p className="no-materials">{t("experimentLog.noMaterials") || "Không có dụng cụ"}</p>
                  ) : (
                    <div className="space-y-4">
                      {materialGroups.map(([category, materials], idx) => (
                        <div
                          key={category}
                          className={
                            "pb-4 " +
                            (idx < materialGroups.length - 1
                              ? "border-b border-gray-100" 
                              : "")
                          }
                        >
                          <p className="category-name">{category}</p>
                          <div className="space-y-2">
                            {materials.map((mat) => (
                              <div key={mat.id} className="flex items-start gap-2">
                                <span className="mt-1 text-[#2D5A27]">
                                  <Check className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{mat.name}</div>
                                  {mat.unit && (
                                    <div className="text-xs text-gray-500">{mat.unit}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
          <section ref={stagesCardRef} className="stages-card">
            <h2 className="stages-title">
              {t("experimentLog.stages") || "Các giai đoạn"}
            </h2>
            <div className="stages-grid">
              {log.method.methodStages
                .sort((a, b) => a.order - b.order)
                .map((stage) => {
                  const stageState =
                    stage.order < (log.currentStageOrder ?? 0)
                      ? 'completed'
                      : stage.order === log.currentStageOrder
                      ? 'current'
                      : 'future';

                  return (
                    <div
                      key={stage.id}
                      className={`stage-card ${stageState}`}
                    >
                      <div className="stage-header">
                        <span className={`stage-number ${stageState}`}>
                          {stageState === 'completed' ? '✓' : stage.order}
                        </span>
                        <span className="stage-name">
                          {stage.stageDefinition?.name || t("experimentLog.notAvailable")}
                        </span>
                        {stageState === 'current' && (
                          <span className="current-badge">
                            {t("experimentLog.currentStage") || "Giai đoạn hiện tại"}
                          </span>
                        )}
                      </div>
                      {stage.stageDefinition?.description && (
                        <p className="stage-description">{stage.stageDefinition.description}</p>
                      )}
                      <div className="stage-tags">
                        {stage.durationsDays && (
                          <span className="stage-tag">
                            {t("experimentLog.duration") || "Thời gian"}: {stage.durationsDays} {t("common.days") || "ngày"}
                          </span>
                        )}
                        {/* isSampleGenerated indicator */}
                        <span className={`stage-tag sample-generation ${stage.isSampleGenerated ? 'enabled' : 'disabled'}`}>
                          <FaSeedling style={{ fontSize: '10px' }} />
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
        <section ref={samplesCardRef} className="samples-card">
          <h2 className="samples-title">
            {t("experimentLog.sampleList") || "Danh sách mẫu vật"}
          </h2>
          {samples.length === 0 ? (
            <div className="samples-empty">
              {t("experimentLog.noSamples") || "Chưa có mẫu vật nào"}
            </div>
          ) : (
            <div className="samples-grid">
              {samples.map((sample) => (
                <Link
                  key={sample.id}
                  to={`/technician/samples/${sample.id}`}
                  state={{ from: 'experimentLogDetail', experimentLogId: id }}
                  className="sample-card"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="sample-name">{sample.name}</div>
                  <div className="sample-status">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${SAMPLE_STATUS_COLOR_MAP[sample.status ?? ''] || 'bg-gray-100 text-gray-800'}`}>
                      {getStatusLabelForSample(sample.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default TechnicianExperimentLogDetail;