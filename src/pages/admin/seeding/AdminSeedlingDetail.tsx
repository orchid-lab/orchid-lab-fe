/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import { 
  ArrowLeft, Leaf, Info, Clock, 
  User as UserIcon, Calendar, Sprout, Palette,
  Dna, AlertCircle
} from "lucide-react";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import { findClosestColorName } from "../../../utils/colorHelper";

// Mở rộng interface Seedling để bao gồm traits theo code cũ của bạn
export interface Trait {
  name: string;
  value: number | string;
  unit?: string;
}

export interface SeedlingDetailData {
  id: string;
  localName: string | null;
  scientificName: string | null;
  description: string | null;
  parentALocalName: string | null;
  parentAScientificName: string | null;
  createdDate: string;
  createdBy: string;
  deletedDate: string | null;
  deletedBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  traits?: Trait[];
}

/* ─── Animation variants ──────────────────────────────── */
const staggerContainer: Variants = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const fadeInUp: Variants = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } 
};

export default function AdminSeedlingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  
  const [seedling, setSeedling] = useState<SeedlingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSeedlingDetail = async () => {
      if (!id) {
        setError(t("seedling.notFound") ?? "Không tìm thấy cây giống");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get<{ value?: SeedlingDetailData }>(`/api/seedlings/${id}`);
        let seedlingData: SeedlingDetailData | null = null;

        if (response.data?.value) {
          seedlingData = response.data.value;
        } else if (response.data) {
          seedlingData = response.data as unknown as SeedlingDetailData;
        }

        if (seedlingData) {
          setSeedling(seedlingData);
        } else {
          setError(t("seedling.notFound") ?? "Không tìm thấy dữ liệu cây giống");
        }
      } catch (err) {
        console.error("Error loading seedling:", err);
        setError(t("seedling.loadingError") ?? "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    void fetchSeedlingDetail();
  }, [id, t]);

  // Fetch users for mapping IDs to names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get<{ data: User[] }>("/api/user?PageNumber=1&PageSize=1000");
        const users = response.data?.data ?? [];

        const map: Record<string, string> = {};
        users.forEach((user: User) => {
          if (user.id && user.name) {
            map[user.id] = user.name;
          }
        });
        setUserMap(map);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    void fetchUsers();
  }, []);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const getUserName = (userId: string | null | undefined): string => {
    if (!userId) return "—";
    if (!userId.includes("-")) return userId; // Nếu là 'system' thì trả về luôn
    return userMap[userId] || userId;
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] flex items-center justify-center p-8">
        <div className="flex flex-col items-center text-rose-500 animate-pulse">
          <Leaf className="w-12 h-12 mb-4 animate-bounce" />
          <p className="font-medium text-lg">{t("common.loadingData") ?? "Đang tải dữ liệu cây giống..."}</p>
        </div>
      </main>
    );
  }

  if (error || !seedling) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-6 font-medium w-fit"
            onClick={() => navigate(`/admin/seedlings?page=${page}`)}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back") ?? "Quay lại"}
          </button>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-16 text-center border border-rose-100 shadow-sm flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-rose-300 mb-4" />
            <p className="text-rose-600 text-xl font-semibold">{error ?? t("seedling.notFound")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-6 lg:p-8 text-slate-800">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Button */}
        <motion.button
          variants={fadeInUp}
          type="button"
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-2 font-medium w-fit"
          onClick={() => navigate(`/admin/seedlings?page=${page}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") ?? "Quay lại danh sách"}
        </motion.button>

        {/* Header Section */}
        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#9f1239] flex items-center gap-3">
              <Leaf className="w-10 h-10 p-2 bg-rose-100 text-rose-600 rounded-xl shadow-sm" />
              {seedling.localName ?? seedling.scientificName}
            </h1>
            <p className="text-lg text-slate-500 mt-2 font-medium italic flex items-center gap-2">
              <Dna className="w-5 h-5 text-slate-400" />
              {seedling.scientificName}
            </p>
          </div>
          <div className="px-4 py-2 bg-white border border-rose-100 rounded-xl shadow-sm text-sm font-medium text-slate-600">
            ID: <span className="text-[#9f1239] font-bold">{seedling.id.split('-')[0]}...</span>
          </div>
        </motion.div>

        {/* Main Info & Metadata Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Basic Information Card */}
          <motion.div variants={fadeInUp} className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-rose-50 bg-gradient-to-r from-rose-50/50 to-transparent flex items-center gap-3">
              <Info className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-800">{t("seedling.basicInfo") ?? "Thông tin cơ bản"}</h2>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t("seedling.seedlingName") ?? "Tên địa phương"}
                  </span>
                  <span className="text-lg font-medium text-slate-800">{seedling.localName ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t("seedling.scientificName") ?? "Tên khoa học"}
                  </span>
                  <span className="text-lg text-slate-700 italic">{seedling.scientificName ?? "—"}</span>
                </div>
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("seedling.description") ?? "Mô tả / Đặc điểm"}
                </span>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  {seedling.description ?? <span className="italic text-slate-400">Chưa có mô tả</span>}
                </p>
              </div>

              {/* Thông tin cây lai */}
              {(seedling.parentALocalName ?? seedling.parentAScientificName) && (
                <div className="pt-4 border-t border-rose-50">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-500" />
                    {t("seedling.parentA") ?? "Thông tin Cây Mẹ (Parent A)"}
                  </span>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col md:flex-row gap-4 md:gap-8">
                    <div>
                      <span className="text-xs text-emerald-600/70 font-semibold uppercase">Tên địa phương</span>
                      <div className="text-emerald-900 font-medium">{seedling.parentALocalName ?? "—"}</div>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-600/70 font-semibold uppercase">Tên khoa học</span>
                      <div className="text-emerald-800 italic">{seedling.parentAScientificName ?? "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Metadata Card */}
          <motion.div variants={fadeInUp} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-orange-100 overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-orange-50 bg-gradient-to-r from-orange-50/50 to-transparent flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-slate-800">{t("seedling.metadata") ?? "Lịch sử hệ thống"}</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{t("seedling.createdDate") ?? "Ngày tạo"}</div>
                  <div className="text-sm font-medium text-slate-800">{formatDate(seedling.createdDate)}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><UserIcon className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{t("seedling.createdBy") ?? "Người tạo"}</div>
                  <div className="text-sm font-medium text-rose-600">{getUserName(seedling.createdBy)}</div>
                </div>
              </div>

              {seedling.updatedDate && (
                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                  <div className="p-2 bg-sky-50 rounded-lg text-sky-500"><Clock className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{t("seedling.updatedDate") ?? "Cập nhật lần cuối"}</div>
                    <div className="text-sm font-medium text-slate-800">{formatDate(seedling.updatedDate)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">bởi {getUserName(seedling.updatedBy)}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Traits Section */}
        <motion.div variants={fadeInUp} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-rose-50 bg-gradient-to-r from-rose-50/50 to-transparent flex items-center gap-3">
            <Palette className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">{t("seedling.traits") ?? "Đặc điểm sinh học (Traits)"}</h2>
          </div>

          <div className="p-6 md:p-8">
            {seedling.traits && seedling.traits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {seedling.traits.map((trait, index) => {
                  const isColorTrait = trait.name.toLowerCase().includes("màu");
                  
                  if (isColorTrait && typeof trait.value === 'number') {
                    // Logic xử lý màu sắc
                    const value = trait.value;
                    const r = Math.floor(value / 1_000_000);
                    const g = Math.floor((value % 1_000_000) / 1_000);
                    const b = value % 1_000;
                    const colorName = findClosestColorName(r, g, b);

                    return (
                      <div key={`trait-${index}`} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-rose-300 hover:shadow-md transition-all">
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{trait.name}</div>
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-14 h-14 rounded-full border-4 border-white shadow-md shadow-slate-200/50 flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }} 
                          />
                          <div>
                            <div className="text-lg font-bold text-slate-800 leading-tight">{colorName}</div>
                            <div className="text-xs font-mono text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                              RGB({r}, {g}, {b})
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Các trait thông thường (Số, Text)
                  return (
                    <div key={`trait-${index}`} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-center">
                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1 truncate" title={trait.name}>
                        {trait.name}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#9f1239]">{trait.value}</span>
                        {trait.unit && <span className="text-sm font-medium text-slate-400">{trait.unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Dna className="w-10 h-10 mb-3 text-slate-300" />
                <p>{t("seedling.noTraits") ?? "Chưa có đặc điểm nào được ghi nhận cho giống này."}</p>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </main>
  );
}