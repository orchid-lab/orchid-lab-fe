/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  ArrowLeft, FileText, FlaskConical, MapPin, 
  Clock, User as UserIcon, Calendar, Info, 
  Activity, CheckCircle2, AlertCircle, Sprout
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";

// ─── INTERFACES KHỚP 100% VỚI JSON MỚI ───
interface Seedling {
  id: string;
  localName: string;
  scientificName: string;
  description: string;
}

interface Method {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
}

interface Batch {
  id: number;
  labRoomId: number;
  labRoomName: string;
  batchName: string;
  status: string;
}

interface Sample {
  id: string;
  name: string;
  status: string;
  currentSampleStage: string;
  createdDate: string;
}

interface ExperimentLogDetailType {
  id: string;
  name: string;
  expectedSampleCount: number;
  status: string;
  createdDate: string;
  createdBy: string;
  startDate: string;
  endDate: string;
  notes: string;
  reason: string;
  objective: string;
  seedling: Seedling;
  method: Method;
  batch: Batch;
  samples: Sample[];
}

export default function AdminExperimentLogDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>("Đang tải...");

  // 1. Fetch Experiment Log Detail
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    // Đã sửa lại đúng Endpoint API: /api/experiment-logs/
    axiosInstance
      .get(`/api/experiment-logs/${id}`)
      .then((res) => {
        // Hỗ trợ cả trường hợp bọc trong value hoặc data trực tiếp
        const logData = res.data?.value ?? res.data;
        setLog(logData as ExperimentLogDetailType);
      })
      .catch((err) => {
        console.error("Fetch log error:", err);
        setError("Không thể tải dữ liệu. Vui lòng kiểm tra lại ID hoặc kết nối mạng.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Lấy tên người tạo (Nếu createdBy là UUID, dịch ra tên)
  useEffect(() => {
    if (log?.createdBy && log.createdBy.includes("-")) {
      axiosInstance
        .get(`/api/user/${log.createdBy}`)
        .then((res) => {
          const name = res.data?.value?.name ?? res.data?.name ?? log.createdBy;
          setCreatorName(name);
        })
        .catch(() => setCreatorName(log.createdBy));
    } else if (log?.createdBy) {
      setCreatorName(log.createdBy);
    }
  }, [log]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (!status) return null;
    const statusMap: Record<string, { label: string, bg: string, text: string, icon: React.ElementType }> = {
      Created: { label: "Mới tạo", bg: "bg-sky-50", text: "text-sky-700", icon: FileText },
      Process: { label: "Đang tiến hành", bg: "bg-amber-50", text: "text-amber-700", icon: Activity },
      InProcess: { label: "Đang tiến hành", bg: "bg-amber-50", text: "text-amber-700", icon: Activity },
      Completed: { label: "Đã hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
      Failed: { label: "Thất bại/Hủy", bg: "bg-rose-50", text: "text-rose-700", icon: AlertCircle },
    };
    
    const config = statusMap[status] ?? { label: status, bg: "bg-gray-50", text: "text-gray-700", icon: Info };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-current/10 ${config.bg} ${config.text}`}>
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
          <p className="font-medium">Đang tải chi tiết nhật ký...</p>
        </div>
      </main>
    );
  }

  if (error || !log) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
        <button type="button" onClick={() => navigate("/admin/experiment-log")} className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-16 text-center border border-rose-100 flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-rose-300 mb-4" />
          <p className="text-rose-600 text-xl font-semibold">{error ?? "Không tìm thấy dữ liệu"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Nút quay lại */}
        <button 
          type="button"
          onClick={() => navigate("/admin/experiment-log")}
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-2 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("experimentLog.backToList") ?? "Quay lại danh sách"}
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#9f1239] flex items-center gap-3">
              <FileText className="w-8 h-8 p-1.5 bg-rose-100 text-rose-600 rounded-xl" />
              {log.name || "Nhật ký thí nghiệm"}
            </h1>
            <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tạo lúc: {formatDate(log.createdDate)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusDisplay(log.status)}
            <div className="px-3 py-1.5 bg-white border border-rose-100 rounded-lg shadow-sm text-xs font-medium text-slate-500">
              Log ID: <span className="text-[#9f1239] font-bold">{log.id.split("-")[0]}...</span>
            </div>
          </div>
        </motion.div>

        {/* Cột chính Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Thông tin cốt lõi */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-rose-50 bg-gradient-to-r from-rose-50/50 to-transparent flex items-center gap-3">
              <Info className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-800">Thông tin thí nghiệm</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">Phương pháp</span>
                  <div className="text-base font-medium text-slate-800 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-500" />
                    {log.method?.name ?? "—"}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">Lô nuôi cấy</span>
                  <div className="text-base font-medium text-slate-800">
                    {log.batch?.batchName ?? "—"}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">Mục tiêu (Objective)</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {log.objective || "—"}
                </p>
              </div>

              {/* Thông tin giống cây */}
              <div className="pt-4 border-t border-rose-50">
                <span className="block text-sm font-semibold text-slate-500 uppercase mb-3 items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  Cây giống sử dụng (Seedling)
                </span>
                {log.seedling ? (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col md:flex-row gap-6">
                    <div>
                      <span className="text-xs text-emerald-600/70 font-semibold uppercase">Tên địa phương</span>
                      <div className="text-emerald-900 font-medium">{log.seedling.localName ?? "—"}</div>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-600/70 font-semibold uppercase">Tên khoa học</span>
                      <div className="text-emerald-800 italic">{log.seedling.scientificName ?? "—"}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Không có dữ liệu giống cây.</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Siêu dữ liệu (Metadata) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-orange-100 overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-orange-50 bg-gradient-to-r from-orange-50/50 to-transparent flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-slate-800">Theo dõi</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><MapPin className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Phòng Lab</div>
                  <div className="text-sm font-medium text-slate-800">{log.batch?.labRoomName ?? "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><UserIcon className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Người phụ trách</div>
                  <div className="text-sm font-medium text-rose-600">{creatorName}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Thời gian thực hiện</div>
                  <div className="text-sm font-medium text-slate-800">
                    {formatDate(log.startDate)} <span className="text-slate-400 font-normal mx-1">đến</span> {formatDate(log.endDate)}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <span className="text-sm font-semibold text-rose-900">Số lượng mẫu dự kiến:</span>
                  <span className="text-lg font-bold text-[#9f1239]">{log.expectedSampleCount ?? 0}</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Danh sách các Mẫu (Samples) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
           <div className="px-6 py-5 border-b border-rose-50 bg-gradient-to-r from-rose-50/50 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-800">Danh sách Mẫu (Samples)</h2>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
              {log.samples?.length || 0} mẫu
            </span>
          </div>

          <div className="p-0">
            {log.samples && log.samples.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Tên Mẫu</th>
                      <th className="px-6 py-3">Giai đoạn hiện tại</th>
                      <th className="px-6 py-3">Ngày tạo</th>
                      <th className="px-6 py-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.samples.map((sample, idx) => (
                      <tr key={sample.id} className={`border-b border-slate-100 hover:bg-rose-50/50 transition-colors ${idx === log.samples.length - 1 ? 'border-none' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-800">{sample.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs">{sample.currentSampleStage || "—"}</span>
                        </td>
                        <td className="px-6 py-4">{formatDate(sample.createdDate)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                            {sample.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">
                Chưa có mẫu nào được khởi tạo trong thí nghiệm này.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </main>
  );
}