import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axios from "axios";

interface Batch {
  id: string;
  name: string;
  labName?: string;
  description?: string;
  status?: boolean;
}

interface Technician {
  id: string;
  name: string;
  email?: string;
  roleID: string | number;
}

function hasValueWithData<T>(
  obj: unknown,
  itemGuard: (item: unknown) => item is T,
): obj is { value: { data: T[] } } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object" &&
    (obj as { value: { data?: unknown[] } }).value !== null &&
    "data" in (obj as { value: { data?: unknown[] } }).value &&
    Array.isArray((obj as { value: { data?: unknown[] } }).value.data) &&
    (obj as { value: { data: unknown[] } }).value.data.every(itemGuard)
  );
}

function isBatch(item: unknown): item is Batch {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    typeof (item as { id: unknown }).id === "string" &&
    "name" in item &&
    typeof (item as { name: unknown }).name === "string"
  );
}

function isMethod(item: unknown): item is {
  id: string;
  name: string;
  description: string;
  type?: string;
  stages?: {
    id: string;
    name: string;
    description: string;
    dateOfProcessing: number;
    step: number;
    status: boolean;
  }[];
} {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    typeof (item as { id: unknown }).id === "string" &&
    "name" in item &&
    typeof (item as { name: unknown }).name === "string" &&
    "description" in item &&
    typeof (item as { description: unknown }).description === "string"
    // type và stages là optional
  );
}

