import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

interface TissueCultureBatch {
  id: string;
  name: string;
  labName?: string;
  description?: string;
  inUse?: string;
  status?: boolean;
}

interface ApiListResponse {
  value?: {
    data?: TissueCultureBatch[];
    totalCount?: number;
  };
  data?: TissueCultureBatch[];
}

const AdminTissueCultureBatchList = () => {
  const [items, setItems] = useState<TissueCultureBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get("/api/tissue-culture-batch?pageNumber=1&pageSize=100")
      .then((res) => {
        const raw = res.data as ApiListResponse | TissueCultureBatch[];
        let arr: TissueCultureBatch[] = [];
        if ((raw as ApiListResponse)?.value?.data)
          arr = (raw as ApiListResponse).value!.data!;
        else if ((raw as ApiListResponse)?.data)
          arr = (raw as ApiListResponse).data!;
        else if (Array.isArray(raw)) arr = raw;
        setItems(arr);
      })
      .catch(() => setError("Không thể tải danh sách lô cấy mô"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Danh sách lô cấy mô
            </h1>
            <p className="text-gray-600">
              Quản lý lô cấy mô trong phòng thí nghiệm
            </p>
          </div>
          <Link
            to="/admin/tissue-culture-batches/create"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Tạo lô cấy mô
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng thí nghiệm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    Chưa có lô cấy mô.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.labName ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.status
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {item.status ? "Còn hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/tissue-culture-batches/${item.id}`}
                        className="text-green-700 hover:underline"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default AdminTissueCultureBatchList;
