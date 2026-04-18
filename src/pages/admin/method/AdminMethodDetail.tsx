/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  ChevronLeft, AlertCircle, Info, Layers, 
  FlaskConical, CheckCircle2, XCircle, Beaker, Box
} from "lucide-react";

interface Chemical {
  id: number;
  name: string;
  category: string;
  description: string;
  concentrationUnit: string;
}

interface Material {
  id: number;
  name: string;
  category: string;
  description: string;
  unit: string;
}

interface StageChemical {
  id: string;
  chemical: Chemical;
}

interface StageMaterial {
  id: string;
  material: Material;
}

interface StageDefinition {
  id: number;
  name: string;
  description: string;
}

interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  stageDefinition: StageDefinition;
  stageMaterials: StageMaterial[];
  stageChemicals: StageChemical[];
}

interface Method {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  status?: boolean;
  methodStages: MethodStage[];
}

export default function AdminMethodDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethodDetail = async () => {
      if (!id) {
        setError("Không tìm thấy ID phương pháp trên URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await axiosInstance.get(`/api/methods/${id}`);
        
        let methodData: Method | null = null;
        if (response.data?.value) {
          methodData = response.data.value;
        } else if (response.data) {
          methodData = response.data;
        }
        
        if (methodData) {
          setMethod(methodData);
        } else {
          setError("Định dạng dữ liệu không hợp lệ.");
        }
      } catch (err) {
        console.error("Error loading method:", err);
        setError("Không thể tải thông tin phương pháp.");
      } finally {
        setLoading(false);
      }
    };

    void fetchMethodDetail();
  }, [id]);

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-rose-50 rounded-xl w-32" />
          <div className="bg-white border border-rose-100 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="h-8 bg-rose-50 rounded-xl w-3/4" />
            <div className="h-4 bg-rose-50 rounded-xl w-full" />
            <div className="h-4 bg-rose-50 rounded-xl w-2/3" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="h-24 bg-rose-50 rounded-2xl" />
              <div className="h-24 bg-rose-50 rounded-2xl" />
              <div className="h-24 bg-rose-50 rounded-2xl" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-72 bg-white border border-rose-100 rounded-3xl" />
            <div className="h-72 bg-white border border-rose-100 rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  // --- ERROR STATE ---
  if (error || !method) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg mb-2">
            {error ?? t("common.noData")}
          </p>
          <p className="text-slate-400 text-sm mb-6">Vui lòng kiểm tra lại URL hoặc kết nối mạng.</p>
          <button
            type="button"
            className="px-6 py-2.5 font-semibold text-white bg-[#9f1239] rounded-xl hover:bg-[#be123c] transition-colors shadow-sm"
            onClick={() => void navigate(`/admin/method?page=${page}`)}
          >
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  const sortedStages = [...method.methodStages].sort((a, b) => a.order - b.order);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Button */}
        <motion.div className="mb-6" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#9f1239] transition-colors group"
            onClick={() => void navigate(`/admin/method?page=${page}`)}
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("common.back") || "Quay lại danh sách"}
          </button>
        </motion.div>

        <motion.div className="space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          {/* Header Card */}
          <div className="bg-white border border-rose-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {/* Hiệu ứng trang trí góc */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-rose-50 to-transparent rounded-full opacity-50 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100/50 shadow-sm flex-shrink-0">
                    <FlaskConical className="w-8 h-8 text-[#9f1239]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-[#9f1239] tracking-tight">
                      {method.name}
                    </h1>
                    <p className="text-xs font-mono text-slate-400 mt-1">ID: {method.id}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-base leading-relaxed max-w-4xl ml-1">
                  {method.description}
                </p>
              </div>
              
              {/* Status Badge */}
              {method.status !== undefined && (
                <div className="flex-shrink-0">
                  {method.status ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("status.active") || "Hoạt động"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                      <XCircle className="w-4 h-4 mr-2" />
                      {t("status.inactive") || "Không hoạt động"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-rose-50">
              
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-blue-50/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng thời gian</p>
                  <p className="text-2xl font-black text-slate-800">
                    {method.totalDurationDays} <span className="text-base font-semibold text-slate-400 normal-case">ngày</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-purple-50/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số giai đoạn</p>
                  <p className="text-2xl font-black text-slate-800">
                    {method.methodStages.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-emerald-50/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</p>
                  <p className="text-lg font-bold text-slate-800">
                    {method.status ? "Đang áp dụng" : "Tạm ngưng"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stages Sequence */}
          <div>
            <div className="flex items-center gap-3 mb-6 ml-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Các giai đoạn thực hiện
              </h2>
              <span className="flex items-center justify-center w-7 h-7 bg-slate-800 text-white text-xs font-bold rounded-full shadow-sm">
                {sortedStages.length}
              </span>
            </div>
            
            <div className="space-y-6">
              {sortedStages.map((stage) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  {/* Stage Header */}
                  <div className="bg-slate-50/50 p-6 border-b border-rose-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-md">
                        {stage.order}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-800 mb-1">
                          {stage.stageDefinition.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {stage.stageDefinition.description}
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center px-5 py-2.5 bg-white rounded-xl border border-rose-100 shadow-sm flex-shrink-0">
                      <Info className="w-5 h-5 text-rose-600 mr-2.5" />
                      <span className="font-bold text-slate-800">
                        {stage.durationsDays} <span className="text-slate-500 font-medium">ngày</span>
                      </span>
                    </div>
                  </div>

                  {/* Stage Content (Materials & Chemicals) */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Materials (Vật tư - Theme Emerald) */}
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/50">
                            <Box className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-800">
                            Vật liệu <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-sm ml-2">{stage.stageMaterials.length}</span>
                          </h4>
                        </div>
                        
                        {stage.stageMaterials.length > 0 ? (
                          <div className="space-y-3">
                            {stage.stageMaterials.map((sm) => (
                              <div key={sm.id} className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-200 hover:shadow-sm transition-all group">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                    {sm.material.name}
                                  </h5>
                                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md flex-shrink-0 ml-3">
                                    {sm.material.category}
                                  </span>
                                </div>
                                {sm.material.description && (
                                  <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                                    {sm.material.description}
                                  </p>
                                )}
                                <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100">
                                  Đơn vị: <span className="text-slate-700 ml-1">{sm.material.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-slate-200 border-dashed">
                            <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">Không yêu cầu vật liệu</p>
                          </div>
                        )}
                      </div>

                      {/* Chemicals (Hoá chất - Theme Blue) */}
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100/50">
                            <Beaker className="w-5 h-5 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-800">
                            Hóa chất <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-sm ml-2">{stage.stageChemicals.length}</span>
                          </h4>
                        </div>
                        
                        {stage.stageChemicals.length > 0 ? (
                          <div className="space-y-3">
                            {stage.stageChemicals.map((sc) => (
                              <div key={sc.id} className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all group">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                    {sc.chemical.name}
                                  </h5>
                                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md flex-shrink-0 ml-3">
                                    {sc.chemical.category}
                                  </span>
                                </div>
                                {sc.chemical.description && (
                                  <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                                    {sc.chemical.description}
                                  </p>
                                )}
                                <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100">
                                  Nồng độ: <span className="text-slate-700 ml-1">{sc.chemical.concentrationUnit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-slate-200 border-dashed">
                            <Beaker className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">Không yêu cầu hóa chất</p>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}