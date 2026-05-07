import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import type {
  Chemical,
  Material,
  ExperimentLog,
  Sample,
  TaskAttribute,
  ChecklistItem,
  TargetType,
  TaskMode,
} from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { Plus, X } from "lucide-react";

interface ApiChemicalResponse {
  data?: { id: number; name: string; category: string; concentrationUnit: string; }[];
  value?: { data?: { id: number; name: string; category: string; concentrationUnit: string; }[]; };
}

interface ApiMaterialResponse {
  data?: { id: number; name: string; category: string; unit: string }[];
  value?: { data?: { id: number; name: string; category: string; unit: string }[]; };
}

interface ApiELResponse {
  value?: { data?: { id: string; name: string; currentStageOrder?: number }[] };
  data?: { id: string; name: string; currentStageOrder?: number }[];
}

interface ApiSampleResponse {
  value?: { data?: { id: string; name: string }[] };
  data?: { id: string; name: string }[];
}

type KeyedAttr = TaskAttribute & { _key: number };
type KeyedCL = ChecklistItem & { _key: number };

let _attrKeyCounter = 0;
let _clKeyCounter = 0;

const emptyAttribute = (): KeyedAttr => ({
  type: "chemical",
  itemId: 0,
  itemName: "",
  unit: "",
  value: 1,
  _key: ++_attrKeyCounter,
});

const emptyChecklist = (order: number): KeyedCL => ({
  name: "",
  description: "",
  order,
  sourceType: "none",
  sourceId: null,
  sourceName: "",
  expectedUnit: "",
  expectedMinValue: null,
  expectedMaxValue: null,
  _key: ++_clKeyCounter,
});

