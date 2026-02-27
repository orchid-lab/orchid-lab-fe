import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        enqueueSnackbar("Không thể tải danh sách hóa chất", {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar]);

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
        enqueueSnackbar("Không thể tải danh sách dụng cụ", {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar]);

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
        enqueueSnackbar("Không thể tải danh sách nhật ký thí nghiệm", {
          variant: "error",
        }),
      );
  }, [enqueueSnackbar]);

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
        enqueueSnackbar("Không thể tải danh sách mẫu", {
          variant: "error",
        }),
      );
  }, [taskMode, targetType, enqueueSnackbar]);

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
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Tạo nhiệm vụ</h2>

        {/* Task Mode */}
        <div className="flex gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={taskMode === "regular"}
              onChange={() => setTaskMode("regular")}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-semibold text-gray-700">Nhiệm vụ thường</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={taskMode === "template"}
              onChange={() => setTaskMode("template")}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-semibold text-gray-700">Template (mẫu)</span>
          </label>
        </div>

        {/* Name */}
        <div className="flex flex-col mb-5">
          <label className="font-semibold text-gray-700 mb-1.5">
            Tên nhiệm vụ *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nhập tên nhiệm vụ"
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col mb-5">
          <label className="font-semibold text-gray-700 mb-1.5">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả nhiệm vụ..."
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Regular task: target type + target + date */}
        {isRegular && (
          <>
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1.5">
                  Loại đối tượng *
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
                  <option value="">Chọn loại đối tượng...</option>
                  <option value="ExperimentLog">Nhật ký thí nghiệm</option>
                  <option value="Sample">Mẫu thí nghiệm</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1.5">
                  Ngày hoàn thành dự kiến *
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
                  Nhật ký thí nghiệm *
                </label>
                <select
                  value={selectedELId}
                  onChange={(e) => setSelectedELId(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Chọn nhật ký thí nghiệm...</option>
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
                  Mẫu thí nghiệm *
                </label>
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Chọn mẫu thí nghiệm...</option>
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
              Nhật ký thí nghiệm (lấy stage hiện tại)
            </label>
            <select
              value={templateELId}
              onChange={(e) => setTemplateELId(e.target.value)}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Không chọn (stageId = 0)</option>
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
                StageId sẽ được đặt là{" "}
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
                Thuộc tính nhiệm vụ
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Hóa chất hoặc dụng cụ sử dụng
              </p>
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1.5 text-sm text-white bg-green-600 hover:bg-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + Thêm
            </button>
          </div>
          {attributes.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Chưa có thuộc tính nào.
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
                    Loại
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
                    <option value="chemical">Hóa chất</option>
                    <option value="material">Dụng cụ / vật liệu</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {attr.type === "chemical"
                      ? "Chọn hóa chất"
                      : "Chọn dụng cụ"}
                  </label>
                  <select
                    value={attr.itemId || ""}
                    onChange={(e) => handleAttrItemChange(idx, e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chọn...</option>
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
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    value={attr.unit}
                    onChange={(e) => handleAttrUnitChange(idx, e.target.value)}
                    placeholder="Đơn vị"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Số lượng
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
                Danh sách kiểm tra (Checklist)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Các mục cần kiểm tra khi thực hiện nhiệm vụ
              </p>
            </div>
            <button
              type="button"
              onClick={addChecklist}
              className="flex items-center gap-1.5 text-sm text-white bg-green-600 hover:bg-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + Thêm
            </button>
          </div>
          {checklistItems.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Chưa có mục kiểm tra nào.
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
                      Tên mục *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      required={checklistItems.length > 0}
                      onChange={(e) =>
                        handleChecklistField(idx, "name", e.target.value)
                      }
                      placeholder="Tên mục kiểm tra"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleChecklistField(idx, "description", e.target.value)
                      }
                      placeholder="Mô tả (tùy chọn)"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Unit + Min + Max */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Đơn vị đo
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
                      placeholder="mg/L, cái, ml..."
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Giá trị min (tùy chọn)
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
                      Giá trị max (tùy chọn)
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
            onClick={() => void navigate("/tasks")}
            className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-8 py-2.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRegular ? "Tiếp theo →" : "Xem lại →"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default CreateTaskContainer;
