import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Plus, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";
import type { Seedling } from "../../../../types/Seedling";

// Helper function to find closest color name from RGB values
const findClosestColorName = (r: number, g: number, b: number): string => {
  const colors: { name: string; r: number; g: number; b: number }[] = [
    { name: "Red", r: 255, g: 0, b: 0 },
    { name: "Blue", r: 0, g: 0, b: 255 },
    { name: "Green", r: 0, g: 128, b: 0 },
    { name: "Yellow", r: 255, g: 255, b: 0 },
    { name: "Pink", r: 255, g: 192, b: 203 },
    { name: "Purple", r: 128, g: 0, b: 128 },
    { name: "Orange", r: 255, g: 165, b: 0 },
    { name: "White", r: 255, g: 255, b: 255 },
    { name: "Black", r: 0, g: 0, b: 0 },
  ];
  let closest = colors[0];
  let minDist = Infinity;
  colors.forEach((color) => {
    const dist = Math.sqrt(
      Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = color;
    }
  });
  return closest.name;
};

const CreateExperimentStep2 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { form, setForm } = useExperimentLogForm();
  const { methodType, methodName } = form;

  // Developer offline mode: set to true to skip external API calls and use mock data
  const DEV_OFFLINE = false;

  // Fallback values used when running in DEV_OFFLINE or when form.methodType is not set.
  // The form provider uses empty strings by default, so treat empty/whitespace as unset.
  const inferMethodType = (typeStr?: string | number, name?: string) => {
    const s = (String(typeStr ?? name ?? "") || "").toLowerCase();
    if (!s) return "Clonal"; // default
    if (
      s.includes("lai") ||
      s.includes("sexual") ||
      s.includes("hybrid") ||
      s.includes("lai ghép")
    )
      return "Sexual";
    if (
      s.includes("nuôi cấy") ||
      s.includes("cấy") ||
      s.includes("clonal") ||
      s.includes("invitro")
    )
      return "Clonal";
    return "Clonal";
  };

  const mType =
    methodType && String(methodType).trim().length > 0
      ? String(methodType)
      : methodName && String(methodName).trim().length > 0
        ? inferMethodType(undefined, methodName)
        : DEV_OFFLINE
          ? "Clonal"
          : "Clonal";

  const mName =
    methodName && String(methodName).trim().length > 0
      ? methodName
      : DEV_OFFLINE
        ? "Clonal"
        : "Phương pháp mẫu";

  // State for fetched seedlings
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for selection: single seedling (mother) for clonal
  const [motherId, setMotherId] = useState<string | undefined>(
    form.motherID ? String(form.motherID) : undefined,
  );
  const [expectedSample, setExpectedSample] = useState<number>(
    typeof form.numberOfSample === "number" && form.numberOfSample > 0
      ? form.numberOfSample
      : 1,
  );
  const [selectedMotherDetail, setSelectedMotherDetail] = useState<Seedling | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch seedlings on mount
  useEffect(() => {
    setLoading(true);
    const mock: Seedling[] = [
      {
        id: "mock-1",
        localName: "Vanda Blue",
        scientificName: "Vanda coerulea",
        description: "Cây giống mẫu - dùng để kiểm tra giao diện",
        doB: "2020-05-12",
        createdDate: "2020-05-12",
        createdBy: "Admin",
        traits: [
          { name: "Màu hoa chính", value: 0, unit: "" },
          { name: "Chiều cao", value: 45, unit: "cm" },
        ],
      },
      {
        id: "mock-2",
        localName: "Phalaenopsis White",
        scientificName: "Phalaenopsis amabilis",
        description: "Cây giống mẫu 2",
        doB: "2019-11-03",
        createdDate: "2019-11-03",
        createdBy: "Admin",
        traits: [
          { name: "Màu hoa chính", value: 255255255, unit: "" },
          { name: "Chiều cao", value: 50, unit: "cm" },
        ],
      },
      {
        id: "mock-3",
        localName: "Dendrobium Pink",
        scientificName: "Dendrobium nobile",
        description: "Cây giống mẫu 3",
        doB: "2021-02-20",
        createdDate: "2021-02-20",
        createdBy: "Admin",
        traits: [
          { name: "Màu hoa chính", value: 255192203, unit: "" },
          { name: "Chiều cao", value: 40, unit: "cm" },
        ],
      },
    ];

    if (DEV_OFFLINE) {
      setSeedlings(mock);
      setError(null);
      setLoading(false);
      return;
    }

    void axiosInstance
      .get("/api/seedlings", {
        params: { pageNumber: 1, pageSize: 100 },
        timeout: 5000,
      })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        const data: Seedling[] = Array.isArray(raw.data)
          ? raw.data.map((item) => ({
              id: item.id,
              localName: item.localName,
              scientificName: item.scientificName,
              description: item.description,
              doB: item.doB,
              createdDate: item.createdDate,
              createdBy: item.createdBy,
              traits: item.traits,
            }))
          : [];
        setSeedlings(data);
        setError(null);
      })
      .catch(async (err) => {
        // eslint-disable-next-line no-console
        console.error("Seedling fetch failed:", err);
        const detail = err?.response?.data?.detail ?? "";
        if (typeof detail === "string" && detail.includes("OFFSET")) {
          try {
            const r2 = await axiosInstance.get("/api/seedlings");
            const raw2 = r2.data as { data?: any[] };
            const data2: Seedling[] = Array.isArray(raw2.data)
              ? raw2.data.map((item) => ({
                  id: item.id,
                  localName: item.localName,
                  scientificName: item.scientificName,
                  description: item.description,
                  doB: item.doB,
                  createdDate: item.createdDate,
                  createdBy: item.createdBy,
                  traits: item.traits,
                }))
              : [];
            setSeedlings(data2);
            setError(null);
            return;
          } catch {
            // fall through to set mock
          }
        }
        setError("Không thể tải danh sách cây giống (sử dụng dữ liệu mẫu)");
        setSeedlings(mock);
      })
      .finally(() => setLoading(false));
  }, []);

  // Reset selection when the effective method type changes
  useEffect(() => {
    setMotherId(undefined);
    setSelectedMotherDetail(null);
  }, [methodType]);

  // Fetch seedling detail when mother ID changes
  useEffect(() => {
    if (!motherId) {
      setSelectedMotherDetail(null);
      return;
    }

    setLoadingDetail(true);
    void axiosInstance
      .get(`/api/seedlings/${motherId}`)
      .then((res) => {
        const data = res.data.value ?? res.data;
        const detail: Seedling = {
          id: data.id,
          localName: data.localName,
          scientificName: data.scientificName,
          description: data.description,
          doB: data.doB,
          createdDate: data.createdDate,
          createdBy: data.createdBy,
          traits: data.traits,
        };
        setSelectedMotherDetail(detail);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch seedling detail:", err);
        // Fallback to list data if detail fetch fails
        const fromList = seedlings.find((s) => s.id === motherId);
        setSelectedMotherDetail(fromList ?? null);
      })
      .finally(() => setLoadingDetail(false));
  }, [motherId]);

  // Update context when mother selection changes
  useEffect(() => {
    const mother = seedlings.find((s) => s.id === motherId);

    if (mother) {
      const displayName =
        mother.localName ??
        mother.scientificName ??
        "Chưa có tên";
      setForm((prev) => ({
        ...prev,
        motherID: mother.id,
        motherName: displayName,
        hybridization: [mother.id],
        hybridizationNames: [displayName],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        motherID: "",
        motherName: "",
        hybridization: [],
        hybridizationNames: [],
      }));
    }
  }, [motherId, seedlings, setForm]);

  // Sync expected sample count to context
  useEffect(() => {
    setForm((prev) => ({ ...prev, numberOfSample: expectedSample }));
  }, [expectedSample, setForm]);

  // Selection is handled by the single select (motherId)

  const isNextDisabled = !motherId || !(expectedSample && expectedSample > 0);

  const selectedMother = selectedMotherDetail || seedlings.find((s) => s.id === motherId);

  const handleNext = () => {
    if (isNextDisabled) return;
    void navigate("/researcher/experiment-log/create/step-3");
  };

  if (!mType) return null;

  return (
    <main className="ml-64 mt-6 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ExperimentSteps currentStep={2} />
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg animate-fade-in-up">
          <div className="p-8 border-b flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tạo Kế Hoạch Lai Tạo Mới
              </h1>
              <p className="text-gray-600 mt-2">
                Bước 2: Chọn cây giống cho phương pháp "{mName}"
              </p>
            </div>
            <Link
              to="/seedlings/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" /> Tạo cây giống mới
            </Link>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form: mother/father selects and details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Chọn cây giống
                  </h3>
                  {loading ? (
                    <div>Đang tải...</div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cây giống 1
                          </label>
                          <div className="relative">
                            <select
                              value={motherId ?? ""}
                              onChange={(e) =>
                                setMotherId(e.target.value || undefined)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            >
                              <option value="">-- Chọn cây giống 1 --</option>
                              {seedlings.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.localName ??
                                    p.scientificName ??
                                    p.id}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số mẫu mong muốn
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={expectedSample}
                            onChange={(e) => {
                              const v = parseInt(e.target.value || "0", 10);
                              setExpectedSample(Number.isNaN(v) ? 1 : v);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          />
                        </div>

                        {/* single select only (clonal) - removed second seedling select */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details for selected plants (static/mock display) */}
                <div className="mt-6 space-y-6">
                  {loadingDetail && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <p className="text-blue-700">Đang tải thông tin cây giống...</p>
                    </div>
                  )}
                  {selectedMother ? (
                    <>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-semibold mb-3">Cây giống 1</h4>
                        <div className="space-y-2">
                          <div>
                            <strong>Tên địa phương:</strong>{" "}
                            {selectedMother.localName ?? "Chưa có"}
                          </div>
                          <div>
                            <strong>Tên khoa học:</strong>{" "}
                            {selectedMother.scientificName ?? "Chưa có"}
                          </div>
                          <div>
                            <strong>Mô tả:</strong> {selectedMother.description}
                          </div>
                          <div>
                            <strong>Ngày tạo:</strong>{" "}
                            {selectedMother.createdDate
                              ? new Date(
                                  selectedMother.createdDate
                                ).toLocaleDateString("vi-VN")
                              : "Chưa có"}
                          </div>
                        </div>
                      </div>

                      {/* Traits Section */}
                      {selectedMother.traits &&
                        selectedMother.traits.length > 0 && (() => {
                          // Hiển thị màu hoa chính/phụ từ trait name
                          const colorTraits =
                            selectedMother.traits?.filter(
                              (trait) =>
                                trait.name === "Màu hoa chính" ||
                                trait.name === "Màu hoa phụ"
                            ) ?? [];
                          const colorCards = colorTraits.map((trait) => {
                            const value = trait.value;
                            const r = Math.floor(value / 1_000_000);
                            const g = Math.floor(
                              (value % 1_000_000) / 1_000
                            );
                            const b = value % 1_000;
                            const colorName = findClosestColorName(r, g, b);
                            return (
                              <div
                                key={trait.name}
                                className="trait-card bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-shadow"
                              >
                                <div className="text-sm font-semibold text-purple-700 mb-4">
                                  {trait.name}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div
                                    className="w-20 h-20 rounded-lg border-4 border-gray-300 shadow-md flex-shrink-0"
                                    style={{
                                      backgroundColor: `rgb(${r}, ${g}, ${b})`,
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="text-2xl font-bold text-gray-900">
                                      {colorName}
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono mt-1">
                                      RGB({r}, {g}, {b})
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });

                          const otherTraits =
                            selectedMother.traits?.filter(
                              (trait) =>
                                trait.name !== "Màu hoa chính" &&
                                trait.name !== "Màu hoa phụ"
                            ) ?? [];
                          return (
                            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-purple-500">
                              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full mr-3 font-semibold">
                                  🌱
                                </span>
                                {t("seedling.traits") || "Đặc điểm"}
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {colorCards}
                                {otherTraits.map((trait, index) => (
                                  <div
                                    key={trait.name + index}
                                    className="trait-card bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-shadow"
                                  >
                                    <div className="text-sm font-semibold text-purple-700 mb-2 line-clamp-2">
                                      {trait.name}
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 mb-2">
                                      {trait.value}
                                    </div>
                                    <div className="text-sm text-gray-600 font-medium">
                                      {trait.unit}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                      {/* Fallback: No Traits */}
                      {(!selectedMother.traits ||
                        selectedMother.traits.length === 0) && (
                        <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-gray-300">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full mr-3 font-semibold">
                              🌱
                            </span>
                            {t("seedling.traits") || "Đặc điểm"}
                          </h2>
                          <p className="text-gray-600">
                            {t("seedling.noTraits") || "Không có tính trạng được ghi lại"}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="text-sm text-gray-500">
                        Chưa chọn cây giống 1.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-800 mb-2">
                    Cây đã chọn
                  </h3>
                  <div className="text-sm text-orange-700 space-y-1">
                    <div>
                      <strong>Cây giống:</strong>{" "}
                      {selectedMother
                        ? (selectedMother.localName ??
                          selectedMother.scientificName)
                        : "Chưa chọn"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <Link
              to="/researcher/experiment-log/create/step-1"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isNextDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
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
