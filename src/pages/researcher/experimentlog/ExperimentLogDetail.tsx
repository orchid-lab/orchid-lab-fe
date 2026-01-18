import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

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
  tissueCultureBatchId?: string;
  tissueCultureBatchName: string;
  currentStageName?: string;
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

// removed strict type guard; response shapes vary (value-wrapped or root)

const ExperimentLogDetail = () => {
  const [samples] = useState([
    {
      id: "SMP-001",
      name: "Lan hồ điệp #1",
      description: "Cây con khỏe mạnh",
      dob: "2025-12-01",
      statusEnum: "Process",
    },
    {
      id: "SMP-002",
      name: "Lan hồ điệp #2",
      description: "Có đốm nâu nhỏ",
      dob: "2025-12-02",
      statusEnum: "Process",
    },
  ]);
  // Add missing labName and creator state
  const [labName] = useState("Phòng Lab 01");
  const [creator] = useState("Nguyễn Văn A");
  // Add missing loading and error state
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>({
    id: "EXP-001",
    name: "Nuôi cấy lan hồ điệp - batch 1",
    methodName: "MS + NAA",
    description:
      "Theo dõi phát triển cây con trong môi trường MS, bổ sung NAA.",
    tissueCultureBatchName: "Batch Orchid 2026",
    createdDate: "2026-01-10T09:24:00Z",
    create_by: "u01",
    status: "Process",
    samples: [
      {
        id: "SMP-001",
        name: "Lan hồ điệp #1",
        description: "Cây con khỏe mạnh",
        dob: "2025-12-01",
        statusEnum: "Process",
      },
      {
        id: "SMP-002",
        name: "Lan hồ điệp #2",
        description: "Có đốm nâu nhỏ",
        dob: "2025-12-02",
        statusEnum: "Process",
      },
    ],
    stages: [
      {
        id: "STG-01",
        name: "Gieo hạt",
        description: "Giai đoạn gieo hạt",
        dateOfProcessing: "2025-12-01",
      },
      {
        id: "STG-02",
        name: "Cấy chuyển",
        description: "Cấy chuyển sang môi trường mới",
        dateOfProcessing: "2025-12-15",
      },
    ],
    hybridizations: [
      {
        seedling: {
          id: "S1",
          localName: "Lan hồ điệp vàng",
          scientificName: "Phalaenopsis amabilis",
        },
      },
      {
        seedling: {
          id: "S2",
          localName: "Lan hồ điệp tím",
          scientificName: "Phalaenopsis schilleriana",
        },
      },
    ],
  });
  // Fetch experiment log detail
  // useEffect(() => {
  //   if (!id) return;
  //   setLoading(true);
  //   setError(null);
  //   fetch(`https://net-api.orchid-lab.systems/api/experimentlog/${id}`)
  //     .then(async (res) => {
  //       if (!res.ok)
  //         throw new Error("Lỗi khi lấy dữ liệu chi tiết nhật ký thí nghiệm");
  //       const data: unknown = await res.json();
  //       const logData = (data as { value?: unknown }).value ?? data;
  //       const anyLog = logData as Record<string, unknown>;
  //       const normalized: Partial<ExperimentLogDetailType> = {
  //         ...(anyLog as unknown as Partial<ExperimentLogDetailType>),
  //         createdDate:
  //           (anyLog.createdDate as string | undefined) ??
  //           (anyLog.create_date as string | undefined),
  //         tissueCultureBatchId:
  //           (anyLog.tissueCultureBatchId as string | undefined) ??
  //           (anyLog as { tissueCultureBatchID?: string }).tissueCultureBatchID,
  //       };
  //       setLog(normalized as ExperimentLogDetailType);
  //     })
  //     .catch(() => setError("Không thể tải chi tiết nhật ký thí nghiệm."))
  //     .finally(() => setLoading(false));
  // }, [id, reloadLog]);

  // Fetch samples
  // useEffect(() => {
  //   if (!id || !log) return;

  //   setSamplesLoading(true);
  //   fetch(
  //     `https://net-api.orchid-lab.systems/api/sample?pageNo=1&pageSize=100&experimentLogId=${id}`,
  //   )
  //     .then(async (res) => {
  //       if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu samples");
  //       const raw: unknown = await res.json();

  //       const data = raw as SamplesResponse | Sample[];
  //       let samplesData: Sample[] = [];
  //       if ((data as SamplesResponse).value?.data) {
  //         samplesData = (data as SamplesResponse).value!.data!;
  //       } else if ((data as SamplesResponse).data) {
  //         samplesData = (data as SamplesResponse).data!;
  //       } else if (Array.isArray(data)) {
  //         samplesData = data;
  //       }

  //       setSamples(samplesData);
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching samples:", err);
  //       setSamples([]);
  //     })
  //     .finally(() => setSamplesLoading(false));
  // }, [id, log]);

  // Fetch labName từ tissueCultureBatchId
  // useEffect(() => {
  //   if (log?.tissueCultureBatchId) {
  //     fetch(
  //       `https://net-api.orchid-lab.systems/api/tissue-culture-batch/${log.tissueCultureBatchId}`,
  //     )
  //       .then(async (res) => {
  //         const raw: unknown = await res.json();
  //         const parsed = raw as
  //           | { value?: { labName?: string } }
  //           | { labName?: string };
  //         const name =
  //           (parsed as { value?: { labName?: string } }).value?.labName ??
  //           (parsed as { labName?: string }).labName;
  //         setLabName(name ?? "Không xác định");
  //       })
  //       .catch(() => setLabName("Không xác định"));
  //   }
  // }, [log]);

  // // Fetch user từ create_by
  // useEffect(() => {
  //   if (log?.create_by) {
  //     fetch(`https://net-api.orchid-lab.systems/api/user/${log.create_by}`)
  //       .then(async (res) => {
  //         const raw: unknown = await res.json();
  //         const parsed = raw as
  //           | { value?: { name?: string } }
  //           | { name?: string };
  //         const name =
  //           (parsed as { value?: { name?: string } }).value?.name ??
  //           (parsed as { name?: string }).name;
  //         setCreator(name ?? "Không xác định");
  //       })
  //       .catch(() => setCreator("Không xác định"));
  //   }
  // }, [log]);

  // const handleChangeStage = async () => {
  //   if (!log?.id) return;
  //   setLoadingStage(true);
  //   try {
  //     await axiosInstance.put("/api/experimentlog/stage-changer", {
  //       elid: log.id,
  //     });
  //     enqueueSnackbar("Chuyển giai đoạn thành công!", {
  //       variant: "success",
  //       autoHideDuration: 3000,
  //       preventDuplicate: true,
  //     });

  //     // Reload trang sau khi chuyển giai đoạn thành công
  //     window.location.reload();
  //   } catch (error) {
  //     console.log(error);
  //     const apiError = error as {
  //       response?: {
  //         data?: string;
  //         status?: number;
  //       };
  //       message?: string;
  //     };
  //     const backendMessage =
  //       apiError.response?.data ??
  //       apiError.message ??
  //       "Chuyển giai đoạn thất bại!";

  //     enqueueSnackbar(backendMessage, {
  //       variant: "error",
  //       autoHideDuration: 5000,
  //       preventDuplicate: true,
  //     });
  //   } finally {
  //     setLoadingStage(false);
  //   }
  // };

  // const handleExportPDF = async () => {
  //   if (!log?.id) return;
  //   setLoadingPDF(true);
  //   try {
  //     const res = await axiosInstance.get(`/api/report/export-pdf/${log.id}`, {
  //       responseType: "blob",
  //       validateStatus: () => true,
  //     });

  //     if (res.status !== 200) {
  //       const errorText = await (res.data as Blob).text();
  //       enqueueSnackbar(
  //         errorText || "Xuất PDF thất bại! Vui lòng thử lại sau.",
  //         { variant: "error", autoHideDuration: 3000, preventDuplicate: true },
  //       );
  //       return;
  //     }

  //     const url = window.URL.createObjectURL(new Blob([res.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", `experimentlog_${log.id}.pdf`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     enqueueSnackbar("Xuất PDF thành công!", {
  //       variant: "success",
  //       autoHideDuration: 3000,
  //       preventDuplicate: true,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     const apiError = error as {
  //       response?: {
  //         data?: string;
  //         status?: number;
  //       };
  //       message?: string;
  //     };
  //     const backendMessage =
  //       apiError.response?.data ?? apiError.message ?? "Xuất PDF thất bại!";

  //     enqueueSnackbar(backendMessage, {
  //       variant: "error",
  //       autoHideDuration: 5000,
  //       preventDuplicate: true,
  //     });
  //   } finally {
  //     setLoadingPDF(false);
  //   }
  // };

  // useEffect(() => {
  //   if (log?.currentStageName && log.stages && log.stages.length > 0) {
  //     const idx = log.stages.findIndex(
  //       (stage) => stage.name === log.currentStageName,
  //     );
  //     if (idx !== -1) {
  //       setSelectedStage(idx + 1);
  //     } else {
  //       setSelectedStage(1);
  //     }
  //   }
  // }, [log]);

  if (loading)
    return (
      <div className="ml-64 mt-16 p-8 text-gray-500">Đang tải dữ liệu...</div>
    );
  if (error) return <div className="ml-64 mt-16 p-8 text-red-500">{error}</div>;
  if (!log)
    return (
      <div className="ml-64 mt-16 p-8">Không tìm thấy nhật ký thí nghiệm!</div>
    );

  const stages =
    log.stages && log.stages.length > 0
      ? log.stages.map((s, idx) => s.name ?? `Giai đoạn ${idx + 1}`)
      : ["Giai đoạn 1", "Giai đoạn 2", "Giai đoạn 3"];

  const renderSelectedSeedlings = () => {
    if (!Array.isArray(log.hybridizations) || log.hybridizations.length === 0) {
      return (
        <div className="text-gray-500">{t("experimentLog.noSeedlings")}</div>
      );
    }

    return (
      <div className="text-green-800 text-base space-y-1">
        {log.hybridizations.map((hybridization, index) => (
          <div key={index}>
            •{" "}
            {hybridization.seedling?.localName ||
              t("experimentLog.notAvailable")}
            {hybridization.seedling?.scientificName && (
              <span className="text-gray-600">
                {" "}
                ({hybridization.seedling.scientificName})
              </span>
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

  // Current stage mock (for demo)
  const currentStage = "Sinh protocom";

  // Mock chemicals and equipment for the current stage
  const chemicals = [
    "NH4NO3",
    "CaCl2.2H2O",
    "MgSO4.7H2O",
    "KNO3",
    "KH2PO4",
    "H3BO3",
    "FeSO4.7H2O",
  ];
  const equipment = [
    "Máy cất nước",
    "Máy đo pH",
    "Máy khuấy từ",
    "Cân điện tử (Cân 2 số)",
    "Muỗng, vá, đũa thủy tinh",
    "Các dụng cụ như: cốc đong, ống đong, pipett, đĩa petri, chai thuỷ tinh, becher",
  ];

  return (
    <main className="ml-64 mt-12 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 hover:bg-green-800 hover:text-green-900 transition"
            onClick={() => void navigate("/admin/experiment-log")}
          >
            &larr;
          </button>
          <h1 className="text-2xl font-bold text-green-900">
            {t("experimentLog.detailTitle")}{" "}
            <span className="font-normal text-gray-700">- {log.name}</span>
          </h1>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-emerald-100 text-green-800 rounded-md text-sm font-medium border border-green-700 hover:bg-emerald-200 transition shadow-sm"
              style={{ minWidth: 120 }}
              onClick={() => {
                /* Export PDF logic here */
              }}
            >
              Export PDF
            </button>
            <button
              className="px-4 py-2 bg-emerald-100 text-green-800 rounded-md text-sm font-medium border border-green-700 hover:bg-emerald-200 transition shadow-sm"
              style={{ minWidth: 120 }}
              onClick={() => {
                /* Create Task logic here */
              }}
            >
              Tạo nhiệm vụ
            </button>
          </div>
        </div>

        {/* Info Card */}
        <section className="w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
            <div className="flex-1 space-y-3">
              <div className="text-base">
                <b>{t("experimentLog.method")}:</b>{" "}
                <span className="text-green-700">{log.methodName}</span>
              </div>
              <div className="text-base">
                <b>{t("experimentLog.tissueCultureBatch")}:</b>{" "}
                {log.tissueCultureBatchName}
              </div>
              <div className="text-base">
                <b>{t("experimentLog.labRoom")}:</b> {labName}
              </div>
              <div className="text-base">
                <b>{t("common.status")}:</b>{" "}
                <span className="px-2 py-1 rounded bg-green-50 text-green-700">
                  {getStatusDisplay(log.status)}
                </span>
              </div>
              <div className="text-base">
                <b>{t("experimentLog.sampleCountLabel")}:</b> {samples.length}
              </div>
              <div className="text-base">
                <b>Số lượng mẫu mong muốn:</b> 1
              </div>
              <div className="text-base">
                <b>{t("experimentLog.dateCreated")}:</b>{" "}
                {formatDate(log.createdDate)}
              </div>
              <div className="text-base">
                <b>{t("experimentLog.creator")}:</b> {creator}
              </div>
              <div className="text-base">
                <b>Giai đoạn hiện tại:</b>{" "}
                <span className="text-sky-700 font-semibold">
                  {currentStage}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {log.description && (
                <div className="text-base">
                  <b>{t("common.description")}:</b> {log.description}
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

        {/* Chemicals and Equipment for current stage */}
        <section className="w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="font-semibold text-lg mb-4 text-green-800">
            Hóa chất và dụng cụ của giai đoạn hiện tại
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">
                Hóa chất sử dụng
              </h3>
              <ul className="list-disc list-inside text-gray-900 space-y-1">
                {chemicals.map((chem, idx) => (
                  <li key={idx}>{chem}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">
                Dụng cụ sử dụng
              </h3>
              <ul className="list-disc list-inside text-gray-900 space-y-1">
                {equipment.map((eq, idx) => (
                  <li key={idx}>{eq}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Sample list section */}
        <section className="w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="font-semibold text-lg mb-4 text-green-800">
            Danh sách mẫu vật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-2"
              >
                <div className="font-medium text-gray-900">{sample.name}</div>
                <div className="text-sm text-gray-600">
                  {sample.description}
                </div>
                <div className="text-xs text-gray-500">ID: {sample.id}</div>
                <div className="text-xs text-gray-500">
                  Ngày tạo: {sample.dob}
                </div>
                <div className="text-xs text-green-700">
                  Trạng thái: {getStatusDisplay(sample.statusEnum)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add more sections as needed for reports/tasks/timeline */}
      </div>
    </main>
  );
};

export default ExperimentLogDetail;
