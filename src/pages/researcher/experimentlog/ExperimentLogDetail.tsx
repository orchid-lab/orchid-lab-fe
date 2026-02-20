/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import "./ExperimentLogDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import type { User } from "../../../types/Auth";
import { FaSeedling } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

Chart.register(ArcElement, Tooltip, Legend);
gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// TYPE DEFINITIONS
//  =============================================================================
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

const ExperimentLogDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labName, setLabName] = useState<string>(
    t("experimentLog.loadingData"),
  );
  const [creator, setCreator] = useState<string>(
    t("experimentLog.loadingData"),
  );
  // Animation refs for researcher detail
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardRef = useRef<HTMLElement>(null);
  const materialsCardRef = useRef<HTMLElement>(null);
  const stagesCardRef = useRef<HTMLElement>(null);
  const samplesCardRef = useRef<HTMLElement>(null);

  const [changingStage, setChangingStage] = useState(false);
  const [changeStageError, setChangeStageError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<number | string | undefined>(
    undefined,
  );

  const handleChangeStage = async () => {
    if (!id) return;
    setChangingStage(true);
    setChangeStageError(null);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, {
        status: "ConfirmChangeStage",
        batchId: batchId,
      });
      // Optionally, reload log data after successful change
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      const logData = res.data.value ?? res.data;
      setLog(logData as ExperimentLogDetailType);
    } catch (e) {
      console.error(e);
    } finally {
      setChangingStage(false);
    }
  };
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
          createdDate:
            (anyLog.createdDate as string | undefined) ??
            (anyLog.create_date as string | undefined),
        };
        setLog(normalized as ExperimentLogDetailType);
      })
      .catch(() => setError(t("common.errorLoading")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    if (!log) return;
    const tcbId =
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchId as string) ??
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchID as string);
    if (tcbId) {
      axiosInstance
        .get(`/api/tissue-culture-batch/${tcbId}`)
        .then((res) => {
          const raw = res.data;
          const name =
            (raw?.value?.labName as string) ?? (raw?.labName as string);
          setLabName(name ?? t("experimentLog.notAvailable"));
          // Lưu batchId để dùng cho chuyển giai đoạn
          const id = (raw?.value?.id ?? raw?.id ?? tcbId) as number | string;
          setBatchId(id);
        })
        .catch(() => {
          setLabName(t("experimentLog.notAvailable"));
          setBatchId(undefined);
        });
    } else {
      setBatchId(undefined);
    }
  }, [log, t]);

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

  useLayoutEffect(() => {
    if (!log || loading) return;

    const ctx = gsap.context(() => {
      // Animation đơn giản chỉ fade in - KHÔNG dùng transform để tránh ẩn content
      gsap.from(headerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.from(infoCardRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 0.1,
        ease: "power2.out",
      });

      // Materials card - chỉ fade in
      if (materialsCardRef.current) {
        gsap.from(materialsCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.2,
          ease: "power2.out",
        });
      }

      // Stages card - chỉ fade in
      if (stagesCardRef.current) {
        gsap.from(stagesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.3,
          ease: "power2.out",
        });
      }

      // Samples card - chỉ fade in
      if (samplesCardRef.current) {
        gsap.from(samplesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.4,
          ease: "power2.out",
        });
      }

      // Hover animations cho cards - nhẹ nhàng hơn
      const allCards = document.querySelectorAll(".stage-card, .sample-card");
      allCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            y: -3,
            duration: 0.2,
            ease: "power2.out",
          });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          });
        });
      });
    });

    return () => ctx.revert(); // Cleanup animations
  }, [log, loading]);

  if (loading)
    return (
      <main id="experimentlog-detail">
        <div className="loading-state">{t("experimentLog.loadingData")}</div>
      </main>
    );
  if (error)
    return (
      <main id="experimentlog-detail">
        <div className="error-state">{error}</div>
      </main>
    );
  if (!log)
    return (
      <main id="experimentlog-detail">
        <div className="no-data-state">{t("common.noData")}</div>
      </main>
    );

  // Hiển thị seedling (nếu có) hoặc hybridizations (nếu có)
  const renderSelectedSeedlings = () => {
    // New API structure: seedling is a single object
    if (log.seedling) {
      return (
        <div className="seedling-content">
          <div>
            • {log.seedling.localName || t("experimentLog.notAvailable")}
            {log.seedling.scientificName && (
              <span style={{ color: "#6b7280" }}>
                {" "}
                ({log.seedling.scientificName})
              </span>
            )}
          </div>
          {log.seedling.parentALocalName && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginLeft: "1rem",
              }}
            >
              {t("experimentLog.parent") || "Cây mẹ"}:{" "}
              {log.seedling.parentALocalName}
              {log.seedling.parentAScientificName && (
                <span> ({log.seedling.parentAScientificName})</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div style={{ color: "#6b7280" }}>{t("experimentLog.noSeedlings")}</div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("experimentLog.notAvailable");
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Status helpers (matching technician detail)
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

  // Lấy stage hiện tại từ log (dựa vào currentStageOrder và methodStages)
  const getCurrentStageName = (): string => {
    if (!log?.method?.methodStages || log.currentStageOrder === undefined) {
      return t("experimentLog.notAvailable");
    }
    const currentMethodStage = log.method.methodStages.find(
      (stage) => stage.order === log.currentStageOrder,
    );
    return (
      currentMethodStage?.stageDefinition?.name ??
      t("experimentLog.notAvailable")
    );
  };
  const currentStage = getCurrentStageName();

  // Lấy hóa chất và dụng cụ của giai đoạn hiện tại

  const methodName =
    log?.method?.name ?? log?.methodName ?? t("experimentLog.notAvailable");

  // Helper to get batch/tissue culture batch name
  const batchName =
    log?.batch?.batchName ??
    log?.tissueCultureBatchName ??
    t("experimentLog.notAvailable");

  // Helper to get lab room name
  const labRoomName = log?.batch?.labRoomName ?? labName;
  const currentMethodStage = log.method?.methodStages?.find(
    (stage) => stage.order === log.currentStageOrder,
  );
  const stageChemicals = currentMethodStage?.stageChemicals ?? [];
  const stageMaterials = currentMethodStage?.stageMaterials ?? [];
  // Group materials by category
  const materialsByCategory = stageMaterials.reduce(
    (acc, sm) => {
      const category = sm.material?.category ?? t("common.other") ?? "Khác";
      if (!acc[category]) acc[category] = [];
      acc[category].push(sm.material);
      return acc;
    },
    {} as Record<string, Material[]>,
  );
  // Group chemicals by category
  const chemicalsByCategory = stageChemicals.reduce(
    (acc, sc) => {
      const category = sc.chemical?.category ?? t("common.other") ?? "Khác";
      if (!acc[category]) acc[category] = [];
      acc[category].push(sc.chemical);
      return acc;
    },
    {} as Record<string, Chemical[]>,
  );

  return (
    <main id="experimentlog-detail">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="detail-header" ref={headerRef}>
          <button
            type="button"
            className="back-button"
            onClick={() => void navigate("/experiment-log")}
          >
            &larr;
          </button>
          <h1 className="detail-title">
            {t("experimentLog.detailTitle")}{" "}
            <span className="experiment-name">- {log.name}</span>
          </h1>
          <div className="action-buttons">
            <button
              type="button"
              className="btn-start"
              style={{ minWidth: 120 }}
              onClick={() => {
                /* Export PDF logic here */
              }}
            >
              Export PDF
            </button>
            <button
              type="button"
              className="btn-start"
              style={{ minWidth: 120 }}
              onClick={() => {
                /* Create Task logic here */
              }}
            >
              Tạo nhiệm vụ
            </button>
          </div>
        </div>
      </div>

      <section className="info-card" ref={infoCardRef}>
        <div className="info-grid">
          <div className="info-column">
            <div className="info-item">
              <span className="info-label">{t("experimentLog.method")}:</span>
              <span className="info-value">{methodName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                {t("experimentLog.tissueCultureBatch")}:
              </span>
              <span className="info-value">{batchName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t("experimentLog.labRoom")}:</span>
              <span className="info-value">{labRoomName}</span>
            </div>
            <div
              className="info-item"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span className="info-label">{t("common.status")}:</span>
              <span className={getStatusColor(log.status)}>
                {getStatusDisplay(log.status)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">
                {t("experimentLog.expectedSampleCountLabel")}:
              </span>
              <span className="info-value">{log.expectedSampleCount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                {t("experimentLog.dateCreated")}:
              </span>
              <span className="info-value">{formatDate(log.createdDate)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t("experimentLog.creator")}:</span>
              <span className="info-value">{creator}</span>
            </div>
            <div
              className="info-item"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span className="info-label">
                {t("experimentLog.currentStage") || "Giai đoạn hiện tại"}:
              </span>
              <span className="current-stage">{currentStage}</span>
              <button
                type="button"
                className="btn-start"
                style={{ minWidth: 120, marginLeft: 8 }}
                onClick={handleChangeStage}
                disabled={
                  changingStage || normalizeStatus(log.status) === "InProgress"
                }
              >
                {changingStage
                  ? t("experimentLog.changingStage") || "Đang chuyển..."
                  : "Chuyển giai đoạn"}
              </button>
              {changeStageError && (
                <div style={{ color: "red", marginLeft: 8, fontSize: "0.9em" }}>
                  {changeStageError}
                </div>
              )}
            </div>
          </div>
          <div className="info-column">
            {log.notes && (
              <div className="info-item">
                <span className="info-label">{t("common.description")}:</span>
                <span className="info-value">{log.notes}</span>
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
      <section className="materials-card" ref={materialsCardRef}>
        <h2 className="materials-title">
          {t("experimentLog.chemicalsAndMaterials") ||
            "Hóa chất và dụng cụ của giai đoạn hiện tại"}
          <span className="stage-indicator">
            ({currentMethodStage?.stageDefinition?.name ?? currentStage})
          </span>
        </h2>
        <div className="materials-grid">
          <div>
            <h3 className="material-section-title">
              <span className="material-icon chemical-icon">🧪</span>
              {t("experimentLog.chemicalsUsed") || "Hóa chất sử dụng"}
              <span className="material-count">({stageChemicals.length})</span>
            </h3>
            {stageChemicals.length === 0 ? (
              <p className="no-materials">
                {t("experimentLog.noChemicals") || "Không có hóa chất"}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {Object.entries(chemicalsByCategory).map(
                  ([category, chemicals]) => (
                    <div key={category} className="material-category">
                      <p className="category-name">{category}</p>
                      <ul className="material-list">
                        {chemicals.map((chem) => (
                          <li key={chem.id} className="material-item">
                            <span className="material-bullet chemical">•</span>
                            <div>
                              <span className="material-name">{chem.name}</span>
                              {chem.concentrationUnit && (
                                <span className="material-unit">
                                  ({chem.concentrationUnit})
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
          <div>
            <h3 className="material-section-title">
              <span className="material-icon equipment-icon">🔧</span>
              {t("experimentLog.materialsUsed") || "Dụng cụ sử dụng"}
              <span className="material-count">({stageMaterials.length})</span>
            </h3>
            {stageMaterials.length === 0 ? (
              <p className="no-materials">
                {t("experimentLog.noMaterials") || "Không có dụng cụ"}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {Object.entries(materialsByCategory).map(
                  ([category, materials]) => (
                    <div key={category} className="material-category">
                      <p className="category-name">{category}</p>
                      <ul className="material-list">
                        {materials.map((mat) => (
                          <li key={mat.id} className="material-item">
                            <span className="material-bullet equipment">•</span>
                            <div>
                              <span className="material-name">{mat.name}</span>
                              {mat.unit && (
                                <span className="material-unit">
                                  ({mat.unit})
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>
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
                    className={`stage-card ${isCurrentStage ? "current" : "normal"}`}
                  >
                    <div className="stage-header">
                      <span
                        className={`stage-number ${isCurrentStage ? "current" : "normal"}`}
                      >
                        {stage.order}
                      </span>
                      <span className="stage-name">
                        {stage.stageDefinition?.name ||
                          t("experimentLog.notAvailable")}
                      </span>
                      {isCurrentStage && (
                        <span className="current-badge">
                          {t("experimentLog.currentStage") || "Hiện tại"}
                        </span>
                      )}
                    </div>
                    {stage.stageDefinition?.description && (
                      <p className="stage-description">
                        {stage.stageDefinition.description}
                      </p>
                    )}
                    <div className="stage-tags">
                      {stage.durationsDays && (
                        <span className="stage-tag">
                          {t("experimentLog.duration") || "Thời gian"}:{" "}
                          {stage.durationsDays} {t("common.days") || "ngày"}
                        </span>
                      )}
                      {/* isSampleGenerated indicator */}
                      <span
                        className={`stage-tag sample-generation ${stage.isSampleGenerated ? "enabled" : "disabled"}`}
                      >
                        <FaSeedling style={{ fontSize: "10px" }} />
                        {stage.isSampleGenerated
                          ? t("experimentLog.canGenerateSample") || "Sinh chồi"
                          : t("experimentLog.noSampleGeneration") ||
                            "Không sinh chồi"}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

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
              <div key={sample.id} className="sample-card">
                <div className="sample-name">{sample.name}</div>
                {sample.description && (
                  <div className="sample-description">{sample.description}</div>
                )}
                <div className="sample-id">ID: {sample.id}</div>
                {sample.dob && (
                  <div className="sample-date">
                    {t("experimentLog.dateCreated") || "Ngày tạo"}:{" "}
                    {formatDate(sample.dob)}
                  </div>
                )}
                <div className="sample-status">
                  <span
                    className={getStatusColor(
                      sample.status ?? sample.statusEnum,
                    )}
                  >
                    {getStatusDisplay(sample.status ?? sample.statusEnum)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
export default ExperimentLogDetail;
