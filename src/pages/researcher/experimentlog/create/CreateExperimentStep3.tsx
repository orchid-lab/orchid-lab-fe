import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

const CreateExperimentStep3 = () => {
  const navigate = useNavigate();
  const { form, setForm, resetForm } = useExperimentLogForm();
  const {
    name,
    numberOfSample,
    tissueCultureBatchID,
    batchName,
    methodID,
    methodName,
    methodType,
    hybridization,
    hybridizationNames,
    description,
    technicianNames,
  } = form;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Construct the payload for the API
    const payload = {
      name: name ?? "",
      numberOfSample: numberOfSample ?? 1,
      methodID: methodID ?? "",
      description: description ?? "",
      tissueCultureBatchID: tissueCultureBatchID ?? "",
      hybridization: hybridization ?? [],
      technicianID: form.technicianID ?? [],
    };
    console.log("Payload gửi lên API:", payload);

    try {
      const response = await axiosInstance.post("/api/experimentlog", payload);
      if (response.status !== 200 && response.status !== 201) {
        let errorData: { message?: string } | undefined;
        try {
          errorData = response.data as { message?: string };
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (errorData && typeof errorData === "object" && errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Có lỗi xảy ra khi tạo nhật ký thí nghiệm.");
      }
      enqueueSnackbar("Tạo nhật ký thí nghiệm thành công!", {
        variant: "success",
      });
      resetForm();
      void navigate("/experiment-log");
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        "Tạo phương pháp thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
      setError(apiError.message ?? "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hybridizationNamesToShow =
    methodType === "Sexual" && hybridizationNames
      ? [...hybridizationNames].reverse()
      : hybridizationNames;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <ExperimentSteps currentStep={3} />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">
              Tạo Kế Hoạch Lai Tạo Mới
            </h1>
            <p className="text-gray-600 mt-1">
              Bước 3: Xem lại thông tin và hoàn thành
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Review Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Tên nhật ký thí nghiệm
                  </h3>
                  <p className="text-gray-600">{name ?? "Chưa nhập"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Số lượng mẫu
                  </h3>
                  <p className="text-gray-600">
                    {numberOfSample ?? "Chưa nhập"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Lô cấy mô
                  </h3>
                  <p className="text-gray-600">{batchName ?? "Chưa chọn"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Phương pháp
                  </h3>
                  <p className="text-gray-600">{methodName ?? "Chưa chọn"}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Loại: {methodType ?? "---"}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Kỹ thuật viên
                  </h3>
                  <p className="text-gray-600">
                    {technicianNames && technicianNames.length > 0
                      ? technicianNames.join(", ")
                      : "Chưa chọn"}
                  </p>
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-1">
                    Cây giống đã chọn
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    {methodType === "Clonal" &&
                      (hybridizationNames && hybridizationNames.length > 0 ? (
                        <div>• {hybridizationNames[0]}</div>
                      ) : (
                        "Không có cây mẹ nào được chọn."
                      ))}
                    {methodType === "Sexual" && (
                      <>
                        <div>
                          <strong>Mẹ:</strong>{" "}
                          {hybridizationNamesToShow?.[0] ?? "Chưa chọn"}
                        </div>
                        <div>
                          <strong>Cha:</strong>{" "}
                          {hybridizationNamesToShow?.[1] ?? "Chưa chọn"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mô tả
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập mô tả, ghi chú hoặc mục tiêu của thí nghiệm..."
                value={description ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <Link
              to="/experiment-log/create/step-2"
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành & Tạo mới
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateExperimentStep3;
