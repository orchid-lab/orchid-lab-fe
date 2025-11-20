import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
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
type StatusType =
  | "Assigned"
  | "Taken"
  | "InProcess"
  | "DoneInTime"
  | "DoneInLate"
  | "Cancel";

const STATUS_LABELS: Record<StatusType, string> = {
  Assigned: "Đã giao",
  Taken: "Đã nhận",
  InProcess: "Đang thực hiện",
  DoneInTime: "Hoàn thành đúng hạn",
  DoneInLate: "Hoàn thành trễ hạn",
  Cancel: "Bị hủy",
};

// Helper function to convert status enum to Vietnamese
const statusEnumToVietnamese = (status: string): string => {
  const statusMap: Record<string, string> = {
    Process: "Đang xử lý",
    Suspended: "Tạm dừng",
    Destroyed: "Đã huỷ",
  };
  return statusMap[status] || status;
};

const AdminExperimentLogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState(1);
  const [labName, setLabName] = useState<string>("Đang tải...");
  const [creator, setCreator] = useState<string>("Đang tải...");
  const [stageTasks, setStageTasks] = useState<Record<string, Task[]>>({});
  const [stageReports, setStageReports] = useState<Record<string, Report[]>>(
    {}
  );

  useEffect(() => {
    if (!log?.stages || !id) return;
    log.stages.forEach((stage) => {
      const stageId = stage.id;
      // Task
      axiosInstance
        .get(
          `/api/tasks?pageNo=1&pageSize=1000&experimentlogId=${id}&stageId=${stageId}`
        )
        .then((res: { data: { value?: { data?: Task[] } } }) => {
          setStageTasks((prev) => ({
            ...prev,
            [stageId]: res.data.value?.data ?? [],
          }));
        })
        .catch((err: unknown) => {
          console.error("Error fetching tasks for stage", stageId, err);
          setStageTasks((prev) => ({
            ...prev,
            [stageId]: [],
          }));
        });
      // Report
      axiosInstance
        .get(
          `/api/report?pageNumber=1&pageSize=1000&experimentLogId=${id}&stageId=${stageId}`
        )
        .then((res: { data: { value?: { data?: Report[] } } }) => {
          setStageReports((prev) => ({
            ...prev,
            [stageId]: res.data.value?.data ?? [],
          }));
        })
        .catch((err: unknown) => {
          console.error("Error fetching reports for stage", stageId, err);
          setStageReports((prev) => ({
            ...prev,
            [stageId]: [],
          }));
        });
    });
  }, [log, id]);

  // Fetch experiment log detail
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`https://net-api.orchid-lab.systems/api/experimentlog/${id}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error("Lỗi khi lấy dữ liệu chi tiết nhật ký thí nghiệm");
        const data: unknown = await res.json();
        const logData = (data as { value?: unknown }).value ?? data;
        const anyLog = logData as Record<string, unknown>;
        const normalized: Partial<ExperimentLogDetailType> = {
          ...(anyLog as unknown as Partial<ExperimentLogDetailType>),
          createdDate:
            (anyLog.createdDate as string | undefined) ??
            (anyLog.create_date as string | undefined),
        };
        setLog(normalized as ExperimentLogDetailType);
      })
      .catch(() => setError("Không thể tải chi tiết nhật ký thí nghiệm."))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch samples when log is loaded
  useEffect(() => {
    if (!id || !log) return;

    setSamplesLoading(true);
    fetch(
      `https://net-api.orchid-lab.systems/api/sample?pageNo=1&pageSize=100&experimentLogId=${id}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu samples");
        const rawData: unknown = await res.json();
        let data: SamplesResponse;
        if (
          typeof rawData === "object" &&
          rawData !== null &&
          ("value" in rawData || "data" in rawData)
        ) {
          data = rawData as SamplesResponse;
        } else {
          throw new Error("Dữ liệu trả về không hợp lệ cho samples");
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

  // Fetch lab room name by tissueCultureBatchId (if available in value or normalized field)
  useEffect(() => {
    if (!log) return;
    const tcbId =
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchId as string) ??
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchID as string);
    if (tcbId) {
      fetch(
        `https://net-api.orchid-lab.systems/api/tissue-culture-batch/${tcbId}`
      )
        .then((r) => r.json())
        .then((raw: Record<string, unknown>) => {
          const name =
            ((raw?.value as Record<string, unknown>)?.labName as string) ??
            (raw?.labName as string);
          setLabName(name ?? "Không xác định");
        })
        .catch(() => setLabName("Không xác định"));
    }
  }, [log]);

  // Fetch creator by create_by
  useEffect(() => {
    if (log?.create_by) {
      fetch(`https://net-api.orchid-lab.systems/api/user/${log.create_by}`)
        .then((r) => r.json())
        .then((raw: Record<string, unknown>) => {
          const name =
            ((raw?.value as Record<string, unknown>)?.name as string) ??
            (raw?.name as string);
          setCreator(name ?? "Không xác định");
        })
        .catch(() => setCreator("Không xác định"));
    }
  }, [log]);

  if (loading)
    return (
      <div className="ml-64 mt-16 p-8 text-gray-500">Đang tải dữ liệu...</div>
    );
  if (error) return <div className="ml-64 mt-16 p-8 text-red-500">{error}</div>;
  if (!log)
    return (
      <div className="ml-64 mt-16 p-8">Không tìm thấy nhật ký thí nghiệm!</div>
    );

  const statusList = ["Process", "Suspended", "Destroyed"];
  const sampleStatusStats = samples.reduce((acc, sample) => {
    const status = sample.statusEnum ?? "Khác";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sampleChartData = {
    labels: statusList.map(statusEnumToVietnamese),
    datasets: [
      {
        data: statusList.map((status) => sampleStatusStats[status] || 0),
        backgroundColor: [
          "#facc15", // Đang xử lý
          "#64748b", // Tạm dừng
          "#ef4444", // Đã huỷ
        ],
        borderWidth: 1,
      },
    ],
  };

  const sampleChartOptions = {
    plugins: {
      legend: { display: true, position: "bottom" as const },
    },
  };

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

  // Render selected seedlings
  const renderSelectedSeedlings = () => {
    if (!Array.isArray(log.hybridizations) || log.hybridizations.length === 0) {
      return <div className="text-gray-500">Chưa chọn cây giống.</div>;
    }

    return (
      <div className="text-green-800 text-base space-y-1">
        {log.hybridizations.map((hybridization, index) => (
          <div key={index}>
            • {hybridization.seedling?.localName || "Chưa đặt tên"}
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

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Format status
  const getStatusDisplay = (status?: string) => {
    if (!status) return "Chưa xác định";

    const statusMap: Record<string, string> = {
      Process: "Đang xử lý",
      InProcess: "Đang xử lý",
      Completed: "Hoàn thành",
      Failed: "Thất bại",
      Pending: "Chờ xử lý",
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
        &larr; Trở về
      </button>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">
          Chi tiết nhật ký thí nghiệm - {log.name}
        </h1>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p>
              <b>Phương pháp:</b> {log.methodName}
            </p>
            <p>
              <b>Lô thí nghiệm:</b> {log.tissueCultureBatchName}
            </p>
            <p>
              <b>Phòng thí nghiệm:</b> {labName}
            </p>
            <p>
              <b>Trạng thái:</b> {getStatusDisplay(log.status)}
            </p>
            <p>
              <b>Số lượng mẫu:</b> {samples.length}
            </p>
            <p>
              <b>Ngày tạo:</b> {formatDate(log.createdDate)}
            </p>
            <p>
              <b>Người tạo:</b> {creator}
            </p>
            {log.description && (
              <p>
                <b>Mô tả:</b> {log.description}
              </p>
            )}
          </div>
        </div>

        {/* Cây giống đã chọn */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Cây giống đã chọn</h2>
          {renderSelectedSeedlings()}
        </div>

        {/* Timeline các giai đoạn */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Tiến trình các giai đoạn</h2>
          </div>

          <div className="flex flex-col gap-0 relative ml-6">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className="flex items-center mb-2 relative group cursor-pointer"
                onClick={() => setSelectedStage(idx + 1)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 ${
                    selectedStage > idx + 1
                      ? "bg-green-500 border-green-500"
                      : selectedStage === idx + 1
                      ? "bg-yellow-400 border-yellow-400"
                      : "bg-gray-200 border-gray-300"
                  }`}
                >
                  <span className="text-white font-bold text-xs">
                    {idx + 1}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className="absolute left-1/2 top-6 w-0.5 h-8 bg-gray-300 -translate-x-1/2 z-0"></div>
                )}
                <span
                  className={`ml-4 text-base ${
                    selectedStage === idx + 1
                      ? "font-bold text-green-700"
                      : "text-gray-700"
                  }`}
                >
                  {stage}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded border text-sm">
            <b>Chi tiết {stages[selectedStage - 1]}</b>
            <div className="mt-2 space-y-2">
              <p>
                <b>Mô tả:</b>{" "}
                {log.stages?.[selectedStage - 1]?.description ??
                  "Không có mô tả"}
              </p>
              <p>
                <b>Ngày xử lý:</b>{" "}
                {log.stages?.[selectedStage - 1]?.dateOfProcessing ??
                  "Chưa xác định"}{" "}
                ngày
              </p>
              {(() => {
                const stage = log.stages?.[selectedStage - 1];
                if (!stage?.elementDTO) return null;
                const elements = Array.isArray(stage.elementDTO)
                  ? stage.elementDTO
                  : [stage.elementDTO];
                if (elements.length === 0) return null;
                return (
                  <div>
                    <b>Nguyên vật liệu:</b>
                    <div className="ml-4 space-y-1">
                      {elements.map((el) => (
                        <div key={el.id}>
                          <p>- {el.name ?? "-"}</p>
                          {el.description && (
                            <p className="text-gray-600 text-sm">
                              {el.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Task Table */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">
                  Công việc (Task) của giai đoạn này
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 border">Tên công việc</th>
                        <th className="px-3 py-2 border">Ngày giao</th>
                        <th className="px-3 py-2 border">Ngày hoàn thành</th>
                        <th className="px-3 py-2 border">Trạng thái</th>
                        <th className="px-3 py-2 border">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const stageId = log.stages?.[selectedStage - 1]?.id;
                        const tasks: Task[] =
                          stageId && Array.isArray(stageTasks[stageId])
                            ? stageTasks[stageId]
                            : [];
                        return tasks.map((task) => (
                          <tr key={task.id}>
                            <td className="px-3 py-2 border">{task.name}</td>
                            <td className="px-3 py-2 border text-center">
                              {formatDate(task.start_date)}
                            </td>
                            <td className="px-3 py-2 border text-center">
                              {formatDate(task.end_date)}
                            </td>
                            <td className="px-3 py-2 border">
                              {STATUS_LABELS[task.status]}
                            </td>
                            <td className="px-3 py-2 border">
                              <button
                                type="button"
                                className="text-blue-600 underline cursor-pointer"
                                onClick={() =>
                                  void navigate(`/admin/tasks/${task.id}`)
                                }
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  {(() => {
                    const stageId = log.stages?.[selectedStage - 1]?.id;
                    const tasks: Task[] =
                      stageId && Array.isArray(stageTasks[stageId])
                        ? stageTasks[stageId]
                        : [];
                    const total = tasks.length;
                    const doneInTime = tasks.filter(
                      (t) => t.status === "DoneInTime"
                    ).length;
                    const doneInLate = tasks.filter(
                      (t) => t.status === "DoneInLate"
                    ).length;
                    const canceled = tasks.filter(
                      (t) => t.status === "Cancel"
                    ).length;

                    return (
                      <div className="mt-2">
                        <table className="w-full border text-center">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1">Thống kê</th>
                              <th className="border px-2 py-1">Tổng task</th>
                              <th className="border px-2 py-1">
                                Số task đã hoàn thành đúng hạn
                              </th>
                              <th className="border px-2 py-1">
                                Số task hoàn thành trễ hạn
                              </th>
                              <th className="border px-2 py-1">
                                Số task bị huỷ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border px-2 py-1 font-semibold">
                                Số lượng
                              </td>
                              <td className="border px-2 py-1">{total}</td>
                              <td className="border px-2 py-1">{doneInTime}</td>
                              <td className="border px-2 py-1">{doneInLate}</td>
                              <td className="border px-2 py-1">{canceled}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Report Table */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">
                  Báo cáo (Report) của giai đoạn này
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 border">Tên báo cáo</th>
                        <th className="px-3 py-2 border">Mô tả</th>
                        <th className="px-3 py-2 border">Sample</th>
                        <th className="px-3 py-2 border">Thuộc tính</th>
                        <th className="px-3 py-2 border">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const stageId = log.stages?.[selectedStage - 1]?.id;
                        const reports: Report[] =
                          stageId && Array.isArray(stageReports[stageId])
                            ? stageReports[stageId]
                            : [];
                        return reports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-3 py-2 border">{report.name}</td>
                            <td className="px-3 py-2 border">
                              {report.description}
                            </td>
                            <td className="px-3 py-2 border">
                              {report.sample}
                            </td>
                            <td className="px-3 py-2 border">
                              {report.reportAttributes?.map((a, idx) => (
                                <div key={idx}>
                                  {a.name}: {a.value} {a.measurementUnit}
                                </div>
                              ))}
                            </td>
                            <td className="px-3 py-2 border">
                              <button
                                type="button"
                                className="text-blue-600 underline"
                                onClick={() =>
                                  void navigate(`/admin/report/${report.id}`)
                                }
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart trạng thái mẫu cây */}
        <div className="bg-white rounded-lg shadow p-4 w-[340px] mx-auto mb-6">
          <h3 className="text-center text-green-700 font-semibold mb-2 text-sm">
            Biểu đồ trạng thái mẫu cây
          </h3>
          <Doughnut data={sampleChartData} options={sampleChartOptions} />
        </div>
        {/* Bảng sample */}
        <div>
          <h2 className="font-semibold mb-2">
            Danh sách mẫu cây
            {samplesLoading && (
              <span className="text-sm text-gray-500 ml-2">(Đang tải...)</span>
            )}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Tên mẫu</th>
                  <th className="px-3 py-2 border">Ngày sinh</th>
                  <th className="px-3 py-2 border">Trạng thái</th>
                  <th className="px-3 py-2 border">Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {samplesLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : samples.length > 0 ? (
                  samples.map((sample) => (
                    <tr key={sample.id}>
                      <td className="px-3 py-2 border">{sample.name}</td>
                      <td className="px-3 py-2 border text-center">
                        {formatDate(sample.dob)}
                      </td>
                      <td className="px-3 py-2 border text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            sample.statusEnum === "Process"
                              ? "bg-yellow-100 text-yellow-800"
                              : sample.statusEnum === "Completed"
                              ? "bg-green-100 text-green-800"
                              : sample.statusEnum === "Failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {getStatusDisplay(sample.statusEnum)}
                        </span>
                      </td>
                      <td className="px-3 py-2 border">
                        {sample.description ?? "Không có mô tả"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      Không có mẫu cây nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminExperimentLogDetail;
