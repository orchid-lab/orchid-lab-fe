import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Info, Plus, ChevronDown } from "lucide-react";
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

  // Developer offline mode: set to true to skip external API calls and use mock data
  const DEV_OFFLINE = true;

  // Fallback values used when running in DEV_OFFLINE or when form.methodType is not set.
  // The form provider uses empty strings by default, so treat empty/whitespace as unset.
  const mType =
    methodType && String(methodType).trim().length > 0
      ? methodType
      : DEV_OFFLINE
        ? "Clonal"
        : undefined;
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

  // State for selection: mother & father (ids)
  const [motherId, setMotherId] = useState<string | undefined>(
    form.motherID ? String(form.motherID) : undefined,
  );
  const [fatherId, setFatherId] = useState<string | undefined>(undefined);

  // Fetch seedlings on mount
  useEffect(() => {
    setLoading(true);
    const mock: Seedling[] = [
      {
        id: "mock-1",
        localName: "Vanda Blue",
        scientificName: "Vanda coerulea",
        name: "Vanda Blue",
        description: "Cây giống mẫu - dùng để kiểm tra giao diện",
        doB: "2020-05-12",
      },
      {
        id: "mock-2",
        localName: "Phalaenopsis White",
        scientificName: "Phalaenopsis amabilis",
        name: "Phalaenopsis White",
        description: "Cây giống mẫu 2",
        doB: "2019-11-03",
      },
      {
        id: "mock-3",
        localName: "Dendrobium Pink",
        scientificName: "Dendrobium nobile",
        name: "Dendrobium Pink",
        description: "Cây giống mẫu 3",
        doB: "2021-02-20",
      },
    ];

    if (DEV_OFFLINE) {
      // Use mock data and do not call external API
      setSeedlings(mock);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchSeedlings = async () => {
      try {
        // Use a short timeout so unresolved host errors fail fast during UI development
        const res = await axios.get(
          "https://net-api.orchid-lab.systems/api/seedling?pageNumber=1&pageSize=100",
          { timeout: 3000 },
        );
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
      } catch (err) {
        // Log full error for debugging (will include timeout/DNS details)
        // eslint-disable-next-line no-console
        console.error("Seedling fetch failed:", err);
        // Non-blocking fallback for dev: provide mock seedlings so UI can be reviewed
        setError("Không thể tải danh sách cây giống (sử dụng dữ liệu mẫu)");
        setSeedlings(mock);
      } finally {
        setLoading(false);
      }
    };

    void fetchSeedlings();
  }, []);

  // Reset selection when the effective method type changes
  useEffect(() => {
    setMotherId(undefined);
    setFatherId(undefined);
  }, [methodType]);

  // Update context when mother/father selection changes
  useEffect(() => {
    const mother = seedlings.find((s) => s.id === motherId);
    const father = seedlings.find((s) => s.id === fatherId);

    if (mother && father) {
      const motherName =
        mother.localName ??
        mother.scientificName ??
        mother.name ??
        "Chưa có tên";
      const fatherName =
        father.localName ??
        father.scientificName ??
        father.name ??
        "Chưa có tên";
      setForm((prev) => ({
        ...prev,
        motherID: mother.id,
        motherName: motherName,
        hybridization: [father.id, mother.id],
        hybridizationNames: [fatherName, motherName],
      }));
    } else if (mother) {
      const displayName =
        mother.localName ??
        mother.scientificName ??
        mother.name ??
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
  }, [motherId, fatherId, seedlings, setForm]);

  // Selection is handled by the two selects (motherId, fatherId)

  const isNextDisabled =
    (mType === "Clonal" && !motherId) ||
    (mType === "Sexual" && (!motherId || !fatherId));

  const selectedMother = seedlings.find((s) => s.id === motherId);
  const selectedFather = seedlings.find((s) => s.id === fatherId);

  const handleNext = () => {
    // Developer bypass: allow proceeding to step-3 even if selections are incomplete.
    void navigate("/experiment-log/create/step-3");
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
                                    p.name ??
                                    p.id}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cây giống 2
                          </label>
                          <div className="relative">
                            <select
                              value={fatherId ?? ""}
                              onChange={(e) =>
                                setFatherId(e.target.value || undefined)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            >
                              <option value="">-- Chọn cây giống 2 --</option>
                              {seedlings.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.localName ??
                                    p.scientificName ??
                                    p.name ??
                                    p.id}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details for selected plants (static/mock display) */}
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  {selectedMother ? (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Cây giống 1</h4>
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
                        <strong>Ngày sinh:</strong> {selectedMother.doB}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Chưa chọn cây giống 1.
                    </div>
                  )}

                  {selectedFather ? (
                    <div>
                      <h4 className="font-semibold mb-2">Cây giống 2</h4>
                      <div>
                        <strong>Tên địa phương:</strong>{" "}
                        {selectedFather.localName ?? "Chưa có"}
                      </div>
                      <div>
                        <strong>Tên khoa học:</strong>{" "}
                        {selectedFather.scientificName ?? "Chưa có"}
                      </div>
                      <div>
                        <strong>Mô tả:</strong> {selectedFather.description}
                      </div>
                      <div>
                        <strong>Ngày sinh:</strong> {selectedFather.doB}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Chưa chọn cây giống 2.
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
                      <strong>Cây giống 1:</strong>{" "}
                      {selectedMother
                        ? (selectedMother.localName ??
                          selectedMother.scientificName ??
                          selectedMother.name)
                        : "Chưa chọn"}
                    </div>
                    <div>
                      <strong>Cây giống 2:</strong>{" "}
                      {selectedFather
                        ? (selectedFather.localName ??
                          selectedFather.scientificName ??
                          selectedFather.name)
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
              to="/experiment-log/create/step-1"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              onClick={handleNext}
              // Bypass disabled so developer can navigate for UI review
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-green-600 text-white hover:bg-green-700`}
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
