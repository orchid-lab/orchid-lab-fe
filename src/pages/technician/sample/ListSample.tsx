import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";

type SampleStatus = string; // backend returns string like "Process" per swagger screenshot

interface ReportAttribute {
  name: string;
  value: number;
  status: number | boolean;
  valueFrom?: number;
  valueTo?: number;
  measurementUnit?: string;
}

interface SampleItem {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  statusEnum: SampleStatus;
  reportAttributes?: ReportAttribute[];
}

interface ApiListEnvelope<T> {
  value?:
    | {
        data?: T[];
        totalCount?: number;
      }
    | T[];
}

function normalizeSamplesResponse(data: unknown): {
  items: SampleItem[];
  total: number;
} {
  // Accept multiple shapes: value.data[], value as [], or []
  const defaultResult = { items: [], total: 0 };
  if (!data || typeof data !== "object") return defaultResult;

  const d = data as ApiListEnvelope<SampleItem>;
  // shape 1: { value: { data: T[], totalCount } }
  if (d.value && !Array.isArray(d.value)) {
    const items = Array.isArray(d.value.data) ? d.value.data : [];
    const total =
      typeof d.value.totalCount === "number"
        ? d.value.totalCount
        : items.length;
    return { items, total };
  }
  // shape 2: { value: T[] }
  if (Array.isArray(d.value)) {
    return { items: d.value, total: d.value.length };
  }
  // shape 3: T[]
  if (Array.isArray(data)) {
    return {
      items: data as SampleItem[],
      total: (data as SampleItem[]).length,
    };
  }
  return defaultResult;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Process: "text-yellow-700",
  Suspended: "text-orange-700",
  Destroyed: "text-red-700",

  ChangedToSeedling: "text-green-700",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  Process: "Đang xử lý",
  Suspended: "Tạm dừng",
  Destroyed: "Đã tiêu hủy",

  ChangedToSeedling: "Đã chuyển thành cây con",
};

export default function ListSample() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("pageNo", "1");
    params.set("pageSize", "1000");
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    return params.toString();
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(
      () => {
        setLoading(true);
        setError(null);
        axiosInstance
          .get(`/api/sample?${query}`)
          .then((res) => {
            const { items } = normalizeSamplesResponse(res.data);

            const sorted = [...items].sort((a, b) => {
              const da = a.dob ? new Date(a.dob) : new Date(0);
              const db = b.dob ? new Date(b.dob) : new Date(0);
              return db.getTime() - da.getTime();
            });

            const filtered = sorted.filter((s) => {
              const matchesSearch = searchTerm
                ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
              const matchesStatus = statusFilter
                ? s.statusEnum === statusFilter
                : true;
              return matchesSearch && matchesStatus;
            });

            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            setSamples(filtered.slice(start, end));
            setTotalCount(filtered.length);
          })
          .catch(() => {
            setError("Không thể tải danh sách mẫu thí nghiệm");
            enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
          })
          .finally(() => setLoading(false));
      },
      searchTerm ? 300 : 0
    );
    return () => clearTimeout(t);
  }, [query, searchTerm, statusFilter, currentPage, enqueueSnackbar]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginate = (p: number) => setCurrentPage(p);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Danh sách mẫu thí nghiệm
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi các mẫu thí nghiệm của bạn
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm mẫu thí nghiệm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Process">Đang xử lý</option>
                <option value="Suspended">Tạm dừng</option>
                <option value="Destroyed">Đã tiêu hủy</option>
                <option value="ChangedToSeedling">
                  Đã chuyển thành cây con
                </option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Đang tải danh sách mẫu...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">
                      Tên mẫu
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      Ngày sinh
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {samples.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        Không có mẫu thí nghiệm
                      </td>
                    </tr>
                  ) : (
                    samples.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-green-50 cursor-pointer transition"
                        onClick={() => {
                          void navigate(`/technician/samples/${s.id}`);
                        }}
                      >
                        <td className="p-4 text-gray-900">{s.name}</td>
                        <td className="p-4 text-gray-600">
                          {s.dob ? new Date(s.dob).toLocaleDateString() : ""}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLOR_MAP[s.statusEnum] || "text-gray-700"
                            }`}
                          >
                            {STATUS_LABEL_MAP[s.statusEnum] || s.statusEnum}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
                <span>
                  Hiển thị {samples.length} mẫu trên tổng số {totalCount} mẫu
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage - 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      ←
                    </button>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-green-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage + 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
