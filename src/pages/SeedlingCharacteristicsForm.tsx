import { useNavigate } from "react-router-dom";
import { useSeedlingForm } from "../context/SeedlingFormContext";
import { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import type { SeedlingCharacteristic } from "../types/Seedling";

const attributeOptions = [
  "Height",
  "Flowers color",
  "Leaf count",
  "Root development",
];

export default function SeedlingCharacteristicsForm() {
  const navigate = useNavigate();
  const { form, setForm } = useSeedlingForm();
  const [touched, setTouched] = useState(false);

  const characteristics: SeedlingCharacteristic[] = form.characteristics || [];

  function handleChange(
    idx: number,
    field: keyof SeedlingCharacteristic,
    value: string
  ) {
    const updated = characteristics.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    setForm({ ...form, characteristics: updated });
  }

  function handleAdd() {
    setForm({
      ...form,
      characteristics: [
        ...(form.characteristics || []),
        { attribute: "", value: "", unit: "" },
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
    characteristics.length > 0 &&
    characteristics.every((c) => c.attribute && c.value && c.unit);

  function handleNext() {
    setTouched(true);
    if (isValid) navigate("/seedlings/new/summary");
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">
        Add New Orchid Seedling
      </h2>
      <div className="bg-white rounded-xl shadow p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-green-800">
            Seedling Characteristics
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
                  Attribute*
                </label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={c.attribute}
                  onChange={(e) =>
                    handleChange(idx, "attribute", e.target.value)
                  }
                >
                  <option value="">Select attribute</option>
                  {attributeOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
                {touched && !c.attribute && (
                  <div className="text-red-500 text-xs">Required</div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Value*</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={c.value}
                  onChange={(e) => handleChange(idx, "value", e.target.value)}
                  placeholder="Value"
                />
                {touched && !c.value && (
                  <div className="text-red-500 text-xs">Required</div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Unit*</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={c.unit}
                  onChange={(e) => handleChange(idx, "unit", e.target.value)}
                  placeholder="Unit"
                />
                {touched && !c.unit && (
                  <div className="text-red-500 text-xs">Required</div>
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
              No characteristics added.
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
            onClick={() => navigate("/seedlings/new")}
          >
            Back
          </button>
          <button
            type="button"
            className="bg-green-800 cursor-pointer text-white px-8 py-2 rounded font-semibold hover:bg-green-900 transition"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">* Required fields</div>
      </div>
    </div>
  );
}
