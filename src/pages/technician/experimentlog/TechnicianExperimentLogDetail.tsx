/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";
import type { Report } from "../../../types/Report";
import axiosInstance from "../../../api/axiosInstance";

Chart.register(ArcElement, Tooltip, Legend);

interface Sample {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  statusEnum?: string;
}

interface ElementDTO {
  id: string;
  name: string;
  description?: string;
  status?: boolean;
  currentInStage?: number;
}

interface StageDTO {
  id: string;
  name: string;
  description?: string;
  dateOfProcessing?: number | string;
  elementDTO?: ElementDTO | ElementDTO[];
}

interface Hybridization {
  seedling: {
    id: string;
    localName: string;
    scientificName: string;
  };
}

interface ExperimentLogDetailType {
  id: string;
  name: string;
  methodName: string;
  description?: string;
  tissueCultureBatchName: string;
  createdDate?: string;
  create_date?: string;
  create_by?: string;
  status?: string;
  samples?: Sample[];
  stages?: StageDTO[];
  hybridizations?: Hybridization[];
}

interface SamplesResponse {
  value?: {
    data?: Sample[];
  };
  data?: Sample[];
}

interface Task {
  id: string;
  researcher: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  create_at: string;
  status: StatusType;
}

type StatusType = "Assigned" | "Taken" | "InProcess" | "DoneInTime" | "DoneInLate" | "Cancel";

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
  const [, setStageTasks] = useState<Record<string, Task[]>>({});
  const [, setStageReports] = useState<Record<string, Report[]>>({});



  useEffect(() => {
    if (!log?.stages || !id) return;
    log.stages.forEach((stage) => {
      const stageId = stage.id;
      
      axiosInstance
        .get(`/api/tasks?pageNo=1&pageSize=1000&experimentlogId=${id}&stageId=${stageId}`)
        .then((res: { data: { value?: { data?: Task[] } } }) => {
          setStageTasks((prev) => ({
            ...prev,
            [stageId]: res.data.value?.data ?? [],
          }));
        })
        .catch((err: unknown) => {
          console.error("Error fetching tasks for stage", stageId, err);
          setStageTasks((prev) => ({ ...prev, [stageId]: [] }));
        });

      axiosInstance
        .get(`/api/report?pageNumber=1&pageSize=1000&experimentLogId=${id}&stageId=${stageId}`)
        .then((res: { data: { value?: { data?: Report[] } } }) => {
          setStageReports((prev) => ({
            ...prev,
            [stageId]: res.data.value?.data ?? [],
          }));
        })
        .catch((err: unknown) => {
          console.error("Error fetching reports for stage", stageId, err);
          setStageReports((prev) => ({ ...prev, [stageId]: [] }));
        });
    });
  }, [log, id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    axiosInstance
      .get(`/api/experimentlog/${id}`)
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

  useEffect(() => {
    if (log?.create_by) {
      axiosInstance
        .get(`/api/user/${log.create_by}`)
        .then((res) => {
          const raw = res.data;
          const name = (raw?.value?.name as string) ?? (raw?.name as string);
          setCreator(name ?? t("experimentLog.notAvailable"));
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
    if (!Array.isArray(log.hybridizations) || log.hybridizations.length === 0) {
      return <div className="text-gray-500">{t("experimentLog.noSeedlings")}</div>;
    }

    return (
      <div className="text-green-800 text-base space-y-1">
        {log.hybridizations.map((hybridization, index) => (
          <div key={index}>
            • {hybridization.seedling?.localName || t("experimentLog.notAvailable")}
            {hybridization.seedling?.scientificName && (
              <span className="text-gray-600"> ({hybridization.seedling.scientificName})</span>
            )}
          </div>
        ))}
      </div>
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

  const getStatusDisplay = (status?: string) => {
    if (!status) return t("experimentLog.notAvailable");

    const statusMap: Record<string, string> = {
      Process: t("experimentLog.processing"),
      InProcess: t("experimentLog.processing"),
      Completed: t("experimentLog.completed"),
      Failed: t("status.cancelled"),
      Pending: t("status.pending"),
    };

    return statusMap[status] || status;
  };

  return (
    <main className="ml-64 mt-8 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate("/admin/experiment-log")}
      >
        &larr; {t("experimentLog.backToList")}
      </button>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">
          {t("experimentLog.detailTitle")} - {log.name}
        </h1>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p>
              <b>{t("experimentLog.method")}:</b> {log.methodName}
            </p>
            <p>
              <b>{t("experimentLog.tissueCultureBatch")}:</b> {log.tissueCultureBatchName}
            </p>
            <p>
              <b>{t("experimentLog.labRoom")}:</b> {labName}
            </p>
            <p>
              <b>{t("common.status")}:</b> {getStatusDisplay(log.status)}
            </p>
            <p>
              <b>{t("experimentLog.sampleCountLabel")}:</b> {samples.length}
            </p>
            <p>
              <b>{t("experimentLog.dateCreated")}:</b> {formatDate(log.createdDate)}
            </p>
            <p>
              <b>{t("experimentLog.creator")}:</b> {creator}
            </p>
            {log.description && (
              <p>
                <b>{t("common.description")}:</b> {log.description}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold mb-2">{t("experimentLog.selectedSeedlings")}</h2>
          {renderSelectedSeedlings()}
        </div>

        {/* Continue in next artifact due to length */}
      </div>
    </main>
  );
};

export default TechnicianExperimentLogDetail;