/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import { useDiseaseMap } from "../../../utils/useDiseaseMap";
import {
  ArrowLeft,
  FileText,
  Activity,
  AlertCircle,
  Ruler,
  Microscope,
  Clock,
  ShieldAlert,
  ThermometerSun,
  XCircle,
  CheckCircle2,
} from "lucide-react";

/* ─── Interfaces Khớp Với API Thật ─── */
interface RequirementDef {
  id: string;
  characteristicCode: string;
  name: string;
  description: string;
  unit: string;
}

interface StageReqDef {
  id: string;
  sampleRequirementDefinitionDto: RequirementDef;
  minValue: number;
  maxValue: number;
  expectedValue: number;
}

interface LogDetail {
  id: string;
  measuredValue: number;
  isMatch: boolean;
  stageRequirementDefinitionDto: StageReqDef;
}

interface ImageDto {
  id: string;
  targetType: string;
  targetId: string;
  url: string;
  description: string;
}

interface AnalyticResult {
  id: string;
  predictions: Record<string, number>;
  topDisease: string;
  confidence: number;
  analyzedAt: string;
}

interface MonitoringLog {
  id: string;
  name: string;
  sampleStageId: string;
  createdBy: string;
  createdDate: string;
  sampleName: string;
  sampleStageDefinitionName: string;
  diseaseName: string | null;
  analyticResult: AnalyticResult | null;
  status: string;
  deletedDate: string | null;
  deletedBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  isNewest: boolean;
  logDetails: LogDetail[];
  images: ImageDto[];
  rejectionReason: string | null;
  rejectedDate: string | null;
}

export default function AdminMonitoringLogDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonitoringLog | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const { onnxNameMap, isMapLoaded } = useDiseaseMap();

  // Fetch data từ API thật
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/api/monitoring-log/${id}`)
      .then((res) => {
        const logData = res.data as MonitoringLog;
        setData(logData);
        if (logData.images && logData.images.length > 0) {
          setSelectedImg(logData.images[0].url);
        }
      })
      .catch((err) => {
        console.error("Error fetching monitoring log:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN");
  }

  const getStatusDisplay = (status?: string) => {
    if (!status) return "—";
    // Fix lỗi `any` bằng cách gán type `React.ElementType` cho thuộc tính icon
    const statusMap: Record<
      string,
      { label: string; bg: string; text: string; icon: React.ElementType }
    > = {
      Created: {
        label: "Mới tạo",
        bg: "bg-sky-50",
        text: "text-sky-700",
        icon: FileText,
      },
      Process: {
        label: "Đang xử lý",
        bg: "bg-amber-50",
        text: "text-amber-700",
        icon: Activity,
      },
      Approved: {
        label: "Đã duyệt",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        icon: CheckCircle2,
      },
      Rejected: {
        label: "Bị từ chối",
        bg: "bg-rose-50",
        text: "text-rose-700",
        icon: XCircle,
      },
    };

    // Fix lỗi `||` bằng nullish coalescing `??`
    const config = statusMap[status] ?? {
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      icon: FileText,
    };
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-current/20 ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] flex items-center justify-center">
        <div className="flex flex-col items-center text-rose-500 animate-pulse">
          <FileText className="w-10 h-10 mb-4 animate-bounce" />
          <p className="font-medium">
            {t("common.loadingData") ?? "Đang tải báo cáo..."}
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] flex items-center justify-center">
        <div className="text-slate-500 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Không tìm thấy dữ liệu Monitoring Log.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-[#9f1239] hover:underline"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  const isHealthyLog =
    (data.analyticResult?.topDisease ?? "").toLowerCase() === "healthy" ||
    (data.diseaseName ?? "").toLowerCase().includes("khỏe");

  // Animation (Fix lỗi type Variants)
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 text-slate-800">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Nút quay lại */}
        <motion.button
          variants={fadeInUp}
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-2 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") ?? "Quay lại"}
        </motion.button>

        {/* Header */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#9f1239] flex items-center gap-3">
              <FileText className="w-8 h-8 p-1.5 bg-rose-100 text-rose-600 rounded-xl" />
              {data.name ?? "Chi tiết báo cáo giám sát"}
            </h1>
            <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatDate(data.createdDate)} <span className="mx-1">•</span> Tạo
              bởi: {data.createdBy}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusDisplay(data.status)}
            <div className="px-3 py-1.5 bg-white border border-rose-100 rounded-lg shadow-sm text-xs font-medium text-slate-500">
              Log ID:{" "}
              <span className="text-[#9f1239] font-bold">{data.id}</span>
            </div>
          </div>
        </motion.div>

        {/* Cảnh báo từ chối (nếu có) */}
        {data.status === "Rejected" && data.rejectionReason && (
          <motion.div
            variants={fadeInUp}
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800"
          >
            <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Lý do từ chối:</h4>
              <p className="text-sm mt-1">{data.rejectionReason}</p>
              <p className="text-xs text-rose-600 mt-2">
                Từ chối lúc: {formatDate(data.rejectedDate)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Sample summary */}
        <motion.section
          variants={fadeInUp}
          className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Sample Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Mẫu: {data.sampleName ?? "—"}
                  </h2>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    Giai đoạn:
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-[#fff1f2] text-[#9f1239] border border-rose-100">
                      {data.sampleStageDefinitionName ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span>Trạng thái dữ liệu:</span>
                    <strong
                      className={
                        data.isNewest ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {data.isNewest ? "Mới nhất" : "Cũ"}
                    </strong>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Cập nhật lần cuối:</span>
                    {/* Sử dụng nullish coalescing để phòng trường hợp updatedDate null */}
                    <strong>
                      {formatDate(data.updatedDate ?? data.createdDate)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Metrics from logDetails */}
              <div className="flex-[1.5] lg:border-l lg:border-rose-50 lg:pl-8">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ThermometerSun className="w-5 h-5 text-rose-500" />
                  Chỉ số đo đạc thực tế
                </h4>

                {data.logDetails && data.logDetails.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.logDetails.map((detail) => (
                      <MetricRow
                        key={detail.id}
                        label={
                          detail.stageRequirementDefinitionDto
                            .sampleRequirementDefinitionDto.name
                        }
                        value={detail.measuredValue}
                        unit={
                          detail.stageRequirementDefinitionDto
                            .sampleRequirementDefinitionDto.unit
                        }
                        minValue={detail.stageRequirementDefinitionDto.minValue}
                        maxValue={detail.stageRequirementDefinitionDto.maxValue}
                        isMatch={detail.isMatch}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">
                    Không có số liệu đo đạc nào được ghi nhận.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Hình ảnh & Phân tích AI */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Cột trái: Hình ảnh */}
          <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 p-6 flex flex-col h-full">
            <h4 className="text-base font-bold text-[#9f1239] mb-4 flex items-center gap-2">
              <Microscope className="w-5 h-5" />
              Hình ảnh đính kèm
            </h4>

            {data.images && data.images.length > 0 ? (
              <>
                <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-4 flex-1 min-h-[300px] relative group">
                  <img
                    src={selectedImg ?? data.images[0].url}
                    alt="Selected"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(selectedImg ?? data.images[0].url, "_blank")
                      }
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/50 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                      Mở ảnh gốc
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {data.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImg(img.url)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === img.url ? "border-rose-500 shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={img.url}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                <AlertCircle className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-sm">Không có hình ảnh đính kèm</p>
              </div>
            )}
          </section>

          {/* Cột phải: Kết quả AI */}
          <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 p-6 flex flex-col h-full">
            <h4 className="text-base font-bold text-[#9f1239] mb-4 border-b border-rose-50 pb-3">
              Kết quả chẩn đoán AI
            </h4>

            {!data.analyticResult ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <Microscope className="w-12 h-12 mb-3 text-slate-200" />
                <p className="text-sm text-center max-w-[250px]">
                  Báo cáo này chưa được phân tích AI hoặc không có dữ liệu chẩn
                  đoán.
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div
                  className={`p-5 rounded-xl border ${
                    isHealthyLog
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  } flex items-center justify-between gap-4`}
                >
                  <div className="space-y-3 flex-1">
                    <div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          isHealthyLog ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        Giai đoạn
                      </span>
                      <p
                        className={`text-lg font-black mt-0.5 ${
                          isHealthyLog ? "text-emerald-800" : "text-[#9f1239]"
                        }`}
                      >
                        {data.sampleStageDefinitionName ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          isHealthyLog ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        Kết quả chẩn đoán
                      </span>
                      <p
                        className={`text-xl font-black mt-0.5 ${
                          isHealthyLog ? "text-emerald-800" : "text-[#9f1239]"
                        }`}
                      >
                        {isMapLoaded && !isHealthyLog && !(data.analyticResult!.topDisease in onnxNameMap) ? "Không rõ" : (data.diseaseName ?? "—")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-sm flex-shrink-0 bg-white ${
                      isHealthyLog ? "border-emerald-200" : "border-rose-200"
                    }`}
                  >
                    <span
                      className={`text-lg font-black leading-none ${
                        isHealthyLog ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {data.analyticResult.confidence != null
                        ? `${(data.analyticResult.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      độ tin cậy
                    </span>
                  </div>
                </div>

                {/* Predictions Breakdown */}
                {data.analyticResult.predictions &&
                  Object.keys(data.analyticResult.predictions).length > 0 && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Phân bố xác suất bệnh
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {Object.entries(data.analyticResult.predictions)
                          .filter(([onnxKey]) => onnxKey in onnxNameMap)
                          .sort(([, a], [, b]) => b - a)
                          .map(([onnxKey, prob]) => {
                            const name = onnxNameMap[onnxKey] ?? onnxKey;
                            const isTop =
                              onnxKey === data.analyticResult!.topDisease;
                            const pct = prob * 100;
                            return (
                              <div
                                key={onnxKey}
                                className={`flex items-center gap-3 px-4 py-3 ${
                                  isTop
                                    ? isHealthyLog
                                      ? "bg-emerald-50/60"
                                      : "bg-rose-50/60"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    isTop
                                      ? isHealthyLog
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                      : "bg-slate-300"
                                  }`}
                                />
                                <span
                                  className={`flex-1 text-sm truncate ${
                                    isTop
                                      ? isHealthyLog
                                        ? "font-semibold text-emerald-800"
                                        : "font-semibold text-[#9f1239]"
                                      : "font-medium text-slate-500"
                                  }`}
                                  title={name}
                                >
                                  {name}
                                </span>
                                <div className="flex items-center gap-2 w-44 flex-shrink-0">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${pct.toFixed(1)}%` }}
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isTop
                                          ? isHealthyLog
                                            ? "bg-emerald-500"
                                            : "bg-rose-500"
                                          : "bg-slate-200"
                                      }`}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-bold w-11 text-right ${
                                      isTop
                                        ? isHealthyLog
                                          ? "text-emerald-700"
                                          : "text-rose-600"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {pct.toFixed(1) === "0.0" ? "~0.0" : pct.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </section>
        </motion.div>
      </motion.div>
    </main>
  );
}

/* Helper Component vẽ Bar cho Số liệu (Log Details) */
function MetricRow({
  label,
  value,
  unit,
  minValue,
  maxValue,
  isMatch,
}: {
  label: string;
  value: number;
  unit: string;
  minValue: number;
  maxValue: number;
  isMatch: boolean;
}) {
  const colorClass = isMatch
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : "text-rose-700 bg-[#fff1f2] border-rose-200";

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-slate-400" />
          {label}
        </span>
        <span className="text-xs text-slate-400 mt-0.5">
          Chuẩn: {minValue} - {maxValue} {unit}
        </span>
      </div>
      <div
        className={`min-w-[4rem] text-center px-2.5 py-1.5 rounded-lg text-sm font-bold border ${colorClass}`}
      >
        {value} {unit}
      </div>
    </div>
  );
}
