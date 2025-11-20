import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { useSeedlingForm } from "../../../context/SeedlingFormContext";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import axiosInstance from "../../../api/axiosInstance";

export default function SeedlingDetailsForm() {
  const navigate = useNavigate();
  const { form, setForm } = useSeedlingForm();
  const [touched, setTouched] = useState(false);
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeedlings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          "/api/seedling?pageNumber=1&pageSize=100"
        );
        const data = res.data as SeedlingApiResponse;
        setSeedlings(data.value.data || []);
      } catch {
        setSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchSeedlings();
  }, []);

  const isValid =
    form.localName &&
    form.scientificName &&
    (form.fatherID || form.motherID) &&
    form.description &&
    form.doB;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNext() {
    setTouched(true);
    if (isValid) void navigate("/seedlings/new/characteristics");
  }

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </main>
    );
  }

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4">
        Thêm cây giống mới
      </h2>
      <div className="bg-white rounded-xl shadow p-4 sm:p-8 max-w-full sm:max-w-2xl md:max-w-4xl mx-auto">
        <h3 className="text-lg sm:text-xl font-semibold text-green-800 mb-6">
          Chi tiết cây giống
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Tên *</label>
            <input
              name="localName"
              value={form.localName}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Nhập tên cây giống"
            />
            {touched && !form.localName && (
              <div className="text-red-500 text-sm">Bắt buộc</div>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Tên khoa học *</label>
            <input
              name="scientificName"
              value={form.scientificName}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Nhập tên cây giống"
            />
            {touched && !form.scientificName && (
              <div className="text-red-500 text-sm">Bắt buộc</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Cây giống 1 *</label>
              <select
                name="fatherID"
                value={form.fatherID}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2"
              >
                <option value="">Chọn cây giống 1</option>
                {seedlings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.localName}
                  </option>
                ))}
              </select>
              {touched && !form.fatherID && !form.motherID && (
                <div className="text-red-500 text-sm mt-1">
                  Cần chọn ít nhất 1 cây giống
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Cây giống 2 *</label>
              <select
                name="motherID"
                value={form.motherID}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2"
              >
                <option value="">Chọn cây giống 2</option>
                {seedlings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.localName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Miêu tả *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Nhập mô tả chi tiết về cây giống..."
            />
            {touched && !form.description && (
              <div className="text-red-500 text-sm">Bắt buộc</div>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Ngày sinh *</label>
            <div className="flex items-center gap-2">
              <input
                name="doB"
                type="date"
                value={form.doB}
                onChange={handleChange}
                className="border rounded px-4 py-2 flex-1"
              />
            </div>
            {touched && !form.doB && (
              <div className="text-red-500 text-sm">Bắt buộc</div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            type="button"
            className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
            onClick={() => void navigate("/seedlings")}
          >
            Hủy
          </button>
          <button
            type="button"
            className="bg-green-800 cursor-pointer text-white px-8 py-2 rounded font-semibold hover:bg-green-900 transition"
            onClick={handleNext}
          >
            Tiếp theo
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">* Các trường bắt buộc</div>
      </div>
    </main>
  );
}
