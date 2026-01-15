import { useState, useMemo, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import type { ReportApiResponse, Report } from "../../../types/Report";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 5;

export default function AdminReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<ReportApiResponse>("/api/report", {
          params: {
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });
        
        const json = res.data; 
        setData(json.value.data || []);
        setTotal(json.value.totalCount || 0);
        setTotalPages(json.value.pageCount || 1);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [page]);

  // Lọc dữ liệu
  const filteredReports = useMemo(() => {
    return data.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.technician.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [data, search]);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4 text-green-800">
          {t("report.reportManagement")}
        </h1>
        {/* Thanh tìm kiếm */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
                placeholder={t("report.searchPlaceholder")}
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
        </div>
        {/* Bảng danh sách */}
        <div className="bg-white rounded shadow p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-green-50 text-green-800 font-semibold">
                <th className="py-3 px-4">{t("report.taskName")}</th>
                <th className="px-4">{t("report.description")}</th>
                <th className="px-4">{t("report.writer")}</th>
                <th className="px-4">{t("report.status")}</th>
                <th className="px-4">{t("report.action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  <tr key={idx} className="border-t animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    {t("report.noReports")}
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3 px-4">{r.name}</td>
                    <td className="px-4">{r.description}</td>
                    <td className="px-4">{r.technician}</td>
                    <td className="px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "Seen"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {r.status === "Seen" ? t("report.seen") : t("report.notSeen")}
                      </span>
                    </td>
                    <td className="px-4">
                      <button
                        type="button"
                        className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                        onClick={() =>
                          void navigate(`/admin/report/${r.id}?page=${page}`)
                        }
                      >
                        {t("report.details")}
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
              {t("report.totalReports")}
            </div>
            <div className="text-2xl font-bold text-green-800">{total}</div>
          </div>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
            <span>
              {t("common.showing")} {filteredReports.length} {t("report.reportsOutOf")}{" "}
              {total} {t("report.reports")}
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

              {/* Page numbers */}
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
      </div>
    </main>
  );
}