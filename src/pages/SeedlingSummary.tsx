import { useNavigate } from "react-router-dom";
import { useSeedlingForm } from "../context/SeedlingFormContext";
import type { SeedlingCharacteristic } from "../types/Seedling";
export default function SeedlingSummary() {
  const navigate = useNavigate();
  const { form } = useSeedlingForm();

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">
        Add New Orchid Seedling
      </h2>
      <div className="bg-white rounded-xl shadow p-8 max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold text-green-800 mb-6">
          Seedling Details
        </h3>
        <div className="mb-6">
          <div className="mb-2">
            <span className="font-semibold">Name:</span> {form.name}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Parent:</span> {form.parent}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Parent 1:</span> {form.parent1}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Description:</span>{" "}
            {form.description}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Date of Birth:</span>{" "}
            {form.dateOfBirth}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Characteristics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border rounded">
            <thead>
              <tr className="bg-green-50 text-green-800 font-semibold">
                <th className="py-2">Attribute</th>
                <th className="py-2">Value</th>
                <th className="py-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {form.characteristics.map(
                (c: SeedlingCharacteristic, idx: number) => (
                  <tr key={idx} className="border-t text-center">
                    <td className="py-2 px-4">{c.attribute}</td>
                    <td className="py-2 px-4">{c.value}</td>
                    <td className="py-2 px-4">{c.unit}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
            onClick={() => navigate("/seedlings/new/characteristics")}
          >
            Back
          </button>
          <button
            type="button"
            className="bg-green-800 cursor-pointer text-white px-8 py-2 rounded font-semibold hover:bg-green-900 transition"
            onClick={() => navigate("/seedlings")}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
