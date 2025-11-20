import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      void navigate("/method");
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate(-1)}
      >
        ← Trở về
      </button>
      <h2 className="text-2xl font-bold mb-4 text-green-800">
        Thêm phương pháp mới
      </h2>
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block font-medium mb-1">Tên phương pháp</label>
            <input
              type="text"
              name="name"
              required
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={handleChange}
              placeholder="VD: Nhân giống từ lá, Thụ phấn chéo..."
            />
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1">Loại phương pháp</label>
            <select
              name="type"
              required
              className="w-full border rounded px-3 py-2"
              value={form.type}
              onChange={handleChange}
            >
              <option value="">-- Chọn loại --</option>
              {methodTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1">Mô tả</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border rounded px-3 py-2"
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về phương pháp..."
            />
            {error && <p className="text-red-500">{error}</p>}
          </div>
          {/* Quy trình chi tiết */}
          <div>
            <label className="block font-medium mb-2">Quy trình chi tiết</label>
            {form.stages.map((stage, stageIdx) => (
              <div
                key={stageIdx}
                className="mb-6 border p-4 rounded bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">
                    Giai đoạn {stageIdx + 1}
                  </span>
                  {form.stages.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
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
                  placeholder="Tên giai đoạn"
                  required
                  className="mb-2 w-full border px-3 py-2 rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
                <textarea
                  value={stage.content}
                  onChange={(e) =>
                    handleStageChange(stageIdx, "content", e.target.value)
                  }
                  placeholder="Mô tả giai đoạn"
                  required
                  className="mb-2 w-full border px-3 py-2 rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
                <div className="mb-2">
                  <label className="block font-medium mb-1">
                    Số ngày xử lý
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
                    className="w-full border px-3 py-2 rounded"
                  />
                  {error && <p className="text-red-500">{error}</p>}
                </div>
                <label className="block font-semibold mb-1">
                  Chọn nguyên vật liệu cho giai đoạn này
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
                {error && <p className="text-red-500">{error}</p>}
                <div>
                  <label className="block font-semibold mb-1">
                    Thông tin tham chiếu
                    <span className="text-gray-500 font-normal text-sm ml-2">
                      (Tùy chọn)
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
                    className="text-green-700 hover:underline cursor-pointer text-sm"
                    onClick={() => handleAddReferent(stageIdx)}
                  >
                    + Thêm thông tin tham chiếu
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="bg-green-100 cursor-pointer text-green-800 px-4 py-1 rounded font-semibold hover:bg-green-200 transition"
              onClick={handleAddStage}
            >
              + Thêm giai đoạn
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-800 cursor-pointer text-white px-6 py-2 rounded-full font-semibold hover:bg-green-900 transition"
          >
            {loading ? "Đang lưu..." : "Lưu phương pháp"}
          </button>
        </form>
      </div>
    </main>
  );
}