const CreateTaskContainer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setState } = useCreateTask();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskMode, setTaskMode] = useState<TaskMode>("regular");

  const [targetType, setTargetType] = useState<TargetType | "">("");
  const [selectedELId, setSelectedELId] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");

  const [templateELId, setTemplateELId] = useState("");

  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [experimentLogs, setExperimentLogs] = useState<ExperimentLog[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);

  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<KeyedAttr[]>([emptyAttribute()]);
  const [checklistItems, setChecklistItems] = useState<KeyedCL[]>([]);

  useEffect(() => {
    axiosInstance.get<ApiChemicalResponse>("/api/chemical?PageNo=1&PageSize=200")
      .then((res) => {
        const list = res.data?.data ?? res.data?.value?.data ?? [];
        setChemicals(list.map((c) => ({ id: c.id, name: c.name, category: c.category, concentrationUnit: c.concentrationUnit })));
      })
      .catch(() => enqueueSnackbar(t("task.fetchChemicalsFailed"), { variant: "error" }));
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    axiosInstance.get<ApiMaterialResponse>("/api/material?PageNo=1&PageSize=200")
      .then((res) => {
        const list = res.data?.data ?? res.data?.value?.data ?? [];
        setMaterials(list.map((m) => ({ id: m.id, name: m.name, category: m.category, unit: m.unit })));
      })
      .catch(() => enqueueSnackbar(t("task.fetchMaterialsFailed"), { variant: "error" }));
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    axiosInstance.get<ApiELResponse>("/api/experiment-logs?PageNo=1&PageSize=100")
      .then((res) => {
        const list = res.data?.value?.data ?? res.data?.data ?? [];
        setExperimentLogs(list.map((el) => ({ id: el.id, name: el.name, currentStageOrder: el.currentStageOrder })));
      })
      .catch(() => enqueueSnackbar(t("task.fetchELFailed"), { variant: "error" }));
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    if (taskMode !== "regular" || targetType !== "Sample") return;
    axiosInstance.get<ApiSampleResponse>("/api/samples?PageNo=1&PageSize=100")
      .then((res) => {
        const list = res.data?.value?.data ?? res.data?.data ?? [];
        setSamples(list.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => enqueueSnackbar(t("task.fetchSamplesFailed"), { variant: "error" }));
  }, [taskMode, targetType, enqueueSnackbar, t]);

  const handleAttrTypeChange = (idx: number, type: "chemical" | "material") => {
    setAttributes((prev) => prev.map((a, i) => i === idx ? { ...a, type, itemId: 0, itemName: "", unit: "" } : a));
  };

  const handleAttrItemChange = (idx: number, idStr: string) => {
    const id = Number(idStr);
    setAttributes((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        if (a.type === "chemical") {
          const c = chemicals.find((x) => x.id === id);
          return { ...a, itemId: id, itemName: c?.name ?? "", unit: c?.concentrationUnit ?? "" };
        } else {
          const m = materials.find((x) => x.id === id);
          return { ...a, itemId: id, itemName: m?.name ?? "", unit: m?.unit ?? "" };
        }
      })
    );
  };

  const handleAttrValueChange = (idx: number, value: number) => {
    setAttributes((prev) => prev.map((a, i) => (i === idx ? { ...a, value } : a)));
  };

  const handleAttrUnitChange = (idx: number, unit: string) => {
    setAttributes((prev) => prev.map((a, i) => (i === idx ? { ...a, unit } : a)));
  };

  const addAttribute = () => setAttributes((prev) => [...prev, emptyAttribute()]);
  const removeAttribute = (idx: number) => setAttributes((prev) => prev.filter((_, i) => i !== idx));

  const handleChecklistField = (idx: number, field: keyof ChecklistItem, value: string | number | null) => {
    setChecklistItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addChecklist = () => setChecklistItems((prev) => [...prev, emptyChecklist(prev.length + 1)]);
  const removeChecklist = (idx: number) =>
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 })));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (taskMode === "regular") {
      const el = targetType === "ExperimentLog" ? (experimentLogs.find((x) => x.id === selectedELId) ?? null) : null;
      const sample = targetType === "Sample" ? (samples.find((x) => x.id === selectedSampleId) ?? null) : null;

      setState((prev) => ({
        ...prev, name, description, taskMode, targetType, selectedEL: el, selectedSample: sample,
        expectedEndDate, technician: null, templateEL: null,
        attributes: attributes.filter((a) => a.itemId > 0),
        checklistItems,
      }));
      void navigate("/researcher/create-task/step-2");
    } else {
      const tplEL = experimentLogs.find((x) => x.id === templateELId) ?? null;
      setState((prev) => ({
        ...prev, name, description, taskMode, targetType: "", selectedEL: null, selectedSample: null,
        expectedEndDate: "", technician: null, templateEL: tplEL,
        attributes: attributes.filter((a) => a.itemId > 0),
        checklistItems,
      }));
      void navigate("/researcher/create-task/step-3");
    }
    setLoading(false);
  };

  const isRegular = taskMode === "regular";
  const todayStr = new Date().toISOString().split("T")[0];
  const canSubmitRegular = !!name && !!targetType && (targetType === "ExperimentLog" ? !!selectedELId : !!selectedSampleId) && !!expectedEndDate && expectedEndDate >= todayStr;
  const canSubmitTemplate = !!name;
  const canSubmit = isRegular ? canSubmitRegular : canSubmitTemplate;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CreateTaskStepper currentStep={1} />

      <form onSubmit={handleSubmit} className="mt-8 bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{t("task.stepBasicInfo")}</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="radio" value="regular" checked={taskMode === "regular"} onChange={() => setTaskMode("regular")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className={taskMode === "regular" ? "text-blue-700" : "text-slate-600"}>{t("task.taskModeRegular")}</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="radio" value="template" checked={taskMode === "template"} onChange={() => setTaskMode("template")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className={taskMode === "template" ? "text-blue-700" : "text-slate-600"}>{t("task.taskModeTemplate")}</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.taskName")} <span className="text-rose-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white transition-all shadow-sm" placeholder={t("task.taskNamePlaceholder")} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t("common.description")}</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white transition-all shadow-sm resize-y" placeholder={t("task.descriptionPlaceholder")} />
          </div>

          {isRegular && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.targetType")} <span className="text-rose-500">*</span></label>
                <select value={targetType} onChange={(e) => { setTargetType(e.target.value as TargetType | ""); setSelectedELId(""); setSelectedSampleId(""); }} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm">
                  <option value="">{t("task.selectTargetType")}</option>
                  <option value="ExperimentLog">{t("task.typeLog")}</option>
                  <option value="Sample">{t("task.typeSample")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.expectedEndDate")} <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={expectedEndDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm"
                  />              
              </div>

              {targetType === "ExperimentLog" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.selectLog")} <span className="text-rose-500">*</span></label>
                  <select value={selectedELId} onChange={(e) => setSelectedELId(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm">
                    <option value="">{t("task.selectLogPlaceholder")}</option>
                    {experimentLogs.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                  </select>
                </div>
              )}

              {targetType === "Sample" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.selectSample")} <span className="text-rose-500">*</span></label>
                  <select value={selectedSampleId} onChange={(e) => setSelectedSampleId(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm">
                    <option value="">{t("task.selectSamplePlaceholder")}</option>
                    {samples.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {!isRegular && (
            <div className="flex flex-col p-5 bg-slate-50 border border-slate-100 rounded-xl">
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t("task.templateStageLabel")}</label>
              <select value={templateELId} onChange={(e) => setTemplateELId(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm">
                <option value="">{t("task.noStageOption")}</option>
                {experimentLogs.map((el) => (
                  <option key={el.id} value={el.id}>{el.name} {el.currentStageOrder != null ? ` — Stage ${el.currentStageOrder}` : ""}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Task Attributes */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">{t("task.taskAttributesTitle")}</h3>
            <button type="button" onClick={addAttribute} className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" /> {t("task.addMaterialBtn")}
            </button>
          </div>
          {attributes.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">{t("task.noAttributes")}</p>}
          <div className="space-y-3">
            {attributes.map((attr, idx) => (
              <div key={attr._key} className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-3 items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t("task.attrType")}</label>
                  <select value={attr.type} onChange={(e) => handleAttrTypeChange(idx, e.target.value as "chemical" | "material")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="chemical">{t("element.chemical")}</option>
                    <option value="material">{t("task.attrMaterialEquipment")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{attr.type === "chemical" ? t("task.selectChemical") : t("task.selectMaterial")}</label>
                  <select value={attr.itemId || ""} onChange={(e) => handleAttrItemChange(idx, e.target.value)} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="">{t("common.select")}</option>
                    {(attr.type === "chemical" ? chemicals : materials).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t("task.unit")}</label>
                  <input type="text" value={attr.unit} onChange={(e) => handleAttrUnitChange(idx, e.target.value)} placeholder={t("task.unit")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t("task.quantity")}</label>
                  <input type="number" min={0} step="any" value={attr.value} onChange={(e) => handleAttrValueChange(idx, Number(e.target.value))} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <button type="button" onClick={() => removeAttribute(idx)} className="mb-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">{t("task.checklistTitle")}</h3>
            <button type="button" onClick={addChecklist} className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" /> {t("task.addChecklistBtn")}
            </button>
          </div>
          {checklistItems.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">{t("task.noChecklistItems")}</p>}
          <div className="space-y-4">
            {checklistItems.map((item, idx) => (
              <div key={item._key} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative">
                <div className="flex items-center justify-between mb-4 pr-8">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">{t("task.stepPrefix")} {idx + 1}</span>
                </div>
                <button type="button" onClick={() => removeChecklist(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.checklistName")} <span className="text-rose-500">*</span></label>
                    <input type="text" required value={item.name} onChange={(e) => handleChecklistField(idx, "name", e.target.value)} placeholder={t("task.checklistItemPlaceholder")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("common.description")}</label>
                    <input type="text" value={item.description} onChange={(e) => handleChecklistField(idx, "description", e.target.value)} placeholder={t("task.checklistDescPlaceholder")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.expectedUnit")}</label>
                    <input type="text" value={item.expectedUnit} onChange={(e) => handleChecklistField(idx, "expectedUnit", e.target.value)} placeholder={t("task.checklistUnitPlaceholder")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.minExpected")}</label>
                    <input type="number" step="any" value={item.expectedMinValue ?? ""} onChange={(e) => handleChecklistField(idx, "expectedMinValue", e.target.value === "" ? null : Number(e.target.value))} placeholder={t("task.minExpected")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">{t("task.maxExpected")}</label>
                    <input type="number" step="any" value={item.expectedMaxValue ?? ""} onChange={(e) => handleChecklistField(idx, "expectedMaxValue", e.target.value === "" ? null : Number(e.target.value))} placeholder={t("task.maxExpected")} className="w-full py-2.5 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-200">
          <button type="button" onClick={() => void navigate("/researcher/tasks")} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={!canSubmit || loading} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm">
            {isRegular ? `${t("common.next")} →` : t("task.reviewBtn")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskContainer;