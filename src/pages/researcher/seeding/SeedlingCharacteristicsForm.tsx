import { useNavigate } from "react-router-dom";

import { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

import { useSeedlingForm } from "../../../context/SeedlingFormContext";
import type { SeedlingCharacteristic } from "../../../types/Seedling";

const attributeOptions = [{ name: "Thân" }, { name: "Hoa" }, { name: "Lá" }];

export default function SeedlingCharacteristicsForm() {
  const navigate = useNavigate();
  const { form, setForm } = useSeedlingForm();
  const [touched, setTouched] = useState(false);

  const characteristics: SeedlingCharacteristic[] = form.characteristics || [];

  function handleChange(
    idx: number,
    field: "name" | "description",
    value: string
  ) {
    const updated = characteristics.map((c, i) =>
      i === idx
        ? {
            ...c,
            seedlingAttribute: {
              ...c.seedlingAttribute,
              [field]: value,
            },
          }
        : c
    );
    setForm({ ...form, characteristics: updated });
  }

  function handleAdd() {
    setForm({
      ...form,
      characteristics: [
        ...(form.characteristics || []),
        { value: 1, seedlingAttribute: { name: "", description: "" } },
      ],
    });
  }

  function handleRemove(idx: number) {
    setForm({
      ...form,
      characteristics: characteristics.filter((_, i) => i !== idx),
    });
  }

  const isValid =
    characteristics.length === 0 ||
    characteristics.every(
      (c) =>
        c.seedlingAttribute.name &&
        c.seedlingAttribute.description !== undefined
    );

  function handleNext() {
    setTouched(true);
    if (isValid) void navigate("/seedlings/new/summary");
  }

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4">
          Thêm cây giống
        </h2>
        <div className="bg-white rounded-xl shadow p-4 sm:p-8 max-w-full sm:max-w-2xl md:max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-green-800">
              Đặc điểm cây giống
            </h3>
            <button
              type="button"
              className="bg-green-800 cursor-pointer text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-800"
              onClick={handleAdd}
              aria-label="Add characteristic"
            >
              <FaPlus />
            </button>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {characteristics.map((c, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-center border rounded p-3 bg-gray-50"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Thuộc tính*
                  </label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={c.seedlingAttribute.name}
                    onChange={(e) => handleChange(idx, "name", e.target.value)}
                  >
                    <option value="">Chọn thuộc tính</option>
                    {attributeOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {touched && !c.seedlingAttribute.name && (
                    <div className="text-red-500 text-xs">Phải điền</div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Mô tả*
                  </label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={c.seedlingAttribute.description}
                    onChange={(e) =>
                      handleChange(idx, "description", e.target.value)
                    }
                    placeholder="Mô tả chi tiết"
                  />
                  {touched && !c.seedlingAttribute.description && (
                    <div className="text-red-500 text-xs">Phải điền</div>
                  )}
                </div>
                <button
                  type="button"
                  className="bg-green-800 cursor-pointer text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-800"
                  onClick={() => handleRemove(idx)}
                  aria-label="Remove characteristic"
                >
                  <FaMinus />
                </button>
              </div>
            ))}
            {characteristics.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                Không có đặc điểm nào được thêm vào.
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="button"
              className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
              onClick={() => void navigate("/seedlings/new")}
            >
              Trở về
            </button>
            <button
              type="button"
              className="bg-green-800 cursor-pointer text-white px-8 py-2 rounded font-semibold hover:bg-green-900 transition"
              onClick={handleNext}
            >
              Tiếp theo
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            * Các trường bắt buộc
          </div>
        </div>
      </div>
    </main>
  );
}
