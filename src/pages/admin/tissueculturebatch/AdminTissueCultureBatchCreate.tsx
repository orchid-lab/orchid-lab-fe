/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  ArrowLeft, PlusCircle, TestTube2, MapPin, 
  X, Loader2, Maximize2 
} from "lucide-react";

interface LabRoom {
  id: string | number;
  name: string;
  description?: string;
}

const AdminTissueCultureBatchCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State form
  const [name, setName] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [batchSizeWidth, setBatchSizeWidth] = useState("");
  const [batchSizeHeight, setBatchSizeHeight] = useState("");
  const [widthUnit, setWidthUnit] = useState("mm");
  const [heightUnit, setHeightUnit] = useState("mm");
  
  const [labRooms, setLabRooms] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/api/labroom?PageNo=1&PageSize=100")
      .then((res) => {
        const data = res.data?.data;
        setLabRooms(Array.isArray(data) ? data : []);
      })
      .catch(() => setLabRooms([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedLab || !batchSizeWidth || !batchSizeHeight) return;
    
    setLoading(true);
    try {
      await axiosInstance.post("/api/batches", {
        labRoomId: Number(selectedLab),
        batchName: name,
        batchSizeWidth: Number(batchSizeWidth),
        batchSizeHeight: Number(batchSizeHeight),
        widthUnit,
        heightUnit,
      });
      navigate("/admin/tissue-culture-batches");
    } catch (error) {
      console.error("Error creating batch:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 text-slate-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Nút quay lại */}
        <button 
          type="button"
          onClick={() => navigate("/admin/tissue-culture-batches")}
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-6 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Quay lại danh sách"}
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 to-transparent flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-[#9f1239] rounded-xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#9f1239]">
                {t("tissueCultureBatch.createBatch") || "Tạo lô nuôi cấy mới"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Điền thông tin bên dưới để khởi tạo một lô mới vào hệ thống
              </p>
            </div>
          </div>

          {/* Body / Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên lô */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <TestTube2 className="w-4 h-4 text-slate-400" />
                  {t("tissueCultureBatch.batchName") || "Tên lô"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: MP-2026-03"
                  className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                  required
                />
              </div>

              {/* Phòng Lab */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {t("tissueCultureBatch.labRoom") || "Phòng Lab"} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 appearance-none text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm cursor-pointer"
                    required
                  >
                    <option value="" disabled hidden>
                      {t("tissueCultureBatch.selectLabRoom") || "-- Chọn phòng lab --"}
                    </option>
                    {labRooms.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Kích thước lô */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-rose-50/50 rounded-xl border border-rose-100">
              {/* Chiều rộng */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Maximize2 className="w-4 h-4 text-slate-400" />
                  {t("tissueCultureBatch.width") || "Chiều rộng"} <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={batchSizeWidth}
                    onChange={(e) => setBatchSizeWidth(e.target.value)}
                    placeholder="2800"
                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                    required
                  />
                  <select
                    value={widthUnit}
                    onChange={(e) => setWidthUnit(e.target.value)}
                    className="w-24 bg-white border border-rose-200 rounded-xl px-3 py-2.5 appearance-none text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>

              {/* Chiều cao */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Maximize2 className="w-4 h-4 text-slate-400" />
                  {t("tissueCultureBatch.height") || "Chiều cao / Dài"} <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={batchSizeHeight}
                    onChange={(e) => setBatchSizeHeight(e.target.value)}
                    placeholder="2200"
                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                    required
                  />
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value)}
                    className="w-24 bg-white border border-rose-200 rounded-xl px-3 py-2.5 appearance-none text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-50">
              <button
                type="button"
                onClick={() => navigate("/admin/tissue-culture-batches")}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
                {t("common.cancel") || "Hủy bỏ"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-[#9f1239] hover:bg-rose-800 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("tissueCultureBatch.creating") || "Đang tạo..."}
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    {t("tissueCultureBatch.create") || "Tạo lô mới"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
};

export default AdminTissueCultureBatchCreate;