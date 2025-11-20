import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Method } from "../../../types/Method";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";

export default function MethodDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    const fetchMethodDetail = async (
      methodId: string
    ): Promise<Method | null> => {
      try {
        const response = await axiosInstance.get<{ value?: Method }>(
          `/api/method/${methodId}`
        );
        if (response.data.value) {
          return response.data.value;
        }
        return null;
      } catch (error) {
        console.error("Lỗi khi tải phương pháp:", error);
        return null;
      }
    };

    void fetchMethodDetail(id ?? "1").then((data) => {
      setMethod(data);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await axiosInstance.delete(`/api/method`, {
        data: { id: id },
      });
      if (res.status >= 200 && res.status < 300) {
        setShowConfirmDelete(false);
        enqueueSnackbar("Xóa phương pháp thành công!", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        void navigate(`/method?page=${page}`);
      } else {
        enqueueSnackbar("Xóa không thành công!", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    } catch (error) {
      console.log(error);
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
        "Xóa phương pháp thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!method) return <div>Không tìm thấy phương pháp.</div>;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate(`/method?page=${page}`)}
      >
        ← Trở về
      </button>
      <div className="max-w-full mx-auto bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-2 text-green-800">
          {method.name}
        </h2>
        <div className="mb-2">
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {method.type === "Clonal"
              ? "Vô tính"
              : method.type === "Sexual"
              ? "Hữu tính"
              : method.type}
          </span>
        </div>
        <div className="mb-4 text-gray-700">{method.description}</div>
        <h3 className="text-lg font-semibold mb-2">Quy trình chi tiết:</h3>
        <ol className="ml-6 space-y-3">
          {method.stages?.map((stage, idx) => (
            // eslint-disable-next-line react-x/no-array-index-key
            <li key={stage.name + idx} className="mb-4 list-decimal">
              <div className="font-semibold">{stage.name}</div>
              <div className="text-gray-700">{stage.description}</div>
              <div className="text-gray-700">
                Ngày xử lý: {stage.dateOfProcessing} ngày
              </div>
              {stage.elementDTO && stage.elementDTO.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Nguyên liệu:</span>
                  <ul className="list-disc ml-4">
                    {stage.elementDTO.map((el) => (
                      <li key={el.id} className="text-gray-700">
                        {el.name} - {el.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Nút Xóa */}
      <div className="flex gap-4 mt-6">
        <button
          type="button"
          className="border cursor-pointer border-red-800 text-red-800 px-6 py-2 rounded font-semibold hover:bg-red-800 hover:text-white transition"
          onClick={() => setShowConfirmDelete(true)}
        >
          Xóa
        </button>
      </div>

      {/* Modal xác nhận xóa */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 min-w-[320px]">
            <div className="text-lg font-semibold mb-4 text-red-700">
              Xác nhận xóa phương pháp này?
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
