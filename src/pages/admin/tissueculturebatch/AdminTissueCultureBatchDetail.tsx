/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  TestTube2, MapPin, Maximize2, Info, Edit3, Trash2, 
  X, Save, CheckCircle2, AlertCircle, ArrowLeft, Loader2
} from "lucide-react";

// Interface khớp với API
interface TCB {
  id: number | string;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  status?: string;
  description?: string;
}

interface LabRoom {
  id: string | number;
  name: string;
}

interface LabRoomResponse {
  value?: { data?: LabRoom[] };
  data?: LabRoom[];
}

const AdminTissueCultureBatchDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [data, setData] = useState<TCB | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [labRooms, setLabRooms] = useState<LabRoom[]>([]);

  // Form Edit States
  const [name, setName] = useState("");
  const [labRoomId, setLabRoomId] = useState<string | number>("");
  const [batchSizeWidth, setBatchSizeWidth] = useState<string | number>("");
  const [batchSizeHeight, setBatchSizeHeight] = useState<string | number>("");
  const [widthUnit, setWidthUnit] = useState("mm");
  const [heightUnit, setHeightUnit] = useState("mm");

  useEffect(() => {
    axiosInstance
      .get("/api/labroom?pageNumber=1&pageSize=100")
      .then((res) => {
        const raw = res.data as LabRoomResponse | LabRoom[];
        let arr: LabRoom[] = [];
        if ((raw as LabRoomResponse)?.value?.data) arr = (raw as LabRoomResponse).value!.data!;
        else if ((raw as LabRoomResponse)?.data) arr = (raw as LabRoomResponse).data!;
        else if (Array.isArray(raw)) arr = raw as LabRoom[];
        setLabRooms(arr);
      })
      .catch((err) => console.error("Error fetching lab rooms:", err));
  }, []);

  // Fetch Batch Detail
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/api/batches/${id}`)
      .then((res) => {
        const tcb = res.data as TCB;
        setData(tcb);
        // Đổ dữ liệu vào state để sẵn sàng cho form edit
        setName(tcb.batchName ?? "");
        setLabRoomId(tcb.labRoomId ?? "");
        setBatchSizeWidth(tcb.batchSizeWidth ?? "");
        setBatchSizeHeight(tcb.batchSizeHeight ?? "");
        setWidthUnit(tcb.widthUnit ?? "mm");
        setHeightUnit(tcb.heightUnit ?? "mm");
      })
      .catch((err) => {
        console.error("Error loading batch detail:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(t("tissueCultureBatch.deleteConfirm") ?? "Bạn có chắc chắn muốn xóa lô này không?")) return;
    try {
      await axiosInstance.delete("/api/batches", { data: { id } });
      navigate("/admin/tissue-culture-batches");
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleSave = async () => {
    if (!id || !name || !labRoomId || !batchSizeWidth || !batchSizeHeight) return;
    setSaving(true);
    try {
      // Gọi đúng API PUT /api/batches/{id} với payload chuẩn
      await axiosInstance.put(`/api/batches/${id}`, {
        labRoomId: Number(labRoomId),
        batchName: name,
        batchSizeWidth: Number(batchSizeWidth),
        batchSizeHeight: Number(batchSizeHeight),
        widthUnit: widthUnit,
        heightUnit: heightUnit
      });
      
      setEditing(false);
      
      // Fetch lại dữ liệu mới nhất sau khi update thành công
      const res = await axiosInstance.get(`/api/batches/${id}`);
      const updatedTcb = res.data as TCB;
      setData(updatedTcb);
      
    } catch (err) {
      console.error("Error saving batch:", err);
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const isReady = status.toLowerCase() === "ready";
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
        isReady 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}>
        {isReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-rose-500 animate-pulse">
          <TestTube2 className="w-10 h-10 mb-4 animate-bounce" />
          <p className="font-medium">{t("common.loadingData") ?? "Đang tải dữ liệu..."}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 flex items-center justify-center">
        <div className="text-slate-500 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
          <p className="text-lg">{t("common.noData") ?? "Không tìm thấy dữ liệu"}</p>
          <button type="button" onClick={() => navigate(-1)} className="mt-4 text-rose-600 hover:underline">Quay lại</button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 text-slate-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <button 
          type="button"
          onClick={() => navigate("/admin/tissue-culture-batches")}
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") ?? "Quay lại danh sách"}
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 to-transparent flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <TestTube2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#9f1239]">
                  {t("tissueCultureBatch.tissueCultureBatchDetails") ?? "Chi tiết lô nuôi cấy"}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">ID: #{data.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!editing && renderStatusBadge(data.status)}
              
              {!editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 tooltip-trigger"
                    title={t("common.edit") ?? "Chỉnh sửa"}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                    title={t("common.delete") ?? "Xóa"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    {t("common.cancel") ?? "Hủy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-[#9f1239] hover:bg-rose-800 rounded-lg transition-colors disabled:opacity-70 shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? (t("common.saving") ?? "Đang lưu...") : (t("common.save") ?? "Lưu lại")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            {!editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Block 1 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                      <TestTube2 className="w-4 h-4" />
                      {t("common.name") ?? "Tên lô"}
                    </h3>
                    <p className="text-lg font-semibold text-slate-800">
                      {data.batchName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t("tissueCultureBatch.labRoom") ?? "Phòng Lab"}
                    </h3>
                    <p className="text-base text-slate-700 font-medium">
                      {data.labRoomName ?? "-"}
                    </p>
                  </div>
                </div>

                {/* Info Block 2 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                      <Maximize2 className="w-4 h-4" />
                      {t("tissueCultureBatch.batchSize") ?? "Kích thước lô (R x C)"}
                    </h3>
                    <p className="text-base text-slate-700">
                      {data.batchSizeWidth && data.batchSizeHeight 
                        ? <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {data.batchSizeWidth} x {data.batchSizeHeight} {data.widthUnit ?? "mm"}
                          </span>
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {t("common.description") ?? "Mô tả thêm"}
                    </h3>
                    <p className="text-base text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[3rem]">
                      {data.description ?? <span className="italic text-slate-400">Không có mô tả</span>}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Form Edit */
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-w-3xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên lô */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("common.name") ?? "Tên lô"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên lô..."
                    />
                  </div>

                  {/* Phòng Lab */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("tissueCultureBatch.labRoom") ?? "Phòng Lab"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={labRoomId}
                        onChange={(e) => setLabRoomId(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 appearance-none text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="" disabled hidden>-- Chọn phòng lab --</option>
                        {labRooms.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kích thước */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("tissueCultureBatch.width") ?? "Chiều rộng"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={batchSizeWidth}
                        onChange={(e) => setBatchSizeWidth(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("tissueCultureBatch.height") ?? "Chiều cao"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={batchSizeHeight}
                        onChange={(e) => setBatchSizeHeight(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
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
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default AdminTissueCultureBatchDetail;