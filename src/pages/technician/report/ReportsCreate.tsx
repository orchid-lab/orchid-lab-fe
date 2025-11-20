import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import type { Referent, ReferentApiResponse } from "../../../types/Referent";
import type { Sample, SampleApiResponse } from "../../../types/Sample";

interface AttributeCommand {
  referentID: string;
  name: string;
  value: number;
}

export default function ReportsCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    sample: "",
    attributeCommands: [
      { referentID: "", name: "", value: 0 },
    ] as AttributeCommand[],
  });
  const [referents, setReferents] = useState<Referent[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [referentRes, sampleRes] = await Promise.all([
          axiosInstance.get("/api/referents?pageNumber=1&pageSize=23"),
          axiosInstance.get("/api/sample?pageNo=1&pageSize=123"),
        ]);
        const referentData = referentRes.data as ReferentApiResponse;
        const sampleData = sampleRes.data as SampleApiResponse;
        setReferents(referentData.value.data);
        setSamples(sampleData.value.data);
      } catch {
        setReferents([]);
        setSamples([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(Array.from(e.target.files ?? []));
  };

  const handleAttrChange = <K extends keyof AttributeCommand>(
    idx: number,
    field: K,
    value: AttributeCommand[K]
  ) => {
    const updated: AttributeCommand[] = [...form.attributeCommands];
    updated[idx][field] = value;
    setForm({ ...form, attributeCommands: updated });
  };

  const handleAddAttr = () => {
    setForm({
      ...form,
      attributeCommands: [
        ...form.attributeCommands,
        { referentID: "", name: "", value: 0 },
      ],
    });
  };

  const handleRemoveAttr = (idx: number) => {
    const updated = form.attributeCommands.filter((_, i) => i !== idx);
    setForm({ ...form, attributeCommands: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Tạo report
      const reportRes = await axiosInstance.post<{
        value?: string;
      }>("/api/report", form);
      console.log("Report API response:", reportRes.data);
      const reportId = reportRes.data?.value;
      if (!reportId) throw new Error("Không lấy được reportId");

      // 2. Nếu có ảnh thì upload ảnh
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((file) => formData.append("images", file));
        formData.append("reportId", reportId);
        await axiosInstance.post("/api/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      enqueueSnackbar("Tạo báo cáo thành công!", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      void navigate("/technician/reports");
    } catch (error) {
      console.error("Failed to create report", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Tạo báo cáo thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate(-1)}
      >
        ← Trở về
      </button>
      <form
        className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-4"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
      >
        <h1 className="text-xl font-bold mb-4">Tạo báo cáo mới</h1>
        <div>
          <label className="block font-semibold">Tên báo cáo</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Mẫu (sample)</label>
          <select
            name="sample"
            value={form.sample}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">Chọn mẫu</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold">
            Thuộc tính thu thập được của mẫu
          </label>
          {form.attributeCommands.map((attr, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <select
                value={attr.referentID}
                onChange={(e) =>
                  handleAttrChange(idx, "referentID", e.target.value)
                }
                className="border rounded px-2 py-1"
                required
              >
                <option value="">Chọn thuộc tính</option>
                {referents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Đơn vị"
                value={attr.name}
                onChange={(e) => handleAttrChange(idx, "name", e.target.value)}
                className="border rounded px-2 py-1"
                required
              />
              <input
                type="number"
                placeholder="Giá trị"
                value={attr.value}
                onChange={(e) =>
                  handleAttrChange(idx, "value", Number(e.target.value))
                }
                className="border rounded px-2 py-1 w-24"
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveAttr(idx)}
                className="text-red-600 hover:underline"
                disabled={form.attributeCommands.length === 1}
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAttr}
            className="bg-green-700 text-white px-3 py-1 rounded mt-2"
          >
            + Thêm thuộc tính
          </button>
        </div>
        <div>
          <label className="block font-semibold">Ảnh (có thể chọn nhiều)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="border rounded px-3 py-2 w-full mb-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition"
          >
            Lưu báo cáo
          </button>
        </div>
      </form>
    </main>
  );
}
