/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
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
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
import { FaTimes, FaSeedling } from "react-icons/fa";
import axiosInstance from "../../../api/axiosInstance";
import type { User } from "../../../types/Auth";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./technicianExperimentLogDetail.css";

Chart.register(ArcElement, Tooltip, Legend);
gsap.registerPlugin(ScrollTrigger);

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
      gsap.fromTo(modalRef.current,
        {
          scale: 0.8,
          opacity: 0,
          y: -20
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "back.out(1.5)"
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
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
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

  // Animation refs
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardRef = useRef<HTMLElement>(null);
  const materialsCardRef = useRef<HTMLElement>(null);
  const stagesCardRef = useRef<HTMLElement>(null);
  const samplesCardRef = useRef<HTMLElement>(null);

  const samples = log?.samples ?? [];

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
      // Refetch experiment log to get updated samples
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      const logData = res.data.value ?? res.data;
      const anyLog = logData as Record<string, unknown>;
      const normalized: Partial<ExperimentLogDetailType> = {
        ...(anyLog as unknown as Partial<ExperimentLogDetailType>),
        createdDate: (anyLog.createdDate as string | undefined) ?? (anyLog.create_date as string | undefined),
      };
      setLog(normalized as ExperimentLogDetailType);
      setIsProtocormPopoverOpen(false);
      setProtocormQuantity("");
    } catch {
      setError(t("common.errorLoading"));
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

  // GSAP Animations - Chạy sau khi component đã render và có data
  useLayoutEffect(() => {
    if (!log || loading) return;

    const ctx = gsap.context(() => {
      // Animation cho header - slide in from top
      gsap.from(headerRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
      });

      // Animation cho info card - fade in và scale up
      gsap.from(infoCardRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.out"
      });

      // Animation cho materials card - slide from left
      if (materialsCardRef.current) {
        gsap.from(materialsCardRef.current, {
          x: -50,
          opacity: 0,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out"
        });
      }

      // Animation cho stages card - slide from right
      if (stagesCardRef.current) {
        gsap.from(stagesCardRef.current, {
          x: 50,
          opacity: 0,
          duration: 0.6,
          delay: 0.4,
          ease: "power2.out"
        });

        // Animation cho từng stage card
        const stageCards = stagesCardRef.current.querySelectorAll('.stage-card');
        gsap.from(stageCards, {
          y: 30,
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.6,
          ease: "back.out(1.2)"
        });
      }

      // Animation cho samples card - fade in from bottom
      if (samplesCardRef.current) {
        gsap.from(samplesCardRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.6,
          delay: 0.5,
          ease: "power2.out"
        });

        // Animation cho từng sample card
        const sampleCards = samplesCardRef.current.querySelectorAll('.sample-card');
        if (sampleCards.length > 0) {
          gsap.from(sampleCards, {
            scale: 0.9,
            opacity: 0,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.7,
            ease: "back.out(1.5)"
          });
        }
      }

      // Hover animations cho cards
      const allCards = document.querySelectorAll('.stage-card, .sample-card');
      allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.3,
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
  if (error) return (
    <main id="technician-experimentlog-detail">
      <div className="error-state">{error}</div>
    </main>
  );
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
                        <span>{t("experimentLog.expectedSampleCountLabel") || "Mong muốn"}: <b>{log.expectedSampleCount ?? 0}</b></span>
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
          </div>
        </div>

        {/* Info Card */}
        <section ref={infoCardRef} className="info-card">
          <div className="info-grid">
            <div className="info-column">
              <div className="info-item">
                <span className="info-label">{t("experimentLog.method")}:</span>{" "}
                <span className="info-value">{methodName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("experimentLog.tissueCultureBatch")}:</span>{" "}
                {batchName}
              </div>
              <div className="info-item">
                <span className="info-label">{t("experimentLog.labRoom")}:</span> {labRoomName}
              </div>
              <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="info-label">{t("common.status")}:</span>{" "}
                <span className={getStatusColor(log.status)}>
                  {getStatusDisplay(log.status)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("experimentLog.expectedSampleCountLabel")}:</span> {log.expectedSampleCount}
              </div>
              <div className="info-item">
                <span className="info-label">{t("experimentLog.dateCreated")}:</span>{" "}
                {formatDate(log.createdDate)}
              </div>
              <div className="info-item">
                <span className="info-label">{t("experimentLog.creator")}:</span> {creator}
              </div>
              <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="info-label">{t("experimentLog.currentStage") || "Giai đoạn hiện tại"}:</span>{" "}
                <span className="current-stage">
                  {currentStage}
                </span>
              </div>
            </div>
            <div className="info-column">
              {log.notes && (
                <div className="info-item">
                  <span className="info-label">{t("common.description")}:</span> {log.notes}
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
          
          // Group materials by category
          const materialsByCategory = stageMaterials.reduce((acc, sm) => {
            const category = sm.material?.category ?? (t("common.other") ?? "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sm.material);
            return acc;
          }, {} as Record<string, Material[]>);

          // Group chemicals by category
          const chemicalsByCategory = stageChemicals.reduce((acc, sc) => {
            const category = sc.chemical?.category ?? (t("common.other") ?? "Khác");
            if (!acc[category]) acc[category] = [];
            acc[category].push(sc.chemical);
            return acc;
          }, {} as Record<string, Chemical[]>);

          if (stageChemicals.length === 0 && stageMaterials.length === 0) {
            return null;
          }

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Object.entries(chemicalsByCategory).map(([category, chemicals]) => (
                        <div key={category} className="material-category">
                          <p className="category-name">{category}</p>
                          <ul className="material-list">
                            {chemicals.map((chem) => (
                              <li key={chem.id} className="material-item">
                                <span className="material-bullet chemical">•</span>
                                <div>
                                  <span className="material-name">{chem.name}</span>
                                  {chem.concentrationUnit && (
                                    <span className="material-unit">({chem.concentrationUnit})</span>
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
                  <h3 className="material-section-title">
                    <span className="material-icon equipment-icon">🔧</span>
                    {t("experimentLog.materialsUsed") || "Dụng cụ sử dụng"}
                    <span className="material-count">({stageMaterials.length})</span>
                  </h3>
                  {stageMaterials.length === 0 ? (
                    <p className="no-materials">{t("experimentLog.noMaterials") || "Không có dụng cụ"}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Object.entries(materialsByCategory).map(([category, materials]) => (
                        <div key={category} className="material-category">
                          <p className="category-name">{category}</p>
                          <ul className="material-list">
                            {materials.map((mat) => (
                              <li key={mat.id} className="material-item">
                                <span className="material-bullet equipment">•</span>
                                <div>
                                  <span className="material-name">{mat.name}</span>
                                  {mat.unit && (
                                    <span className="material-unit">({mat.unit})</span>
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
          <section ref={stagesCardRef} className="stages-card">
            <h2 className="stages-title">
              {t("experimentLog.stages") || "Các giai đoạn"}
            </h2>
            <div className="stages-grid">
              {log.method.methodStages
                .sort((a, b) => a.order - b.order)
                .map((stage) => {
                  const isCurrentStage = stage.order === log.currentStageOrder;
                  return (
                    <div
                      key={stage.id}
                      className={`stage-card ${isCurrentStage ? 'current' : 'normal'}`}
                    >
                      <div className="stage-header">
                        <span className={`stage-number ${isCurrentStage ? 'current' : 'normal'}`}>
                          {stage.order}
                        </span>
                        <span className="stage-name">
                          {stage.stageDefinition?.name || t("experimentLog.notAvailable")}
                        </span>
                        {isCurrentStage && (
                          <span className="current-badge">
                            {t("experimentLog.currentStage") || "Hiện tại"}
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
                <div
                  key={sample.id}
                  className="sample-card"
                >
                  <div className="sample-name">{sample.name}</div>
                  {sample.description && (
                    <div className="sample-description">
                      {sample.description}
                    </div>
                  )}
                  <div className="sample-id">ID: {sample.id}</div>
                  {sample.dob && (
                    <div className="sample-date">
                      {t("experimentLog.dateCreated") || "Ngày tạo"}: {formatDate(sample.dob)}
                    </div>
                  )}
                  <div className="sample-status">
                    <span className={getStatusColor(sample.status ?? sample.statusEnum)}>
                      {getStatusDisplay(sample.status ?? sample.statusEnum)}
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