const CreateExperimentStep1 = () => {
  // Developer offline mode: set to true to skip external API calls and use mock data
  const DEV_OFFLINE = true;
  const navigate = useNavigate();
  const { form, setForm } = useExperimentLogForm();

  // Local state initialized from context
  const [selectedBatch, setSelectedBatch] = useState(
    form.tissueCultureBatchID ?? "",
  );
  const [selectedMethod, setSelectedMethod] = useState(form.methodID ?? "");
  const [name, setName] = useState(form.name ?? "");
  const [startDate, setStartDate] = useState(form.startDate ?? "");
  const [endDate, setEndDate] = useState(form.endDate ?? "");
  const [numberOfSample, setNumberOfSample] = useState(
    form.numberOfSample ?? 1,
  );

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [experimentLogs, setExperimentLogs] = useState<
    { id: string; tissueCultureBatchID: string; status: number | string }[]
  >([]);
  const [loadingEL, setLoadingEL] = useState(true);

  const [methods, setMethods] = useState<
    {
      id: string;
      name: string;
      description: string;
      type?: string;
      stages?: {
        id: string;
        name: string;
        description: string;
        dateOfProcessing: number;
        step: number;
        status: boolean;
      }[];
    }[]
  >([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>(
    typeof form.technicianID === "string"
      ? form.technicianID
      : Array.isArray(form.technicianID) && form.technicianID.length > 0
        ? form.technicianID[0]
        : "",
  );

  // Fetch experiment logs for validation
  useEffect(() => {
    if (DEV_OFFLINE) {
      // In offline dev mode we don't need experiment log validations
      setExperimentLogs([]);
      setLoadingEL(false);
      return;
    }
    setLoadingEL(true);
    fetch(
      "https://net-api.orchid-lab.systems/api/experimentlog?pageNumber=1&pageSize=1000",
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy danh sách experiment logs");
        const data: unknown = await res.json();
        let arr: {
          id: string;
          tissueCultureBatchID: string;
          status: number | string;
        }[] = [];
        if (
          hasValueWithData<{
            id: string;
            tissueCultureBatchID: string;
            status: number | string;
          }>(
            data,
            (
              item,
            ): item is {
              id: string;
              tissueCultureBatchID: string;
              status: number | string;
            } => {
              return (
                typeof item === "object" &&
                item !== null &&
                "id" in item &&
                typeof (item as { id: unknown }).id === "string" &&
                "tissueCultureBatchID" in item &&
                typeof (item as { tissueCultureBatchID: unknown })
                  .tissueCultureBatchID === "string" &&
                "status" in item
              );
            },
          )
        ) {
          arr = data.value.data;
        }
        setExperimentLogs(arr);
      })
      .catch(() => {
        setExperimentLogs([]);
      })
      .finally(() => setLoadingEL(false));
  }, []);

  // Fetch batches from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setBatchError(null);
      setBatches([
        {
          id: "mock-b1",
          name: "Lô mẫu A",
          labName: "Lab A",
          description: "Lô mẫu dùng để dev",
        },
        {
          id: "mock-b2",
          name: "Lô mẫu B",
          labName: "Lab B",
          description: "Lô mẫu B",
        },
      ]);
      setLoadingBatch(false);
      return;
    }
    setLoadingBatch(true);
    setBatchError(null);
    fetch(
      "https://net-api.orchid-lab.systems/api/tissue-culture-batch?pageNumber=1&pageSize=10",
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy danh sách batch");
        const data: unknown = await res.json();
        let arr: Batch[] = [];
        if (hasValueWithData<Batch>(data, isBatch)) {
          arr = data.value.data;
        }
        setBatches(arr);
      })
      .catch(() => {
        setBatchError("Không thể tải danh sách batch.");
        setBatches([]);
      })
      .finally(() => setLoadingBatch(false));
  }, []);

  // Fetch methods from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setMethods([
        {
          id: "m1",
          name: "Clonal",
          description: "Clonal method",
          type: "Clonal",
        },
        {
          id: "m2",
          name: "Sexual",
          description: "Sexual method",
          type: "Sexual",
        },
      ] as any);
      return;
    }
    fetch(
      "https://net-api.orchid-lab.systems/api/method?pageNumber=1&pageSize=10",
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy danh sách phương pháp");
        const data: unknown = await res.json();
        let arr: { id: string; name: string; description: string }[] = [];
        if (
          hasValueWithData<{ id: string; name: string; description: string }>(
            data,
            isMethod,
          )
        ) {
          arr = data.value.data;
        }
        setMethods(arr);
      })
      .catch(() => setMethods([]));
  }, []);

  // Fetch technicians from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setTechnicians([
        {
          id: "tech-1",
          name: "Nguyen Van A",
          email: "a@example.com",
          roleID: "3",
        },
        {
          id: "tech-2",
          name: "Tran Thi B",
          email: "b@example.com",
          roleID: "3",
        },
      ]);
      return;
    }
    axios
      .get(
        "https://net-api.orchid-lab.systems/api/user?pageNumber=1&pageSize=100",
      )
      .then((res) => {
        const raw = res.data as { data?: Technician[] };
        console.log("User API raw:", raw.data);
        const data: Technician[] = Array.isArray(raw.data)
          ? raw.data.filter((u) => String(u.roleID) === "3")
          : [];
        console.log("Filtered technicians:", data);
        setTechnicians(data);
      })
      .catch(() => setTechnicians([]));
  }, []);

  // Update context when local state changes
  useEffect(() => {
    const methodObj = methods.find((m) => m.id === selectedMethod);
    const batchObj = batches.find((b) => b.id === selectedBatch);
    const tech = technicians.find((t) => t.id === selectedTechnician);
    setForm((prev) => ({
      ...prev,
      name,
      startDate,
      endDate,
      numberOfSample,
      tissueCultureBatchID: selectedBatch,
      batchName: batchObj?.name ?? "",
      methodID: methodObj?.id ?? "",
      methodName: methodObj?.name ?? "",
      methodType: methodObj?.type ?? "",
      technicianID: selectedTechnician ? [selectedTechnician] : [],
      technicianNames: tech ? [tech.name] : [],
    }));
  }, [
    selectedBatch,
    selectedMethod,
    batches,
    setForm,
    methods,
    name,
    startDate,
    endDate,
    numberOfSample,
    selectedTechnician,
    technicians,
  ]);

  // Function to check if a batch is available for use
  const isBatchAvailable = (
    batchId: string,
  ): { available: boolean; reason?: string } => {
    const relatedELs = experimentLogs.filter(
      (el) => el.tissueCultureBatchID === batchId,
    );

    if (relatedELs.length === 0) {
      return { available: true };
    }

    // Check if any EL is in process (status 2)
    const inProcessELs = relatedELs.filter((el) => String(el.status) === "2");
    if (inProcessELs.length > 0) {
      return {
        available: false,
        reason: `Lô cấy mô này đang được sử dụng trong ${inProcessELs.length} thí nghiệm đang thực hiện`,
      };
    }

    // Check if all related ELs are cancelled (status 4)
    const allCancelled = relatedELs.every((el) => String(el.status) === "4");
    if (allCancelled) {
      return { available: true };
    }

    // If there are other statuses, check what they are
    const otherStatuses = relatedELs.filter((el) => String(el.status) !== "4");
    const statusCounts = otherStatuses.reduce(
      (acc, el) => {
        const status = String(el.status);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusText = Object.entries(statusCounts)
      .map(([status, count]) => {
        switch (status) {
          case "1":
            return `${count} thí nghiệm đã tạo`;
          case "2":
            return `${count} thí nghiệm đang thực hiện`;
          case "3":
            return `${count} thí nghiệm hoàn thành`;
          default:
            return `${count} thí nghiệm với trạng thái ${status}`;
        }
      })
      .join(", ");

    return {
      available: false,
      reason: `Lô cấy mô này đang được sử dụng trong ${statusText}`,
    };
  };

  const handleNext = () => {
    // Developer bypass: allow progressing between steps even if
    // API-backed selects are not loaded. Restore original validation
    // when API is available again.
    void navigate("/experiment-log/create/step-2");
  };

  return (
    <main className="ml-64 mt-6 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ExperimentSteps currentStep={1} />
      <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg animate-fade-in-up">
            <div className="p-8 border-b">
              <h1 className="text-3xl font-bold text-gray-900">
                Tạo Kế Hoạch Lai Tạo Mới
              </h1>
              <p className="text-gray-600 mt-2">
                Bước 1: Chọn Lô Cấy Mô và Phương Pháp
              </p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form chính */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Tên EL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên nhật ký thí nghiệm{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder="Nhập tên nhật ký thí nghiệm"
                      required
                    />
                  </div>
                  {/* Ngày bắt đầu / kết thúc (dev) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                  {/* Lô Cấy Mô */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lô Cấy Mô <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBatch}
                        onChange={(e) => {
                          setSelectedBatch(e.target.value);
                          setBatchError(null); // Clear error when selection changes
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        disabled={loadingBatch || loadingEL}
                      >
                        <option value="">Chọn Lô Cấy Mô</option>
                        {batches.map((batch) => {
                          const validation = isBatchAvailable(batch.id);
                          return (
                            <option
                              key={batch.id}
                              value={batch.id}
                              disabled={!validation.available}
                            >
                              {batch.name || batch.id}{" "}
                              {!validation.available ? "(Đang sử dụng)" : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                    {(loadingBatch || loadingEL) && (
                      <div className="text-xs text-gray-400 mt-1">
                        Đang tải danh sách batch...
                      </div>
                    )}
                    {batchError && (
                      <div className="text-xs text-red-500 mt-1">
                        {batchError}
                      </div>
                    )}
                    {selectedBatch &&
                      !loadingEL &&
                      (() => {
                        const validation = isBatchAvailable(selectedBatch);
                        if (validation.available) {
                          return (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Lô cấy mô này có thể sử dụng
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-xs text-red-500 mt-1">
                              ✗ {validation.reason}
                            </div>
                          );
                        }
                      })()}
                  </div>
                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương pháp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">Chọn phương pháp</option>
                        {methods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>
                  {/* Chi Tiết Method */}
                  {selectedMethod && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Chi Tiết Phương Pháp:{" "}
                        {
                          methods.find((m) => String(m.id) === selectedMethod)
                            ?.name
                        }
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <strong>Mô tả:</strong>
                          <p>
                            {
                              methods.find(
                                (m) => String(m.id) === selectedMethod,
                              )?.description
                            }
                          </p>
                        </div>
                        <div>
                          <strong>Các giai đoạn:</strong>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            {methods
                              .find((m) => String(m.id) === selectedMethod)
                              ?.stages?.map(
                                (
                                  stage: {
                                    id: string;
                                    name: string;
                                    description: string;
                                    dateOfProcessing: number;
                                    step: number;
                                    status: boolean;
                                  },
                                  index: number,
                                ) => (
                                  <li key={stage.id}>
                                    Giai đoạn {index + 1}: {stage.name}
                                  </li>
                                ),
                              ) ?? <li>Không có thông tin giai đoạn</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Chọn technician */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kỹ thuật viên thực hiện{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      <option value="">Chọn kỹ thuật viên</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name ?? tech.email ?? tech.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
              <Link
                to="/experiment-log"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </Link>
              <div className="flex gap-4">
                <button
                  onClick={handleNext}
                  // Bypass disabled state so developer can navigate for UI review
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-green-600 text-white hover:bg-green-700`}
                >
                  Tiếp tục <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateExperimentStep1;
