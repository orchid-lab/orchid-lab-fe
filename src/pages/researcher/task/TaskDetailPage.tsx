import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

interface TaskAttribute {
  chemicalName: string | null;
  materialName: string | null;
  unit: string | null;
  value: number | null;
}

interface TaskAssignment {
  taskId: string;
  technicianName: string;
  targetType: string;
  targetId: string;
  startDate: string;
  endDate: string;
  expectedEndDate: string;
}

interface CheckListItemDto {
  id: string;
  name: string;
  description: string;
  order: number;
  expectedUnit: string | null;
  expectedMinValue: number | null;
  expectedMaxValue: number | null;
  status: string;
  measurementUnit: string | null;
  mesuredValue: number | null;
  isPass: boolean | null;
  evaluated: string | null;
}

interface TaskCheckList {
  id: string;
  checkListItemDtos: CheckListItemDto[];
}

interface TaskData {
  id: string;
  name: string;
  description: string;
  stageId: string | null;
  researcherId: string;
  status: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  deletedDate: string | null;
  deletedBy: string | null;
  taskAttributes: TaskAttribute[];
  taskAssignments: TaskAssignment | null;
  taskCheckList: TaskCheckList | null;
  reportInformation?: string; // Added optional property
  url?: string; // Added optional property
  isDaily?: boolean; // Added optional property
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Assigned":
      return "bg-blue-100 text-blue-800";
    case "Taken":
      return "bg-purple-100 text-purple-800";
    case "InProcess":
      return "bg-yellow-100 text-yellow-800";
    case "DoneInTime":
      return "bg-green-100 text-green-800";
    case "DoneInLate":
      return "bg-orange-100 text-orange-800";
    case "Cancel":
      return "bg-red-100 text-red-800";
    case "WaitingForApproval":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "Assigned":
      return t("status.assigned");
    case "Taken":
      return t("status.taken");
    case "InProcess":
      return t("status.inProcess");
    case "DoneInTime":
      return t("status.doneInTime");
    case "DoneInLate":
      return t("status.doneInLate");
    case "Cancel":
      return t("status.cancel");
    case "WaitingForApproval":
      return t("task.waitingForApproval");
    default:
      return status;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "–";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TaskDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [creatorName, setCreatorName] = useState<string>("");

