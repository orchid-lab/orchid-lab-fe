import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import type {
  MonitoringLogDetail,
  LogDetail,
} from "../../../types/MonitoringLogDetail";

export default function MonitoringLogDetail() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [log, setLog] = useState<MonitoringLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvingOrRejecting, setApprovingOrRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, number | null>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isResearcher = user?.roleId === 2;
  const isTechnician = user?.roleId === 3;
  const isOwner = user?.id === log?.createdBy;
  const canEdit = isTechnician && log?.status === "Rejected" && isOwner;
  const canSubmit =
    isTechnician &&
    (log?.status === "Created" || log?.status === "Rejected") &&
    isOwner;
  const canApproveOrReject =
    isResearcher &&
    (log?.status === "WaitingForApproval" || log?.status === "Revised");

  const fetchLog = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/monitoring-log/${id}`);
      const logData = res.data as MonitoringLogDetail;
      setLog(logData);
      // Init editing values
      if (logData?.logDetails) {
        const values: Record<string, number | null> = {};
        logData.logDetails.forEach((detail: LogDetail) => {
          values[detail.id] = detail.measuredValue;
        });
        setEditingValues(values);
      }
    } catch (error) {
      console.error("Failed to fetch monitoring log detail:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("common.errorLoading"),
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLog();
  }, [id]);

  const handleEditChange = (detailId: string, value: string) => {
    const numValue = Number(value);
    setEditingValues((prev) => ({
      ...prev,
      [detailId]: value === "" ? null : (Number.isNaN(numValue) ? 0 : numValue),
    }));
  };

  const handleSaveChanges = async () => {
    if (!id || !log) return;

    const updates = Object.entries(editingValues).map(
      ([logDetailId, measuredValue]) => ({
        logDetailId,
        measuredValue,
      })
    );

    setSubmitting(true);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${id}/update-details`, updates);
      enqueueSnackbar(t("monitoringLog.updateDetailsSuccess"), {
        variant: "success",
      });
      setIsEditing(false);
      await fetchLog();
    } catch (error) {
      console.error("Failed to update log details:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.updateDetailsFailed"),
        { variant: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${id}/submit`);
      enqueueSnackbar(
        log?.status === "Created"
          ? t("monitoringLog.submitDraftSuccess")
          : t("monitoringLog.resubmitSuccess"),
        { variant: "success" }
      );
      await fetchLog();
    } catch (error) {
      console.error("Failed to submit:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.submitDraftFailed"),
        { variant: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApprovingOrRejecting(true);
    try {
      // Lấy sampleStageId từ log
      const monitoringLogRes = await axiosInstance.get(`/api/monitoring-log/${id}`);
      const monitoringLog = monitoringLogRes.data as MonitoringLogDetail;
      const sampleStageId = (monitoringLog as any).sampleStageId || (log as any)?.sampleStageId;
      // Lấy ảnh đầu tiên của monitoring log (nếu có)
      const imageObj = monitoringLog.images && monitoringLog.images.length > 0 ? monitoringLog.images[0] : null;
      if (imageObj && sampleStageId) {
        // Lấy file từ url (fetch blob)
        const response = await fetch(imageObj.url);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("image", blob, "monitoring-log-image.jpg");
        formData.append("targetType", "SampleStage");
        formData.append("targetId", sampleStageId);
        await axiosInstance.post("/api/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await axiosInstance.patch(`/api/monitoring-log/${id}/approve`);
      enqueueSnackbar(t("monitoringLog.approveSuccess"), { variant: "success" });
      await fetchLog();
    } catch (error) {
      console.error("Failed to approve:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.approveFailed"),
        { variant: "error" }
      );
    } finally {
      setApprovingOrRejecting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      enqueueSnackbar(t("monitoringLog.rejectionReasonRequired"), {
        variant: "warning",
      });
      return;
    }

    setApprovingOrRejecting(true);
    try {
      await axiosInstance.patch(
        `/api/monitoring-log/${id}/reject`,
        JSON.stringify(rejectionReason.trim()),
        { headers: { "Content-Type": "application/json" } }
      );
      enqueueSnackbar(t("monitoringLog.rejectSuccess"), { variant: "success" });
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchLog();
    } catch (error) {
      console.error("Failed to reject:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.rejectFailed"),
        { variant: "error" }
      );
    } finally {
      setApprovingOrRejecting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Created":
        return "bg-blue-50 border border-blue-200 text-blue-700";
      case "WaitingForApproval":
        return "bg-orange-50 border border-orange-200 text-orange-700";
      case "Approved":
        return "bg-green-50 border border-green-200 text-green-700";
      case "Rejected":
        return "bg-red-50 border border-red-200 text-red-700";
      case "Revised":
        return "bg-indigo-50 border border-indigo-200 text-indigo-700";
      default:
        return "bg-gray-50 border border-gray-200 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Created":
        return t("monitoringLog.statusCreated");
      case "WaitingForApproval":
        return t("monitoringLog.statusWaitingForApproval");
      case "Approved":
        return t("monitoringLog.statusApproved");
      case "Rejected":
        return t("monitoringLog.statusRejected");
      case "Revised":
        return t("monitoringLog.statusRevised");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">{t("common.loadingData")}</div>
      </main>
    );
  }

  if (!log) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">{t("common.noData")}</div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-10 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-6 hover:bg-green-800 hover:text-white transition"
          onClick={() =>
            void navigate(
              isTechnician
                ? `/technician/reports`
                : `/researcher/reports`
            )
          }
        >
          &larr; {t("common.back")}
        </button>

        <div className="bg-white rounded-xl shadow p-8 mb-8">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t("monitoringLog.reportName")}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {log.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t("monitoringLog.sampleName")}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {log.sampleName}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t("common.status")}
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                  log.status
                )}`}
              >
                {getStatusLabel(log.status)}
              </span>
              {log.isNewest && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                    {t("monitoringLog.newest")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="border-t pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  {t("monitoringLog.createdDate")}
                </div>
                <div className="text-gray-900">
                  {new Date(log.createdDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t("monitoringLog.sampleStage")}</div>
                <div className="text-gray-900">
                  {log.sampleStageDefinitionName}
                </div>
              </div>
              {log.diseaseName && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">
                    {t("monitoringLog.diseaseDetected")}
                  </div>
                  <div className="text-red-600 font-semibold">
                    {log.diseaseName}
                  </div>
                </div>
              )}
              {log.updatedDate && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {t("monitoringLog.lastUpdated")}
                  </div>
                  <div className="text-gray-900">
                    {new Date(log.updatedDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analytic Result Section */}
          {log.analyticResult && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("monitoringLog.aiDiseaseAnalysisResult")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(log.analyticResult)
                  .filter(([key]) => key !== "id")
                  .map(([diseaseKey, percentage]) => {
                    const decimalValue = Number(percentage);
                    const percentValue = decimalValue * 100;
                    const isHealthy = diseaseKey === "healthy";
                    const isHighRisk = percentValue > 50 && !isHealthy;
                    
                    // Hiển thị 0.00% cho các giá trị rất nhỏ (< 0.01%), còn lại hiển thị đầy đủ
                    const displayValue = percentValue < 0.01 
                      ? "0.00" 
                      : percentValue.toFixed(4);

                    return (
                      <div
                        key={diseaseKey}
                        className={`p-3 rounded-lg border ${
                          isHealthy
                            ? "bg-green-50 border-green-200"
                            : isHighRisk
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div
                          className={`text-xs font-medium mb-1 ${
                            isHealthy
                              ? "text-green-700"
                              : isHighRisk
                              ? "text-red-700"
                              : "text-gray-700"
                          }`}
                        >
                          {t(`diseases.${diseaseKey}`)}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            isHealthy
                              ? "text-green-900"
                              : isHighRisk
                              ? "text-red-900"
                              : "text-gray-900"
                          }`}
                        >
                          {displayValue}%
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {log.status === "Rejected" && log.rejectionReason && (
            <div className="border-t pt-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 font-semibold mb-2">
                  {t("monitoringLog.rejectionReasonLabel")}
                </div>
                <div className="text-red-900">{log.rejectionReason}</div>
                {log.rejectedDate && (
                  <div className="text-xs text-red-600 mt-2">
                    {t("monitoringLog.rejectedOn")}{" "}
                    {new Date(log.rejectedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Log Details Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("monitoringLog.monitoringSpecifications")}
              </h2>
              {canEdit && !isEditing && (
                <button
                  type="button"
                  className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                  onClick={() => setIsEditing(true)}
                >
                  {t("common.edit")}
                </button>
              )}
            </div>

            {log.logDetails.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                {t("monitoringLog.noSpecificationData")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.requirementName")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.expectedValue")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.min")} -{" "}
                        {t("monitoringLog.createForm.max")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.measuredValue")}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        {t("monitoringLog.match")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.logDetails.map((detail) => (
                      <tr
                        key={detail.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.name
                          }
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {detail.stageRequirementDefinitionDto.expectedValue ??
                            "-"}{" "}
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.unit
                          }
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {detail.stageRequirementDefinitionDto.minValue ??
                            "-"}{" "}
                          -{" "}
                          {detail.stageRequirementDefinitionDto.maxValue ??
                            "-"}{" "}
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.unit
                          }
                        </td>
                        <td className="px-4 py-3">
                          {isEditing && canEdit ? (
                            <input
                              type="number"
                              step="any"
                              value={editingValues[detail.id] ?? ""}
                              onChange={(e) =>
                                handleEditChange(detail.id, e.target.value)
                              }
                              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          ) : (
                            <span className="text-gray-900">
                              {detail.measuredValue ?? "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              detail.isMatch
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {detail.isMatch ? "✓" : "✗"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEditing && canEdit && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSaveChanges()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {submitting
                    ? t("monitoringLog.submitting")
                    : t("common.save")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsEditing(false);
                    // Reset values
                    if (log?.logDetails) {
                      const values: Record<string, number | null> = {};
                      log.logDetails.forEach((detail: LogDetail) => {
                        values[detail.id] = detail.measuredValue;
                      });
                      setEditingValues(values);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-100 disabled:bg-gray-100 transition"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>

          {/* Images Section */}
          {log.images && log.images.length > 0 && (
            <div className="border-t mt-6 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("monitoringLog.images")}
              </h2>
              <div className="flex gap-4 flex-wrap">
                {log.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="monitoring-log"
                    className={`w-32 h-32 object-cover rounded border cursor-pointer transition hover:scale-105 ${
                      selectedImage === img.url
                        ? "border-4 border-blue-600 scale-105"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedImage(img.url)}
                  />
                ))}
              </div>
              {selectedImage && (
                <div className="mt-4 relative">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                  >
                    ×
                  </button>
                  <img
                    src={selectedImage}
                    alt="selected"
                    className="w-full max-h-96 object-contain rounded border-2 border-gray-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {/* Technician Actions */}
          {isTechnician && canSubmit && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmitForApproval()}
              className="px-5 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {submitting
                ? t("monitoringLog.submitting")
                : log.status === "Created"
                ? t("monitoringLog.submitDraft")
                : t("monitoringLog.resubmit")}
            </button>
          )}

          {/* Researcher Actions */}
          {isResearcher && canApproveOrReject && (
            <>
              <button
                type="button"
                disabled={approvingOrRejecting}
                onClick={() => void handleApprove()}
                className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {approvingOrRejecting ? t("common.processing") : t("monitoringLog.approve")}
              </button>
              <button
                type="button"
                disabled={approvingOrRejecting}
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {approvingOrRejecting ? t("common.processing") : t("monitoringLog.reject")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("monitoringLog.rejectReport")}
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl disabled:cursor-not-allowed"
                disabled={approvingOrRejecting}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("monitoringLog.rejectionReasonRequired")}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("monitoringLog.enterRejectionReason")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={approvingOrRejecting}
                />
                <p className="text-xs text-gray-500 mt-1">{t("monitoringLog.minimumCharacters")}</p>
              </div>
            </div>

            <div className="border-t p-5 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                onClick={() => setShowRejectModal(false)}
                disabled={approvingOrRejecting}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-white font-semibold transition ${
                  rejectionReason.trim().length >= 10 && !approvingOrRejecting
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={() => void handleReject()}
                disabled={
                  approvingOrRejecting || rejectionReason.trim().length < 10
                }
              >
                {approvingOrRejecting ? t("common.processing") : t("monitoringLog.reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
