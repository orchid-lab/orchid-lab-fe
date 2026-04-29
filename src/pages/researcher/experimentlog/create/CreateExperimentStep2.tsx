/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Plus, ChevronDown, Leaf, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";
import type { Seedling } from "../../../../types/Seedling";

const findClosestColorName = (r: number, g: number, b: number): string => {
  const colors = [
    { name: "Red", r: 255, g: 0, b: 0 }, { name: "Blue", r: 0, g: 0, b: 255 },
    { name: "Green", r: 0, g: 128, b: 0 }, { name: "Yellow", r: 255, g: 255, b: 0 },
    { name: "Pink", r: 255, g: 192, b: 203 }, { name: "Purple", r: 128, g: 0, b: 128 },
    { name: "Orange", r: 255, g: 165, b: 0 }, { name: "White", r: 255, g: 255, b: 255 },
    { name: "Black", r: 0, g: 0, b: 0 },
  ];
  let closest = colors[0];
  let minDist = Infinity;
  colors.forEach((color) => {
    const dist = Math.sqrt(Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2));
    if (dist < minDist) { minDist = dist; closest = color; }
  });
  return closest.name;
};

const staggerContainer: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeInUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] bg-white transition-all shadow-sm";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

const CreateExperimentStep2 = () => {
  const { t } = useTranslation();
  // FIX: thêm useNavigate để dùng trong handleNext
  const navigate = useNavigate();
  const { form, setForm } = useExperimentLogForm();
  const { methodType, methodName } = form;

  const DEV_OFFLINE = false;
  const mType = methodType || "Clonal";
  const mName = methodName ?? (DEV_OFFLINE ? "Clonal" : "Phương pháp mẫu");

  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [motherId, setMotherId] = useState<string | undefined>(form.motherID ? String(form.motherID) : undefined);
  const [expectedSample, setExpectedSample] = useState<number>(typeof form.numberOfSample === "number" && form.numberOfSample > 0 ? form.numberOfSample : 1);
  const [selectedMotherDetail, setSelectedMotherDetail] = useState<Seedling | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setLoading(true);
    const mock: Seedling[] = [
      { id: "mock-1", localName: "Vanda Blue", scientificName: "Vanda coerulea", description: "Cây giống mẫu", doB: "2020-05-12", createdDate: "2020-05-12", createdBy: "Admin", traits: [{ name: "Chiều cao", value: 45, unit: "cm" }] }
    ];
    if (DEV_OFFLINE) { setSeedlings(mock); setLoading(false); return; }

    axiosInstance.get("/api/seedlings", { params: { pageNumber: 1, pageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        setSeedlings(Array.isArray(raw.data) ? raw.data : []);
      })
      .catch(() => { setError("Không thể tải danh sách cây giống (sử dụng dữ liệu mẫu)"); setSeedlings(mock); })
      .finally(() => setLoading(false));
  }, [DEV_OFFLINE]);

  useEffect(() => { setMotherId(undefined); setSelectedMotherDetail(null); }, [methodType]);

  useEffect(() => {
    if (!motherId) { setSelectedMotherDetail(null); return; }
    setLoadingDetail(true);
    axiosInstance.get(`/api/seedlings/${motherId}`)
      .then((res) => setSelectedMotherDetail(res.data.value ?? res.data))
      .catch(() => setSelectedMotherDetail(seedlings.find((s) => s.id === motherId) ?? null))
      .finally(() => setLoadingDetail(false));
  }, [motherId, seedlings]);

  useEffect(() => {
    const mother = seedlings.find((s) => s.id === motherId);
    if (mother) {
      const displayName = mother.localName ?? mother.scientificName ?? "Chưa có tên";
      setForm((prev) => ({ ...prev, motherID: mother.id, motherName: displayName, hybridization: [mother.id], hybridizationNames: [displayName] }));
    } else {
      setForm((prev) => ({ ...prev, motherID: "", motherName: "", hybridization: [], hybridizationNames: [] }));
    }
  }, [motherId, seedlings, setForm]);

  useEffect(() => { setForm((prev) => ({ ...prev, numberOfSample: expectedSample })); }, [expectedSample, setForm]);

  const isNextDisabled = !motherId || !(expectedSample && expectedSample > 0);
  const selectedMother = selectedMotherDetail ?? seedlings.find((s) => s.id === motherId);

  // FIX: khai báo handleNext, void để tránh Promise-in-void warning
  const handleNext = () => {
    void navigate("/researcher/experiment-log/create/step-3");
  };

  if (mType === undefined) return null;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
        
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <ExperimentSteps currentStep={2} />
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-[#2D5A27] p-1 bg-[#E4F0E8] rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-[#1e3e1c]">Tạo Kế Hoạch Lai Tạo Mới</h1>
                <p className="text-sm text-slate-500 mt-0.5">Bước 2: Chọn cây giống cho phương pháp "{mName}"</p>
              </div>
            </div>
            <Link to="/seedlings/new" className="flex items-center gap-2 px-4 py-2 bg-[#E4F0E8] text-[#2D5A27] hover:bg-[#DDEEE0] rounded-xl font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Tạo cây giống mới
            </Link>
          </div>
          
          <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Cây giống 1</label>
                <div className="relative">
                  <select value={motherId ?? ""} onChange={(e) => setMotherId(e.target.value || undefined)} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="">-- Chọn cây giống 1 --</option>
                    {seedlings.map((p) => (
                      <option key={p.id} value={p.id}>{p.localName ?? p.scientificName ?? p.id}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Số mẫu mong muốn</label>
                <input type="number" min={1} value={expectedSample} onChange={(e) => { const v = parseInt(e.target.value || "0", 10); setExpectedSample(Number.isNaN(v) ? 1 : v); }} className={inputClass} />
              </div>
            </div>

            {loadingDetail ? (
              <div className="p-5 border border-blue-100 rounded-xl bg-blue-50/50 flex items-center gap-3 text-blue-700 font-medium">
                <span className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" /> Đang tải thông tin cây...
              </div>
            ) : selectedMother ? (
              <div className="space-y-6">
                <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50">
                  <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-[#2D5A27]" /> Thông tin cây giống 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 text-sm">
                    <div><span className="text-slate-500">Tên địa phương:</span> <strong className="text-slate-800 ml-1">{selectedMother.localName ?? "Chưa có"}</strong></div>
                    <div><span className="text-slate-500">Tên khoa học:</span> <strong className="text-slate-800 ml-1">{selectedMother.scientificName ?? "Chưa có"}</strong></div>
                    <div className="md:col-span-2"><span className="text-slate-500">Mô tả:</span> <span className="text-slate-800 ml-1">{selectedMother.description || "Không có mô tả"}</span></div>
                  </div>
                </div>

                <div className="p-6 border border-[#DDEEE0] rounded-2xl bg-[#F4F7F4]/50">
                  <h4 className="font-bold text-lg text-[#1e3e1c] mb-4 flex items-center gap-2">🌱 {t("seedling.traits") || "Đặc điểm nổi bật"}</h4>
                  {selectedMother.traits && selectedMother.traits.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedMother.traits.map((trait, index) => {
                        const isColor = trait.name === "Màu hoa chính" || trait.name === "Màu hoa phụ";
                        if (isColor) {
                          const r = Math.floor(trait.value / 1_000_000);
                          const g = Math.floor((trait.value % 1_000_000) / 1_000);
                          const b = trait.value % 1_000;
                          return (
                            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg border-2 border-slate-200 shadow-sm" style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }} />
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">{trait.name}</p>
                                <p className="text-lg font-bold text-slate-800 leading-tight">{findClosestColorName(r, g, b)}</p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase">{trait.name}</p>
                            <p className="text-xl font-bold text-[#1e3e1c] leading-tight mt-1">{trait.value} <span className="text-sm text-slate-500 font-medium">{trait.unit}</span></p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500"><AlertCircle className="w-5 h-5"/> Không có tính trạng được ghi lại.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-32 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 bg-slate-50/50">
                Chưa chọn cây giống để hiển thị thông tin chi tiết.
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <Link to="/researcher/experiment-log/create/step-1" className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${isNextDisabled ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#2D5A27] text-white hover:bg-[#1e3e1c]"}`}
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default CreateExperimentStep2;