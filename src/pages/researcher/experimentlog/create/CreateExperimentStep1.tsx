/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react-dom/no-missing-button-type */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ArrowRight, FileText, Microscope, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";

interface Batch {
  id: string;
  name: string;
  labName?: string;
  description?: string;
  status?: string;
}

interface Technician {
  id: string;
  name: string;
  email?: string;
  roleID: string | number;
}

/* ─── Animation & Styles ──────────────────────────────── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] bg-white transition-all shadow-sm";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

const CreateExperimentStep1 = () => {
  const DEV_OFFLINE = false;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { form, setForm } = useExperimentLogForm();

  const [selectedBatch, setSelectedBatch] = useState(form.tissueCultureBatchID ?? "");
  const [selectedMethod, setSelectedMethod] = useState(form.methodID ?? "");
  const [name, setName] = useState(form.name ?? "");
  const [startDate, setStartDate] = useState(form.startDate ?? "");
  const [endDate, setEndDate] = useState(form.endDate ?? "");
  const [numberOfSample, _setNumberOfSample] = useState(form.numberOfSample ?? 1);
  const [objective, setObjective] = useState(form.objective ?? "");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);

  const [methods, setMethods] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>(
    typeof form.technicianID === "string" ? form.technicianID : Array.isArray(form.technicianID) && form.technicianID.length > 0 ? form.technicianID[0] : ""
  );

  const [methodStages, setMethodStages] = useState<{ name: string; description: string }[]>([]);

  // Fetch batches
  useEffect(() => {
    if (DEV_OFFLINE) {
      setBatchError(null);
      setBatches([{ id: "mock-b1", name: "Lô mẫu A", status: "Ready" }]);
      setLoadingBatch(false);
      return;
    }
    setLoadingBatch(true);
    axiosInstance.get("/api/batches", { params: { pageNo: 1, pageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        setBatches(Array.isArray(raw.data) ? raw.data.map((b) => ({ id: String(b.id), name: b.batchName, status: b.status })) : []);
      })
      .catch(() => { setBatchError(t("experimentLog.batchLoadError")); setBatches([]); })
      .finally(() => setLoadingBatch(false));
  }, [DEV_OFFLINE, t]);

  // Fetch methods
  useEffect(() => {
    if (DEV_OFFLINE) {
      setMethods([{ id: "1", name: "Nuôi cấy mô tế bào (Invitro)", type: "Clonal" }]);
      return;
    }
    axiosInstance.get("/api/methods", { params: { pageNumber: 1, pageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        setMethods(Array.isArray(raw.data) ? raw.data.map((m) => ({ id: String(m.id), name: m.name, description: m.description })) : []);
      })
      .catch(() => setMethods([]));
  }, [DEV_OFFLINE]);

  // Fetch detailed method info
  useEffect(() => {
    if (!selectedMethod || DEV_OFFLINE) { setMethodStages([]); return; }
    axiosInstance.get(`/api/methods/${selectedMethod}`)
      .then((res) => {
        const data = res.data as any;
        setMethodStages(Array.isArray(data.methodStages) ? data.methodStages.map((s: any) => ({ name: s.stageDefinition?.name ?? "", description: s.stageDefinition?.description ?? "" })) : []);
      })
      .catch(() => setMethodStages([]));
  }, [selectedMethod, DEV_OFFLINE]);

  // Fetch technicians
  useEffect(() => {
    if (DEV_OFFLINE) {
      setTechnicians([{ id: "tech-1", name: "Technician Phat", roleID: "Lab Technician" }]);
      return;
    }
    axiosInstance.get("/api/user", { params: { PageNumber: 1, PageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        setTechnicians(Array.isArray(raw.data) ? raw.data.filter((u) => String(u.role).toLowerCase().includes("technician")).map((u) => ({ id: u.id, name: u.name, email: u.email, roleID: u.role })) : []);
      })
      .catch(() => setTechnicians([]));
  }, [DEV_OFFLINE]);

  // Update context
  useEffect(() => {
    const methodObj = methods.find((m) => m.id === selectedMethod);
    const batchObj = batches.find((b) => b.id === selectedBatch);
    const tech = technicians.find((t) => t.id === selectedTechnician);
    setForm((prev) => ({
      ...prev, name, startDate, endDate, numberOfSample, objective,
      tissueCultureBatchID: selectedBatch, batchName: batchObj?.name ?? "",
      methodID: methodObj?.id ?? "", methodName: methodObj?.name ?? "", methodType: methodObj?.type ?? "",
      technicianID: selectedTechnician ? [selectedTechnician] : [], technicianNames: tech ? [tech.name] : [],
    }));
  }, [selectedBatch, selectedMethod, batches, setForm, methods, name, startDate, endDate, numberOfSample, objective, selectedTechnician, technicians]);

  // --- VALIDATE NGÀY ---
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Ngày bắt đầu không được ở quá khứ (so sánh string YYYY-MM-DD là đủ chính xác)
  const isStartDateValid = !startDate || startDate >= todayStr;

  // Ngày kết thúc không được trước ngày bắt đầu
  const isEndDateValid = !startDate || !endDate || endDate >= startDate;

  const isStep1Valid = Boolean(
    name &&
    selectedBatch &&
    selectedMethod &&
    selectedTechnician &&
    isStartDateValid &&
    isEndDateValid
  );

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
        
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <ExperimentSteps currentStep={1} />
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#2D5A27] p-1 bg-[#E4F0E8] rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-[#1e3e1c]">{t("experimentLog.createTitle")}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{t("experimentLog.step1Subtitle")}</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <label className={labelClass}>{t("experimentLog.name")} <span className="text-rose-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t("experimentLog.namePlaceholder")} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label className={labelClass}>{t("experimentLog.startDate")}</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputClass} ${!isStartDateValid ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`}
                  />
                </div>
                {!isStartDateValid && (
                  <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Ngày bắt đầu không thể ở trong quá khứ.
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className={labelClass}>{t("experimentLog.endDate")}</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || todayStr}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputClass} ${!isEndDateValid ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`}
                  />
                </div>
                {!isEndDateValid && (
                  <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Ngày kết thúc không thể trước ngày bắt đầu.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>{t("experimentLog.batch")} <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select value={selectedBatch} onChange={(e) => { setSelectedBatch(e.target.value); setBatchError(null); }} className={`${inputClass} appearance-none cursor-pointer`} disabled={loadingBatch}>
                    <option value="">{t("experimentLog.selectBatch")}</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id} disabled={batch.status !== "Ready"}>
                        {batch.name || batch.id} {batch.status !== "Ready" ? `(${t("experimentLog.batchInUse")})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
                {batchError && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3"/> {batchError}</p>}
              </div>

              <div>
                <label className={labelClass}>{t("experimentLog.technician")} <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="">{t("experimentLog.selectTechnician")}</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>{tech.name ?? tech.email ?? tech.id}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("experimentLog.method")} <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">{t("experimentLog.selectMethod")}</option>
                  {methods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            {selectedMethod && (
              <div className="bg-[#F4F7F4] p-5 rounded-xl border border-[#DDEEE0]">
                <h3 className="font-bold text-[#1e3e1c] flex items-center gap-2 mb-3">
                  <Microscope className="w-4 h-4 text-[#2D5A27]" />
                  {t("experimentLog.methodDetail")}: {methods.find((m) => String(m.id) === selectedMethod)?.name}
                </h3>
                <div className="text-sm text-slate-600 space-y-3 pl-6">
                  <p><strong>{t("experimentLog.description")}:</strong> {methods.find((m) => String(m.id) === selectedMethod)?.description}</p>
                  <div>
                    <strong>{t("experimentLog.stages")}:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500">
                      {methodStages.length > 0 ? methodStages.map((stage, index) => (
                        <li key={index}><span className="font-semibold text-slate-700">{stage.name}</span> {stage.description && `- ${stage.description}`}</li>
                      )) : <li>{t("experimentLog.noStageInfo")}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>{t("experimentLog.objective")} <span className="text-rose-500">*</span></label>
              <textarea rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} className={`${inputClass} resize-none`} placeholder={t("experimentLog.objectivePlaceholder")} />
            </div>

          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <Link to="/researcher/experiment-log" className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors">
              {t("common.cancel")}
            </Link>
            <button
              onClick={() => navigate("/researcher/experiment-log/create/step-2")}
              disabled={!isStep1Valid}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${
                isStep1Valid ? "bg-[#2D5A27] text-white hover:bg-[#1e3e1c]" : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {t("common.continue")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default CreateExperimentStep1;