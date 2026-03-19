import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

interface Task {
  id: string;
  name?: string;
  description?: string;
  stageId?: string | number | null;
  taskTargetType?: string | null;
  targetId?: string | null;
  researcherId?: string | null;
  researcher?: string | null;
  technicianId?: string | null;
  experimentLogName?: string;
  end_date?: string;
  create_at?: string;
  status: string;
  expectedEndDate?: string | null;
}

type StatusType =
  | "Assigned"
  | "Taken"
  | "InProcess"
  | "DoneInTime"
  | "DoneInLate"
  | "Cancel";

interface ApiTaskResponse {
  value?: {
    totalCount?: number;
    pageCount?: number;
    pageSize?: number;
    pageNumber?: number;
    data?: Task[];
  };
}

function isApiTaskResponse(obj: unknown): obj is ApiTaskResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object" &&
    Array.isArray((obj as { value: { data?: unknown } }).value?.data)
  );
}

// Map API-returned status values → internal StatusType
const STATUS_NORMALIZE_MAP: Record<string, StatusType> = {
  Assigned: "Assigned",
  Taken: "Taken",
  InProcess: "InProcess",
  InProgress: "InProcess",
  DoneInTime: "DoneInTime",
  CompletedInTime: "DoneInTime",
  DoneInLate: "DoneInLate",
  CompletedLate: "DoneInLate",
  CompletedInLate: "DoneInLate",
  Cancel: "Cancel",
  Cancelled: "Cancel",
  Canceled: "Cancel",
};

function normalizeStatus(status: string): StatusType | null {
  return STATUS_NORMALIZE_MAP[status] ?? null;
}

function getStatusLabel(
  status: StatusType,
  t: (key: string) => string,
): string {
  const labels: Record<StatusType, string> = {
    Assigned: t("status.assigned"),
    Taken: t("status.taken"),
    InProcess: t("status.inProcess"),
    DoneInTime: t("status.doneInTime"),
    DoneInLate: t("status.doneInLate"),
    Cancel: t("status.cancel"),
  };
  return labels[status] || status;
}

