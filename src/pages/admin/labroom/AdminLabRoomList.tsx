import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

interface LabRoomItem {
  id: string;
  name: string;
  description: string;
  status: boolean;
  inUse?: boolean; // trạng thái sử dụng
}

interface TissueCultureBatch {
  id: string;
  labRoomID: string;
  status: boolean;
}

interface ApiListResponse<T> {
  value?: {
    totalCount?: number;
    pageCount?: number;
    pageSize?: number;
    pageNumber?: number;
    data?: T[];
  };
}

function isApiListResponse<T>(obj: unknown): obj is ApiListResponse<T> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object"
  );
}

const AdminLabRoomList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [items, setItems] = useState<LabRoomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inUseCount, setInUseCount] = useState(0);
  const [notInUseCount, setNotInUseCount] = useState(0);

  const getPerformanceLabel = (performance: number) => {
    if (performance < 30) {
      return (
        <p className="text-red-600 font-semibold">
          Hiệu suất thấp: nhiều phòng đang bỏ trống, cần tối ưu khai thác.
        </p>
      );
    } else if (performance < 60) {
      return (
        <p className="text-yellow-600 font-semibold">
          Hiệu suất trung bình: một nửa số phòng được sử dụng, vẫn còn dư thừa.
        </p>
      );
    } else if (performance < 85) {
      return (
        <p className="text-blue-600 font-semibold">
          Hiệu suất tốt: phần lớn phòng được sử dụng hợp lý.
        </p>
      );
    } else {
      return (
        <p className="text-green-600 font-semibold">
          Hiệu suất rất cao: hầu hết các phòng đều đang được khai thác, cần chú
          ý duy trì.
        </p>
      );
    }
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const [labroomRes, batchRes] = await Promise.all([
          axiosInstance.get("/api/labroom?pageNumber=1&pageSize=100"),
          axiosInstance.get(
            "/api/tissue-culture-batch?pageNumber=1&pageSize=1000"
          ),
        ]);

        let labrooms: LabRoomItem[] = [];
        let batches: TissueCultureBatch[] = [];

        if (isApiListResponse<LabRoomItem>(labroomRes.data)) {
          labrooms = Array.isArray(labroomRes.data.value?.data)
            ? (labroomRes.data.value?.data as LabRoomItem[])
            : [];
        }

        if (isApiListResponse<TissueCultureBatch>(batchRes.data)) {
          batches = Array.isArray(batchRes.data.value?.data)
            ? (batchRes.data.value?.data as TissueCultureBatch[])
            : [];
        }

        // xác định trạng thái sử dụng
        let inUse = 0;
        let notInUse = 0;

        const updatedLabrooms = labrooms.map((room) => {
          const relatedBatches = batches.filter((b) => b.labRoomID === room.id);
          const isInUse = relatedBatches.some((b) => b.status === true);
          if (isInUse) inUse++;
          else notInUse++;
          return { ...room, inUse: isInUse };
        });

        setItems(updatedLabrooms);
        setInUseCount(inUse);
        setNotInUseCount(notInUse);
      } catch (err) {
        console.error("Error fetching dữ liệu:", err);
        setError("Không thể tải danh sách phòng thí nghiệm");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [enqueueSnackbar]);

  const totalRooms = inUseCount + notInUseCount;
  const performance = totalRooms > 0 ? (inUseCount / totalRooms) * 100 : 0;

  const chartData = {
    labels: ["Đang sử dụng", "Chưa sử dụng"],
    datasets: [
      {
        data: [inUseCount, notInUseCount],
        backgroundColor: ["#22c55e", "#9ca3af"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const value = context.parsed;
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">
            Danh sách phòng thực nghiệm
          </h1>
          <button
            onClick={() => void navigate("/admin/labroom/new")}
            className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800"
            type="button"
          >
            Tạo phòng thực nghiệm
          </button>
        </div>

        {/* Biểu đồ thống kê */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-lg shadow p-4 w-[340px]">
            <h3 className="text-center text-green-700 font-semibold mb-2 text-sm">
              Biểu đồ tình trạng sử dụng phòng thí nghiệm
            </h3>
            <Doughnut data={chartData} options={chartOptions} />
            <div className="text-center mt-4">
              <p className="font-medium">
                Hiệu suất: {performance.toFixed(1)}%
              </p>
              {getPerformanceLabel(performance)}
            </div>
          </div>
        </div>

        {/* Danh sách */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Đang tải danh sách...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-green-50 text-green-800 font-semibold">
                <th className="py-3 px-4 text-left">Tên</th>
                <th className="px-4 text-left">Mô tả</th>
                <th className="px-4 text-left">Trạng thái</th>
                <th className="px-4 text-left">Tình trạng sử dụng</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Không có phòng thực nghiệm nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t transition cursor-pointer ${
                      item.status ? "hover:bg-green-50" : "bg-gray-100"
                    }`}
                    onClick={() => {
                      if (!item.status) {
                        enqueueSnackbar(
                          "Phòng thực nghiệm này đã ngừng hoạt động nên không thể xem chi tiết",
                          { variant: "warning" }
                        );
                        return;
                      }
                      navigate(`/admin/labroom/${item.id}`);
                    }}
                  >
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="px-4">{item.description}</td>
                    <td className="px-4">
                      {item.status ? (
                        <span className="text-green-600 font-semibold">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4">
                      {item.inUse ? (
                        <span className="text-green-600 font-semibold">
                          Đang sử dụng
                        </span>
                      ) : (
                        <span className="text-gray-500 font-semibold">
                          Chưa sử dụng
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};

export default AdminLabRoomList;
