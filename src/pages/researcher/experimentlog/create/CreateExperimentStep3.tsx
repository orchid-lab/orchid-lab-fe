/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, XCircle, FileText, ClipboardCheck } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

/* ─── Animations ──────────────────────────────── */
const staggerContainer: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeInUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

const CreateExperimentStep3 = () => {
  const navigate = useNavigate();
  const { form, setForm, resetForm } = useExperimentLogForm();
  const { name, numberOfSample, tissueCultureBatchID, batchName, methodID, methodName, methodType, hybridizationNames, description, technicianNames } = form;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    setIsSubmitting(true); setError(null);
    const methodId = methodID ? parseInt(String(methodID), 10) : NaN;
    const batchesId = tissueCultureBatchID ? parseInt(String(tissueCultureBatchID), 10) : NaN;
    const parentAId = form.motherID ?? (Array.isArray(form.hybridization) && form.hybridization[0]) ?? "";
    const assignedToTechnicianId = Array.isArray(form.technicianID) && form.technicianID.length > 0 ? form.technicianID[0] : ((form.technicianID as any) ?? "");

    if (!Number.isInteger(batchesId) || batchesId <= 0) {
      const msg = "Lỗi: Lô cấy mô (batch) chưa hợp lệ. Vui lòng chọn lại lô.";
      enqueueSnackbar(msg, { variant: "error" }); setError(msg); setIsSubmitting(false); return;
    }
    if (!Number.isInteger(methodId) || methodId <= 0) {
      const msg = "Lỗi: Phương pháp chưa hợp lệ. Vui lòng chọn phương pháp.";
      enqueueSnackbar(msg, { variant: "error" }); setError(msg); setIsSubmitting(false); return;
    }

    const payload = {
      methodId, batchesId, parentAId, name: name ?? "",
      expectedSampleCount: numberOfSample ?? 1,
      assignedToTechnicianId, objective: form.objective ?? "",
    };

    try {
      const response = await axiosInstance.post("/api/experiment-logs", payload);
      if (response.status !== 200 && response.status !== 201 && response.status !== 204) { throw new Error("Có lỗi xảy ra khi tạo nhật ký thí nghiệm."); }
      enqueueSnackbar("Tạo nhật ký thí nghiệm thành công!", { variant: "success" });
      resetForm();
      void navigate("/researcher/experiment-log");
    } catch (error) {
      const apiError = error as { response?: { data?: string }; message?: string };
      const backendMessage = apiError.response?.data ?? apiError.message ?? "Tạo phương pháp thất bại!";
      enqueueSnackbar(backendMessage, { variant: "error", autoHideDuration: 5000 });
      setError(apiError.message ?? "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMotherName = hybridizationNames?.[0] ?? form.motherName ?? "Chưa chọn";

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
        
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <ExperimentSteps currentStep={3} />
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-[#2D5A27] p-1 bg-[#E4F0E8] rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-[#1e3e1c]">Tạo Kế Hoạch Lai Tạo Mới</h1>
              <p className="text-sm text-slate-500 mt-0.5">Bước 3: Xem lại thông tin và hoàn thành</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cột trái */}
              <div className="space-y-4">
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tên nhật ký thí nghiệm</p>
                  <p className="text-base font-bold text-slate-800">{name ?? "Chưa nhập"}</p>
                </div>
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mục đích thí nghiệm</p>
                  <p className="text-base font-medium text-slate-800">{form.objective ?? "Chưa nhập"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bắt đầu</p>
                    <p className="text-sm font-medium text-slate-800">{form.startDate ?? "Chưa chọn"}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kết thúc</p>
                    <p className="text-sm font-medium text-slate-800">{form.endDate ?? "Chưa chọn"}</p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Số mẫu mong muốn</p>
                    <p className="text-2xl font-black text-[#1e3e1c]">{numberOfSample ?? "-"}</p>
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-4">
                <div className="bg-[#E4F0E8] p-5 border border-[#DDEEE0] rounded-xl">
                  <p className="text-xs font-semibold text-[#2D5A27] uppercase tracking-wider mb-1">Phương pháp</p>
                  <p className="text-base font-bold text-[#1e3e1c]">{methodName ?? "Chưa chọn"}</p>
                  <p className="text-xs text-[#2D5A27]/80 mt-1">Loại: {methodType ?? "---"}</p>
                </div>
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lô cấy mô</p>
                  <p className="text-base font-medium text-slate-800">{batchName ?? "Chưa chọn"}</p>
                </div>
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kỹ thuật viên phụ trách</p>
                  <p className="text-base font-medium text-slate-800">{technicianNames && technicianNames.length > 0 ? technicianNames.join(", ") : "Chưa chọn"}</p>
                </div>
                <div className="bg-white p-5 border-2 border-dashed border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cây giống đã chọn</p>
                  <p className="text-lg font-bold text-[#1e3e1c] mt-1">🌱 {selectedMotherName}</p>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100">
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                <FileText className="w-4 h-4 text-[#2D5A27]" /> Ghi chú / Mô tả chi tiết
              </label>
              <textarea
                id="description" rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] bg-white transition-all shadow-sm resize-none"
                placeholder="Nhập ghi chú hoặc mục tiêu chi tiết của thí nghiệm..."
                value={description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <Link to="/researcher/experiment-log/create/step-2" className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#2D5A27] text-white hover:bg-[#1e3e1c]"}`}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><CheckCircle className="w-4 h-4" /> Hoàn thành & Tạo mới</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default CreateExperimentStep3;