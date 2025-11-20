import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";

type ExperimentStatus = "Created" | "InProcess" | "Done" | "Cancel";

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
    "all"
  );
  const [methodFilter, setMethodFilter] = useState<string>("");
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
    InProcess: number;
    Done: number;
    Cancel: number;
  }>({
    total: 0,
    Created: 0,
    InProcess: 0,
    Done: 0,
    Cancel: 0,
  });

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  // chuẩn hóa status từ API sang frontend
  const normalizeStatus = (status?: number | string) => {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "1":
        return "Created";
      case "2":
        return "InProcess";
      case "3":
        return "Done";
      case "4":
        return "Cancel";
      default:
        return statusStr;
    }
  };

  // dịch status sang tiếng Việt
  const statusToVietnamese = (status?: number | string) => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "Đã tạo";
      case "InProcess":
        return "Đang thực hiện";
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
      const response = await fetch(
        `https://net-api.orchid-lab.systems/api/sample?pageNo=1&pageSize=1000&experimentLogId=${experimentLogId}`
      );
      if (!response.ok) return 0;
      const data: unknown = await response.json();

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
    []
  );

  function hasValueWithData<T>(
    obj: unknown,
    itemGuard: (item: unknown) => item is T
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
      typeof o.tissueCultureBatchName === "string"
    );
  }

  // Fetch methods
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get(
          "/api/method?pageNumber=1&pageSize=100"
        );
        const raw = res.data as {
          value?: { data?: { id: string; name: string }[] };
        };
        const arr = Array.isArray(raw?.value?.data) ? raw.value.data : [];
        setMethods(arr.map((m) => ({ id: m.id, name: m.name })));
      } catch {
        setMethods([]);
      }
    };
    void fetchMethods();
  }, []);

  // Fetch thống kê nhanh
  const fetchStatsOnly = useCallback(async () => {
    try {
      // Fetch tất cả dữ liệu để đếm thống kê
      const param = new URLSearchParams();
      param.append("pageNumber", "1");
      param.append("pageSize", "1000"); // Lấy tất cả để đếm
      const res = await fetch(
        `https://net-api.orchid-lab.systems/api/experimentlog?${param.toString()}`
      );
      if (!res.ok) throw new Error("Lỗi khi lấy thống kê");
      const data: unknown = await res.json();

      let allLogs: ExperimentLogEntry[] = [];
      if (hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)) {
        allLogs = data.value.data;
      } else if (typeof data === "object" && data !== null && "value" in data) {
        allLogs = ((data as ExperimentLogApiResponse).value ?? []).filter(
          isExperimentLogEntry
        );
      } else if (Array.isArray(data)) {
        allLogs = data.filter(isExperimentLogEntry);
      }

      // Đếm theo status
      const counts = {
        Created: 0,
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
        InProcess: counts.InProcess,
        Done: counts.Done,
        Cancel: counts.Cancel,
      });
    } catch (err) {
      console.error("Không thể lấy thống kê:", err);
      setStats({ total: 0, Created: 0, InProcess: 0, Done: 0, Cancel: 0 });
    }
  }, []);

  // Fetch dữ liệu phân trang
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("pageNumber", String(currentPage));
      params.append("pageSize", String(logsPerPage));
      if (methodFilter) {
        params.append("filter", methodFilter);
      }

      try {
        const res = await fetch(
          `https://net-api.orchid-lab.systems/api/experimentlog?${params.toString()}`
        );
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu");
        const data: unknown = await res.json();
        let arr: ExperimentLogEntry[] = [];
        let total = 0;

        if (hasValueWithData<ExperimentLogEntry>(data, isExperimentLogEntry)) {
          arr = data.value.data;
          total = Number(
            (data as { value: { totalCount?: unknown } })?.value?.totalCount ??
              arr.length
          );
        } else if (
          typeof data === "object" &&
          data !== null &&
          "value" in data
        ) {
          arr = ((data as ExperimentLogApiResponse).value ?? []).filter(
            isExperimentLogEntry
          );
          total = (data as ExperimentLogApiResponse).totalCount ?? arr.length;
        } else if (Array.isArray(data)) {
          arr = data.filter(isExperimentLogEntry);
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
        return "bg-blue-100 text-blue-800";
      case "InProcess":
        return "bg-yellow-100 text-yellow-800";
      case "Done":
        return "bg-green-100 text-green-800";
      case "Cancel":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 ">
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Nhật ký thí nghiệm
            </h1>
            <Link
              to="/experiment-log/create/step-1"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Tạo nhật ký thí nghiệm mới
            </Link>
          </div>

          {/* Thống kê */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">
                TỔNG THÍ NGHIỆM
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.total}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">
                {statusToVietnamese("InProcess")}
              </div>
              <div className="text-2xl font-bold text-yellow-700">
                {stats.InProcess}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">
                {statusToVietnamese("Done")}
              </div>
              <div className="text-2xl font-bold text-green-700">
                {stats.Done}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 text-sm font-medium">
                {statusToVietnamese("Cancel")}
              </div>
              <div className="text-2xl font-bold text-red-700">
                {stats.Cancel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Danh sách nhật ký thí nghiệm
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Quản lý và theo dõi các thí nghiệm của bạn
            </p>

            <div className="flex gap-4 flex-wrap mb-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhật ký thí nghiệm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 min-w-[180px]">
                <Filter className="text-gray-400 w-4 h-4" />
                <select
                  className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
              <div className="flex items-center gap-2 min-w-[220px]">
                <span className="text-gray-600 text-sm">Phương pháp:</span>
                <select
                  className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
              <div className="flex items-center gap-2 min-w-[180px]">
                <span className="text-gray-600 text-sm">Giai đoạn:</span>
                <select
                  className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  value={stageFilter}
                  onChange={(e) =>
                    setStageFilter(
                      e.target.value as
                        | "all"
                        | "Giai đoạn 1"
                        | "Giai đoạn 2"
                        | "Giai đoạn 3"
                        | "Giai đoạn 4"
                    )
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="Giai đoạn 1">Giai đoạn 1</option>
                  <option value="Giai đoạn 2">Giai đoạn 2</option>
                  <option value="Giai đoạn 3">Giai đoạn 3</option>
                  <option value="Giai đoạn 4">Giai đoạn 4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên thí nghiệm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phương pháp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lô thí nghiệm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng mẫu
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-gray-500">Đang tải dữ liệu...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-red-500">{error}</div>
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-green-50 cursor-pointer transition"
                      onClick={() => void navigate(`/experiment-log/${log.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.methodName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.tissueCultureBatchName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.createdDate
                          ? new Date(log.createdDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {statusToVietnamese(log.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-gray-500">
                        Không tìm thấy nhật ký nào.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {(() => {
                const start =
                  filteredLogs.length === 0
                    ? 0
                    : (currentPage - 1) * logsPerPage + 1;
                const end =
                  filteredLogs.length === 0
                    ? 0
                    : (currentPage - 1) * logsPerPage + filteredLogs.length;
                return (
                  <span>
                    Hiển thị {start}-{end} của {totalCount} kết quả
                  </span>
                );
              })()}
            </div>
            {totalCount > logsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from(
                  { length: Math.ceil(totalCount / logsPerPage) },
                  (_, i) => i + 1
                ).map((number) => (
                  <button
                    type="button"
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`${
                      currentPage === number
                        ? "bg-green-600 text-white"
                        : "text-gray-500 hover:text-gray-700"
                    } px-3 py-1 rounded text-sm`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalCount / logsPerPage)}
                  className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExperimentLog;
