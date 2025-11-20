import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";

type SampleStatus = string;

interface ReportAttribute {
  name: string;
  value: number;
  status: number | boolean;
  valueFrom?: number;
  valueTo?: number;
  measurementUnit?: string;
}

interface SampleDetail {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  statusEnum: SampleStatus;
  reportAttributes?: ReportAttribute[];
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Process: "bg-yellow-100 text-yellow-800",
  Suspended: "bg-orange-100 text-orange-800",
  Destroyed: "bg-red-100 text-red-800",

  ChangedToSeedling: "bg-green-100 text-green-800",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  Process: "Đang xử lý",
  Suspended: "Tạm dừng",
  Destroyed: "Đã tiêu hủy",

  ChangedToSeedling: "Đã chuyển thành cây con",
};

export default function TechDetailSample() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destroying, setDestroying] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`/api/sample/${id}`);
        // Support { value: T } envelope per swagger screenshot
        const data = res?.data?.value ?? res?.data;
        setSample(data as SampleDetail);
      } catch (e) {
        setError("Không thể tải chi tiết mẫu thí nghiệm");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, enqueueSnackbar]);

  const handleBack = () => {
    void navigate("/technician/samples");
  };

  const handleDestroy = async () => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc muốn tiêu hủy mẫu thí nghiệm này?"))
      return;
    try {
      setDestroying(true);
      await axiosInstance.delete(`/api/sample`, { data: { id } });
      enqueueSnackbar("Đã tiêu hủy mẫu thí nghiệm", { variant: "success" });
      void navigate("/technician/samples");
    } catch (error) {
      console.log("Error destroying sample:", error);
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
        "Tiêu hủy mẫu thí nghiệm thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setDestroying(false);
    }
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  if (error || !sample) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Không tìm thấy dữ liệu"}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[900px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Chi tiết mẫu thí nghiệm: {sample.name}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleDestroy}
              disabled={destroying}
              className={`px-4 py-2 rounded-lg transition-colors ${
                destroying
                  ? "bg-gray-300 text-gray-500"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {destroying ? "Đang xóa..." : "Tiêu hủy"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên mẫu</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {sample.name}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày sinh</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {sample.dob
                ? new Date(sample.dob).toLocaleDateString("vi-VN")
                : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Trạng thái</label>
          <span
            className={`px-3 py-2 rounded-md text-sm font-medium w-fit ${
              STATUS_COLOR_MAP[sample.statusEnum] || "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABEL_MAP[sample.statusEnum] || sample.statusEnum}
          </span>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Mô tả</label>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
            {sample.description || ""}
          </div>
        </div>

        {sample.reportAttributes && sample.reportAttributes.length > 0 && (
          <div className="flex flex-col mb-6">
            <label className="font-medium mb-1.5">Thuộc tính báo cáo</label>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 font-medium text-sm text-gray-700">
                <span>Tên</span>
                <span>Giá trị</span>
                <span>Trạng thái</span>
                <span>Khoảng</span>
                <span>Đơn vị</span>
              </div>
              {sample.reportAttributes.map((a, idx) => (
                <div
                  key={`${a.name}-${idx}`}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2"
                >
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {a.name}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {a.value}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {String(a.status)}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {a.valueFrom ?? "-"} → {a.valueTo ?? "-"}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {a.measurementUnit ?? ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Quay lại
          </button>
        </div>
      </div>
    </main>
  );
}
