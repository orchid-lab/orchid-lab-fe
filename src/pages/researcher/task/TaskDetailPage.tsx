/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-dom/no-missing-button-type */
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Save, X, CheckCircle, RotateCcw, Edit3, Trash2, 
  FileText, Package, UserCheck, CheckSquare, Image as ImageIcon, AlertCircle
} from "lucide-react";
import "./TaskDetailPage.css";

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
  reportInformation?: string;
  url?: string;
  isDaily?: boolean;
}

interface TaskImage {
  id: string;
  targetType: string;
  targetId: string;
  url: string;
}

interface ImageListResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: TaskImage[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Taken":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "InProcess":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "DoneInTime":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DoneInLate":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Cancel":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "ReworkRequired":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "WaitingForApproval":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "Assigned": return t("status.assigned");
    case "Taken": return t("status.taken");
    case "InProcess": return t("status.inProcess");
    case "DoneInTime": return t("status.doneInTime");
    case "DoneInLate": return t("status.doneInLate");
    case "Cancel": return t("status.cancel");
    case "ReworkRequired": return t("status.reworkRequired");
    case "WaitingForApproval": return t("task.waitingForApproval");
    default: return status;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "–";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
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

  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const [checklistEditItem, setChecklistEditItem] = useState<CheckListItemDto | null>(null);
  const [checklistEditForm, setChecklistEditForm] = useState({
    name: "", description: "", expectedMeasureUnit: "", expectedMinValue: "", expectedMaxValue: "",
  });
  const [savingChecklist, setSavingChecklist] = useState(false);
  
  const [taskImages, setTaskImages] = useState<TaskImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalConfirmText, setConfirmModalConfirmText] = useState("");
  const [confirmModalConfirmClass, setConfirmModalConfirmClass] = useState("bg-rose-600 hover:bg-rose-700");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(`/api/tasks/${id}`);
        const raw = response.data as { value?: TaskData };
        const value: TaskData = raw.value ?? (response.data as TaskData);
        if (value?.id) {
          setTaskData(value);
          const creatorId = value.createdBy;
          if (creatorId) {
            try {
              const userResponse = await axiosInstance.get<{ name?: string }>(`/api/user/${creatorId}`);
              setCreatorName(userResponse.data?.name ?? creatorId);
            } catch {
              setCreatorName(creatorId);
            }
          }
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("task.loadError");
        setError(errorMessage);
        enqueueSnackbar(t("task.taskDetailLoadError"), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    void fetchTaskDetail();
  }, [id, enqueueSnackbar, t]);

  useEffect(() => {
    const fetchTaskImages = async () => {
      if (!id) { setTaskImages([]); return; }
      try {
        setLoadingImages(true);
        const response = await axiosInstance.get<ImageListResponse>("/api/images", {
          params: { PageNumber: 1, PageSize: 1000, TargetId: id },
        });
        const images = (response.data?.data ?? []).filter(
          (image) => image.targetType === "Task" && image.targetId === id,
        );
        setTaskImages(images);
      } catch {
        setTaskImages([]);
      } finally {
        setLoadingImages(false);
      }
    };
    void fetchTaskImages();
  }, [id]);

  const handleEdit = () => {
    if (!taskData) return;
    setEditTaskName(taskData.name);
    setEditTaskDescription(taskData.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

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
        updateTaskAssignment: taskData.taskAssignments ? {
          taskAssignmentId: taskData.taskAssignments.taskId,
          targetType: taskData.taskAssignments.targetType,
          targetId: taskData.taskAssignments.targetId,
          expectedEndDate: taskData.taskAssignments.expectedEndDate,
        } : null,
      });
      enqueueSnackbar(t("task.taskUpdatedSuccess"), { variant: "success" });
      setIsEditing(false);
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(`/api/tasks/${id}`);
      const raw = response.data as { value?: TaskData };
      setTaskData(raw.value ?? (response.data as TaskData));
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("task.taskUpdateFailed"), { variant: "error" });
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
      expectedMinValue: item.expectedMinValue !== null ? String(item.expectedMinValue) : "",
      expectedMaxValue: item.expectedMaxValue !== null ? String(item.expectedMaxValue) : "",
    });
  };

  const handleSaveChecklistItem = async () => {
    if (!checklistEditItem || !id) return;
    try {
      setSavingChecklist(true);
      await axiosInstance.put(`/api/tasks/${id}/checklist-items/${checklistEditItem.id}`, {
        name: checklistEditForm.name,
        description: checklistEditForm.description || null,
        expectedMeasureUnit: checklistEditForm.expectedMeasureUnit || null,
        expectedMinValue: checklistEditForm.expectedMinValue !== "" ? Number(checklistEditForm.expectedMinValue) : null,
        expectedMaxValue: checklistEditForm.expectedMaxValue !== "" ? Number(checklistEditForm.expectedMaxValue) : null,
      });
      enqueueSnackbar(t("task.checklistUpdatedSuccess"), { variant: "success" });
      setChecklistEditItem(null);
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(`/api/tasks/${id}`);
      const raw = response.data as { value?: TaskData };
      setTaskData(raw.value ?? (response.data as TaskData));
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("task.checklistUpdateFailed"), { variant: "error" });
    } finally {
      setSavingChecklist(false);
    }
  };

  const openConfirmModal = (options: { title: string; message: string; confirmText: string; confirmClass?: string; onConfirm: () => void; }) => {
    setConfirmModalTitle(options.title);
    setConfirmModalMessage(options.message);
    setConfirmModalConfirmText(options.confirmText);
    setConfirmModalConfirmClass(options.confirmClass ?? "bg-rose-600 hover:bg-rose-700");
    setConfirmAction(() => options.onConfirm);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    if (confirmingAction) return;
    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmModalAction = async () => {
    if (!confirmAction) return;
    try {
      setConfirmingAction(true);
      await Promise.resolve(confirmAction());
      setConfirmModalOpen(false);
      setConfirmAction(null);
    } finally {
      setConfirmingAction(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!id) return;
    try {
      await axiosInstance.delete(`/api/tasks/${id}/checklist-items/${itemId}`);
      enqueueSnackbar(t("task.checklistDeletedSuccess"), { variant: "success" });
      const response = await axiosInstance.get<{ value?: TaskData } | TaskData>(`/api/tasks/${id}`);
      const raw = response.data as { value?: TaskData };
      setTaskData(raw.value ?? (response.data as TaskData));
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("task.checklistDeleteFailed"), { variant: "error" });
    }
  };

  const requestDeleteChecklistItem = (itemId: string) => {
    openConfirmModal({
      title: t("common.confirm"),
      message: t("task.confirmDeleteChecklist"),
      confirmText: t("common.delete"),
      confirmClass: "bg-rose-600 hover:bg-rose-700",
      onConfirm: () => void handleDeleteChecklistItem(itemId),
    });
  };

  const handleDelete = () => {
    openConfirmModal({
      title: t("common.confirm"),
      message: t("task.confirmDeleteTask"),
      confirmText: t("common.delete"),
      confirmClass: "bg-rose-600 hover:bg-rose-700 text-white",
      onConfirm: () => {
        setLoading(true);
        axiosInstance.delete(`/api/tasks`, { data: { taskId: id } })
          .then(() => {
            enqueueSnackbar(t("task.taskDeletedSuccess"), { variant: "success" });
            void navigate("/researcher/tasks");
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : t("task.deleteError"));
            enqueueSnackbar(t("task.taskDeleteFailed"), { variant: "error" });
          })
          .finally(() => setLoading(false));
      },
    });
  };

  const handleApprove = async () => {
    if (!taskData) return;
    try {
      setLoading(true);
      let approvalStatus = "CompletedInTime";
      if (taskData.taskAssignments?.expectedEndDate) {
        const approvalDate = new Date();
        const expectedEndDate = new Date(taskData.taskAssignments.expectedEndDate);
        if (approvalDate > expectedEndDate) approvalStatus = "CompletedOutTime";
      }
      await axiosInstance.put("/api/tasks/change-task-status", {
        todoTaskId: taskData.id,
        status: approvalStatus,
        endDate: new Date().toISOString(),
      });
      enqueueSnackbar(t("task.approvedSuccess"), { variant: "success" });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("task.approveError"));
      enqueueSnackbar(t("task.approveFailed"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRework = () => {
    if (!taskData) return;
    openConfirmModal({
      title: t("common.confirm"),
      message: t("task.confirmRequestRework"),
      confirmText: t("task.requestRework"),
      confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
      onConfirm: () => {
        setLoading(true);
        axiosInstance.put("/api/tasks/change-task-status", {
          todoTaskId: taskData.id,
          status: "ReworkRequired",
        })
        .then(() => {
          enqueueSnackbar(t("task.reworkRequestedSuccess"), { variant: "success" });
          window.location.reload();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : t("task.reworkRequestError"));
          enqueueSnackbar(t("task.reworkRequestFailed"), { variant: "error" });
        })
        .finally(() => setLoading(false));
      },
    });
  };

  const handleBack = () => navigate("/researcher/tasks");

  const sortedChecklistItems = taskData?.taskCheckList?.checkListItemDtos?.slice().sort((a, b) => a.order - b.order) ?? [];

  return (
    <main className="task-detail-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-800 p-6 lg:p-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-blue-600">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="font-medium">{t("common.loadingData")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <p className="text-rose-600 font-medium mb-4">{t("common.error")}: {error}</p>
          <button type="button" onClick={handleBack} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium shadow-sm transition-colors">
            {t("common.back")}
          </button>
        </div>
      ) : !taskData ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-slate-500 font-medium mb-4">{t("task.taskDataNotFound")}</p>
          <button type="button" onClick={handleBack} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium shadow-sm transition-colors">
            {t("common.back")}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <div>
              <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-semibold mb-3 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4" /> {t("task.breadcrumb") || "Quay lại danh sách"}
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">{taskData.name}</h1>
              {taskData.status && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(taskData.status)}`}>
                  {getStatusLabel(taskData.status, t)}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <>
                  <button type="button" onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                    <X className="w-4 h-4" /> {t("common.cancel")}
                  </button>
                  <button type="button" onClick={handleSaveTask} disabled={savingTask} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
                    <Save className="w-4 h-4" /> {savingTask ? t("common.saving") : t("common.save")}
                  </button>
                </>
              ) : (
                <>
                  {taskData.status === "WaitingForApproval" && (
                    <>
                      <button type="button" onClick={handleRequestRework} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-200 text-amber-700 font-semibold rounded-xl shadow-sm hover:bg-amber-50 transition-colors">
                        <RotateCcw className="w-4 h-4" /> {t("task.requestRework")}
                      </button>
                      <button type="button" onClick={handleApprove} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors">
                        <CheckCircle className="w-4 h-4" /> {t("task.approve")}
                      </button>
                    </>
                  )}
                  <button type="button" onClick={handleEdit} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                    <Edit3 className="w-4 h-4" /> {t("common.edit")}
                  </button>
                  <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 font-semibold rounded-xl shadow-sm hover:bg-rose-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> {t("common.delete")}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* --- LEFT COLUMN --- */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* DESCRIPTION & BASIC INFO */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Thông tin chung
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.creator")}</p>
                    <p className="text-sm font-medium text-slate-800">{creatorName || taskData.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("common.createdAt")}</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(taskData.createdDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{t("common.description")}</p>
                  {isEditing ? (
                    <textarea
                      value={editTaskDescription}
                      onChange={(e) => setEditTaskDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none bg-white shadow-sm"
                    />
                  ) : (
                    <div className="px-4 py-3 border border-slate-100 rounded-xl bg-slate-50/50 text-slate-700 min-h-[100px] whitespace-pre-wrap text-sm leading-relaxed">
                      {taskData.description || <span className="italic text-slate-400">Không có mô tả</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKLIST */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" /> {t("task.taskChecklist")}
                </h3>
                
                {taskData.taskCheckList && Array.isArray(taskData.taskCheckList.checkListItemDtos) && taskData.taskCheckList.checkListItemDtos.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center">#</th>
                          <th className="px-4 py-3">{t("task.checklistName")}</th>
                          <th className="px-4 py-3 text-center">{t("task.expectedUnit")}</th>
                          <th className="px-4 py-3 text-center">{t("task.measuredValue")}</th>
                          <th className="px-4 py-3 text-center">{t("task.checklistPassLabel")}</th>
                          <th className="px-4 py-3 text-right">{t("common.action")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedChecklistItems.map((item) => (
                          <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-500 font-medium">{item.order}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.expectedMinValue !== null && item.expectedMaxValue !== null 
                                ? `${item.expectedMinValue} - ${item.expectedMaxValue} ${item.expectedUnit ?? ''}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-700">
                              {item.mesuredValue ? `${item.mesuredValue} ${item.measurementUnit ?? ''}` : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.isPass === null ? (
                                <span className="text-slate-400">-</span>
                              ) : item.isPass ? (
                                <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Đạt</span>
                              ) : (
                                <span className="inline-flex px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold">Không đạt</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => handleOpenChecklistEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t("common.edit")}>
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => requestDeleteChecklistItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t("common.delete")}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-slate-500 italic">
                    {t("task.noChecklist")}
                  </div>
                )}
              </div>

              {/* IMAGES */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" /> Bằng chứng hoàn thành
                </h3>
                {loadingImages ? (
                  <div className="px-4 py-8 border border-slate-100 rounded-xl bg-slate-50 text-center text-blue-600 flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    {t("common.loadingData")}
                  </div>
                ) : taskImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {taskImages.map((image) => (
                      <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:shadow-md hover:border-blue-300 transition-all aspect-square relative group">
                        <img src={image.url} alt="Evidence" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white font-semibold text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-opacity">Xem ảnh lớn</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-slate-500 italic">
                    Chưa có hình bằng chứng cho task này.
                  </div>
                )}
              </div>

            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="space-y-6">
              
              {/* ASSIGNMENT INFO */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserCheck className="w-4 h-4 text-blue-600" /> {t("task.assignmentInfo")}
                </h3>
                {taskData.taskAssignments ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.technician")}</p>
                      <p className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                        {taskData.taskAssignments.technicianName || "Chưa phân công"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("common.startDate")}</p>
                      <p className="text-sm font-medium text-slate-800 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50">
                        {formatDate(taskData.taskAssignments.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.expectedEndDate")}</p>
                      <p className="text-sm font-medium text-slate-800 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50">
                        {formatDate(taskData.taskAssignments.expectedEndDate)}
                      </p>
                    </div>
                    {taskData.taskAssignments.endDate && taskData.taskAssignments.endDate !== "0001-01-01T00:00:00" && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.endDate")}</p>
                        <p className="text-sm font-medium text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 bg-emerald-50">
                          {formatDate(taskData.taskAssignments.endDate)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-500 italic text-sm">
                    {t("task.noAssignmentInfo")}
                  </div>
                )}
              </div>

              {/* MATERIALS */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Package className="w-4 h-4 text-blue-600" /> {t("task.materials")}
                </h3>
                {Array.isArray(taskData.taskAttributes) && taskData.taskAttributes.length > 0 ? (
                  <div className="space-y-3">
                    {taskData.taskAttributes.map((attr, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-slate-800">{attr.materialName ?? attr.chemicalName ?? "-"}</span>
                          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {attr.value ?? 0} {attr.unit ?? ""}
                          </span>
                        </div>
                        {attr.materialName && attr.chemicalName && (
                          <div className="text-xs text-slate-500">Hóa chất: {attr.chemicalName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-500 italic text-sm">
                    {t("task.noMaterialsRecorded")}
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* --- MODALS --- */}
      
      {/* Confirm Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 task-modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModalTitle}</h3>
            <p className="text-slate-600 text-sm mb-6">{confirmModalMessage}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeConfirmModal} disabled={confirmingAction} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors disabled:opacity-60">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={() => void handleConfirmModalAction()} disabled={confirmingAction} className={`px-4 py-2 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${confirmModalConfirmClass}`}>
                {confirmingAction ? t("common.saving") : confirmModalConfirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Checklist Item Edit Modal */}
      {checklistEditItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 task-modal-overlay p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col w-full max-w-lg max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> {t("task.editChecklistItem")}
              </h3>
              <button onClick={() => setChecklistEditItem(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("common.name")} <span className="text-rose-500">*</span></label>
                <input type="text" value={checklistEditForm.name} onChange={(e) => setChecklistEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("common.description")}</label>
                <textarea value={checklistEditForm.description} onChange={(e) => setChecklistEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 bg-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.expectedUnit")}</label>
                <input type="text" value={checklistEditForm.expectedMeasureUnit} onChange={(e) => setChecklistEditForm((f) => ({ ...f, expectedMeasureUnit: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.minExpected")}</label>
                  <input type="number" value={checklistEditForm.expectedMinValue} onChange={(e) => setChecklistEditForm((f) => ({ ...f, expectedMinValue: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.maxExpected")}</label>
                  <input type="number" value={checklistEditForm.expectedMaxValue} onChange={(e) => setChecklistEditForm((f) => ({ ...f, expectedMaxValue: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 bg-white" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setChecklistEditItem(null)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-sm">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={() => void handleSaveChecklistItem()} disabled={savingChecklist || !checklistEditForm.name.trim()} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm text-sm">
                <Save className="w-4 h-4" /> {savingChecklist ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default TaskDetailPage;