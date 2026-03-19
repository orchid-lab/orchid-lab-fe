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

interface ApiChemicalResponse {
  data?: {
    id: number;
    name: string;
    category: string;
    concentrationUnit: string;
  }[];
  value?: {
    data?: {
      id: number;
      name: string;
      category: string;
      concentrationUnit: string;
    }[];
  };
}

interface ApiMaterialResponse {
  data?: { id: number; name: string; category: string; unit: string }[];
  value?: {
    data?: { id: number; name: string; category: string; unit: string }[];
  };
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

  // Regular task fields
  const [targetType, setTargetType] = useState<TargetType | "">("");
  const [selectedELId, setSelectedELId] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");

  // Template field
  const [templateELId, setTemplateELId] = useState("");

  // Data lists
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [experimentLogs, setExperimentLogs] = useState<ExperimentLog[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);

  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<KeyedAttr[]>([emptyAttribute()]);
  const [checklistItems, setChecklistItems] = useState<KeyedCL[]>([]);

  // Fetch chemicals
  useEffect(() => {
    axiosInstance
      .get<ApiChemicalResponse>("/api/chemical?PageNo=1&PageSize=200")
      .then((res) => {
        const list = res.data?.data ?? res.data?.value?.data ?? [];
        setChemicals(
          list.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            concentrationUnit: c.concentrationUnit,
          })),
        );
      })
      .catch(() =>
        enqueueSnackbar(t("task.fetchChemicalsFailed"), {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar, t]);

  // Fetch materials
  useEffect(() => {
    axiosInstance
      .get<ApiMaterialResponse>("/api/material?PageNo=1&PageSize=200")
      .then((res) => {
        const list = res.data?.data ?? res.data?.value?.data ?? [];
        setMaterials(
          list.map((m) => ({
            id: m.id,
            name: m.name,
            category: m.category,
            unit: m.unit,
          })),
        );
      })
      .catch(() =>
        enqueueSnackbar(t("task.fetchMaterialsFailed"), {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar, t]);

  // Fetch experiment logs
  useEffect(() => {
    axiosInstance
      .get<ApiELResponse>("/api/experiment-logs?PageNo=1&PageSize=100")
      .then((res) => {
        const list = res.data?.value?.data ?? res.data?.data ?? [];
        setExperimentLogs(
          list.map((el) => ({
            id: el.id,
            name: el.name,
            currentStageOrder: el.currentStageOrder,
          })),
        );
      })
      .catch(() =>
        enqueueSnackbar(t("task.fetchELFailed"), {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar, t]);

  // Fetch samples when targetType = Sample
  useEffect(() => {
    if (taskMode !== "regular" || targetType !== "Sample") return;
    axiosInstance
      .get<ApiSampleResponse>("/api/samples?PageNo=1&PageSize=100")
      .then((res) => {
        const list = res.data?.value?.data ?? res.data?.data ?? [];
        setSamples(list.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() =>
        enqueueSnackbar(t("task.fetchSamplesFailed"), {
          variant: "error",
        }),
      );
  }, [taskMode, targetType, enqueueSnackbar, t]);

  // ── Attribute handlers ──────────────────────────────────────────────────
  const handleAttrTypeChange = (idx: number, type: "chemical" | "material") => {
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, type, itemId: 0, itemName: "", unit: "" } : a,
      ),
    );
  };

  const handleAttrItemChange = (idx: number, idStr: string) => {
    const id = Number(idStr);
    setAttributes((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        if (a.type === "chemical") {
          const c = chemicals.find((x) => x.id === id);
          return {
            ...a,
            itemId: id,
            itemName: c?.name ?? "",
            unit: c?.concentrationUnit ?? "",
          };
        } else {
          const m = materials.find((x) => x.id === id);
          return {
            ...a,
            itemId: id,
            itemName: m?.name ?? "",
            unit: m?.unit ?? "",
          };
        }
      }),
    );
  };

  const handleAttrValueChange = (idx: number, value: number) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, value } : a)),
    );
  };

  const handleAttrUnitChange = (idx: number, unit: string) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, unit } : a)),
    );
  };

  const addAttribute = () =>
    setAttributes((prev) => [...prev, emptyAttribute()]);
  const removeAttribute = (idx: number) =>
    setAttributes((prev) => prev.filter((_, i) => i !== idx));

  // ── Checklist handlers ──────────────────────────────────────────────────
  const handleChecklistField = (
    idx: number,
    field: keyof ChecklistItem,
    value: string | number | null,
  ) => {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const addChecklist = () =>
    setChecklistItems((prev) => [...prev, emptyChecklist(prev.length + 1)]);
  const removeChecklist = (idx: number) =>
    setChecklistItems((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, order: i + 1 })),
    );

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (taskMode === "regular") {
      const el =
        targetType === "ExperimentLog"
          ? (experimentLogs.find((x) => x.id === selectedELId) ?? null)
          : null;
      const sample =
        targetType === "Sample"
          ? (samples.find((x) => x.id === selectedSampleId) ?? null)
          : null;

      setState((prev) => ({
        ...prev,
        name,
        description,
        taskMode,
        targetType,
        selectedEL: el,
        selectedSample: sample,
        expectedEndDate,
        technician: null,
        templateEL: null,
        attributes: attributes.filter((a) => a.itemId > 0),
        checklistItems,
      }));
      void navigate("/create-task/step-2");
    } else {
      // Template mode — skip technician step
      const tplEL = experimentLogs.find((x) => x.id === templateELId) ?? null;
      setState((prev) => ({
        ...prev,
        name,
        description,
        taskMode,
        targetType: "",
        selectedEL: null,
        selectedSample: null,
        expectedEndDate: "",
        technician: null,
        templateEL: tplEL,
        attributes: attributes.filter((a) => a.itemId > 0),
        checklistItems,
      }));
      void navigate("/create-task/step-3");
    }
    setLoading(false);
  };

  const isRegular = taskMode === "regular";
  const canSubmitRegular =
    !!name &&
    !!targetType &&
    (targetType === "ExperimentLog" ? !!selectedELId : !!selectedSampleId) &&
    !!expectedEndDate;
  const canSubmitTemplate = !!name;
  const canSubmit = isRegular ? canSubmitRegular : canSubmitTemplate;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-6">
      <CreateTaskStepper currentStep={1} />
      <form
        className="bg-white rounded-2xl px-10 pt-8 pb-10 shadow-md w-full max-w-4xl mt-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          {t("task.createTaskPageTitle")}
        </h2>

        {/* Task Mode */}
        <div className="flex gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={taskMode === "regular"}
              onChange={() => setTaskMode("regular")}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-semibold text-gray-700">
              {t("task.taskModeRegular")}
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={taskMode === "template"}
              onChange={() => setTaskMode("template")}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-semibold text-gray-700">
              {t("task.taskModeTemplate")}
            </span>
          </label>
        </div>

        {/* Name */}
        <div className="flex flex-col mb-5">
          <label className="font-semibold text-gray-700 mb-1.5">
            {t("task.taskName")} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("task.taskName")}
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col mb-5">
          <label className="font-semibold text-gray-700 mb-1.5">
            {t("common.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("common.description") + "..."}
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Regular task: target type + target + date */}
        {isRegular && (
          <>
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1.5">
                  {t("task.targetType")} *
                </label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as TargetType | "");
                    setSelectedELId("");
                    setSelectedSampleId("");
                  }}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t("task.selectTargetType")}</option>
                  <option value="ExperimentLog">
                    {t("task.experimentLog")}
                  </option>
                  <option value="Sample">{t("task.targetTypeSample")}</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1.5">
                  {t("task.expectedEndDate")} *
                </label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {targetType === "ExperimentLog" && (
              <div className="flex flex-col mb-5">
                <label className="font-semibold text-gray-700 mb-1.5">
                  {t("task.experimentLog")} *
                </label>
                <select
                  value={selectedELId}
                  onChange={(e) => setSelectedELId(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t("task.experimentLog")}...</option>
                  {experimentLogs.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "Sample" && (
              <div className="flex flex-col mb-5">
                <label className="font-semibold text-gray-700 mb-1.5">
                  {t("task.targetTypeSample")} *
                </label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t("task.targetTypeSample")}...</option>
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Template: pick EL for stageId */}
        {!isRegular && (
          <div className="flex flex-col mb-5">
            <label className="font-semibold text-gray-700 mb-1.5">
              {t("task.templateStageLabel")}
            </label>
            <select
              value={templateELId}
              onChange={(e) => setTemplateELId(e.target.value)}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">{t("task.noStageOption")}</option>
              {experimentLogs.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.name}
                  {el.currentStageOrder != null
                    ? ` — Stage ${el.currentStageOrder}`
                    : ""}
                </option>
              ))}
            </select>
            {templateELId && (
              <p className="text-xs text-gray-500 mt-1.5">
                {t("task.stageIdWillBe")}{" "}
                <strong>
                  {experimentLogs.find((x) => x.id === templateELId)
                    ?.currentStageOrder ?? 0}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* ── Task Attributes ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-800">
                {t("task.taskAttributesTitle")}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("task.taskAttributesSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1.5 text-sm text-white bg-green-600 hover:bg-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + {t("common.add")}
            </button>
          </div>
          {attributes.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              {t("task.noAttributes")}
            </p>
          )}
          <div className="space-y-3">
            {attributes.map((attr, idx) => (
              <div
                key={attr._key}
                className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-3 items-end bg-gray-50 border border-gray-200 rounded-xl p-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {t("task.attrType")}
                  </label>
                  <select
                    value={attr.type}
                    onChange={(e) =>
                      handleAttrTypeChange(
                        idx,
                        e.target.value as "chemical" | "material",
                      )
                    }
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="chemical">{t("element.chemical")}</option>
                    <option value="material">
                      {t("task.attrMaterialEquipment")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {attr.type === "chemical"
                      ? t("task.selectChemical")
                      : t("task.selectMaterial")}
                  </label>
                  <select
                    value={attr.itemId || ""}
                    onChange={(e) => handleAttrItemChange(idx, e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">...</option>
                    {(attr.type === "chemical" ? chemicals : materials).map(
                      (item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {t("task.unit")}
                  </label>
                  <input
                    type="text"
                    value={attr.unit}
                    onChange={(e) => handleAttrUnitChange(idx, e.target.value)}
                    placeholder={t("task.unit")}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {t("task.quantity")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttrValueChange(idx, Number(e.target.value))
                    }
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAttribute(idx)}
                  className="mb-0.5 text-red-400 hover:text-red-600 text-xl font-bold leading-none"
                  title="Xóa"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Checklist ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-800">
                {t("task.checklistTitle")}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("task.checklistSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={addChecklist}
              className="flex items-center gap-1.5 text-sm text-white bg-green-600 hover:bg-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + {t("common.add")}
            </button>
          </div>
          {checklistItems.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              {t("task.noChecklistItems")}
            </p>
          )}
          <div className="space-y-3">
            {checklistItems.map((item, idx) => (
              <div
                key={item._key}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklist(idx)}
                    className="text-red-400 hover:text-red-600 text-xl font-bold leading-none"
                    title="Xóa"
                  >
                    ×
                  </button>
                </div>

                {/* Name + Description */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t("task.taskName")} *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      required={checklistItems.length > 0}
                      onChange={(e) =>
                        handleChecklistField(idx, "name", e.target.value)
                      }
                      placeholder={t("task.checklistItemPlaceholder")}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t("common.description")}
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleChecklistField(idx, "description", e.target.value)
                      }
                      placeholder={t("task.checklistDescPlaceholder")}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Unit + Min + Max */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t("task.expectedUnit")}
                    </label>
                    <input
                      type="text"
                      value={item.expectedUnit}
                      onChange={(e) =>
                        handleChecklistField(
                          idx,
                          "expectedUnit",
                          e.target.value,
                        )
                      }
                      placeholder={t("task.checklistUnitPlaceholder")}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t("task.checklistMinOptional")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={item.expectedMinValue ?? ""}
                      onChange={(e) =>
                        handleChecklistField(
                          idx,
                          "expectedMinValue",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      placeholder="Min"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t("task.checklistMaxOptional")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={item.expectedMaxValue ?? ""}
                      onChange={(e) =>
                        handleChecklistField(
                          idx,
                          "expectedMaxValue",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      placeholder="Max"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => void navigate("/researcher/tasks")}
            className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-8 py-2.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRegular ? `${t("common.next")} →` : t("task.reviewBtn")}
          </button>
        </div>
      </form>
    </main>
  );
};

export default CreateTaskContainer;
