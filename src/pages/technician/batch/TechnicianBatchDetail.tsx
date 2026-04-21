/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import { 
  ArrowLeft, TestTube2, MapPin, Maximize2, 
  Info, Activity, AlertCircle, Layers
} from "lucide-react";
import type { TissueCultureBatch } from "../../../types/Batch";

/* ─── Animation variants ──────────────────────────────── */
const staggerContainer: Variants = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const fadeInUp: Variants = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } 
};

export default function TechnicianBatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [item, setItem] = useState<TissueCultureBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError(t("common.invalidId") ?? "ID không hợp lệ");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    axiosInstance
      .get(`/api/batches/${id}`)
      .then((res) => {
        const data = res.data as TissueCultureBatch | { data: TissueCultureBatch };
        const batch = "data" in data ? data.data : data;
        setItem(batch);
      })
      .catch((err) => {
        console.error("Error loading batch details:", err);
        setError(t("tissueCultureBatch.errorLoadingDetail") ?? "Lỗi khi tải chi tiết lô");
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const renderStatusBadge = () => {
    if (!item) return null;
    
    let statusText = "";
    let isReady = false;

    if (typeof item.status === "string") {
      statusText = item.status;
      isReady = statusText.toLowerCase() === "ready";
    } else {
      const operating = item.status ?? item.isBatching;
      statusText = operating ? (t("tissueCultureBatch.operating") ?? "Đang hoạt động") : (t("tissueCultureBatch.notOperating") ?? "Ngừng hoạt động");
      isReady = Boolean(operating);
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
        isReady 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-gray-100 text-gray-700 border-gray-300"
      }`}>
        <Activity className="w-4 h-4" />
        {statusText}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="flex flex-col items-center text-emerald-600 animate-pulse">
          <Layers className="w-12 h-12 mb-4 animate-bounce" />
          <p className="font-medium text-lg">{t("common.loadingData") ?? "Đang tải dữ liệu lô..."}</p>
        </div>
      </main>
    );
  }

  if (error ?? !item) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6 font-medium w-fit"
            onClick={() => navigate("/technician/batches")}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back") ?? "Quay lại danh sách"}
          </button>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-16 text-center border border-emerald-100 shadow-sm flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-emerald-300 mb-4" />
            <p className="text-emerald-700 text-xl font-semibold">{error ?? t("common.noDataFound") ?? "Không tìm thấy lô"}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-slate-50 p-6 lg:p-8 text-slate-800">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Button */}
        <motion.button
          variants={fadeInUp}
          type="button"
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-2 font-medium w-fit"
          onClick={() => navigate("/technician/batches")}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") ?? "Quay lại danh sách"}
        </motion.button>

        {/* Detail Card */}
        <motion.div variants={fadeInUp} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-transparent flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-emerald-900">
                  {item.batchName ?? item.name ?? `Lô #${item.id}`}
                </h1>
                <p className="text-sm text-emerald-700/70 mt-0.5 font-medium">ID Hệ thống: #{item.id}</p>
              </div>
            </div>
            
            <div>
              {renderStatusBadge()}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Info Block 1 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <TestTube2 className="w-4 h-4 text-emerald-500" />
                    {t("tissueCultureBatch.batchName") ?? "Tên lô"}
                  </h3>
                  <p className="text-lg font-bold text-slate-800">
                    {item.batchName ?? item.name ?? "—"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    {t("tissueCultureBatch.labRoom") ?? "Phòng Lab"}
                  </h3>
                  <p className="text-base text-slate-700 font-medium">
                    {item.labRoomName ?? item.labName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    ID Phòng Lab: {item.labRoomId ?? "—"}
                  </p>
                </div>
              </div>

              {/* Info Block 2 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-emerald-500" />
                    {t("tissueCultureBatch.batchSize") ?? "Kích thước lô (Rộng x Cao)"}
                  </h3>
                  {item.batchSizeWidth && item.batchSizeHeight ? (
                    <div className="inline-flex items-center bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm text-emerald-900 font-semibold gap-2">
                      <span>{item.batchSizeWidth} {item.widthUnit ?? ""}</span>
                      <span className="text-emerald-300">x</span>
                      <span>{item.batchSizeHeight} {item.heightUnit ?? ""}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa ghi nhận kích thước</span>
                  )}
                </div>

                {item.inUse && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      {t("tissueCultureBatch.inUse") ?? "Trạng thái sử dụng"}
                    </h3>
                    <p className="text-base text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      {item.inUse}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Description Block */}
            <div className="mt-8 pt-6 border-t border-emerald-50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500" />
                {t("common.description") ?? "Mô tả / Ghi chú"}
              </h3>
              <div className="text-slate-700 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 min-h-[4rem] leading-relaxed">
                {item.description ?? <span className="italic text-slate-400">Không có mô tả cho lô này.</span>}
              </div>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </main>
  );
}