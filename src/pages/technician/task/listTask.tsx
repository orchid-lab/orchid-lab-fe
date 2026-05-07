/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import type { TaskStatusType, TaskItem, TaskListApiResponse } from "../../../types/TechnicianTask";
import {
  Clock,
  UserPlus,
  Inbox,
  Loader,
  CheckCheck,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  type Variants,
} from "framer-motion";

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const progressBarVariant: Variants = {
  hidden: { width: "0%" },
  visible: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.3 },
  }),
};

const filterPanelVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.96, y: -8 },
  visible: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

const dropdownVariant: Variants = {
  hidden: {
    opacity: 0,
    scaleY: 0.88,
    y: -6,
  },
  visible: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    scaleY: 0.9,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const dropdownItemVariant: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, delay: i * 0.03, ease: "easeOut" as const },
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTaskListApiResponse(obj: unknown): obj is TaskListApiResponse {
  return typeof obj === "object" && obj !== null && "data" in obj;
}

const STATUS_LABELS: Record<TaskStatusType, string> = {
  Assigned: "Assigned",
  InProgress: "In Progress",
  WaitingForApproval: "Waiting For Approval",
  CompletedInTime: "Completed On Time",
  CompletedOutTime: "Completed Late",
  Deleted: "Deleted",
  DeclinedByTechnician: "Declined",
  ReworkRequired: "Rework Required",
  Unknown: "Unknown",
};

const STATUS_TRANSLATION_KEYS: Record<TaskStatusType, string> = {
  Assigned: "status.assigned",
  InProgress: "status.inProgress",
  WaitingForApproval: "status.waitingForApproval",
  CompletedInTime: "status.completedInTime",
  CompletedOutTime: "status.completedOutTime",
  Deleted: "status.deleted",
  DeclinedByTechnician: "status.declinedByTechnician",
  ReworkRequired: "status.reworkRequired",
  Unknown: "status.unknown",
};

const STATUS_COLORS: Record<TaskStatusType, string> = {
  Assigned: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  InProgress: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  WaitingForApproval: "bg-[#FFF0F9] text-[#DA70D6] border-[#F3D4EB]",
  CompletedInTime: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  CompletedOutTime: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Deleted: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
  DeclinedByTechnician: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  ReworkRequired: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Unknown: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
};

const STATUS_ICON_COLORS: Record<TaskStatusType, string> = {
  Assigned: "text-[#2D5A27]",
  InProgress: "text-[#2D5A27]",
  WaitingForApproval: "text-[#DA70D6]",
  CompletedInTime: "text-[#2D5A27]",
  CompletedOutTime: "text-[#F97316]",
  Deleted: "text-[#6B7280]",
  DeclinedByTechnician: "text-[#B91C1C]",
  ReworkRequired: "text-[#F97316]",
  Unknown: "text-[#6B7280]",
};

const STATUS_FILTER_ORDER: TaskStatusType[] = [
  "Assigned",
  "InProgress",
  "WaitingForApproval",
  "CompletedInTime",
  "CompletedOutTime",
  "Deleted",
  "DeclinedByTechnician",
  "ReworkRequired",
];

const normalizeTaskStatus = (status: string): TaskStatusType => {
  if (status in STATUS_LABELS) return status as TaskStatusType;
  return "Unknown";
};

const createEmptyStatusCounts = (): Record<TaskStatusType, number> => ({
  Assigned: 0,
  InProgress: 0,
  WaitingForApproval: 0,
  CompletedInTime: 0,
  CompletedOutTime: 0,
  Deleted: 0,
  DeclinedByTechnician: 0,
  ReworkRequired: 0,
  Unknown: 0,
});

const formatDateVi = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── AnimatedSelect Component ─────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface AnimatedSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
}

function AnimatedSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
}: AnimatedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm bg-white
          transition-all duration-150 whitespace-nowrap
          ${open
            ? "border-[#2D5A27] ring-2 ring-[#2D5A27]/20 text-[#2D5A27]"
            : "border-gray-300 text-gray-700 hover:border-[#2D5A27]/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span>{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          className="flex items-center"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            key="dropdown"
            variants={dropdownVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top center" }}
            className="
              absolute z-50 top-[calc(100%+6px)] left-0 min-w-full
              bg-white border border-[#DDEEE0] rounded-xl
              shadow-[0_8px_32px_rgba(45,90,39,0.14)]
              overflow-hidden py-1
            "
          >
            {options.map((opt, i) => (
              <motion.li
                key={opt.value}
                custom={i}
                variants={dropdownItemVariant}
                initial="hidden"
                animate="visible"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`
                  px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap
                  transition-colors duration-75
                  ${opt.value === value
                    ? "bg-[#E4F0E8] text-[#2D5A27] font-medium"
                    : "text-gray-700 hover:bg-[#F4F7F4] hover:text-[#2D5A27]"
                  }
                `}
              >
                {opt.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  help: string;
  value: number;
  valueColor: string;
}

function StatCard({ icon, iconBg, label, help, value, valueColor }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(45,90,39,0.16)" }}
      className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5 cursor-default"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${iconBg}`}>
            {icon}
          </span>
          <span className="text-sm font-medium text-[#2D5A27]">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`text-2xl font-semibold ${valueColor}`}
        >
          {value}
        </motion.span>
      </div>
      <p className="text-xs text-[#4B6C54]">{help}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ListTask() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const getStatusLabel = (status: TaskStatusType) =>
    t(STATUS_TRANSLATION_KEYS[status], { defaultValue: STATUS_LABELS[status] });

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<TaskStatusType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [todayFilter, setTodayFilter] = useState(false);

  const [statusCounts, setStatusCounts] = useState<Record<TaskStatusType, number>>(
    createEmptyStatusCounts()
  );
  const [totalTasks, setTotalTasks] = useState(0);

  // Cache technician names to avoid redundant API calls
  const technicianNameCache = useRef<Record<string, string>>({});

  const tasksPerPage = 20;

  // Build status options for AnimatedSelect
  const statusOptions: SelectOption<TaskStatusType | "All">[] = [
    { value: "All", label: t("common.status") },
    ...STATUS_FILTER_ORDER.map((key) => ({
      value: key as TaskStatusType | "All",
      label: getStatusLabel(key),
    })),
  ];

  const fetchTargetName = async (
    targetType: string | undefined,
    targetId: string | undefined
  ): Promise<string> => {
    if (!targetId || !targetType) return "-";
    try {
      let endpoint = "";
      if (targetType === "ExperimentLog") endpoint = `/api/experiment-logs/${targetId}`;
      else if (targetType === "Sample") endpoint = `/api/sample/${targetId}`;
      if (endpoint) {
        const response = await axiosInstance.get(endpoint);
        const data = response.data?.value ?? response.data;
        return data?.name ?? t("common.none");
      }
    } catch (error) {
      console.error("Error fetching target:", error);
    }
    return t("common.none");
  };

  const fetchTechnicianName = async (technicianId: string | undefined): Promise<string> => {
    if (!technicianId) return "-";

    if (technicianNameCache.current[technicianId]) {
      return technicianNameCache.current[technicianId];
    }

    try {
      const response = await axiosInstance.get(`/api/user/${technicianId}`);
      const data = response.data?.value ?? response.data;
      const name: string =
        data?.fullName ?? data?.name ?? data?.userName ?? t("common.none");
      technicianNameCache.current[technicianId] = name;
      return name;
    } catch (error) {
      console.error("Error fetching technician:", error);
      return t("common.none");
    }
  };

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        const params = new URLSearchParams();
        params.append("PageNumber", "1");
        params.append("PageSize", "1000");
        params.append("TechnicianId", user?.id ?? "");
        const response = await axiosInstance.get(`/api/tasks?${params.toString()}`);
        if (isTaskListApiResponse(response.data)) {
          const allTasks = Array.isArray(response.data.data)
            ? response.data.data
                .filter((task) => String(task.status ?? "") !== "Template")
                .map((task) => ({
                  ...task,
                  status: normalizeTaskStatus(String(task.status ?? "")),
                }))
            : [];
          const counts: Record<TaskStatusType, number> = createEmptyStatusCounts();
          allTasks.forEach((task) => { counts[task.status] = (counts[task.status] || 0) + 1; });
          setStatusCounts(counts);
          setTotalTasks(allTasks.length);
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
      }
    };
    void loadSummaryData();
  }, [user?.id]);

  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.append("PageNumber", "1");
    params.append("PageSize", "1000");
    params.append("TechnicianId", user?.id ?? "");
    if (searchTerm.trim()) params.append("SearchTerm", searchTerm.trim());
    return params.toString();
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        const fetchTasks = async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await axiosInstance.get(`/api/tasks?${buildApiQuery}`);
            if (isTaskListApiResponse(res.data)) {
              const data = Array.isArray(res.data.data)
                ? res.data.data
                    .filter((task) => String(task.status ?? "") !== "Template")
                    .map((task) => ({
                      ...task,
                      status: normalizeTaskStatus(String(task.status ?? "")),
                    }))
                : [];

              let filteredData = [...data];


              // ─── FIX: use ?? 0 to handle undefined createdDate ───────────
              filteredData = [...filteredData].sort((a, b) =>
                new Date(b.createdDate ?? 0).getTime() - new Date(a.createdDate ?? 0).getTime()
              );

              if (statusFilter !== "All")
                filteredData = filteredData.filter((task) => task.status === statusFilter);
              if (todayFilter) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filteredData = filteredData.filter((task) => {
                  const taskEndDate = new Date(task.expectedEndDate);
                  taskEndDate.setHours(0, 0, 0, 0);
                  return taskEndDate.getTime() === today.getTime();
                });
              }
              if (searchTerm.trim()) {
                filteredData = filteredData.filter(
                  (task) =>
                    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
                );
              }

              const startIndex = (currentPage - 1) * tasksPerPage;
              const paginatedData = filteredData.slice(startIndex, startIndex + tasksPerPage);

              const tasksWithNames = await Promise.all(
                paginatedData.map(async (task) => {
                  const [targetName, technicianName] = await Promise.all([
                    fetchTargetName(task.taskTargetType, task.targetId),
                    fetchTechnicianName(task.technicianId),
                  ]);
                  return { ...task, targetName, technicianName };
                })
              );

              setTasks(tasksWithNames);
              setTotalCount(filteredData.length);
            }
          } catch {
            setError(t("technicianTask.unableToLoadTaskList"));
            enqueueSnackbar(t("common.errorLoading"), { variant: "error" });
          } finally {
            setLoading(false);
          }
        };
        void fetchTasks();
      },
      searchTerm ? 300 : 0
    );
    return () => clearTimeout(timeoutId);
  }, [buildApiQuery, statusFilter, searchTerm, todayFilter, currentPage, user?.id, enqueueSnackbar]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm, todayFilter]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);
  const urgentCount = statusCounts.Assigned + statusCounts.InProgress + statusCounts.ReworkRequired;
  const inProgressCount = statusCounts.InProgress;
  const waitingApprovalCount = statusCounts.WaitingForApproval;
  const completedCount = statusCounts.CompletedInTime + statusCounts.CompletedOutTime;
  const totalTrackedTasks = Math.max(totalTasks, 1);
  const completedPercent = Math.round((completedCount / totalTrackedTasks) * 100);

  const getStatusIcon = (status: TaskStatusType) => {
    const iconClass = `w-5 h-5 ${STATUS_ICON_COLORS[status]}`;
    switch (status) {
      case "Assigned":             return <UserPlus className={iconClass} />;
      case "InProgress":           return <Loader className={iconClass} />;
      case "WaitingForApproval":   return <Clock className={iconClass} />;
      case "CompletedInTime":      return <CheckCheck className={iconClass} />;
      case "CompletedOutTime":     return <AlertCircle className={iconClass} />;
      case "Deleted":              return <XCircle className={iconClass} />;
      case "DeclinedByTechnician": return <Inbox className={iconClass} />;
      case "ReworkRequired":       return <AlertCircle className={iconClass} />;
      case "Unknown":              return <XCircle className={iconClass} />;
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          className="mb-8"
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl font-bold text-[#2D5A27] mb-2">
            {t("technicianTask.pageTitle")}
          </h1>
          <p className="text-[#4B6C54] text-lg">
            {t("technicianTask.pageSubtitle")}
          </p>
        </motion.div>

        {/* ── Overview grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(45,90,39,0.18)" }}
            className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.12)] border border-[#DDEEE0] p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#2D5A27] mb-1">
                  {t("technicianTask.overallTaskDistribution")}
                </h3>
                <p className="text-sm text-[#4B6C54]">
                  {t("technicianTask.overallTaskSummary", { defaultValue: "Overview of your tasks" })}
                </p>
              </div>
              <div className="text-right">
                <motion.div
                  key={totalTasks}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-3xl font-bold text-[#2D5A27]"
                >
                  {totalTasks}
                </motion.div>
                <div className="text-xs text-[#4B6C54] mt-1">{t("task.taskList")}</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-[#4B6C54] mb-2">
                <span>{t("technicianTask.completedRate", { defaultValue: "Completed" })}</span>
                <motion.span
                  key={completedPercent}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-[#2D5A27]"
                >
                  {completedPercent}%
                </motion.span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E4F0E8] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#2D5A27]"
                  variants={progressBarVariant}
                  initial="hidden"
                  animate="visible"
                  custom={completedPercent}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              iconBg="bg-gradient-to-br from-[#DA70D6]/30 to-[#F97316]/30 text-[#DA70D6]"
              label={t("technicianTask.urgentTasks", { defaultValue: "Cần làm ngay / Trễ hạn" })}
              help={t("technicianTask.urgentTasksHelp", { defaultValue: "Tasks past due or require immediate attention." })}
              value={urgentCount}
              valueColor="text-[#DA70D6]"
            />
            <StatCard
              icon={<Loader className="w-5 h-5" />}
              iconBg="bg-[#DDEEE0] text-[#2D5A27]"
              label={t("technicianTask.inProgress", { defaultValue: "Đang thực hiện" })}
              help={t("technicianTask.inProgressHelp", { defaultValue: "Tasks currently in progress." })}
              value={inProgressCount}
              valueColor="text-[#2D5A27]"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-[#FFF0F9] text-[#DA70D6]"
              label={t("technicianTask.waitingApproval", { defaultValue: "Chờ phê duyệt" })}
              help={t("technicianTask.waitingApprovalHelp", { defaultValue: "Tasks waiting for approval." })}
              value={waitingApprovalCount}
              valueColor="text-[#DA70D6]"
            />
            <StatCard
              icon={<CheckCheck className="w-5 h-5" />}
              iconBg="bg-[#E5E7EB] text-[#4B5563]"
              label={t("technicianTask.completed", { defaultValue: "Hoàn thành" })}
              help={t("technicianTask.completedHelp", { defaultValue: "Tasks completed on time or late." })}
              value={completedCount}
              valueColor="text-[#4B5563]"
            />
          </motion.div>
        </div>

        {/* ── Filter panel ── */}
        <motion.div
          variants={filterPanelVariant}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(45,90,39,0.08)] border border-[#DDEEE0] p-6 origin-top"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#2D5A27]" />
              <AnimatedSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as TaskStatusType | "All")}
                options={statusOptions}
                placeholder={t("common.status")}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("task.searchTasks")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent transition-shadow"
              />
            </div>

            {/* Clear filters */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setStatusFilter("All"); setSearchTerm(""); setTodayFilter(false); }}
              className="px-4 py-2.5 text-sm text-[#2D5A27] hover:text-[#1e3e1c] hover:bg-[#E4F0E8] rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Table ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <motion.div
                className="w-10 h-10 border-4 border-[#DDEEE0] border-t-[#2D5A27] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <span className="text-gray-500 text-sm">{t("technicianTask.loadingTasks")}</span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-center py-12"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
                  <tr>
                    {[
                      t("task.taskName"),
                      t("task.targetType"),
                      t("technicianTask.technicianName"),
                      t("technicianTask.targetName"),
                      t("task.deadline"),
                      t("common.createdAt"),
                      t("common.status"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {tasks.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={7} className="p-12 text-center text-gray-500">
                          {t("task.noTasks")}
                        </td>
                      </motion.tr>
                    ) : (
                      tasks.map((task, i) => (
                        <motion.tr
                          key={task.id}
                          custom={i}
                          variants={tableRowVariant}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="cursor-pointer hover:bg-[#EBF7EE] transition-colors duration-100"
                          onClick={() => { void navigate(`/technician/tasks/${task.id}`); }}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{task.name}</td>
                          <td className="px-6 py-4 text-gray-600">{task.taskTargetType ?? "-"}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-[160px] truncate">
                            {(task as TaskItem & { technicianName?: string }).technicianName ?? "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                            {task.targetName ?? "-"}
                          </td>
                          <td className="px-6 py-4 text-[#4B6C54]">
                            {formatDateVi(task.expectedEndDate)}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDateVi(task.createdDate)}
                          </td>
                          <td className="px-6 py-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 + 0.1, type: "spring", stiffness: 280, damping: 22 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${STATUS_COLORS[task.status]}`}
                            >
                              {getStatusIcon(task.status)}
                              {getStatusLabel(task.status)}
                            </motion.span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-4 bg-[#F4F7F4] border-t border-[#DDEEE0] flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600">
                    {t("common.showing")} {tasks.length} {t("common.of")} {totalCount} {t("common.tasks")}
                  </span>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
                      >
                        ←
                      </motion.button>
                    )}

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <motion.button
                          key={pageNum}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            currentPage === pageNum
                              ? "bg-[#2D5A27] text-white"
                              : "bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8]"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}

                    {currentPage < totalPages && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
                      >
                        →
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}