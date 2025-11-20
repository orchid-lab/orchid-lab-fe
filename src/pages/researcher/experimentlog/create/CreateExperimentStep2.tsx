import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Info, Check, Plus } from "lucide-react";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axios from "axios";

interface Seedling {
  id: string;
  localName?: string;
  scientificName?: string;
  name?: string; // fallback
  description: string;
  doB: string;
}

interface ApiSeedling {
  id: string;
  localName?: string;
  scientificName?: string;
  name?: string;
  description: string;
  doB: string;
}

const CreateExperimentStep2 = () => {
  const navigate = useNavigate();
  const { form, setForm } = useExperimentLogForm();
  const { methodType, methodName } = form;

  // State for fetched seedlings
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for selection
  const [selected, setSelected] = useState<Seedling[]>([]);

  // Fetch seedlings on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get(
        "https://net-api.orchid-lab.systems/api/seedling?pageNumber=1&pageSize=100"
      )
      .then((res) => {
        const raw = res.data as { value?: { data?: ApiSeedling[] } };
        const data: Seedling[] = Array.isArray(raw.value?.data)
          ? raw.value.data.map((item) => ({
              id: item.id,
              localName: item.localName,
              scientificName: item.scientificName,
              name: item.name,
              description: item.description,
              doB: item.doB,
            }))
          : [];
        setSeedlings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách cây giống");
        setLoading(false);
      });
  }, []);

  // Reset selection when methodType changes
  useEffect(() => {
    setSelected([]);
  }, [methodType]);

  // Update context when selection changes
  useEffect(() => {
    if (methodType === "Clonal") {
      if (selected[0]) {
        const displayName =
          selected[0].localName ??
          selected[0].scientificName ??
          selected[0].name ??
          "Chưa có tên";
        setForm((prev) => ({
          ...prev,
          motherID: selected[0].id,
          motherName: displayName,
          hybridization: [selected[0].id],
          hybridizationNames: [displayName],
        }));
      }
    } else if (methodType === "Sexual") {
      if (selected.length === 2) {
        const motherName =
          selected[0].localName ??
          selected[0].scientificName ??
          selected[0].name ??
          "Chưa có tên";
        const fatherName =
          selected[1].localName ??
          selected[1].scientificName ??
          selected[1].name ??
          "Chưa có tên";
        setForm((prev) => ({
          ...prev,
          motherID: selected[0].id,
          motherName: motherName,
          hybridization: [selected[1].id, selected[0].id],
          hybridizationNames: [fatherName, motherName],
        }));
      }
    }
  }, [selected, methodType, setForm]);

  // Select logic
  const handleSelect = (seedling: Seedling) => {
    if (methodType === "Clonal") {
      setSelected([seedling]);
    } else if (methodType === "Sexual") {
      if (selected.find((s) => s.id === seedling.id)) {
        setSelected(selected.filter((s) => s.id !== seedling.id));
      } else if (selected.length < 2) {
        setSelected([...selected, seedling]);
      }
    }
  };

  const isNextDisabled =
    (methodType === "Clonal" && selected.length !== 1) ||
    (methodType === "Sexual" && selected.length !== 2);

  const handleNext = () => {
    if (!isNextDisabled) {
      void navigate("/experiment-log/create/step-3");
    }
  };

  if (!methodType) return null;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <ExperimentSteps currentStep={2} />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tạo Kế Hoạch Lai Tạo Mới
              </h1>
              <p className="text-gray-600 mt-1">
                Bước 2: Chọn cây giống cho phương pháp "{methodName}"
              </p>
            </div>
            <Link
              to="/seedlings/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" /> Tạo cây giống mới
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {methodType === "Clonal"
                      ? "Chọn 1 cây giống (mẹ)"
                      : "Chọn 2 cây giống (đầu tiên là mẹ, thứ hai là cha)"}
                  </h3>
                  {loading ? (
                    <div>Đang tải...</div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {seedlings.map((plant) => {
                        const isSelected = selected.find(
                          (s) => s.id === plant.id
                        );
                        const displayName =
                          plant.localName && plant.scientificName
                            ? `${plant.localName} (${plant.scientificName})`
                            : plant.localName ??
                              plant.scientificName ??
                              plant.name ??
                              plant.id;
                        return (
                          <div
                            key={plant.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-all ${
                              isSelected
                                ? "border-green-600 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handleSelect(plant)}
                          >
                            <div
                              className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-green-600 border-green-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{displayName}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Detail of selected seedlings */}
                {methodType === "Clonal" && selected[0] && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold mb-2">
                      Thông tin cây mẹ đã chọn
                    </h4>
                    <div>
                      <strong>Tên địa phương:</strong>{" "}
                      {selected[0].localName ?? "Chưa có"}
                    </div>
                    <div>
                      <strong>Tên khoa học:</strong>{" "}
                      {selected[0].scientificName ?? "Chưa có"}
                    </div>
                    <div>
                      <strong>Mô tả:</strong> {selected[0].description}
                    </div>
                    <div>
                      <strong>Ngày sinh:</strong> {selected[0].doB}
                    </div>
                  </div>
                )}
                {methodType === "Sexual" && selected.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {selected[0] && (
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold mb-2">Cây mẹ</h4>
                        <div>
                          <strong>Tên địa phương:</strong>{" "}
                          {selected[0].localName ?? "Chưa có"}
                        </div>
                        <div>
                          <strong>Tên khoa học:</strong>{" "}
                          {selected[0].scientificName ?? "Chưa có"}
                        </div>
                        <div>
                          <strong>Mô tả:</strong> {selected[0].description}
                        </div>
                        <div>
                          <strong>Ngày sinh:</strong> {selected[0].doB}
                        </div>
                      </div>
                    )}
                    {selected[1] && (
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold mb-2">Cây cha</h4>
                        <div>
                          <strong>Tên địa phương:</strong>{" "}
                          {selected[1].localName ?? "Chưa có"}
                        </div>
                        <div>
                          <strong>Tên khoa học:</strong>{" "}
                          {selected[1].scientificName ?? "Chưa có"}
                        </div>
                        <div>
                          <strong>Mô tả:</strong> {selected[1].description}
                        </div>
                        <div>
                          <strong>Ngày sinh:</strong> {selected[1].doB}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <Info size={16} />
                    Tóm tắt lựa chọn
                  </h3>
                  <div className="text-sm text-green-700 space-y-2">
                    <div>
                      <strong>Lô cấy:</strong> {form.batchName ?? "Chưa chọn"}
                    </div>
                    <div>
                      <strong>Phương pháp:</strong>{" "}
                      {form.methodName ?? "Chưa chọn"}
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-800 mb-2">
                    Cây đã chọn
                  </h3>
                  <div className="text-sm text-orange-700 space-y-1">
                    {methodType === "Clonal" &&
                      (selected[0] ? (
                        <div>
                          •{" "}
                          {selected[0].localName ??
                            selected[0].scientificName ??
                            "Chưa có tên"}
                        </div>
                      ) : (
                        "Chưa chọn cây mẹ."
                      ))}
                    {methodType === "Sexual" && (
                      <>
                        <div>
                          <strong>Mẹ:</strong>{" "}
                          {selected[0]?.localName ??
                            selected[0]?.scientificName ??
                            "Chưa chọn"}
                        </div>
                        <div>
                          <strong>Cha:</strong>{" "}
                          {selected[1]?.localName ??
                            selected[1]?.scientificName ??
                            "Chưa chọn"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <Link
              to="/experiment-log/create/step-1"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isNextDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateExperimentStep2;
