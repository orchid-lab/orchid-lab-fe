import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";

interface TechnicianApi {
  id: string;
  name: string;
  roleID: number;
}

const SelectTechnicianContainer: React.FC = () => {
  const [technicians, setTechnicians] = useState<TechnicianApi[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setState } = useCreateTask();

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/api/user?pageNumber=1&pageSize=100")
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? (res.data.data as TechnicianApi[])
          : [];
        setTechnicians(data.filter((t) => String(t.roleID) === "3"));
      })
      .catch(() => setTechnicians([]))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedTech) {
      const techObj = technicians.find((t) => t.id === selectedTech);
      setState((prev) => ({
        ...prev,
        assignCommand: techObj
          ? [{ technicianId: techObj.id, technicianName: techObj.name }]
          : [],
      }));
      void navigate("/create-task/step-3");
    }
  };

  const handleBack = (): void => {
    void navigate("/create-task/step-1");
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
      <CreateTaskStepper currentStep={2} />
      <form
        className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-[900px] mx-auto mt-8"
        onSubmit={handleNext}
      >
        <h2 className="text-2xl font-semibold mb-6">Chọn kỹ thuật viên</h2>
        <div className="flex flex-col gap-4 my-6 mb-8">
          {loading && (
            <div className="text-gray-500">
              Đang tải danh sách kỹ thuật viên...
            </div>
          )}
          {!loading && technicians.length === 0 && (
            <div className="text-red-500">Không có kỹ thuật viên nào!</div>
          )}
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className={`border-[1.5px] rounded-[10px] py-[18px] px-6 cursor-pointer transition-all duration-200 relative ${
                selectedTech === tech.id
                  ? "border-2 border-green-700 bg-green-50 shadow-[0_2px_8px_rgba(56,142,60,0.08)]"
                  : "border-gray-300 bg-[#fafbfc] hover:border-2 hover:border-blue-600 hover:bg-[#f1f8ff]"
              }`}
              onClick={() => setSelectedTech(tech.id)}
            >
              <div className="flex items-center gap-[14px] mb-2">
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[1.1rem] text-white mr-2 bg-green-700">
                  {tech.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-semibold text-[1.08rem]">
                    {tech.name}
                  </span>
                </div>
                <input
                  type="radio"
                  checked={selectedTech === tech.id}
                  className="ml-4 w-[18px] h-[18px]"
                  readOnly
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="submit"
            className={`min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold transition-colors duration-200 ${
              selectedTech === null
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-700 text-white cursor-pointer hover:bg-green-800"
            }`}
            disabled={selectedTech === null}
          >
            Next
          </button>
        </div>
      </form>
    </main>
  );
};

export default SelectTechnicianContainer;