  // Task edit state
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Checklist item edit modal state
  const [checklistEditItem, setChecklistEditItem] =
    useState<CheckListItemDto | null>(null);
  const [checklistEditForm, setChecklistEditForm] = useState({
    name: "",
    description: "",
    expectedMeasureUnit: "",
    expectedMinValue: "",
    expectedMaxValue: "",
  });
  const [savingChecklist, setSavingChecklist] = useState(false);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axiosInstance.get<
          { value?: TaskData } | TaskData
        >(`/api/tasks/${id}`);
        const raw = response.data as { value?: TaskData };
        const value: TaskData = raw.value ?? (response.data as TaskData);
        if (value?.id) {
          setTaskData(value);
          const creatorId = value.createdBy;
          if (creatorId) {
            try {
              const userResponse = await axiosInstance.get<{ name?: string }>(
                `/api/user/${creatorId}`,
              );
              setCreatorName(userResponse.data?.name ?? creatorId);
            } catch {
              setCreatorName(creatorId);
            }
          }
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("task.loadError");
        setError(errorMessage);
        enqueueSnackbar(t("task.taskDetailLoadError"), {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    void fetchTaskDetail();
  }, [id, enqueueSnackbar, t]);

  const handleEdit = () => {
    if (!taskData) return;
    setEditTaskName(taskData.name);
    setEditTaskDescription(taskData.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveTask = async () => {
    if (!taskData || !id) return;
    try {
      setSavingTask(true);
      await axiosInstance.put("/api/tasks", {
        taskId: id,
        stageId: taskData.stageId ?? 0,
        name: editTaskName,
        description: editTaskDescription,
        createTaskAttribute: [],
        updateTaskAttribute: [],
        updateTaskAssignment: taskData.taskAssignments
          ? {
              taskAssignmentId: taskData.taskAssignments.taskId,
              targetType: taskData.taskAssignments.targetType,
              targetId: taskData.taskAssignments.targetId,
              expectedEndDate: taskData.taskAssignments.expectedEndDate,
            }
          : null,
      });
      enqueueSnackbar(t("task.taskUpdatedSuccess"), { variant: "success" });
      setIsEditing(false);
      // Refresh data
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(
        `/api/tasks/${id}`,
      );
      const raw = response.data as { value?: TaskData };
      const value: TaskData = raw.value ?? (response.data as TaskData);
      setTaskData(value);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("task.taskUpdateFailed"),
        { variant: "error" },
      );
    } finally {
      setSavingTask(false);
    }
  };

  const handleOpenChecklistEdit = (item: CheckListItemDto) => {
    setChecklistEditItem(item);
    setChecklistEditForm({
      name: item.name,
      description: item.description ?? "",
      expectedMeasureUnit: item.expectedUnit ?? "",
      expectedMinValue:
        item.expectedMinValue !== null ? String(item.expectedMinValue) : "",
      expectedMaxValue:
        item.expectedMaxValue !== null ? String(item.expectedMaxValue) : "",
    });
  };

  const handleSaveChecklistItem = async () => {
    if (!checklistEditItem || !id) return;
    try {
      setSavingChecklist(true);
      await axiosInstance.put(
        `/api/tasks/${id}/checklist-items/${checklistEditItem.id}`,
        {
          name: checklistEditForm.name,
          description: checklistEditForm.description || null,
          expectedMeasureUnit: checklistEditForm.expectedMeasureUnit || null,
          expectedMinValue:
            checklistEditForm.expectedMinValue !== ""
              ? Number(checklistEditForm.expectedMinValue)
              : null,
          expectedMaxValue:
            checklistEditForm.expectedMaxValue !== ""
              ? Number(checklistEditForm.expectedMaxValue)
              : null,
        },
      );
      enqueueSnackbar(t("task.checklistUpdatedSuccess"), { variant: "success" });
      setChecklistEditItem(null);
      // Refresh
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(
        `/api/tasks/${id}`,
      );
      const raw = response.data as { value?: TaskData };
      setTaskData(raw.value ?? (response.data as TaskData));
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("task.checklistUpdateFailed"),
        { variant: "error" },
      );
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!id || !window.confirm(t("task.confirmDeleteChecklist")))
      return;
    try {
      await axiosInstance.delete(`/api/tasks/${id}/checklist-items/${itemId}`);
      enqueueSnackbar(t("task.checklistDeletedSuccess"), { variant: "success" });
      // Refresh
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(
        `/api/tasks/${id}`,
      );
      const raw = response.data as { value?: TaskData };
      setTaskData(raw.value ?? (response.data as TaskData));
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("task.checklistDeleteFailed"),
        { variant: "error" },
      );
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("task.confirmDeleteTask"))) {
      setLoading(true);
      axiosInstance
        .delete(`/api/tasks`, { data: { taskId: id } }) // Updated API call to match the provided API details
        .then(() => {
          enqueueSnackbar(t("task.taskDeletedSuccess"), {
            variant: "success",
          });
          void navigate("/tasks");
        })
        .catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : t("task.deleteError");
          setError(errorMessage);
          enqueueSnackbar(t("task.taskDeleteFailed"), {
            variant: "error",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleApprove = async () => {
    if (!taskData) return;
    try {
      setLoading(true);
      await axiosInstance.put("/api/tasks/change-task-status", {
        todoTaskId: taskData.id,
        status: "WaitingForApproval",
        endDate: new Date().toISOString(),
      });
      enqueueSnackbar(t("task.approvedSuccess"), { variant: "success" });
      // Optionally refresh task data
      window.location.reload();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("task.approveError");
      setError(errorMessage);
      enqueueSnackbar(t("task.approveFailed"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    void navigate("/tasks");
  };

  const sortedChecklistItems =
    taskData?.taskCheckList?.checkListItemDtos
      ?.slice()
      .sort((a, b) => a.order - b.order) ?? [];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      {loading ? (
        <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("common.loadingData")}</p>
          </div>
        </main>
      ) : error ? (
        <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t("common.error")}: {error}</p>
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              {t("common.back")}
            </button>
          </div>
        </main>
      ) : !taskData ? (
        <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {t("task.taskDataNotFound")}
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              {t("common.back")}
            </button>
          </div>
        </main>
      ) : (
        <>
          {/* Header + Status badge */}
          <div className="w-full max-w-[1600px] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  {t("task.breadcrumb")}
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {taskData.name}
                </div>
                {taskData.status === "WaitingForApproval" && (
                  <span className={`w-fit ${getStatusColor(taskData.status)}`}>
                    {getStatusLabel(taskData.status, t)}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveTask();
                      }}
                      disabled={savingTask}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {savingTask ? t("common.saving") : `💾 ${t("common.save")}`}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                  </>
                ) : (
                  <>
                    {taskData.status === "WaitingForApproval" && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleApprove();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
                      >
                        <span>✔️</span> {t("task.approve")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-orange-700 font-semibold rounded-lg shadow hover:bg-orange-50 transition-colors"
                    >
                      <span>✏️</span> {t("common.edit")}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors"
                >
                  <span>🗑️</span> {t("task.deleteTask")}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[1600px] flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{t("common.name")}:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTaskName}
                      onChange={(e) => setEditTaskName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    />
                  ) : (
                    <span className="text-gray-800">{taskData.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{t("task.id")}:</span>
                  <span className="text-gray-800">{taskData.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    {t("task.creator")}:
                  </span>
                  <span className="text-gray-800">
                    {creatorName || taskData.createdBy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{t("common.createdAt")}:</span>
                  <span className="text-gray-800">
                    {formatDate(taskData.createdDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    {t("common.updatedAt")}:
                  </span>
                  <span className="text-gray-800">
                    {formatDate(taskData.updatedDate)}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <span className="font-semibold text-gray-700">{t("common.description")}:</span>
                {isEditing ? (
                  <textarea
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    rows={4}
                    className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 resize-y"
                  />
                ) : (
                  <div className="mt-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 min-h-[80px]">
                    {taskData.description}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Nguyên vật liệu */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t("task.materials")}
              </h3>
              {Array.isArray(taskData.taskAttributes) &&
              taskData.taskAttributes.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-3 mb-2 font-medium text-sm text-gray-700">
                    <span>{t("task.materialName")}</span>
                    <span>{t("task.unit")}</span>
                    <span>{t("task.quantity")}</span>
                    <span>{t("task.chemicalName")}</span>
                  </div>
                  {taskData.taskAttributes.map((attr) => (
                    <div
                      className="grid grid-cols-4 gap-3 mb-2"
                      key={`${attr.materialName ?? ""}-${attr.chemicalName ?? ""}-${attr.unit ?? ""}-${String(attr.value ?? "")}`}
                    >
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.materialName ?? "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.unit ?? "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.value ?? "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.chemicalName ?? "-"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                  {t("task.noMaterialsRecorded")}
                </div>
              )}
            </div>

            {/* Card 3: Phân công & Checklist */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t("task.assignmentInfo")}
              </h3>
              {taskData.taskAssignments ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-3 mb-2 font-medium text-sm text-gray-700">
                    <span>{t("task.technician")}</span>
                    <span>{t("common.startDate")}</span>
                    <span>{t("task.endDate")}</span>
                    <span>{t("task.expectedEndDate")}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {taskData.taskAssignments.technicianName || "-"}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {formatDate(taskData.taskAssignments.startDate)}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {taskData.taskAssignments.endDate &&
                      taskData.taskAssignments.endDate !== "0001-01-01T00:00:00"
                        ? formatDate(taskData.taskAssignments.endDate)
                        : "-"}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {formatDate(taskData.taskAssignments.expectedEndDate)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                  {t("task.noAssignmentInfo")}
                </div>
              )}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {t("task.taskChecklist")}
                </h3>
                {taskData.taskCheckList &&
                Array.isArray(taskData.taskCheckList.checkListItemDtos) &&
                taskData.taskCheckList.checkListItemDtos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 font-medium">
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.checklistOrder")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.checklistName")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("common.description")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.expectedUnit")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.minExpected")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.maxExpected")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.measureUnit")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.measuredValue")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.checklistPassLabel")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("task.checklistEvaluation")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("common.status")}
                          </th>
                          <th className="px-3 py-2 text-left border border-gray-200 whitespace-nowrap">
                            {t("common.action")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedChecklistItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.order}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.description ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.expectedUnit ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.expectedMinValue ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.expectedMaxValue ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.measurementUnit ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.mesuredValue ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.isPass === null
                                ? "-"
                                : item.isPass
                                  ? t("task.checklistPassResult")
                                  : t("task.checklistFailResult")}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.evaluated ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 text-gray-700">
                              {item.status}
                            </td>
                            <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenChecklistEdit(item)}
                                  className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                >
                                  ✏️ {t("common.edit")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleDeleteChecklistItem(item.id);
                                  }}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                  🗑️ {t("common.delete")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                    {t("task.noChecklist")}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Báo cáo & Loại nhiệm vụ */}
            {/* <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin báo cáo
                </h3>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 mb-4">
                  {taskData.reportInformation ?? "Không có"}
                </div>
                {taskData.url && (
                  <div className="mb-4">
                    <label className="font-medium mb-1.5">Ảnh báo cáo</label>
                    <a
                      href={taskData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline break-all mb-2 block"
                    >
                      {taskData.url}
                    </a>
                    <img
                      src={taskData.url}
                      alt="Report"
                      className="max-h-64 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Loại nhiệm vụ
                </h3>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {taskData.isDaily === true
                    ? "Lặp lại hằng ngày tới ngày kết thúc"
                    : taskData.isDaily === false
                      ? "Thực hiện một lần"
                      : "Không có"}
                </div>
              </div>
            </div> */}
          </div>
        </>
      )}

      {/* Checklist Item Edit Modal */}
      {checklistEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {t("task.editChecklistItem")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("common.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={checklistEditForm.name}
                  onChange={(e) =>
                    setChecklistEditForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("common.description")}
                </label>
                <textarea
                  value={checklistEditForm.description}
                  onChange={(e) =>
                    setChecklistEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("task.expectedUnit")}
                </label>
                <input
                  type="text"
                  value={checklistEditForm.expectedMeasureUnit}
                  onChange={(e) =>
                    setChecklistEditForm((f) => ({
                      ...f,
                      expectedMeasureUnit: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("task.minExpected")}
                  </label>
                  <input
                    type="number"
                    value={checklistEditForm.expectedMinValue}
                    onChange={(e) =>
                      setChecklistEditForm((f) => ({
                        ...f,
                        expectedMinValue: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("task.maxExpected")}
                  </label>
                  <input
                    type="number"
                    value={checklistEditForm.expectedMaxValue}
                    onChange={(e) =>
                      setChecklistEditForm((f) => ({
                        ...f,
                        expectedMaxValue: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setChecklistEditItem(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSaveChecklistItem();
                }}
                disabled={savingChecklist || !checklistEditForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
              >
                {savingChecklist ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TaskDetailPage;
