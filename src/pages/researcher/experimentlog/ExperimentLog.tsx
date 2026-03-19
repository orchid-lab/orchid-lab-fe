/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";

type ExperimentStatus = "Created" | "Waiting" | "InProcess" | "Done" | "Cancel";

interface Stage {
  id: string;
  name: string;
  description?: string;
  dateOfProcessing?: number;
  step: number;
  status: boolean;
  elementDTO?: unknown[];
}

interface Sample {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  status?: boolean;
}

interface ExperimentLogEntry {
  id: string;
  name: string;
  methodName: string;
  description?: string;
  tissueCultureBatchName: string;
  createdDate?: string;
  status?: number | string;
  samples?: Sample[];
  stages?: Stage[];
  currentStageName?: string;
}

interface ExperimentLogApiResponse {
  value: ExperimentLogEntry[];
  totalCount?: number;
}

interface MethodOption {
  id: string;
  name: string;
}

const ExperimentLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">(
    "all",
  );
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [methodSearchTerm, setMethodSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<
    "all" | "Giai đoạn 1" | "Giai đoạn 2" | "Giai đoạn 3" | "Giai đoạn 4"
  >("all");
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    Created: number;
    Waiting: number;
    InProcess: number;
    Done: number;
    Cancel: number;
  }>({
    total: 0,
    Created: 0,
    Waiting: 0,
    InProcess: 0,
    Done: 0,
    Cancel: 0,
  });

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  // chuẩn hóa status từ API sang frontend
  function normalizeStatus(status?: number | string): ExperimentStatus | string {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "Created":
        return "Created";
      case "WaitingForChangeStage":
        return "Waiting";
      case "Completed":
        return "Done";
      case "InProgress":
        return "InProcess";
      case "Cancelled":
        return "Cancel";
      case "Destroyed":
        return "Cancel";
      default:
        return statusStr;
    }
  }

  // Derived metrics for Researcher dashboard
  const activeExperiments = stats.Created + stats.Waiting + stats.InProcess;
  const completedOrFailed = stats.Done + stats.Cancel;
  const successRate =
    completedOrFailed > 0 ? Math.round((stats.Done / completedOrFailed) * 100) : 0;
  const bottlenecksCount = stats.Waiting;

  const approachingDeadlineLogs = logs.filter((log) => {
    const now = Date.now();
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    return Boolean(
      log.stages?.some((stage) => {
        if (!stage.dateOfProcessing) return false;
        let ts = stage.dateOfProcessing;
        if (ts < 1e12) ts = ts * 1000;
        return ts >= now && ts <= in7Days;
      }),
    );
  });
  const approachingDeadlineCount = approachingDeadlineLogs.length;

  const priorityLogs = logs
    .filter((log) => normalizeStatus(log.status) === "Waiting")
    .slice(0, 5);

  // dịch status sang tiếng Việt
  const statusToVietnamese = (status?: number | string) => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "Mới tạo";
      case "Waiting":
        return "Chờ thay đổi giai đoạn";
      case "InProcess":
        return "Đang trong quá trình thực hiện";
      case "Done":
        return "Hoàn thành";
      case "Cancel":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Fetch sample count
  const fetchSampleCount = async (experimentLogId: string): Promise<number> => {
    try {
      const resp = await axiosInstance.get("/api/samples", {
        params: { pageNo: 1, pageSize: 1000, experimentLogId },
      });
      const data: unknown = resp.data;

      if (typeof data === "object" && data !== null && "value" in data) {
        const value = (data as { value?: unknown }).value;
        if (Array.isArray(value)) {
          return value.length;
        }
        if (
          value &&
          typeof value === "object" &&
          "data" in (value as { data?: unknown[] })
        ) {
          const inner = (value as { data?: unknown[] }).data;
          return Array.isArray(inner) ? inner.length : 0;
        }
      }
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

  const fetchAllSampleCounts = useCallback(
    async (experimentLogs: ExperimentLogEntry[]) => {
      const counts: Record<string, number> = {};
      const promises = experimentLogs.map(async (log) => {
        const count = await fetchSampleCount(log.id);
        counts[log.id] = count;
      });
      await Promise.all(promises);
      setSampleCounts(counts);
    },
    [],
  );

  function hasValueWithData<T>(
    obj: unknown,
    itemGuard: (item: unknown) => item is T,
  ): obj is { value: { data: T[] } } {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "value" in obj &&
      typeof (obj as { value: unknown }).value === "object" &&
      (obj as { value: { data?: unknown[] } }).value !== null &&
      "data" in (obj as { value: { data?: unknown[] } }).value &&
      Array.isArray((obj as { value: { data?: unknown[] } }).value.data) &&
      (obj as { value: { data: unknown[] } }).value.data.every(itemGuard)
    );
  }

  function isExperimentLogEntry(obj: unknown): obj is ExperimentLogEntry {
    if (typeof obj !== "object" || obj === null) return false;
    const o = obj as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.methodName === "string" &&
      (typeof o.tissueCultureBatchName === "string" ||
        typeof (o as any).batcheName === "string" ||
        typeof (o as any).batchName === "string")
    );
  }

  // Normalize different backend shapes into ExperimentLogEntry
  function normalizeRawLog(obj: any): ExperimentLogEntry | null {
    if (!obj?.id || !obj.name) return null;
    const tissueCultureBatchName =
      obj.tissueCultureBatchName ?? obj.batcheName ?? obj.batchName ?? "";
    return {
      id: String(obj.id),
      name: String(obj.name),
      methodName: obj.methodName ?? obj.method ?? "",
      description: obj.description ?? "",
      tissueCultureBatchName,
      createdDate: obj.createdDate ?? obj.createdDateString ?? "",
      status: obj.status,
      samples: obj.samples,
      stages: obj.stages,
      currentStageName: obj.currentStageName ?? obj.currentStageName ?? "",
    };
  }

  // Fetch methods (supports search via API params)
  useEffect(() => {
    const controller = new AbortController();
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get("/api/methods", {
          params: {
            PageNumber: 1,
            PageSize: 100,
            SearchTerm: methodSearchTerm || undefined,
          },
          signal: controller.signal,
        });
        const raw = res.data as {
          value?: { data?: { id: string; name: string }[] };
        };
        const arr = Array.isArray(raw?.value?.data) ? raw.value.data : [];
        setMethods(arr.map((m) => ({ id: m.id, name: m.name })));
      } catch (err) {
        // ignore aborted requests
        if ((err as any)?.name === "CanceledError") return;
        setMethods([]);
      }
    };

    const timer = window.setTimeout(() => {
      void fetchMethods();
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [methodSearchTerm]);

  // Fetch thống kê nhanh
  const fetchStatsOnly = useCallback(async () => {
    try {
      // Fetch tất cả dữ liệu để đếm thống kê (use axiosInstance)
      let data: unknown;
      try {
        const res = await axiosInstance.get("/api/experiment-logs", {
          params: { pageNo: 1, pageSize: 1000 },
        });
        data = res.data;
      } catch (err) {
        const apiErr = err as any;
        const detail =
          apiErr?.response?.data?.detail ?? apiErr?.response?.data?.message;
        if (typeof detail === "string" && detail.includes("OFFSET")) {
          // Retry without params
          const retryRes = await axiosInstance.get("/api/experiment-logs");
          data = retryRes.data;
        } else {
          throw new Error("Lỗi khi lấy thống kê");
        }
      }

      let allLogs: ExperimentLogEntry[] = [];
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in (data as Record<string, unknown>) &&
        Array.isArray((data as any).data)
      ) {
        allLogs = (data as any).data
          .map(normalizeRawLog)
          .filter((x: any): x is ExperimentLogEntry => x !== null);
      } else if (
        hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)
      ) {
        allLogs = (data.value.data ?? [])
          .map(normalizeRawLog)
          .filter((x: any): x is ExperimentLogEntry => x !== null);
      } else if (typeof data === "object" && data !== null && "value" in data) {
        allLogs = ((data as ExperimentLogApiResponse).value ?? [])
          .map(normalizeRawLog)
          .filter((x): x is ExperimentLogEntry => x !== null);
      } else if (Array.isArray(data)) {
        allLogs = data
          .map(normalizeRawLog)
          .filter((x): x is ExperimentLogEntry => x !== null);
      }

      // Đếm theo status
      const counts = {
        Created: 0,
        Waiting: 0,
        InProcess: 0,
        Done: 0,
        Cancel: 0,
      };

      allLogs.forEach((log) => {
        const status = normalizeStatus(log.status);
        switch (status) {
          case "Created":
            counts.Created++;
            break;
          case "Waiting":
            counts.Waiting++;
            break;
          case "InProcess":
            counts.InProcess++;
            break;
          case "Done":
            counts.Done++;
            break;
          case "Cancel":
            counts.Cancel++;
            break;
        }
      });

      const total =
        counts.Created + counts.InProcess + counts.Done + counts.Cancel;

      setStats({
        total,
        Created: counts.Created,
        Waiting: counts.Waiting,
        InProcess: counts.InProcess,
        Done: counts.Done,
        Cancel: counts.Cancel,
      });
    } catch (err) {
      console.error("Không thể lấy thống kê:", err);
      setStats({
        total: 0,
        Created: 0,
        Waiting: 0,
        InProcess: 0,
        Done: 0,
        Cancel: 0,
      });
    }
  }, []);

  // Fetch dữ liệu phân trang
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("pageNo", String(currentPage));
      params.append("pageSize", String(logsPerPage));
      if (methodFilter) {
        params.append("filter", methodFilter);
      }

      try {
        // Use axiosInstance to fetch paged experiment logs
        const paramsObj: Record<string, unknown> = {
          pageNo: currentPage,
          pageSize: logsPerPage,
        };
        if (methodFilter) paramsObj.filter = methodFilter;

        let data: unknown;
        try {
          const res = await axiosInstance.get("/api/experiment-logs", {
            params: paramsObj,
          });
          data = res.data;
        } catch (err) {
          const apiErr = err as any;
          const detail =
            apiErr?.response?.data?.detail ?? apiErr?.response?.data?.message;
          if (typeof detail === "string" && detail.includes("OFFSET")) {
            const retryRes = await axiosInstance.get("/api/experiment-logs");
            data = retryRes.data;
          } else {
            throw new Error("Lỗi khi lấy dữ liệu");
          }
        }
        let arr: ExperimentLogEntry[] = [];
        let total = 0;

        if (
          typeof data === "object" &&
          data !== null &&
          "data" in (data as Record<string, unknown>) &&
          Array.isArray((data as any).data)
        ) {
          arr = (data as any).data
            .map(normalizeRawLog)
            .filter((x: any): x is ExperimentLogEntry => x !== null);
          total = Number((data as any).totalCount ?? arr.length);
        } else if (
          hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)
        ) {
          arr = (data.value.data ?? [])
            .map(normalizeRawLog)
            .filter((x): x is ExperimentLogEntry => x !== null);
          total = Number(
            (data as { value: { totalCount?: unknown } })?.value?.totalCount ??
              arr.length,
          );
        } else if (
          typeof data === "object" &&
          data !== null &&
          "value" in data
        ) {
          arr = ((data as ExperimentLogApiResponse).value ?? [])
            .map(normalizeRawLog)
            .filter((x): x is ExperimentLogEntry => x !== null);
          total = (data as ExperimentLogApiResponse).totalCount ?? arr.length;
        } else if (Array.isArray(data)) {
          arr = data
            .map(normalizeRawLog)
            .filter((x): x is ExperimentLogEntry => x !== null);
          total = arr.length;
        }

        arr = arr.map((log) => ({
          ...log,
          status: normalizeStatus(log.status),
        }));

        setLogs(arr);
        setTotalCount(total);

        if (arr.length > 0) {
          await fetchAllSampleCounts(arr);
        }
      } catch {
        setError("Không thể tải dữ liệu.");
        setLogs([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    void fetchStatsOnly();
  }, [
    currentPage,
    logsPerPage,
    methodFilter,
    fetchAllSampleCounts,
    fetchStatsOnly,
  ]);

  const getStatusColor = (status?: number | string): string => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "bg-[#E6F1FF] text-[#005792]";
      case "Waiting":
        return "bg-[#FFF2F0] text-[#D1433C]";
      case "InProcess":
        return "bg-[#E0F7FA] text-[#006D73]";
      case "Done":
        return "bg-[#E0F7FA] text-[#006D73]";
      case "Cancel":
        return "bg-[#FFECEA] text-[#D1433C]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusDistribution = [
    { label: "Mới tạo", value: stats.Created, color: "#005792" },
    { label: "Chờ", value: stats.Waiting, color: "#FF6F61" },
    { label: "Đang thực hiện", value: stats.InProcess, color: "#00CED1" },
    { label: "Hoàn thành", value: stats.Done, color: "#00CED1" },
    { label: "Đã hủy", value: stats.Cancel, color: "#FF6F61" },
  ];

  const totalDistribution = statusDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;

  let cumulativeOffset = 0;
  const donutSlices = statusDistribution
    .filter((item) => item.value > 0)
    .map((item) => {
      const dash =
        totalDistribution > 0
          ? (item.value / totalDistribution) * donutCircumference
          : 0;
      const slice = {
        ...item,
        dash,
        offset: cumulativeOffset,
      };
      cumulativeOffset += dash;
      return slice;
    });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tissueCultureBatchName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || normalizeStatus(log.status) === statusFilter;

    let matchesStage = true;
    if (
      stageFilter !== "all" &&
      log.stages &&
      log.stages.length > 0 &&
      log.currentStageName
    ) {
      const stageNumber = parseInt(stageFilter.split(" ")[2]);
      if (stageNumber >= 1 && stageNumber <= log.stages.length) {
        const stageIndex = stageNumber - 1;
        const targetStageName = log.stages[stageIndex].name;
        matchesStage = log.currentStageName === targetStageName;
      } else {
        matchesStage = false;
      }
    }

    return matchesSearch && matchesStatus && matchesStage;
  });

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
        .animate-slide-in-left { animation: slideInLeft 0.5s ease-out forwards; }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        .hover-lift { transition: all 0.28s cubic-bezier(0.4,0,0.2,1); }
        .hover-lift:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 12px 24px -6px rgba(0,0,0,0.15); }
        .row-hover { transition: all 0.2s ease; }
        .row-hover:hover { transform: scale(1.01); box-shadow: 0 4px 12px rgba(34,197,94,0.12); }
      `}</style>

      <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
              Quản lý &amp; Theo dõi Thí nghiệm Orchid Lab
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Bảng điều khiển nghiên cứu viên: theo dõi trạng thái, tiến độ và điểm nghẽn.
            </p>
          </div>
          <Link
            to="/researcher/experiment-log/create"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#005792] text-white font-semibold shadow-sm hover:bg-[#00456a] transition"
          >
            <Plus className="w-4 h-4" />
            Tạo nhật ký
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm animate-scale-in hover-lift">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Thí nghiệm hoạt động
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#005792]">
              {activeExperiments}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Tổng số thí nghiệm đang chạy &amp; chờ xử lý.
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm animate-scale-in hover-lift">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tỷ lệ thành công
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#00CED1]">
                {successRate}%
              </span>
              <span className="text-xs text-slate-500">
                ({completedOrFailed} thí nghiệm đã kết thúc)
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Dựa trên kết quả hoàn thành/hủy.
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm animate-scale-in hover-lift">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Điểm nghẽn / Chờ review
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#D1433C]">
              {bottlenecksCount}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Số thí nghiệm cần xác nhận hoặc thay đổi giai đoạn.
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm animate-scale-in hover-lift">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Dự kiến hoàn thành
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#005792]">
              {approachingDeadlineCount}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Thí nghiệm có mốc quan trọng trong 7 ngày tới.
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">
                  Phân bổ trạng thái thí nghiệm
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quan sát nhanh tỷ lệ từng trạng thái để ưu tiên hành động.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="38"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    {donutSlices.map((slice) => (
                      <circle
                        key={slice.label}
                        cx="60"
                        cy="60"
                        r="38"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={`${slice.dash} ${donutCircumference}`}
                        strokeDashoffset={-slice.offset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    ))}
                    <text
                      x="60"
                      y="60"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-sm font-semibold"
                      fill="#0f172a"
                    >
                      {totalDistribution}
                    </text>
                  </svg>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {statusDistribution
                    .filter((item) => item.value > 0)
                    .map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700">
                          {item.label}
                        </span>
                        <span className="ml-auto text-xs text-slate-500">
                          {item.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6 animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#005792]">
                  Thí nghiệm ưu tiên Review
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Danh sách thí nghiệm đang chờ review hoặc cần xác nhận.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {priorityLogs.length} mục
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {priorityLogs.length > 0 ? (
                priorityLogs.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-xl p-3 hover:bg-blue-50/50 transition cursor-pointer"
                    onClick={() =>
                      void navigate(`/researcher/experiment-log/${log.id}`)
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {log.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {log.methodName} • {log.tissueCultureBatchName}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(
                            log.status,
                          )}`}
                        >
                          {statusToVietnamese(log.status)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  Không có thí nghiệm đang chờ review.
                </div>
              )}
            </ul>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-[#005792]">Bộ lọc</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lọc thí nghiệm theo trạng thái, phương pháp và giai đoạn.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Trạng thái
                </label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ExperimentStatus | "all")
                  }
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Created">Đã tạo</option>
                  <option value="InProcess">Đang thực hiện</option>
                  <option value="Done">Hoàn thành</option>
                  <option value="Cancel">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Phương pháp
                </label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:border-transparent"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Giai đoạn
                </label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:border-transparent"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as any)}
                >
                  <option value="all">Tất cả</option>
                  <option value="Giai đoạn 1">Giai đoạn 1</option>
                  <option value="Giai đoạn 2">Giai đoạn 2</option>
                  <option value="Giai đoạn 3">Giai đoạn 3</option>
                  <option value="Giai đoạn 4">Giai đoạn 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm thí nghiệm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-10 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm">
          <div className="bg-white/80 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Tên thí nghiệm
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Phương pháp
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Lô thí nghiệm
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Ngày tạo
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Trạng thái
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Số lượng mẫu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="mt-4 text-gray-600 font-medium">
                          Đang tải dữ liệu...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <div className="text-red-500 text-lg font-medium">
                          {error}
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className="border-b hover:bg-blue-50/60 cursor-pointer row-hover"
                        onClick={() =>
                          void navigate(`/researcher/experiment-log/${log.id}`)
                        }
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {log.name}
                        </td>
                        <td className="p-4 text-gray-700">{log.methodName}</td>
                        <td className="p-4 text-gray-700">
                          {log.tissueCultureBatchName}
                        </td>
                        <td className="p-4 text-gray-700">
                          {log.createdDate
                            ? new Date(log.createdDate).toLocaleDateString(
                                "vi-VN",
                              )
                            : ""}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(log.status)} bg-opacity-20 border transition-all duration-200 hover:scale-105`}
                          >
                            {statusToVietnamese(log.status)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">
                              {sampleCounts[log.id] ?? 0}
                            </span>
                            <span className="text-xs text-gray-400">mẫu</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center p-12 text-gray-500"
                      >
                        <div className="text-6xl mb-4">📋</div>
                        <div className="text-lg font-medium">
                          Không tìm thấy nhật ký nào.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70">
              <span className="font-medium">
                Hiển thị{" "}
                {Math.min((currentPage - 1) * logsPerPage + 1, totalCount)}-
                {Math.min(currentPage * logsPerPage, totalCount)} của{" "}
                {totalCount}
              </span>
              {totalCount > logsPerPage && (
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
                    >
                      ←
                    </button>
                  )}
                  {Array.from(
                    {
                      length: Math.min(Math.ceil(totalCount / logsPerPage), 5),
                    },
                    (_, i) => {
                      let pageNum;
                      const totalPages = Math.ceil(totalCount / logsPerPage);
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          type="button"
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentPage === pageNum ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105" : "bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 shadow-sm"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                  {Math.ceil(totalCount / logsPerPage) > currentPage && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExperimentLog;