export default function Tasks() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  // State cho pagination và data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State cho filters
  const [statusFilter, setStatusFilter] = useState<StatusType | "Tất cả">(
    "Tất cả",
  );
  const [researcherFilter, setResearcherFilter] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  // State cho summary data (chỉ load 1 lần)
  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0,
    Taken: 0,
    InProcess: 0,
    DoneInTime: 0,
    DoneInLate: 0,
    Cancel: 0,
  });
  const [allResearchers, setAllResearchers] = useState<string[]>([]);

  // Map taskId -> technician name
  const [technicianNames, setTechnicianNames] = useState<
    Record<string, string>
  >({});

  const tasksPerPage = 8;

  // Build query parameters cho API call chính
  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();

    params.append("pageNumber", "1");
    params.append("pageSize", "1000");

    if (researcherFilter !== "Tất cả") {
      params.append("researcher", researcherFilter);
    }
    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    return params.toString();
  }, [researcherFilter, searchTerm]);

  // Load tasks với debounce cho search
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        setLoading(true);
        setError(null);

        axiosInstance
          .get(`/api/tasks?${buildApiQuery}`)
          .then(async (res) => {
            let data: Task[] = [];
            if (isApiTaskResponse(res.data)) {
              data = Array.isArray(res.data.value?.data)
                ? res.data.value.data
                : [];
            } else if (Array.isArray((res.data as { data?: Task[] }).data)) {
              data = (res.data as { data: Task[] }).data;
            }

            // Compute status counts and researchers from full unfiltered data
            const counts: Record<StatusType, number> = {
              Assigned: 0, Taken: 0, InProcess: 0,
              DoneInTime: 0, DoneInLate: 0, Cancel: 0,
            };
            const researcherSet = new Set<string>();
            data.forEach((task) => {
              const normalized = normalizeStatus(task.status);
              if (normalized) counts[normalized] = (counts[normalized] ?? 0) + 1;
              if (task.researcher) researcherSet.add(task.researcher);
            });
            setStatusCounts(counts);
            setAllResearchers(Array.from(researcherSet));

            // Sort tasks theo expectedEndDate, end_date, create_at
            const sortedData = [...data].sort((a, b) => {
              const dateA = new Date(
                a.expectedEndDate ?? a.end_date ?? a.create_at ?? 0,
              );
              const dateB = new Date(
                b.expectedEndDate ?? b.end_date ?? b.create_at ?? 0,
              );
              return dateB.getTime() - dateA.getTime();
            });
            // Filter
            let filteredData = sortedData;
            if (statusFilter !== "Tất cả") {
              filteredData = filteredData.filter(
                (task) => normalizeStatus(task.status) === statusFilter,
              );
            }
            if (researcherFilter !== "Tất cả") {
              filteredData = filteredData.filter(
                (task) => (task.researcherId ?? "") === researcherFilter,
              );
            }
            if (searchTerm.trim()) {
              filteredData = filteredData.filter(
                (task) =>
                  (task.name ?? "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  (task.description ?? "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              );
            }
            // Pagination
            const startIndex = (currentPage - 1) * tasksPerPage;
            const endIndex = startIndex + tasksPerPage;
            const paginatedData = filteredData.slice(startIndex, endIndex);
            setTasks(paginatedData);
            setTotalCount(filteredData.length);
            // Fetch technician names
            const techIds = paginatedData
              .map((task) => task.technicianId)
              .filter((id): id is string => !!id);
            const uniqueTechIds = Array.from(new Set(techIds));
            const techNameMap: Record<string, string> = {};
            await Promise.all(
              uniqueTechIds.map(async (id) => {
                try {
                  const userRes = await axiosInstance.get(`/api/user/${id}`);
                  const userData = userRes.data as {
                    value?: { name?: string };
                    name?: string;
                  };
                  techNameMap[id] =
                    userData?.value?.name ?? userData?.name ?? id;
                } catch {
                  techNameMap[id] = id;
                }
              }),
            );
            setTechnicianNames(techNameMap);
          })
          .catch(() => {
            setError(t("task.cannotLoadList"));
            enqueueSnackbar(t("common.errorLoading"), { variant: "error" });
          })
          .finally(() => {
            setLoading(false);
          });
      },
      searchTerm ? 300 : 0,
    ); // Debounce 300ms cho search, ngay lập tức cho các filter khác

    return () => clearTimeout(timeoutId);
  }, [
    buildApiQuery,
    statusFilter,
    researcherFilter,
    searchTerm,
    currentPage,
    enqueueSnackbar,
    t,
  ]);

  // Reset về trang 1 khi filter thay đổi (chỉ khi có filter)
  useEffect(() => {
    if (
      statusFilter !== "Tất cả" ||
      researcherFilter !== "Tất cả" ||
      searchTerm.trim()
    ) {
      setCurrentPage(1);
    }
  }, [statusFilter, researcherFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
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
        .hover-lift { transition: all 0.28s cubic-bezier(0.4,0,0.2,1); }
        .hover-lift:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 12px 24px -6px rgba(0,0,0,0.15); }
      `}</style>
      <div className="space-y-6">
        {/* Header + nút tạo task */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#005792]">
              {t("task.researchTaskManagement")}
            </h1>
            <p className="text-blue-900/70 mt-1">
              {t("task.researchTaskSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => {
                void navigate("/researcher/task-templates");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-[#005792] shadow-sm transition-all duration-200 hover:bg-white"
            >
              <span className="text-xl leading-none" aria-hidden>
                🧭
              </span>
              {t("task.taskTemplates")}
            </button>
            <button
              type="button"
              onClick={() => {
                void navigate("/create-task/step-1");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005792] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#004d73]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path d="M10 4v12m-6-6h12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("task.createResearchTask")}
            </button>
          </div>
        </div>

        {/* 6 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries({
            Assigned: t("status.taskAssigned"),
            Taken: t("status.taskTaken"),
            InProcess: t("status.taskInProcess"),
            DoneInTime: t("status.taskDoneInTime"),
            DoneInLate: t("status.taskDoneInLate"),
            Cancel: t("status.taskCancelled"),
          }).map(([key, label], idx) => {
            // Color and bg similar to ExperimentLog
            let cardBg = "bg-blue-50 border-blue-200 text-blue-700";
            if (key === "Taken")
              cardBg = "bg-indigo-50 border-indigo-200 text-indigo-700";
            if (key === "InProcess")
              cardBg = "bg-yellow-50 border-yellow-200 text-yellow-700";
            if (key === "DoneInTime")
              cardBg = "bg-green-50 border-green-200 text-green-700";
            if (key === "DoneInLate")
              cardBg = "bg-orange-50 border-orange-200 text-orange-700";
            if (key === "Cancel")
              cardBg = "bg-red-50 border-red-200 text-red-700";
            return (
              <div
                key={key}
                className={`rounded-xl border px-6 py-4 flex flex-col items-center animate-scale-in hover-lift min-w-[150px] ${cardBg}`}
                style={{ animationDelay: `${0.1 * (idx + 1)}s`, opacity: 0 }}
              >
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  {label}
                </div>
                <div className={`text-3xl font-bold ${cardBg.split(" ")[2]}`}>
                  {statusCounts[key as StatusType]}
                </div>
              </div>
            );
          })}
        </div>

        {/* {t('common.filter')} */}
        <div className="bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900/70 font-medium">
                {t("common.status")}:
              </span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusType | "Tất cả")
                }
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="Tất cả">{t("common.all")}</option>
                {Object.entries({
                  Assigned: t("status.assigned"),
                  Taken: t("status.taken"),
                  InProcess: t("status.inProcess"),
                  DoneInTime: t("status.doneInTime"),
                  DoneInLate: t("status.doneInLate"),
                  Cancel: t("status.cancel"),
                }).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900/70 font-medium">
                {t("task.researcher")}:
              </span>
              <select
                value={researcherFilter}
                onChange={(e) => setResearcherFilter(e.target.value)}
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="Tất cả">{t("common.all")}</option>
                {allResearchers.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#005792"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t("common.searchPlaceholder") ?? "Tìm kiếm nhiệm vụ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-blue-100 bg-white/90 rounded-xl px-10 py-2 text-sm text-blue-950 focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("Tất cả");
                setResearcherFilter("Tất cả");
                setSearchTerm("");
              }}
              className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-blue-950 shadow-sm transition-all duration-200 hover:bg-white"
            >
              <span className="text-lg leading-none" aria-hidden>
                ✕
              </span>
              {t("common.clear")} {t("common.filter").toLowerCase()}
            </button>
          </div>

          {/* Hiển thị active filters */}
          {(statusFilter !== "Tất cả" ||
            researcherFilter !== "Tất cả" ||
            searchTerm.trim()) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {t("common.filter")} {t("common.selected").toLowerCase()}:
              </span>
              {statusFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700">
                  {t("common.status")}: {getStatusLabel(statusFilter, t)}
                </span>
              )}
              {researcherFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                  {t("task.researcher")}: {researcherFilter}
                </span>
              )}
              {searchTerm.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                  {t("common.search")}: "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up stagger-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b-2 border-green-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    {t("task.taskName")}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    {t("common.status")}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    {t("task.deadline")}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    {t("task.technician")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        {t("common.loadingData")}
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      {t("task.noTasks")}
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="row-hover border-b cursor-pointer hover:bg-green-50 transition-all duration-150"
                      onClick={() => {
                        void navigate(`/researcher/tasks/${task.id}`);
                      }}
                    >
                      <td className="p-4 font-medium text-gray-900">
                        {task.name ?? "-"}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {task.status || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        {task.expectedEndDate
                          ? new Date(task.expectedEndDate).toLocaleDateString(
                              "vi-VN",
                            )
                          : task.end_date
                            ? new Date(task.end_date).toLocaleDateString(
                                "vi-VN",
                              )
                            : task.create_at
                              ? new Date(task.create_at).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "-"}
                      </td>
                      <td className="p-4">
                        {task.technicianId
                          ? technicianNames[task.technicianId] ||
                            task.technicianId
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-sm text-gray-600 p-6 bg-gray-50">
              <span className="font-medium">
                {t("common.showing")}{" "}
                {tasks.length > 0 ? (currentPage - 1) * tasksPerPage + 1 : 0}-
                {Math.min(currentPage * tasksPerPage, totalCount)}{" "}
                {t("common.of")} {totalCount}
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <button
                    type="button"
                    onClick={() => paginate(currentPage - 1)}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
                  >
                    ←
                  </button>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
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
                      key={pageNum}
                      type="button"
                      onClick={() => paginate(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium shadow-sm ${
                        currentPage === pageNum
                          ? "bg-green-700 text-white"
                          : "bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {currentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() => paginate(currentPage + 1)}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* ...existing code... */}
      </div>
    </main>
  );
}
