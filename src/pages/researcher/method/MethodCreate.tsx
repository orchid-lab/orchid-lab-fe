/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./MethodCreate.css";
import axiosInstance from "../../../api/axiosInstance";
import type { Element } from "../../../types/Element";
import { Select } from "antd";
import type { Referent } from "../../../types/Referent";
import { useSnackbar } from "notistack";

const methodTypes = [
  { label: "Nhân giống vô tính", value: 0 },
  { label: "Nhân giống hữu tính", value: 1 },
];

interface ReferentForCreate {
  name: string;
  unit: string;
  valueFrom: number;
  valueTo: number;
}

interface StageForm {
  title: string;
  content: string;
  dateOfProcessing: number;
  elementInStages: string[];
  referents: ReferentForCreate[];
}

export default function MethodCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [elements, setElements] = useState<Element[]>([]);
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
        elementInStages: [],
        referents: [],
      },
    ],
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchElements = async () => {
      try {
        const res = await axiosInstance.get<{
          value?: { data?: Element[] };
        }>(
          "https://net-api.orchid-lab.systems/api/element?pageNumber=1&pageSize=12"
        );
        setElements(res.data?.value?.data ?? []);
      } catch {
        setElements([]);
      }
    };
    void fetchElements();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStageChange = (
    idx: number,
    field: keyof StageForm,
    value: string | string[] | number | Referent[]
  ) => {
    setForm((prev) => {
      const stages = [...prev.stages];
      stages[idx] = { ...stages[idx], [field]: value };
      return { ...prev, stages };
    });
  };

  const handleElementChange = (stageIdx: number, selectedIds: string[]) => {
    handleStageChange(stageIdx, "elementInStages", selectedIds);
  };

  const handleReferentChange = (
    stageIdx: number,
    referentIdx: number,
    field: keyof ReferentForCreate,
    value: string | number
  ) => {
    setForm((prev) => {
      const stages = [...prev.stages];
      const referents = [...stages[stageIdx].referents];
      referents[referentIdx] = { ...referents[referentIdx], [field]: value };
      stages[stageIdx].referents = referents;
      return { ...prev, stages };
    });
  };

  const handleAddReferent = (stageIdx: number) => {
    setForm((prev) => {
      const stages = prev.stages.map((stage, idx) =>
        idx === stageIdx
          ? {
              ...stage,
              referents: [
                ...stage.referents,
                { name: "", unit: "", valueFrom: 0, valueTo: 0 },
              ],
            }
          : stage
      );
      return { ...prev, stages };
    });
  };

  const handleRemoveReferent = (stageIdx: number, referentIdx: number) => {
    setForm((prev) => {
      const stages = prev.stages.map((stage, idx) =>
        idx === stageIdx
          ? {
              ...stage,
              referents: stage.referents.filter((_, i) => i !== referentIdx),
            }
          : stage
      );
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
          elementInStages: [],
          referents: [],
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
    setLoading(true);

    if (!form.name) {
      setLoading(false);
      setError("Tên phương pháp không được trống");
      return;
    } else if (!form.type) {
      setLoading(false);
      setError("Loại phương pháp không được trống");
      return;
    } else if (!form.description) {
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

      // Validate referents - chỉ validate nếu có referents
      if (stage.referents.length > 0) {
        for (const ref of stage.referents) {
          if (!ref.name.trim()) {
            setLoading(false);
            setError("Tên thông tin tham chiếu không được để trống");
            return;
          }
          if (!ref.unit.trim()) {
            setLoading(false);
            setError("Đơn vị thông tin tham chiếu không được để trống");
            return;
          }
          if (ref.valueTo <= ref.valueFrom) {
            setLoading(false);
            setError(
              "Giá trị 'Đến' phải lớn hơn 'Từ' trong thông tin tham chiếu"
            );
            return;
          }
        }
      }
    }
    // Payload - chỉ gửi referents nếu có data
    const payload = {
      name: form.name,
      description: form.description,
      type: parseInt(form.type),
      stages: form.stages.map((stage, idx) => ({
        name: stage.title,
        description: stage.content,
        dateOfProcessing: stage.dateOfProcessing,
        step: idx + 1,
        elementInStages: stage.elementInStages,
        // Chỉ gửi referents nếu có data
        ...(stage.referents.length > 0 && { referents: stage.referents }),
      })),
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    try {
      await axiosInstance.post(
        "https://net-api.orchid-lab.systems/api/method",
        payload
      );
      setLoading(false);
      void navigate("/researcher/method");
      enqueueSnackbar("Tạo phương pháp thành công!", {
        variant: "success",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    } catch (error) {
      setLoading(false);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        "Tạo phương pháp thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
      console.error("Error creating method:", error);
    }
  };

  return (
    <main className="method-create-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#E7F5FF] p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 rounded-2xl p-6 md:p-8">
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
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodName")}
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
              value={form.name}
              onChange={handleChange}
              placeholder={t("method.methodName") + "..."}
            />
            {error && <p className="text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodType")}
            </label>
            <select
              name="type"
              required
              className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
              value={form.type}
              onChange={handleChange}
            >
              <option value="">-- {t("common.select")} --</option>
              {methodTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.methodDescription")}
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
              value={form.description}
              onChange={handleChange}
              placeholder={t("method.methodDescription") + "..."}
            />
            {error && <p className="text-red-500 mt-1">{error}</p>}
          </div>
          {/* Quy trình chi tiết */}
          <div>
            <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
              {t("method.stage")}
            </label>
            {form.stages.map((stage, stageIdx) => (
              <div
                key={stageIdx}
                className="mb-5 bg-[#F0F8FF]/60 border border-blue-100 rounded-xl p-5"
              >
                <div className="flex justify-between items-center mb-3">
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
                <input
                  value={stage.title}
                  onChange={(e) =>
                    handleStageChange(stageIdx, "title", e.target.value)
                  }
                  placeholder={t("method.stageName")}
                  required
                  className="mb-2 w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                />
                {error && <p className="text-red-500 mt-1">{error}</p>}
                <textarea
                  value={stage.content}
                  onChange={(e) =>
                    handleStageChange(stageIdx, "content", e.target.value)
                  }
                  placeholder={t("method.stageDescription")}
                  required
                  className="mb-2 w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                />
                {error && <p className="text-red-500 mt-1">{error}</p>}
                <div className="mb-2">
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
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                  />
                  {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  {t("method.materialSelection")}
                </label>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%", marginBottom: 8 }}
                  placeholder="Chọn nguyên vật liệu"
                  value={stage.elementInStages}
                  onChange={(values) => handleElementChange(stageIdx, values)}
                  options={elements.map((el) => ({
                    label: el.name,
                    value: el.id,
                  }))}
                />
                {error && <p className="text-red-500 mt-1">{error}</p>}
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                    {t("method.referentInfo")}
                    <span className="text-blue-500 font-normal text-sm ml-2">
                      ({t("common.optional") ?? "Optional"})
                    </span>
                  </label>

                  {/* Chỉ hiển thị referents nếu có */}
                  {stage.referents.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {stage.referents.map((ref, refIdx) => (
                        <div key={refIdx} className="flex gap-2 items-center">
                          <input
                            value={ref.name}
                            onChange={(e) =>
                              handleReferentChange(
                                stageIdx,
                                refIdx,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Tên"
                            className="border px-2 py-1 rounded"
                          />
                          <input
                            type="text"
                            value={ref.unit}
                            onChange={(e) =>
                              handleReferentChange(
                                stageIdx,
                                refIdx,
                                "unit",
                                e.target.value
                              )
                            }
                            placeholder="Đơn vị"
                            className="border px-2 py-1 rounded w-20"
                          />
                          <label className="text-sm">Từ:</label>
                          <input
                            type="number"
                            value={ref.valueFrom}
                            onChange={(e) =>
                              handleReferentChange(
                                stageIdx,
                                refIdx,
                                "valueFrom",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Min"
                            className="border px-2 py-1 rounded w-20"
                          />
                          <label className="text-sm">Đến:</label>
                          <input
                            type="number"
                            value={ref.valueTo}
                            onChange={(e) =>
                              handleReferentChange(
                                stageIdx,
                                refIdx,
                                "valueTo",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Max"
                            className="border px-2 py-1 rounded w-20"
                          />
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() =>
                              handleRemoveReferent(stageIdx, refIdx)
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nút thêm thông tin tham chiếu */}
                  <button
                    type="button"
                    className="text-[#005792] text-sm font-medium hover:text-[#00CED1] transition-colors mt-2 inline-block"
                    onClick={() => handleAddReferent(stageIdx)}
                  >
                    + {t("method.addReferent")}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="w-full border-2 border-dashed border-[#00CED1] text-[#005792] bg-cyan-50/30 hover:bg-cyan-50 rounded-xl py-3 font-medium transition-colors flex items-center justify-center mt-4"
              onClick={handleAddStage}
            >
              + {t("method.addStage")}
            </button>
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#005792] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-900/20 hover:bg-[#004370] hover:shadow-lg transition-all"
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
