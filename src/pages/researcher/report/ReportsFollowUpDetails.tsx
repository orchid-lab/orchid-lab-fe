import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import "./ReportsFollowUpDetails.css";
import type { MonitoringLogDetail } from "../../../types/MonitoringLogDetail";
import { useAuth } from "../../../context/AuthContext";

export default function ReportFollowUpDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [log, setLog] = useState<MonitoringLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingOrRejecting, setApprovingOrRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isTechnician = user?.roleId === 3;

  const canApproveOrReject =
    log?.status === "WaitingForApproval" || log?.status === "Revised";

  const fetchLog = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/monitoring-log/${id}`);
      const logData = (res.data?.value ?? res.data) as MonitoringLogDetail;
      setLog(logData);
    } catch (error) {
      console.error("Failed to fetch monitoring log:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("common.errorLoading"),
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setApprovingOrRejecting(true);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${id}/approve`);
      enqueueSnackbar(t("monitoringLog.approveSuccess"), {
        variant: "success",
      });
      await fetchLog();
    } catch (error) {
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.approveFailed"),
        { variant: "error" },
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
      await axiosInstance.patch(`/api/monitoring-log/${id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      enqueueSnackbar(t("monitoringLog.rejectSuccess"), { variant: "success" });
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchLog();
    } catch (error) {
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.rejectFailed"),
        { variant: "error" },
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
      <main className="reports-follow-up-details-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">{t("common.loadingData")}</div>
      </main>
    );
  }

  if (!log) {
    return (
      <main className="reports-follow-up-details-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">{t("common.noData")}</div>
      </main>
    );
  }

  return (
    <main className="reports-follow-up-details-page ml-64 mt-10 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Back button */}
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

        <h1 className="text-2xl font-bold text-green-900 mb-6">
          {t("monitoringLog.reportName") || "Chi tiết báo cáo theo dõi"}
        </h1>

        {/* Main info card */}
        <div className="bg-white rounded-xl shadow p-8 mb-6">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t("monitoringLog.reportName") || "Tên báo cáo"}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {log.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {t("monitoringLog.sampleName") || "Tên mẫu"}
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
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(log.status)}`}
              >
                {getStatusLabel(log.status)}
              </span>
              {log.isNewest && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                    {t("monitoringLog.newest") || "Mới nhất"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detail fields */}
          <div className="border-t pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  {t("monitoringLog.createdDate") || "Ngày tạo"}
                </div>
                <div className="text-gray-900">
                  {new Date(log.createdDate).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  {t("monitoringLog.sampleStage") || "Giai đoạn mẫu"}
                </div>
                <div className="text-gray-900">
                  {log.sampleStageDefinitionName}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  {t("monitoringLog.createdBy") || "Người tạo"}
                </div>
                <div className="text-gray-900 font-medium">{log.createdBy}</div>
              </div>
              {log.updatedDate && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {t("monitoringLog.lastUpdated") || "Cập nhật lần cuối"}
                  </div>
                  <div className="text-gray-900">
                    {new Date(log.updatedDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              )}
              {log.diseaseName && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">
                    {t("monitoringLog.diseaseDetected") || "Bệnh phát hiện"}
                  </div>
                  <div className="font-semibold text-red-600">
                    {log.diseaseName}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection reason */}
          {log.rejectionReason && (
            <div className="border-t pt-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-red-700 mb-1">
                  {t("monitoringLog.rejectionReasonLabel") || "Lý do từ chối"}
                </div>
                <div className="text-red-900">{log.rejectionReason}</div>
                {log.rejectedDate && (
                  <div className="text-xs text-red-600 mt-2">
                    {t("monitoringLog.rejectedOn") || "Bị từ chối vào"}{" "}
                    {new Date(log.rejectedDate).toLocaleDateString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Log details table */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {t("monitoringLog.monitoringSpecifications") ||
                "Chỉ tiêu theo dõi"}
            </h2>
            {log.logDetails.length === 0 ? (
              <div className="text-gray-500 text-sm py-4 text-center">
                {t("monitoringLog.noSpecificationData") ||
                  "Không có dữ liệu chỉ tiêu"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.requirementName") ||
                          "Tên chỉ tiêu"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.expectedValue") || "Giá trị kỳ vọng"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.min") || "Min"} –{" "}
                        {t("monitoringLog.createForm.max") || "Max"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {t("monitoringLog.createForm.measuredValue") ||
                          "Giá trị đo"}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        {t("monitoringLog.match") || "Đạt"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.logDetails.map((detail) => {
                      const req = detail.stageRequirementDefinitionDto;
                      const sampleReq = req.sampleRequirementDefinitionDto;
                      return (
                        <tr
                          key={detail.id}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {sampleReq.name}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {req.expectedValue ?? "-"} {sampleReq.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {req.minValue ?? "-"} – {req.maxValue ?? "-"}{" "}
                            {sampleReq.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {detail.measuredValue ?? "-"}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Images */}
          {log.images.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {t("monitoringLog.images") || "Hình ảnh đính kèm"}
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
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === img.url ? null : img.url,
                      )
                    }
                  />
                ))}
              </div>
              {selectedImage && (
                <div className="mt-4 relative max-w-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 z-10"
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

        {/* Approve / Reject buttons */}
        {canApproveOrReject && (
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              disabled={approvingOrRejecting}
              onClick={() => void handleApprove()}
              className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {approvingOrRejecting
                ? t("common.processing") || "Đang xử lý..."
                : t("monitoringLog.approve") || "Duyệt"}
            </button>
            <button
              type="button"
              disabled={approvingOrRejecting}
              onClick={() => setShowRejectModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
            >
              {approvingOrRejecting
                ? t("common.processing") || "Đang xử lý..."
                : t("monitoringLog.reject") || "Từ chối"}
            </button>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("monitoringLog.rejectReport") || "Từ chối báo cáo"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!approvingOrRejecting) setShowRejectModal(false);
                }}
                disabled={approvingOrRejecting}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {t("monitoringLog.rejectionReasonRequired") || "Lý do từ chối"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  t("monitoringLog.enterRejectionReason") ||
                  "Nhập lý do từ chối..."
                }
                rows={4}
                disabled={approvingOrRejecting}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-400">
                {t("monitoringLog.minimumCharacters") || "Tối thiểu 10 ký tự"}
              </p>
            </div>
            <div className="border-t p-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={approvingOrRejecting}
                className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={
                  approvingOrRejecting || rejectionReason.trim().length < 10
                }
                className={`px-4 py-2 rounded-full text-white font-semibold transition ${
                  rejectionReason.trim().length >= 10 && !approvingOrRejecting
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {approvingOrRejecting
                  ? t("common.processing") || "Đang xử lý..."
                  : t("monitoringLog.reject") || "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
