import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Method, MethodApiResponse } from "../../../types/Method";
import axiosInstance from "../../../api/axiosInstance";

const methodTypes = [
  { label: "Tất cả", value: "" },
  { label: "Nhân giống vô tính", value: "Clonal" },
  { label: "Nhân giống hữu tính", value: "Sexual" },
];

const PAGE_SIZE = 5;

export default function Method() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [data, setData] = useState<Method[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `https://net-api.orchid-lab.systems/api/method?pageNumber=${page}&pageSize=${PAGE_SIZE}`
        );
        const json = res.data as MethodApiResponse;
        setData(json.value.data || []);
        setTotal(json.value.totalCount || 0);
        setTotalPages(json.value.pageCount || 1);
      } catch {
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [page]);

  const clonalCount = data.filter((m) => m.type === "Clonal").length;
  const sexualCount = data.filter((m) => m.type === "Sexual").length;

  const filtered = data.filter(
    (m) =>
      (filterType === "" ||
        (filterType === "Clonal" && m.type === "Clonal") ||
        (filterType === "Sexual" && m.type === "Sexual")) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-800">
          Quản lý phương pháp cấy lan
        </h1>
        <button
          type="button"
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
          onClick={() => void navigate("/method/new")} // Nếu có trang thêm mới
        >
          + Thêm mới
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder="Tìm kiếm theo tên hoặc loại phương pháp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                />
              </svg>
            </span>
          </div>
        </div>
        <select
          className="border border-green-800 rounded-full px-4 py-2 font-medium text-green-800 focus:outline-none"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
        >
          {methodTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded shadow p-0 overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-green-50 text-green-800 font-semibold">
              <th className="py-3 px-4">Tên phương pháp</th>
              <th className="px-4">Loại</th>
              <th className="px-4">Trạng thái</th>
              <th className="px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                // eslint-disable-next-line react-x/no-array-index-key
                <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
                  <td colSpan={5} className="py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="px-4">
                    {m.type === "Clonal"
                      ? "Vô tính"
                      : m.type === "Sexual"
                      ? "Hữu tính"
                      : m.type}
                  </td>
                  <td className="px-4">
                    {m.status == true ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4">
                    <button
                      type="button"
                      className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                      onClick={() =>
                        void navigate(`/method/${m.id}?page=${page}`)
                      } // Nếu có trang chi tiết
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Summary cards */}
      <div className="flex gap-4 mt-6 mb-2">
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            Tổng số phương pháp
          </div>
          <div className="text-2xl font-bold text-green-800">{total}</div>
        </div>
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            Phương pháp vô tính
          </div>
          <div className="text-2xl font-bold text-green-800">{clonalCount}</div>
        </div>
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            Phương pháp hữu tính
          </div>
          <div className="text-2xl font-bold text-green-800">{sexualCount}</div>
        </div>
      </div>
      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <span>
            Hiển thị {filtered.length} phương pháp trên tổng số {total} phương
            pháp
          </span>
          <div className="flex gap-2">
            {/* Previous button */}
            {page > 1 && (
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ←
              </button>
            )}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded-lg ${
                    page === pageNum
                      ? "bg-green-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            {page < totalPages && (
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
