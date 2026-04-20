/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./MethodCreate.css";
import axiosInstance from "../../../api/axiosInstance";
import { Select } from "antd";
import { useSnackbar } from "notistack";

const methodTypes = [
  { label: "Nhân giống vô tính", value: 0 },
  { label: "Nhân giống hữu tính", value: 1 },
];

interface Material {
  id: number | string;
  name: string;
  unit?: string;
  category?: string;
}

interface Chemical {
  id: number | string;
  name: string;
  concentrationUnit?: string;
  category?: string;
}

interface StageForm {
  title: string;
  content: string;
  dateOfProcessing: number;
  createMaterial: (number | string)[];
  createChemical: (number | string)[];
}

export default function MethodCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);

  const [form, setForm] = useState<{
    name: string;
    type: string;
    description: string;
    stages: StageForm[];
  }>({
    name: "",
    type: "",
    description: "",
    stages: [
      {
        title: "",
        content: "",
        dateOfProcessing: 1,
        createMaterial: [],
        createChemical: [],
      },
    ],
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Fetch materials and chemicals in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialRes, chemicalRes] = await Promise.all([
          axiosInstance.get<{ value?: { data?: Material[] } }>(
            "/api/material?pageNumber=1&pageSize=100"
          ),
          axiosInstance.get<{ value?: { data?: Chemical[] } }>(
            "/api/chemical?pageNumber=1&pageSize=100"
          ),
        ]);
        setMaterials(materialRes.data?.value?.data ?? []);
        setChemicals(chemicalRes.data?.value?.data ?? []);
      } catch {
        setMaterials([]);
        setChemicals([]);
      }
    };
    void fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStageChange = (
    idx: number,
    field: keyof StageForm,
    value: string | number | (number | string)[]
  ) => {
    setForm((prev) => {
      const stages = [...prev.stages];
      stages[idx] = { ...stages[idx], [field]: value };
      return { ...prev, stages };
    });
  };

  const handleAddStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          title: "",
          content: "",
          dateOfProcessing: 1,
          createMaterial: [],
          createChemical: [],
        },
      ],
    }));
  };

  const handleRemoveStage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name.trim()) {
      setLoading(false);
      setError("Tên phương pháp không được trống");
      return;
    }
    if (!form.type) {
      setLoading(false);
      setError("Loại phương pháp không được trống");
      return;
    }
    if (!form.description.trim()) {
      setLoading(false);
      setError("Mô tả không được trống");
      return;
    }

    for (const stage of form.stages) {
      if (!stage.title.trim()) {
        setLoading(false);
        setError("Tất cả các giai đoạn phải có tên");
        return;
      }
      if (!stage.content.trim()) {
        setLoading(false);
        setError("Tất cả các giai đoạn phải có mô tả");
        return;
      }
      if (stage.dateOfProcessing < 1) {
        setLoading(false);
        setError("Số ngày xử lý phải lớn hơn 0");
        return;
      }
    }

    // Build payload matching POST /api/methods schema
    const payload = {
      name: form.name,
      description: form.description,
      type: parseInt(form.type),
      createMethodDtos: form.stages.map((stage, idx) => ({
        stageDefinitionId: 0, // placeholder – adjust if you have real stage definition IDs
        order: idx + 1,
        durationDays: stage.dateOfProcessing,
        createMaterial: stage.createMaterial,
        createChemical: stage.createChemical,
      })),
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    try {
      // Sử dụng đường dẫn tương đối
      await axiosInstance.post("/api/methods", payload);
      setLoading(false);
      void navigate("/researcher/method");
      enqueueSnackbar("Tạo phương pháp thành công!", {
        variant: "success",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    } catch (err) {
      setLoading(false);
      const apiError = err as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Tạo phương pháp thất bại!";
      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
      console.error("Error creating method:", err);
    }
  };

  const inputClass =
    "w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]";

  return (
    <main className="method-create-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#E7F5FF] p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            className="text-[#005792] font-medium hover:text-blue-700 transition"
            onClick={() => void navigate(-1)}
          >
            ← {t("common.back")}
          </button>
          <h2 className="text-2xl font-bold text-[#005792]">
            {t("method.createMethodTitle")}
          </h2>
        </div>

        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="space-y-4"
        >
          {/* Method name */}
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodName")}
            </label>
            <input
              type="text"
              name="name"
              required
              className={inputClass}
              value={form.name}
              onChange={handleChange}
              placeholder={t("method.methodName") + "..."}
            />
          </div>

          {/* Method type */}
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodType")}
            </label>
            <select
              name="type"
              required
              className={inputClass}
              value={form.type}
              onChange={handleChange}
            >
              <option value="">-- {t("common.select")} --</option>
              {methodTypes.map((mt) => (
                <option key={mt.value} value={mt.value}>
                  {mt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodDescription")}
            </label>
            <textarea
              name="description"
              rows={3}
              className={inputClass}
              value={form.description}
              onChange={handleChange}
              placeholder={t("method.methodDescription") + "..."}
            />
          </div>

          {/* Global error */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Stages */}
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.stage")}
            </label>

            {form.stages.map((stage, stageIdx) => (
              <div
                key={stageIdx}
                className="mb-5 bg-[#F0F8FF]/60 border border-blue-100 rounded-xl p-5 space-y-3"
              >
                {/* Stage header */}
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-[#005792]">
                    Giai đoạn {stageIdx + 1}
                  </span>
                  {form.stages.length > 1 && (
                    <button
                      type="button"
                      className="text-[#005792] hover:text-[#00CED1] font-medium"
                      onClick={() => handleRemoveStage(stageIdx)}
                    >
                      Xóa giai đoạn
                    </button>
                  )}
                </div>

                {/* Stage name */}
                <input
                  value={stage.title}
                  onChange={(e) =>
                    handleStageChange(stageIdx, "title", e.target.value)
                  }
                  placeholder={t("method.stageName")}
                  required
                  className={inputClass}
                />

                {/* Stage description */}
                <textarea
                  value={stage.content}
                  onChange={(e) =>
                    handleStageChange(stageIdx, "content", e.target.value)
                  }
                  placeholder={t("method.stageDescription")}
                  required
                  rows={2}
                  className={inputClass}
                />

                {/* Processing days */}
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                    {t("method.processingDays")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stage.dateOfProcessing}
                    onChange={(e) =>
                      handleStageChange(
                        stageIdx,
                        "dateOfProcessing",
                        Number(e.target.value)
                      )
                    }
                    placeholder="Số ngày"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Materials (createMaterial) */}
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                    {t("method.materialSelection") ?? "Nguyên vật liệu"}
                  </label>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Chọn nguyên vật liệu"
                    value={stage.createMaterial}
                    onChange={(values: (number | string)[]) =>
                      handleStageChange(stageIdx, "createMaterial", values)
                    }
                    options={materials.map((m) => ({
                      label: m.name,
                      value: m.id,
                    }))}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </div>

                {/* Chemicals (createChemical) */}
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                    Hóa chất
                  </label>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Chọn hóa chất"
                    value={stage.createChemical}
                    onChange={(values: (number | string)[]) =>
                      handleStageChange(stageIdx, "createChemical", values)
                    }
                    options={chemicals.map((c) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </div>
              </div>
            ))}

            {/* Add stage */}
            <button
              type="button"
              className="w-full border-2 border-dashed border-[#00CED1] text-[#005792] bg-cyan-50/30 hover:bg-cyan-50 rounded-xl py-3 font-medium transition-colors flex items-center justify-center mt-4"
              onClick={handleAddStage}
            >
              + {t("method.addStage")}
            </button>

            {/* Submit */}
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#005792] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-900/20 hover:bg-[#004370] hover:shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? t("common.saving") : t("method.saveMethod")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}