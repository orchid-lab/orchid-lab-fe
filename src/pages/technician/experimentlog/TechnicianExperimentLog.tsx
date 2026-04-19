/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Beaker,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";

import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type {
  ExperimentStatus,
  ExperimentLogEntryList,
  ExperimentLogListApiResponse,
  MethodOption,
  SampleListApiResponse,
} from "../../../types/ExperimentLog";

gsap.registerPlugin(useGSAP);

const TechnicianExperimentLog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatVietnameseDate = (value?: string): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // --- GSAP REF ---
  const containerRef = useRef<HTMLElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">(
    "all",
  );
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<"all" | "1" | "2" | "3" | "4">(
    "all",
  );
  const [logs, setLogs] = useState<ExperimentLogEntryList[]>([]);
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
    WaitingForChangeStage: number;
  }>({
    total: 0,
    Created: 0,
    InProcess: 0,
    Done: 0,
    Cancel: 0,
    WaitingForChangeStage: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  // --- GSAP ANIMATIONS ---

  // 1. Animation cho cấu trúc trang khi mới load (Header, Stats, Filter)
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // Header animation
      tl.from(".gsap-header", {
        y: -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
      })
        // Chart & Stats cards
        .from(
          ".gsap-chart",
          {
            scale: 0.9,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.3",
        )
        .from(
          ".gsap-stat-card",
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.3",
        )
        // Summary card
        .from(
          ".gsap-summary",
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.2",
        )
        // Filter bar
        .from(
          ".gsap-filter",
          {
            y: 10,
            opacity: 0,
            duration: 0.4,
          },
          "-=0.2",
        );
    },
    { scope: containerRef },
  );

  const normalizeStatus = (status?: number | string) => {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "1":
      case "Created":
        return "Created";
      case "2":
      case "InProgress":
        return "InProcess";
      case "WaitingForChangeStage":
        return "WaitingForChangeStage";
      case "3":
      case "Done":
      case "Completed":
        return "Done";
      case "4":
      case "Cancel":
      case "Cancelled":
      case "Destroyed":
        return "Cancel";
      default:
        return statusStr;
    }
  };

  const statusToVietnamese = (status?: number | string) => {
    switch (normalizeStatus(status)) {
      case "Created":
        return t("status.created");
      case "InProcess":
        return t("experimentLog.inProgress");
      case "Done":
        return t("experimentLog.completed");
      case "Cancel":
        return t("experimentLog.cancelled");
      case "WaitingForChangeStage":
        return t("experimentLog.waitingForStageChange");
      default:
        return t("common.none");
    }
  };

  const parseApiResponse = (
    data: unknown,
  ): { logs: ExperimentLogEntryList[]; totalCount: number } => {
    if (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      "totalCount" in data
    ) {
      const res = data as ExperimentLogListApiResponse;
      if (Array.isArray(res.data)) {
        return {
          logs: res.data as ExperimentLogEntryList[],
          totalCount: res.totalCount ?? res.data.length,
        };
      }
    }
    if (Array.isArray(data)) {
      return {
        logs: data as ExperimentLogEntryList[],
        totalCount: data.length,
      };
    }
    return { logs: [], totalCount: 0 };
  };

  const fetchSampleCount = async (experimentLogId: string): Promise<number> => {
    try {
      const response = await axiosInstance.get(
        `/api/samples?pageNo=1&pageSize=1000&experimentLogId=${experimentLogId}`,
      );
      const data = response.data;

      if (typeof data === "object" && data !== null && "totalCount" in data) {
        return (data as SampleListApiResponse).totalCount ?? 0;
      }
      if (typeof data === "object" && data !== null && "data" in data) {
        const inner = (data as SampleListApiResponse).data;
        return Array.isArray(inner) ? inner.length : 0;
      }
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

  const fetchAllSampleCounts = useCallback(
    async (experimentLogs: ExperimentLogEntryList[]) => {
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

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get(
          "/api/methods?PageNumber=1&PageSize=1000",
        );
        const raw = res.data;

        // API returns: { totalCount, pageCount, pageSize, pageNumber, data: [...] }
        if (
          typeof raw === "object" &&
          raw !== null &&
          "data" in raw &&
          Array.isArray(raw.data)
        ) {
          const arr = raw.data as any[];
          setMethods(arr.map((m) => ({ id: String(m.id), name: m.name })));
        } else {
          setMethods([]);
        }
      } catch (err) {
        console.error("Error fetching methods:", err);
        setMethods([]);
      }
    };
    void fetchMethods();
  }, []);

  const fetchStatsOnly = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        "/api/experiment-logs?PageNo=1&PageSize=1000",
      );
      const { logs: allLogs } = parseApiResponse(res.data);

      const counts = {
        Created: 0,
        InProcess: 0,
        Done: 0,
        Cancel: 0,
        WaitingForChangeStage: 0,
      };

      allLogs.forEach((log) => {
        const normalized = normalizeStatus(log.status);
        // Kiểm tra chính xác các key đã khởi tạo ở trên
        if (normalized === "Created") counts.Created++;
        else if (normalized === "InProcess") counts.InProcess++;
        else if (normalized === "Done") counts.Done++;
        else if (normalized === "Cancel") counts.Cancel++;
        else if (normalized === "WaitingForChangeStage")
          counts.WaitingForChangeStage++;
      });

      setStats({
        total:
          counts.Created +
          counts.InProcess +
          counts.Done +
          counts.Cancel +
          counts.WaitingForChangeStage,
        ...counts,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("PageNo", String(Math.max(1, currentPage)));
      params.append("PageSize", String(logsPerPage));

      if (methodFilter) {
        const selectedMethod = methods.find((m) => m.id === methodFilter);
        if (selectedMethod) {
          params.append("MethodNameSearchTerm", selectedMethod.name);
        }
      }

      try {
        const res = await axiosInstance.get(
          `/api/experiment-logs?${params.toString()}`,
        );
        const { logs: arr, totalCount: total } = parseApiResponse(res.data);

        const normalizedLogs = arr.map((log) => ({
          ...log,
          tissueCultureBatchName:
            log.tissueCultureBatchName ?? (log as any).batcheName ?? "",
          status: normalizeStatus(log.status),
        }));

        setLogs(normalizedLogs);
        setTotalCount(total);

        if (normalizedLogs.length > 0) {
          await fetchAllSampleCounts(normalizedLogs);
        }
      } catch {
        setError(t("common.errorLoading"));
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
    methods,
    fetchAllSampleCounts,
    fetchStatsOnly,
    t,
  ]);

  const getStatusColor = (status?: number | string): string => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "bg-red-50 text-red-700";
      case "InProcess":
        return "bg-green-50 text-green-700";
      case "WaitingForChangeStage":
        return "bg-yellow-50 text-yellow-700";
      case "Done":
        return "bg-green-50 text-green-700";
      case "Cancel":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status?: number | string) => {
    const iconClass = "w-4 h-4";
    switch (normalizeStatus(status)) {
      case "Created":
        return <Beaker className={`${iconClass} text-[#2D5A27]`} />;
      case "InProcess":
        return <Clock className={`${iconClass} text-[#2D5A27]`} />;
      case "WaitingForChangeStage":
        return <AlertCircle className={`${iconClass} text-[#D97706]`} />;
      case "Done":
        return <CheckCircle2 className={`${iconClass} text-[#2D5A27]`} />;
      case "Cancel":
        return <XCircle className={`${iconClass} text-[#B91C1C]`} />;
      default:
        return null;
    }
  };

  var filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.tissueCultureBatchName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "WaitingForChangeStage" &&
        normalizeStatus(log.status) === "WaitingForChangeStage") ||
      normalizeStatus(log.status) === statusFilter;

    let matchesStage = true;
    if (stageFilter !== "all") {
      const stageNumber = Number(stageFilter);
      if (log.currentStageOrder !== undefined) {
        matchesStage = log.currentStageOrder === stageNumber - 1;
      } else if (log.stages && log.stages.length > 0 && log.currentStageName) {
        if (stageNumber >= 1 && stageNumber <= log.stages.length) {
          const targetStageName = log.stages[stageNumber - 1].name;
          matchesStage = log.currentStageName === targetStageName;
        } else {
          matchesStage = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesStage;
  });

  const totalPages = Math.ceil(totalCount / logsPerPage);
  const completedPercent =
    stats.total > 0 ? Math.round((stats.Done / stats.total) * 100) : 0;

  return (
    <main
      id="technician-experimentlog-page"
      ref={containerRef}
      className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8"
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8 gsap-header">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <h1 className="text-4xl font-bold text-[#2D5A27]">
                {t("experimentLog.experimentLogTitle")}
              </h1>
              <p className="text-[#4B6C54] text-lg mt-1">
                {t("technicianExperiment.manageExperiments")}
              </p>
            </div>
          </div>
        </div>

        {/* Overview + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Overview */}
          <div className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.12)] border border-[#DDEEE0] p-6 gsap-chart h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#2D5A27] mb-1">
                  {t("technicianTask.overallTaskDistribution", {
                    defaultValue: "Tổng quan tiến độ",
                  })}
                </h3>
                <p className="text-sm text-[#4B6C54]">
                  {t("technicianTask.overallTaskSummary", {
                    defaultValue: "Xem nhanh tiến độ các thí nghiệm",
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#2D5A27]">
                  {stats.total}
                </div>
                <div className="text-xs text-[#4B6C54] mt-1">
                  {t("experimentLog.experiments")}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-[#4B6C54] mb-2">
                <span>
                  {t("technicianTask.completedRate", {
                    defaultValue: "Hoàn thành",
                  })}
                </span>
                <span className="font-semibold text-[#2D5A27]">
                  {completedPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E4F0E8] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2D5A27] transition-all duration-500"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#DDEEE0] text-[#2D5A27]">
                    <Clock className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("experimentLog.inProgress", {
                      defaultValue: "Đang thực hiện",
                    })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#2D5A27]">
                  {stats.InProcess}
                </span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("experimentLog.inProgressHelp", {
                  defaultValue: "Các thí nghiệm đang tiến hành",
                })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706]">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("experimentLog.waitingForStageChange", {
                      defaultValue: "Chờ chuyển giai đoạn",
                    })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#D97706]">
                  {stats.WaitingForChangeStage}
                </span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("experimentLog.waitingHelp", {
                  defaultValue: "Chờ chuyển giai đoạn",
                })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#D1FAE5] text-[#2D5A27]">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("experimentLog.completed", {
                      defaultValue: "Hoàn thành",
                    })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#2D5A27]">
                  {stats.Done}
                </span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("experimentLog.completedHelp", {
                  defaultValue: "Các thí nghiệm đã hoàn thành",
                })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                    <XCircle className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("experimentLog.cancelled", { defaultValue: "Đã hủy" })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#B91C1C]">
                  {stats.Cancel}
                </span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("experimentLog.cancelledHelp", {
                  defaultValue: "Các thí nghiệm đã hủy",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(45,90,39,0.08)] border border-[#DDEEE0] p-6 gsap-filter">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t("experimentLog.experimentLogList")}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ExperimentStatus | "all")
                }
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
              >
                <option value="all">{t("experimentLog.allStatuses")}</option>
                <option value="Created">{t("status.created")}</option>
                <option value="InProcess">{t("status.inProgress")}</option>
                <option value="WaitingForChangeStage">
                  {t("experimentLog.waitingForStageChange")}
                </option>
                <option value="Done">{t("status.completed")}</option>
                <option value="Cancel">{t("status.cancelled")}</option>
              </select>
            </div>

            <select
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">{t("experimentLog.allMethods")}</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
              value={stageFilter}
              onChange={(e) =>
                setStageFilter(e.target.value as "all" | "1" | "2" | "3" | "4")
              }
            >
              <option value="all">{t("experimentLog.allStages")}</option>
              <option value="1">
                {t("experimentLog.stageNumber", { number: 1 })}
              </option>
              <option value="2">
                {t("experimentLog.stageNumber", { number: 2 })}
              </option>
              <option value="3">
                {t("experimentLog.stageNumber", { number: 3 })}
              </option>
              <option value="4">
                {t("experimentLog.stageNumber", { number: 4 })}
              </option>
            </select>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("common.search") + "..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setMethodFilter("");
                setStageFilter("all");
                setSearchTerm("");
              }}
              className="px-4 py-2.5 text-sm text-[#2D5A27] hover:text-[#1f3f24] hover:bg-[#E4F0E8] rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters")}
            </button>
          </div>
        </div>

        {/* Experiments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              {t("experimentLog.loadingExperiments")}
            </div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden gsap-table-container">
            <table className="w-full">
              <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.experimentName")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.method")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.tissueCultureBatch")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.dateCreated")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("common.status")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.expectedSampleCount")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.currentSampleCount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#EBF7EE] cursor-pointer transition-colors gsap-table-row"
                      onClick={() =>
                        void navigate(`/technician/experiment-log/${log.id}`)
                      }
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-[#2D5A27]" />
                          {log.methodName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.tissueCultureBatchName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatVietnameseDate(log.createdDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                            log.status,
                          )}`}
                        >
                          {getStatusIcon(log.status)}
                          {statusToVietnamese(log.status)}
                        </span>
                      </td>
                      {/* Expected Sample Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#E4F0E8] px-3 py-1 rounded-full">
                            <span className="font-semibold text-[#2D5A27]">
                              {log.expectedSampleCount ?? 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {t("experimentLog.samples")}
                          </span>
                        </div>
                      </td>
                      {/* Current Sample Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#E4F0E8] px-3 py-1 rounded-full">
                            <span className="font-semibold text-[#2D5A27]">
                              {sampleCounts[log.id] ?? 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {t("experimentLog.samples")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {t("common.showing")} {filteredLogs.length} {t("common.of")}{" "}
                  {totalCount}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm transition-colors"
                    >
                      ←
                    </button>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() => setCurrentPage(number)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          currentPage === number
                            ? "bg-[#2D5A27] text-white"
                            : "bg-white border border-[#E4F0E8] hover:bg-[#E4F0E8]"
                        }`}
                      >
                        {number}
                      </button>
                    ),
                  )}

                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm transition-colors"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default TechnicianExperimentLog;
