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

    // Map form values and coerce types
    const methodId = methodID ? parseInt(String(methodID), 10) : NaN;
    const batchesId = tissueCultureBatchID
      ? parseInt(String(tissueCultureBatchID), 10)
      : NaN;
    const parentAId =
      form.motherID ??
      (Array.isArray(form.hybridization) && form.hybridization[0]) ??
      "";
    const assignedToTechnicianId =
      Array.isArray(form.technicianID) && form.technicianID.length > 0
        ? form.technicianID[0]
        : ((form.technicianID as any) ?? "");

    // Basic client-side validation
    if (!Number.isInteger(batchesId) || batchesId <= 0) {
      const msg = "Lỗi: Lô cấy mô (batch) chưa hợp lệ. Vui lòng chọn lại lô.";
      enqueueSnackbar(msg, { variant: "error" });
      setError(msg);
      setIsSubmitting(false);
      return;
    }
    if (!Number.isInteger(methodId) || methodId <= 0) {
      const msg = "Lỗi: Phương pháp chưa hợp lệ. Vui lòng chọn phương pháp.";
      enqueueSnackbar(msg, { variant: "error" });
      setError(msg);
      setIsSubmitting(false);
      return;
    }

    // Verify batch exists on server before posting to get clearer error
    try {
      const batchListResp = await axiosInstance.get("/api/batches", {
        params: { pageNo: 1, pageSize: 500 },
      });
      const serverBatches =
        (batchListResp.data && batchListResp.data.data) || [];
      const found = serverBatches.find((b: any) => Number(b.id) === batchesId);
      if (!found) {
        const msg = `Lỗi: Không tìm thấy lô cấy mô có id=${batchesId} trên server.`;
        enqueueSnackbar(msg, { variant: "error" });
        setError(msg);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra batch trên server:", err);
      // Allow to proceed — server check failed, but still attempt to create and show server error
    }

    // Map form to backend payload shape
    const payload = {
      methodId: methodId,
      batchesId: batchesId,
      parentAId: parentAId,
      name: name ?? "",
      expectedSampleCount: numberOfSample ?? 1,
      assignedToTechnicianId: assignedToTechnicianId,
    };
    console.log("Payload gửi lên API:", payload);

    try {
      const response = await axiosInstance.post(
        "/api/experiment-logs",
        payload,
      );
      if (
        response.status !== 200 &&
        response.status !== 201 &&
        response.status !== 204
      ) {
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

  const handleLocalFinish = () => {
    // Developer helper: finish flow locally without calling API.
    resetForm();
    enqueueSnackbar("Hoàn thành (không gọi API)", { variant: "info" });
    void navigate("/experiment-log");
  };

  const hybridizationNamesToShow =
    methodType === "Sexual" && hybridizationNames
      ? [...hybridizationNames].reverse()
      : hybridizationNames;

  // Mock plant details to show richer info in the review step when backend data is absent
  const mockPlantDetails = [
    {
      id: "mock-1",
      localName: "Vanda Blue",
      scientificName: "Vanda coerulea",
      description: "Mẫu cây Vanda có hoa xanh, độ thích nghi tốt",
      doB: "2020-05-12",
    },
    {
      id: "mock-2",
      localName: "Phalaenopsis White",
      scientificName: "Phalaenopsis amabilis",
      description: "Mẫu Phalaenopsis trắng, thường dùng để lai tạo",
      doB: "2019-11-03",
    },
    {
      id: "mock-3",
      localName: "Dendrobium Pink",
      scientificName: "Dendrobium nobile",
      description: "Dendrobium hồng, cây khỏe và ít sâu bệnh",
      doB: "2021-02-20",
    },
  ];

  const selectedMotherName =
    hybridizationNamesToShow?.[0] ?? form.motherName ?? "Chưa chọn";
  const selectedFatherName =
    hybridizationNamesToShow?.[1] ??
    (form.hybridization && form.hybridization.length > 0
      ? form.hybridization[0]
      : undefined) ??
    "Chưa chọn";

  const findMockByName = (name?: string) => {
    if (!name) return undefined;
    return (
      mockPlantDetails.find(
        (p) => p.localName === name || p.scientificName === name,
      ) ?? mockPlantDetails[0]
    );
  };

  const motherDetail = findMockByName(selectedMotherName);
  const fatherDetail = findMockByName(selectedFatherName);

  return (
    <main className="ml-64 mt-6 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ExperimentSteps currentStep={3} />
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg animate-fade-in-up">
          <div className="p-8 border-b">
            <h1 className="text-3xl font-bold text-gray-900">
              Tạo Kế Hoạch Lai Tạo Mới
            </h1>
            <p className="text-gray-600 mt-2">
              Bước 3: Xem lại thông tin và hoàn thành
            </p>
          </div>
          <div className="p-8 space-y-6">
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
                    Thời gian
                  </h3>
                  <p className="text-gray-600">
                    Bắt đầu: {form.startDate ?? "Chưa chọn"}
                  </p>
                  <p className="text-gray-600">
                    Kết thúc: {form.endDate ?? "Chưa chọn"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Số mẫu mong muốn
                  </h3>
                  <p className="text-gray-600">
                    {numberOfSample ?? "Chưa chọn"}
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
                {/* Selected plants - show detailed mock info when available */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Cây giống đã chọn
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <div className="font-medium text-sm">
                        Cây giống: {selectedMotherName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {motherDetail?.scientificName ?? "-"}
                      </div>
                      <div className="text-sm text-gray-700 mt-2">
                        {motherDetail?.description ?? "Không có mô tả."}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Ngày sinh: {motherDetail?.doB ?? "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Removed quick summary and mock chemicals/tools to tighten layout */}
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
            <div className="flex items-center gap-3">
              <button
                type="button"
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
      </div>
    </main>
  );
};

export default CreateExperimentStep3;
